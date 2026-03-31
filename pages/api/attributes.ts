import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File } from "formidable";
import fs from "node:fs";

export const config = {
    api: {
        bodyParser: false,
    },
};

type ApiErrorPayload = {
    code: string;
    message: string;
    details?: unknown;
};

type ApiEnvelope<T = unknown> =
    | { ok: true; data: T }
    | { ok: false; error: ApiErrorPayload };

function getFirstFile(file: File | File[] | undefined): File | null {
    if (!file) return null;
    return Array.isArray(file) ? file[0] : file;
}

function buildProxyError(
    code: string,
    message: string,
    details: unknown = null
): ApiEnvelope<never> {
    return {
        ok: false,
        error: {
            code,
            message,
            details,
        },
    };
}

function parseUpstreamJson(text: string): ApiEnvelope | null {
    try {
        return JSON.parse(text) as ApiEnvelope;
    } catch {
        return null;
    }
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ApiEnvelope>
) {
    if (req.method !== "POST") {
        return res.status(405).json(
            buildProxyError("method_not_allowed", "僅支援 POST 方法。")
        );
    }

    const apiUrl = process.env.FASHION_ATTR_API_URL;
    if (!apiUrl) {
        return res.status(500).json(
            buildProxyError(
                "missing_env",
                "缺少 FASHION_ATTR_API_URL 環境變數。"
            )
        );
    }

    const form = formidable({ multiples: false });

    form.parse(req, async (err, _fields, files) => {
        if (err) {
            return res.status(400).json(
                buildProxyError("form_parse_failed", "表單解析失敗。", {
                    cause: err.message,
                })
            );
        }

        const imageFile = getFirstFile(files.image as File | File[] | undefined);

        if (!imageFile) {
            return res.status(400).json(
                buildProxyError("missing_image", "缺少 image 檔案。")
            );
        }

        try {
            const fileBuffer = await fs.promises.readFile(imageFile.filepath);

            const formData = new FormData();
            const blob = new Blob([fileBuffer], {
                type: imageFile.mimetype || "application/octet-stream",
            });

            formData.append(
                "image",
                blob,
                imageFile.originalFilename || "image.jpg"
            );

            const response = await fetch(apiUrl, {
                method: "POST",
                body: formData,
            });

            const text = await response.text();
            const payload = parseUpstreamJson(text);

            if (!payload) {
                return res.status(502).json(
                    buildProxyError(
                        "invalid_upstream_response",
                        "服飾辨識服務回傳的不是有效 JSON。",
                        text || null
                    )
                );
            }

            return res.status(response.status).json(payload);
        } catch (error) {
            return res.status(502).json(
                buildProxyError(
                    "upstream_request_failed",
                    "服飾辨識服務請求失敗。",
                    error instanceof Error ? { cause: error.message } : null
                )
            );
        }
    });
}
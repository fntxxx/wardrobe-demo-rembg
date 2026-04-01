import type { NextApiRequest, NextApiResponse } from "next";

type ApiErrorPayload = {
    code: string;
    message: string;
    details?: unknown;
};

type ApiEnvelope<T = unknown> =
    | { ok: true; data: T }
    | { ok: false; error: ApiErrorPayload };

type Base64RequestPayload = {
    base64: string;
    filename?: string;
    mimeType?: string;
};

type PredictPreviewPayload = {
    base64: string;
    filename: string;
    mimeType: string;
};

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

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isBase64RequestPayload(value: unknown): value is Base64RequestPayload {
    return (
        isObject(value) &&
        typeof value.base64 === "string" &&
        (value.filename === undefined || typeof value.filename === "string") &&
        (value.mimeType === undefined || typeof value.mimeType === "string")
    );
}

function isSuccessEnvelope(payload: ApiEnvelope): payload is { ok: true; data: unknown } {
    return payload.ok === true;
}

function withPreview(
    payload: ApiEnvelope,
    preview: PredictPreviewPayload | null
): ApiEnvelope {
    if (!preview || !isSuccessEnvelope(payload) || !isObject(payload.data)) {
        return payload;
    }

    return {
        ok: true,
        data: {
            ...payload.data,
            preview,
        },
    };
}

async function readJsonBody(req: NextApiRequest): Promise<unknown> {
    const parsedBody = req.body;

    if (typeof parsedBody === "string") {
        const raw = parsedBody.trim();

        if (!raw) {
            throw new Error("empty_json_body");
        }

        return JSON.parse(raw);
    }

    if (Buffer.isBuffer(parsedBody)) {
        const raw = parsedBody.toString("utf-8").trim();

        if (!raw) {
            throw new Error("empty_json_body");
        }

        return JSON.parse(raw);
    }

    if (parsedBody !== undefined) {
        return parsedBody;
    }

    const chunks: Buffer[] = [];

    for await (const chunk of req) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }

    const raw = Buffer.concat(chunks).toString("utf-8").trim();

    if (!raw) {
        throw new Error("empty_json_body");
    }

    return JSON.parse(raw);
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

    const contentType = req.headers["content-type"] || "";
    if (!contentType.includes("application/json")) {
        return res.status(400).json(
            buildProxyError(
                "invalid_content_type",
                "辨識 API 僅接受 remove-bg 後的 JSON base64 圖片資料。"
            )
        );
    }

    try {
        let jsonBody: unknown;

        try {
            jsonBody = await readJsonBody(req);
        } catch (error) {
            if (error instanceof Error && error.message === "empty_json_body") {
                return res.status(400).json(
                    buildProxyError("empty_json_body", "JSON request body 不可為空。")
                );
            }

            return res.status(400).json(
                buildProxyError("invalid_json_body", "JSON request body 格式錯誤。")
            );
        }

        if (!isBase64RequestPayload(jsonBody) || !jsonBody.base64.trim()) {
            return res.status(400).json(
                buildProxyError(
                    "invalid_request_body",
                    "辨識請求缺少有效的 remove-bg base64 欄位。"
                )
            );
        }

        const preview: PredictPreviewPayload = {
            base64: jsonBody.base64.trim(),
            filename: (jsonBody.filename || "image.png").trim() || "image.png",
            mimeType: (jsonBody.mimeType || "image/png").trim() || "image/png",
        };

        const upstreamResponse = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                base64: preview.base64,
                filename: preview.filename,
                mimeType: preview.mimeType,
            }),
        });

        const text = await upstreamResponse.text();
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

        return res.status(upstreamResponse.status).json(withPreview(payload, preview));
    } catch (error) {
        return res.status(502).json(
            buildProxyError(
                "upstream_request_failed",
                "服飾辨識服務請求失敗。",
                error instanceof Error ? { cause: error.message } : null
            )
        );
    }
}
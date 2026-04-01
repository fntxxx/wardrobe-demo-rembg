import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File } from "formidable";
import fs from "node:fs";

import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import {
    buildAssetPreviewUrl,
    createTemporaryAsset,
    getOrCreateSessionId,
} from "@/lib/server/temporaryAssetStore";

export const config = {
    api: { bodyParser: false },
    regions: ["hkg1"],
};

type ApiErrorPayload = {
    code: string;
    message: string;
    details?: unknown;
};

type RemoveBgAssetPayload = {
    assetId: string;
    previewUrl: string;
    filename: string;
    mimeType: string;
    expiresAt: string;
};

type ApiEnvelope<T = unknown> =
    | { ok: true; data: T }
    | { ok: false; error: ApiErrorPayload };

const REMBG_BASE =
    process.env.REMBG_API_BASE_URL?.replace(/\/+$/, "") ||
    "https://fntxxx-rembg-service.hf.space";

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

function getClientIp(req: NextApiRequest) {
    const xf = req.headers["x-forwarded-for"];
    const ip = Array.isArray(xf) ? xf[0] : xf?.split(",")[0]?.trim();
    return ip || req.socket.remoteAddress || "unknown";
}

const redis = Redis.fromEnv();
const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    analytics: true,
    prefix: "rl:remove-bg",
});

function parseForm(req: NextApiRequest): Promise<{ file: File }> {
    const form = formidable({
        multiples: false,
        maxFileSize: 8 * 1024 * 1024,
        filter: ({ mimetype, originalFilename }) => {
            const okMime =
                mimetype === "image/jpeg" ||
                mimetype === "image/png" ||
                mimetype === "image/webp";
            const okExt = /\.(jpg|jpeg|png|webp)$/i.test(originalFilename || "");
            return okMime || okExt;
        },
    });

    return new Promise((resolve, reject) => {
        form.parse(req, (err, _fields, files) => {
            if (err) return reject(err);
            const field = files.file;
            if (!field) return reject(new Error("缺少 file 欄位"));
            const file = Array.isArray(field) ? field[0] : field;
            resolve({ file });
        });
    });
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, init: RequestInit) {
    const delays = [0, 800, 1600];

    for (let i = 0; i < delays.length; i += 1) {
        if (delays[i] > 0) await sleep(delays[i]);

        const ac = new AbortController();
        const timeout = setTimeout(() => ac.abort(), 25_000);

        try {
            const response = await fetch(url, { ...init, signal: ac.signal });
            clearTimeout(timeout);

            if (
                (response.status === 502 || response.status === 503) &&
                i < delays.length - 1
            ) {
                continue;
            }

            return response;
        } catch (error) {
            clearTimeout(timeout);
            if (i < delays.length - 1) {
                continue;
            }
            throw error;
        }
    }

    throw new Error("remove-bg upstream failed");
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ApiEnvelope<RemoveBgAssetPayload>>
) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res
            .status(405)
            .json(buildProxyError("method_not_allowed", "僅支援 POST 方法。"));
    }

    const requiredKey = process.env.INTERNAL_API_KEY;
    if (requiredKey) {
        const got = req.headers["x-api-key"];
        if (got !== requiredKey) {
            return res
                .status(401)
                .json(buildProxyError("unauthorized", "未授權的請求。"));
        }
    }

    const ip = getClientIp(req);
    const rl = await ratelimit.limit(ip);
    res.setHeader("X-RateLimit-Limit", String(rl.limit));
    res.setHeader("X-RateLimit-Remaining", String(rl.remaining));
    if (!rl.success) {
        return res
            .status(429)
            .json(buildProxyError("too_many_requests", "請求次數過多，請稍後再試。"));
    }

    try {
        const { file } = await parseForm(req);
        const sessionId = getOrCreateSessionId(req, res);
        const buffer = await fs.promises.readFile(file.filepath);

        if (!buffer.length) {
            return res
                .status(400)
                .json(buildProxyError("empty_file", "上傳檔案不可為空。"));
        }

        const formData = new FormData();
        const mimeType = file.mimetype || "application/octet-stream";
        formData.append(
            "file",
            new Blob([buffer], { type: mimeType }),
            file.originalFilename || "upload.png"
        );

        const response = await fetchWithRetry(`${REMBG_BASE}/remove-bg`, {
            method: "POST",
            body: formData,
            headers: {
                Accept: "image/png, application/json",
            },
        });

        const upstreamContentType = response.headers.get("content-type") || "";

        if (!response.ok || !upstreamContentType.toLowerCase().includes("image/png")) {
            const text = await response.text();
            const payload = parseUpstreamJson(text);

            if (payload) {
                return res.status(response.status).json(payload as ApiEnvelope<RemoveBgAssetPayload>);
            }

            return res.status(502).json(
                buildProxyError(
                    "invalid_upstream_response",
                    "去背服務回傳格式不符合預期。",
                    {
                        upstreamStatus: response.status,
                        upstreamContentType,
                        rawBody: text || null,
                    }
                )
            );
        }

        const outputBuffer = Buffer.from(await response.arrayBuffer());

        if (!outputBuffer.length) {
            return res
                .status(502)
                .json(buildProxyError("empty_upstream_body", "去背服務未回傳圖片內容。"));
        }

        const asset = createTemporaryAsset({
            sessionId,
            buffer: outputBuffer,
            filename: file.originalFilename || "image.png",
            mimeType: "image/png",
        });

        return res.status(200).json({
            ok: true,
            data: {
                assetId: asset.assetId,
                previewUrl: buildAssetPreviewUrl(req, asset.assetId),
                filename: asset.filename,
                mimeType: asset.mimeType,
                expiresAt: asset.expiresAt,
            },
        });
    } catch (error) {
        return res.status(400).json(
            buildProxyError(
                "bad_request",
                error instanceof Error ? error.message : "去背請求失敗。"
            )
        );
    }
}
import type { NextApiRequest, NextApiResponse } from "next";
import {
    getOrCreateSessionId,
    getTemporaryAsset,
} from "@/lib/server/temporaryAssetStore";

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

type AssetReferenceRequestPayload = {
    assetId: string;
};

type UpstreamDiagnostics = {
    upstreamUrl: string;
    upstreamStatus: number;
    upstreamContentType: string | null;
    isJson: boolean;
    isHtml: boolean;
    isText: boolean;
    isEmptyBody: boolean;
    rawBodyPreview: string | null;
    rawBodyLength: number;
    envelopeValid: boolean;
};

const RAW_BODY_PREVIEW_LIMIT = 1000;

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

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
    return (
        isObject(value) &&
        typeof value.code === "string" &&
        typeof value.message === "string"
    );
}

function isApiEnvelope(value: unknown): value is ApiEnvelope {
    if (!isObject(value) || typeof value.ok !== "boolean") {
        return false;
    }

    if (value.ok === true) {
        return "data" in value;
    }

    return isApiErrorPayload(value.error);
}

function parseUpstreamJson(text: string): unknown | null {
    try {
        return JSON.parse(text) as unknown;
    } catch {
        return null;
    }
}

function isAssetReferenceRequestPayload(
    value: unknown
): value is AssetReferenceRequestPayload {
    return isObject(value) && typeof value.assetId === "string";
}

function truncateRawBody(text: string): string | null {
    const normalized = text.trim();

    if (!normalized) {
        return null;
    }

    return normalized.slice(0, RAW_BODY_PREVIEW_LIMIT);
}

function detectHtml(text: string, contentType: string | null): boolean {
    if (contentType?.toLowerCase().includes("text/html")) {
        return true;
    }

    const normalized = text.trim().toLowerCase();
    return normalized.startsWith("<!doctype html") || normalized.startsWith("<html");
}

function detectJson(contentType: string | null, text: string): boolean {
    if (contentType?.toLowerCase().includes("application/json")) {
        return true;
    }

    const normalized = text.trim();
    return normalized.startsWith("{") || normalized.startsWith("[");
}

function buildUpstreamDiagnostics(
    upstreamUrl: string,
    upstreamResponse: Response,
    text: string,
    envelopeValid: boolean
): UpstreamDiagnostics {
    const contentType = upstreamResponse.headers.get("content-type");

    return {
        upstreamUrl,
        upstreamStatus: upstreamResponse.status,
        upstreamContentType: contentType,
        isJson: detectJson(contentType, text),
        isHtml: detectHtml(text, contentType),
        isText:
            contentType?.toLowerCase().startsWith("text/") ||
            (!contentType && Boolean(text.trim())),
        isEmptyBody: text.trim().length === 0,
        rawBodyPreview: truncateRawBody(text),
        rawBodyLength: text.length,
        envelopeValid,
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
        return res
            .status(405)
            .json(buildProxyError("method_not_allowed", "僅支援 POST 方法。"));
    }

    const apiUrl = process.env.FASHION_ATTR_API_URL;
    if (!apiUrl) {
        return res
            .status(500)
            .json(buildProxyError("missing_env", "缺少 FASHION_ATTR_API_URL 環境變數。"));
    }

    const contentType = req.headers["content-type"] || "";
    if (!contentType.includes("application/json")) {
        return res.status(400).json(
            buildProxyError(
                "invalid_content_type",
                "辨識 API 僅接受 assetId JSON 參照資料。"
            )
        );
    }

    try {
        let jsonBody: unknown;

        try {
            jsonBody = await readJsonBody(req);
        } catch (error) {
            if (error instanceof Error && error.message === "empty_json_body") {
                return res
                    .status(400)
                    .json(buildProxyError("empty_json_body", "JSON request body 不可為空。"));
            }

            return res
                .status(400)
                .json(buildProxyError("invalid_json_body", "JSON request body 格式錯誤。"));
        }

        if (!isAssetReferenceRequestPayload(jsonBody) || !jsonBody.assetId.trim()) {
            return res.status(400).json(
                buildProxyError(
                    "invalid_request_body",
                    "辨識請求缺少有效的 assetId 欄位。"
                )
            );
        }

        const sessionId = getOrCreateSessionId(req, res);
        const asset = getTemporaryAsset(jsonBody.assetId.trim(), sessionId);

        if (!asset) {
            return res.status(404).json(
                buildProxyError(
                    "asset_not_found",
                    "找不到可用的去背暫存圖片，請重新執行去背流程。"
                )
            );
        }

        const imageArrayBuffer = asset.buffer.buffer.slice(
            asset.buffer.byteOffset,
            asset.buffer.byteOffset + asset.buffer.byteLength
        ) as ArrayBuffer;

        const formData = new FormData();
        formData.append(
            "image",
            new Blob([imageArrayBuffer], { type: asset.mimeType }),
            asset.filename
        );

        const upstreamResponse = await fetch(apiUrl, {
            method: "POST",
            headers: {
                Accept: "application/json",
            },
            body: formData,
        });

        const text = await upstreamResponse.text();
        const parsedJson = parseUpstreamJson(text);
        const envelopeValid = isApiEnvelope(parsedJson);
        const diagnostics = buildUpstreamDiagnostics(
            apiUrl,
            upstreamResponse,
            text,
            envelopeValid
        );

        if (parsedJson === null) {
            return res.status(502).json(
                buildProxyError(
                    "invalid_upstream_json",
                    "服飾辨識上游回傳的不是有效 JSON。",
                    diagnostics
                )
            );
        }

        if (!envelopeValid) {
            return res.status(502).json(
                buildProxyError(
                    "invalid_upstream_envelope",
                    "服飾辨識上游回傳的 JSON 不符合 demo contract。",
                    {
                        ...diagnostics,
                        parsedBody: parsedJson,
                    }
                )
            );
        }

        return res.status(upstreamResponse.status).json(parsedJson);
    } catch (error) {
        return res.status(502).json(
            buildProxyError(
                "upstream_request_failed",
                "服飾辨識服務請求失敗。",
                error instanceof Error
                    ? { cause: error.message, upstreamUrl: apiUrl }
                    : { upstreamUrl: apiUrl }
            )
        );
    }
}
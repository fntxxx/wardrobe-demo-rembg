import type { NextApiRequest, NextApiResponse } from "next";
import {
    getOrCreateSessionId,
    getTemporaryAsset,
} from "@/lib/server/temporaryAssetStore";

type ApiErrorPayload = {
    ok: false;
    error: {
        code: string;
        message: string;
    };
};

function jsonError(
    res: NextApiResponse<ApiErrorPayload>,
    status: number,
    code: string,
    message: string
) {
    return res.status(status).json({
        ok: false,
        error: {
            code,
            message,
        },
    });
}

export default function handler(
    req: NextApiRequest,
    res: NextApiResponse<Buffer | ApiErrorPayload>
) {
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return jsonError(res, 405, "method_not_allowed", "僅支援 GET 方法。");
    }

    const assetId = Array.isArray(req.query.assetId)
        ? req.query.assetId[0]
        : req.query.assetId;

    if (!assetId) {
        return jsonError(res, 400, "missing_asset_id", "缺少 assetId。");
    }

    const sessionId = getOrCreateSessionId(req, res);
    const asset = getTemporaryAsset(assetId, sessionId);

    if (!asset) {
        return jsonError(res, 404, "asset_not_found", "找不到可用的暫存圖片資產。");
    }

    res.setHeader("Content-Type", asset.mimeType);
    res.setHeader("Content-Length", String(asset.buffer.length));
    res.setHeader("Cache-Control", "private, max-age=60, stale-while-revalidate=60");
    res.setHeader("Content-Disposition", `inline; filename="${asset.filename}"`);
    res.status(200).send(asset.buffer);
}
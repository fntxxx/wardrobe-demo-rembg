import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "node:crypto";

const SESSION_COOKIE_NAME = "wardrobe_demo_session";
const SESSION_TTL_SECONDS = 60 * 60;
const ASSET_TTL_MS = 15 * 60 * 1000;

type TemporaryAssetRecord = {
    assetId: string;
    sessionId: string;
    buffer: Buffer;
    mimeType: string;
    filename: string;
    createdAt: string;
    expiresAt: string;
};

type TemporaryAssetStoreState = {
    assets: Map<string, TemporaryAssetRecord>;
};

declare global {
    var __WARDROBE_TEMP_ASSET_STORE__: TemporaryAssetStoreState | undefined;
}

function getStoreState(): TemporaryAssetStoreState {
    if (!global.__WARDROBE_TEMP_ASSET_STORE__) {
        global.__WARDROBE_TEMP_ASSET_STORE__ = {
            assets: new Map<string, TemporaryAssetRecord>(),
        };
    }

    return global.__WARDROBE_TEMP_ASSET_STORE__;
}

function parseCookieHeader(cookieHeader: string | undefined): Record<string, string> {
    if (!cookieHeader) {
        return {};
    }

    return cookieHeader
        .split(";")
        .map((part) => part.trim())
        .filter(Boolean)
        .reduce<Record<string, string>>((result, part) => {
            const separatorIndex = part.indexOf("=");
            if (separatorIndex <= 0) {
                return result;
            }

            const key = decodeURIComponent(part.slice(0, separatorIndex).trim());
            const value = decodeURIComponent(part.slice(separatorIndex + 1).trim());
            result[key] = value;
            return result;
        }, {});
}

function appendSetCookieHeader(
    res: NextApiResponse,
    cookieValue: string
) {
    const currentHeader = res.getHeader("Set-Cookie");

    if (!currentHeader) {
        res.setHeader("Set-Cookie", cookieValue);
        return;
    }

    if (Array.isArray(currentHeader)) {
        res.setHeader("Set-Cookie", [...currentHeader, cookieValue]);
        return;
    }

    res.setHeader("Set-Cookie", [String(currentHeader), cookieValue]);
}

function buildSessionCookie(sessionId: string) {
    return [
        `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}`,
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        `Max-Age=${SESSION_TTL_SECONDS}`,
    ].join("; ");
}

function cleanupExpiredAssets() {
    const now = Date.now();
    const store = getStoreState();

    store.assets.forEach((record, assetId) => {
        if (new Date(record.expiresAt).getTime() <= now) {
            store.assets.delete(assetId);
        }
    });
}

function ensurePngFilename(filename: string) {
    const normalized = filename.trim() || "image";
    const withoutExtension = normalized.replace(/\.[^.]+$/, "") || "image";
    return `${withoutExtension}.png`;
}

export function getOrCreateSessionId(
    req: NextApiRequest,
    res: NextApiResponse
): string {
    const cookies = parseCookieHeader(req.headers.cookie);
    const existingSessionId = cookies[SESSION_COOKIE_NAME];

    if (existingSessionId) {
        return existingSessionId;
    }

    const sessionId = randomUUID();
    appendSetCookieHeader(res, buildSessionCookie(sessionId));
    return sessionId;
}

export function createTemporaryAsset(params: {
    sessionId: string;
    buffer: Buffer;
    filename: string;
    mimeType?: string;
}) {
    cleanupExpiredAssets();

    const assetId = randomUUID();
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + ASSET_TTL_MS);
    const record: TemporaryAssetRecord = {
        assetId,
        sessionId: params.sessionId,
        buffer: params.buffer,
        filename: ensurePngFilename(params.filename),
        mimeType: params.mimeType?.trim() || "image/png",
        createdAt: createdAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
    };

    getStoreState().assets.set(assetId, record);

    return {
        assetId: record.assetId,
        filename: record.filename,
        mimeType: record.mimeType,
        expiresAt: record.expiresAt,
    };
}

export function getTemporaryAsset(assetId: string, sessionId: string) {
    cleanupExpiredAssets();

    const record = getStoreState().assets.get(assetId);
    if (!record) {
        return null;
    }

    if (record.sessionId !== sessionId) {
        return null;
    }

    if (new Date(record.expiresAt).getTime() <= Date.now()) {
        getStoreState().assets.delete(assetId);
        return null;
    }

    return record;
}

export function buildAssetPreviewUrl(req: NextApiRequest, assetId: string) {
    const forwardedProto = req.headers["x-forwarded-proto"];
    const protocol = Array.isArray(forwardedProto)
        ? forwardedProto[0]
        : forwardedProto || (req.headers.host?.includes("localhost") ? "http" : "https");
    const host = req.headers.host || "localhost:3000";

    return `${protocol}://${host}/api/assets/${assetId}`;
}
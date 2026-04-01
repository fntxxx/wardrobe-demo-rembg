type JsonObject = Record<string, unknown>;

type RemoveBgAsset = {
    assetId: string;
    previewUrl: string;
    filename: string;
    mimeType: string;
    expiresAt: string;
};

type RemoveBgSuccessResponse = {
    ok: true;
    data: RemoveBgAsset;
};

type RemoveBgErrorResponse = {
    ok: false;
    error: {
        message: string;
    };
};

export type RemoveBgNormalizedResponse =
    | RemoveBgSuccessResponse
    | RemoveBgErrorResponse;

function isRecord(value: unknown): value is JsonObject {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
    return typeof value === "string" ? value : fallback;
}

export async function parseRemoveBgResponse(
    res: Response
): Promise<RemoveBgNormalizedResponse> {
    const text = await res.text();

    try {
        const parsed = JSON.parse(text) as unknown;

        if (!isRecord(parsed)) {
            return {
                ok: false,
                error: {
                    message: "去背服務回傳格式錯誤",
                },
            };
        }

        const ok = parsed.ok;

        if (ok === false) {
            const error = isRecord(parsed.error) ? parsed.error : {};
            return {
                ok: false,
                error: {
                    message: asString(error.message, "去背失敗。"),
                },
            };
        }

        const data = isRecord(parsed.data) ? parsed.data : {};
        const normalizedAsset: RemoveBgAsset = {
            assetId: asString(data.assetId),
            previewUrl: asString(data.previewUrl),
            filename: asString(data.filename, "image.png"),
            mimeType: asString(data.mimeType, "image/png"),
            expiresAt: asString(data.expiresAt),
        };

        if (!normalizedAsset.assetId || !normalizedAsset.previewUrl) {
            return {
                ok: false,
                error: {
                    message: "去背結果缺少資產參照資料",
                },
            };
        }

        return {
            ok: true,
            data: normalizedAsset,
        };
    } catch {
        return {
            ok: false,
            error: {
                message: "去背服務回傳格式錯誤",
            },
        };
    }
}
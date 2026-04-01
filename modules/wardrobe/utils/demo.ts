type JsonObject = Record<string, unknown>;

type RemoveBgImage = {
    base64: string;
    filename: string;
    mime_type: string;
};

type RemoveBgSuccessResponse = {
    ok: true;
    data: {
        image: RemoveBgImage;
    };
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

/**
 * remove-bg API 回傳解析
 */
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
        const image = isRecord(data.image) ? data.image : {};

        const normalizedImage: RemoveBgImage = {
            base64: asString(image.base64),
            filename: asString(image.filename, "image.png"),
            mime_type: asString(image.mime_type, "image/png"),
        };

        if (!normalizedImage.base64) {
            return {
                ok: false,
                error: {
                    message: "去背結果缺少圖片資料",
                },
            };
        }

        return {
            ok: true,
            data: {
                image: normalizedImage,
            },
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
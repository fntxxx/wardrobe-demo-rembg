import { useState } from "react";

export type AttributeScores = {
    category: number;
    occasion: number;
    colorTone: number;
    season: number;
};

export type AttributeResult = {
    category: string;
    occasion: string;
    colorTone: string;
    colorTags: string[];
    season: string;
    scores: AttributeScores;
};

type PredictOptions = {
    silent?: boolean;
};

type RawApiResponse = {
    ok?: boolean;
    reason?: string;

    category?: string;
    occasion?: string;
    colorTone?: string;
    colorTags?: string[];
    season?: string;

    style?: string;
    score?: number;

    scores?: Partial<{
        category: number;
        occasion: number;
        colorTone: number;
        season: number;
    }>;
};

function mapStyleToOccasion(style?: string): string {
    switch (style) {
        case "casual":
            return "日常休閒";
        case "formal":
            return "正式";
        case "sport":
            return "運動";
        case "smart_casual":
            return "都會休閒";
        default:
            return style || "-";
    }
}

function mapSeasonLabel(season?: string): string {
    switch (season) {
        case "spring_autumn":
            return "春秋";
        case "summer":
            return "夏季";
        case "winter":
            return "冬季";
        case "all_season":
            return "四季皆宜";
        default:
            return season || "-";
    }
}

function fallbackColorToneToUiTags(colorTone?: string): string[] {
    if (!colorTone) return [];

    const map: Record<string, string[]> = {
        白色系: ["淺米白"],
        黑色系: ["深灰黑"],
        灰色系: ["中性灰"],
        米色系: ["淺米白"],
        卡其色系: ["大地棕"],
        咖啡色系: ["大地棕"],
        紅色系: ["暖橘紅"],
        綠色系: ["自然綠"],
        藍色系: ["清爽藍"],
        紫色系: ["優雅紫"],
        花紋圖案: ["花紋圖案"],
    };

    return map[colorTone] ?? [];
}

function normalizeScores(data: RawApiResponse): AttributeScores {
    const fallbackScore = typeof data.score === "number" ? data.score : 0;

    return {
        category: data.scores?.category ?? fallbackScore,
        occasion: data.scores?.occasion ?? fallbackScore,
        colorTone: data.scores?.colorTone ?? fallbackScore,
        season: data.scores?.season ?? fallbackScore,
    };
}

function normalizeResult(data: RawApiResponse): AttributeResult {
    return {
        category: data.category || "-",
        occasion: data.occasion || mapStyleToOccasion(data.style),
        colorTone: data.colorTone || "-",
        colorTags:
            Array.isArray(data.colorTags) && data.colorTags.length > 0
                ? data.colorTags
                : fallbackColorToneToUiTags(data.colorTone),
        season: mapSeasonLabel(data.season),
        scores: normalizeScores(data),
    };
}

export function useAttributes() {
    const [attributes, setAttributes] = useState<AttributeResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function predict(
        input: File | Blob,
        filename = "image.png",
        options: PredictOptions = {}
    ): Promise<AttributeResult | null> {
        const { silent = false } = options;

        if (!silent) {
            setLoading(true);
            setError(null);
        }

        try {
            const formData = new FormData();
            formData.append("image", input, filename);

            const res = await fetch("/api/attributes", {
                method: "POST",
                body: formData,
            });

            const text = await res.text();

            if (!res.ok) {
                throw new Error(text || "屬性辨識失敗");
            }

            let json: RawApiResponse;
            try {
                json = JSON.parse(text);
            } catch {
                throw new Error("屬性服務回傳格式不是有效 JSON");
            }

            if (json.ok === false) {
                if (json.reason === "not_fashion_image") {
                    throw new Error("這不是衣物圖片，請重新上傳單件衣物照片。");
                }
                throw new Error("屬性辨識失敗");
            }

            const normalized = normalizeResult(json);

            if (!silent) {
                setAttributes(normalized);
            }

            return normalized;
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "屬性辨識失敗";

            if (!silent) {
                setError(message);
            }

            throw err;
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    }

    return {
        attributes,
        loading,
        error,
        predict,
        setAttributes,
        setError,
    };
}
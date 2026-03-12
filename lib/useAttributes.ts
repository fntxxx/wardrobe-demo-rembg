import { useState } from "react";
import type {
    CategoryValue,
    OccasionValue,
    SeasonValue,
    ColorValue,
} from "@/lib/wardrobeOptions";

export type CandidateItem<T extends string = string> = {
    value: T;
    label: string;
    score: number;
};

export type SingleSelectField<T extends string = string> = {
    selected: T;
    label?: string;
    score?: number;
    candidates: CandidateItem<T>[];
};

export type MultiSelectField<T extends string = string> = {
    selected: T[];
    candidates: CandidateItem<T>[];
    threshold?: number;
    maxSelected?: number;
};

export type AttributeScores = {
    category: number;
    occasion: number;
    colorTone: number;
    season: number;
};

export type AttributeResult = {
    legacy: {
        category: string;
        occasion: string;
        colorTone: string;
        colorTags: string[];
        season: string;
    };
    categorySelection: SingleSelectField<CategoryValue>;
    occasions: MultiSelectField<OccasionValue>;
    seasons: MultiSelectField<SeasonValue>;
    colors: MultiSelectField<ColorValue>;
    scores: AttributeScores;
};

type PredictOptions = {
    silent?: boolean;
};

type RawApiResponse = {
    ok?: boolean;
    reason?: string;

    category?: string;
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

    categorySelection?: {
        selected?: CategoryValue;
        label?: string;
        score?: number;
        candidates?: CandidateItem<CategoryValue>[];
    };

    occasions?: {
        selected?: OccasionValue[];
        candidates?: CandidateItem<OccasionValue>[];
        threshold?: number;
        maxSelected?: number;
    };

    seasons?: {
        selected?: SeasonValue[];
        candidates?: CandidateItem<SeasonValue>[];
        threshold?: number;
        maxSelected?: number;
    };

    colors?: {
        selected?: ColorValue[];
        candidates?: CandidateItem<ColorValue>[];
        threshold?: number;
        maxSelected?: number;
    };
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
        legacy: {
            category: data.category || "-",
            occasion: mapStyleToOccasion(data.style),
            colorTone: data.colorTone || "-",
            colorTags: Array.isArray(data.colorTags) ? data.colorTags : [],
            season: mapSeasonLabel(data.season),
        },
        categorySelection: {
            selected: data.categorySelection?.selected || "top",
            label: data.categorySelection?.label || "上衣",
            score: data.categorySelection?.score ?? 0,
            candidates: data.categorySelection?.candidates ?? [],
        },
        occasions: {
            selected: data.occasions?.selected ?? [],
            candidates: data.occasions?.candidates ?? [],
            threshold: data.occasions?.threshold ?? 0.62,
            maxSelected: data.occasions?.maxSelected ?? 2,
        },
        seasons: {
            selected: data.seasons?.selected ?? [],
            candidates: data.seasons?.candidates ?? [],
            threshold: data.seasons?.threshold ?? 0.58,
            maxSelected: data.seasons?.maxSelected ?? 2,
        },
        colors: {
            selected: data.colors?.selected ?? [],
            candidates: data.colors?.candidates ?? [],
            threshold: data.colors?.threshold ?? 0.58,
            maxSelected: data.colors?.maxSelected ?? 2,
        },
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
                    throw new Error("這不是符合規則的衣物圖片，請重新上傳單件衣物照片。");
                }
                throw new Error("屬性辨識失敗");
            }

            const normalized = normalizeResult(json);

            if (!silent) {
                setAttributes(normalized);
            }

            return normalized;
        } catch (err) {
            const message = err instanceof Error ? err.message : "屬性辨識失敗";

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
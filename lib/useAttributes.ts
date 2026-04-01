import { useState } from "react";
import type {
    CategoryValue,
    OccasionValue,
    SeasonValue,
    ColorValue,
} from "@/lib/wardrobeOptions";
import {
    CATEGORY_OPTIONS,
    OCCASION_OPTIONS,
    SEASON_OPTIONS,
    COLOR_OPTIONS,
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
    latest: {
        route: string;
        coarseType: string;
        name: string;
        category: CategoryValue;
        categoryLabel: string;
        color: ColorValue | null;
        colorLabel: string;
        occasion: OccasionValue[];
        season: SeasonValue[];
        score: number;
        detected: boolean;
        detectedLabel: string | null;
        bbox: number[] | null;
        validation: {
            bestLabel: string;
            validScore: number;
            invalidScore: number;
        };
    };
    categorySelection: SingleSelectField<CategoryValue>;
    occasions: MultiSelectField<OccasionValue>;
    seasons: MultiSelectField<SeasonValue>;
    colors: MultiSelectField<ColorValue>;
    scores: AttributeScores;
};

export type ProcessedImageInput = {
    base64: string;
    filename?: string;
    mimeType?: string;
};

export type PredictPreview = {
    base64: string;
    filename: string;
    mimeType: string;
    dataUrl: string;
};

export type PredictResult = {
    attributes: AttributeResult;
    preview: PredictPreview | null;
};

type PredictOptions = {
    silent?: boolean;
};

type ApiErrorPayload = {
    code: string;
    message: string;
    details?: unknown;
};

type PredictValidationPayload = {
    best_label: string;
    valid_score: number;
    invalid_score: number;
};

type PredictPreviewPayload = {
    base64: string;
    filename: string;
    mimeType: string;
};

type PredictSuccessData = {
    route: string;
    coarseType: string;
    name: string;
    category: string;
    categoryLabel: string;
    color: string;
    colorLabel: string;
    occasion: string[];
    season: string[];
    score: number;
    detected?: boolean;
    detectedLabel?: string | null;
    bbox?: number[] | null;
    validation?: Partial<PredictValidationPayload>;
    preview?: Partial<PredictPreviewPayload>;
    scores?: Partial<{
        mainCategory: number;
        category: number;
        occasion: number;
        color: number;
        season: number;
    }>;
    candidates?: Partial<{
        category: CandidateItem[];
        color: CandidateItem[];
        occasion: CandidateItem[];
        season: CandidateItem[];
    }>;
};

type RawApiResponse =
    | { ok: true; data: PredictSuccessData }
    | { ok: false; error: ApiErrorPayload };

const CATEGORY_LABEL_MAP = new Map(
    CATEGORY_OPTIONS.map((option) => [option.value, option.label])
);
const OCCASION_LABEL_MAP = new Map(
    OCCASION_OPTIONS.map((option) => [option.value, option.label])
);
const SEASON_LABEL_MAP = new Map(
    SEASON_OPTIONS.map((option) => [option.value, option.label])
);
const COLOR_LABEL_MAP = new Map(
    COLOR_OPTIONS.map((option) => [option.value, option.label])
);

const CATEGORY_VALUE_SET = new Set<CategoryValue>(
    CATEGORY_OPTIONS.map((option) => option.value)
);
const OCCASION_VALUE_SET = new Set<OccasionValue>(
    OCCASION_OPTIONS.map((option) => option.value)
);
const SEASON_VALUE_SET = new Set<SeasonValue>(
    SEASON_OPTIONS.map((option) => option.value)
);
const COLOR_VALUE_SET = new Set<ColorValue>(
    COLOR_OPTIONS.map((option) => option.value)
);

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

function isCandidateItem(value: unknown): value is CandidateItem {
    return (
        isObject(value) &&
        typeof value.value === "string" &&
        typeof value.label === "string" &&
        typeof value.score === "number"
    );
}

function isPredictSuccessData(value: unknown): value is PredictSuccessData {
    return (
        isObject(value) &&
        typeof value.route === "string" &&
        typeof value.coarseType === "string" &&
        typeof value.name === "string" &&
        typeof value.category === "string" &&
        typeof value.categoryLabel === "string" &&
        typeof value.color === "string" &&
        typeof value.colorLabel === "string" &&
        Array.isArray(value.occasion) &&
        value.occasion.every((item) => typeof item === "string") &&
        Array.isArray(value.season) &&
        value.season.every((item) => typeof item === "string") &&
        typeof value.score === "number"
    );
}

function parseApiResponse(text: string): RawApiResponse {
    let json: unknown;

    try {
        json = JSON.parse(text);
    } catch {
        throw new Error("屬性服務回傳格式不是有效 JSON。");
    }

    if (!isObject(json) || typeof json.ok !== "boolean") {
        throw new Error("屬性服務回傳格式不符合預期。");
    }

    if (json.ok === false) {
        if (!isApiErrorPayload(json.error)) {
            throw new Error("屬性服務錯誤格式不符合預期。");
        }
        return {
            ok: false,
            error: json.error,
        };
    }

    if (!isPredictSuccessData(json.data)) {
        throw new Error("屬性服務成功回傳格式不符合預期。");
    }

    return {
        ok: true,
        data: json.data,
    };
}

function normalizeErrorMessage(error: ApiErrorPayload): string {
    if (error.message?.trim()) {
        return error.message.trim();
    }

    return "屬性辨識失敗。";
}

function dedupeCandidates<T extends string>(
    candidates: CandidateItem<T>[]
): CandidateItem<T>[] {
    const map = new Map<T, CandidateItem<T>>();

    candidates.forEach((candidate) => {
        const current = map.get(candidate.value);
        if (!current || candidate.score > current.score) {
            map.set(candidate.value, candidate);
        }
    });

    return Array.from(map.values()).sort((a, b) => b.score - a.score);
}

function getLabel<T extends string>(
    labelMap: Map<string, string>,
    value: T,
    fallbackLabel?: string
) {
    return fallbackLabel || labelMap.get(value) || value;
}

function normalizeSingleValue<T extends string>(
    value: unknown,
    allowedValues: Set<T>,
    fallbackValue: T
): T {
    return allowedValues.has(value as T) ? (value as T) : fallbackValue;
}

function normalizeMultiValues<T extends string>(
    values: unknown,
    allowedValues: Set<T>
): T[] {
    if (!Array.isArray(values)) return [];

    return values.filter((value): value is T => allowedValues.has(value as T));
}

function ensureSingleCandidates<T extends string>(
    candidates: CandidateItem<T>[],
    selected: T,
    selectedLabel: string,
    score: number
): CandidateItem<T>[] {
    if (candidates.some((candidate) => candidate.value === selected)) {
        return candidates;
    }

    return dedupeCandidates([
        {
            value: selected,
            label: selectedLabel,
            score,
        },
        ...candidates,
    ]);
}

function ensureMultiCandidates<T extends string>(
    candidates: CandidateItem<T>[],
    selectedValues: T[],
    labelMap: Map<string, string>
): CandidateItem<T>[] {
    const missing = selectedValues
        .filter((value) => !candidates.some((candidate) => candidate.value === value))
        .map((value) => ({
            value,
            label: getLabel(labelMap, value),
            score: 0,
        }));

    return dedupeCandidates([...candidates, ...missing]);
}

function normalizeCandidateList<T extends string>(
    input: unknown,
    labelMap: Map<string, string>,
    allowedValues: Set<T>
): CandidateItem<T>[] {
    if (!Array.isArray(input)) return [];

    const normalized = input
        .filter(isCandidateItem)
        .filter((item) => allowedValues.has(item.value as T))
        .map((item) => ({
            value: item.value as T,
            label: getLabel(labelMap, item.value as T, item.label),
            score: typeof item.score === "number" ? item.score : 0,
        }));

    return dedupeCandidates(normalized);
}

function normalizeScores(data: PredictSuccessData): AttributeScores {
    const fallbackScore = typeof data.score === "number" ? data.score : 0;

    return {
        category: data.scores?.category ?? fallbackScore,
        occasion: data.scores?.occasion ?? fallbackScore,
        colorTone: data.scores?.color ?? fallbackScore,
        season: data.scores?.season ?? fallbackScore,
    };
}

function joinLabels(labels: string[]): string {
    return labels.length ? labels.join("、") : "-";
}

function normalizeResult(data: PredictSuccessData): AttributeResult {
    const scores = normalizeScores(data);

    const selectedCategory = normalizeSingleValue<CategoryValue>(
        data.category,
        CATEGORY_VALUE_SET,
        "top"
    );
    const selectedOccasions = normalizeMultiValues<OccasionValue>(
        Array.isArray(data.occasion) ? data.occasion : [],
        OCCASION_VALUE_SET
    );
    const selectedSeasons = normalizeMultiValues<SeasonValue>(
        Array.isArray(data.season) ? data.season : [],
        SEASON_VALUE_SET
    );
    const normalizedColor = COLOR_VALUE_SET.has(data.color as ColorValue)
        ? (data.color as ColorValue)
        : null;
    const selectedColors = normalizedColor ? [normalizedColor] : [];

    const categoryLabel = getLabel(
        CATEGORY_LABEL_MAP,
        selectedCategory,
        data.categoryLabel
    );
    const colorLabel = normalizedColor
        ? getLabel(COLOR_LABEL_MAP, normalizedColor, data.colorLabel)
        : data.colorLabel || "-";

    const categoryCandidates = ensureSingleCandidates(
        normalizeCandidateList<CategoryValue>(
            data.candidates?.category,
            CATEGORY_LABEL_MAP,
            CATEGORY_VALUE_SET
        ),
        selectedCategory,
        categoryLabel,
        scores.category
    );
    const occasionCandidates = ensureMultiCandidates(
        normalizeCandidateList<OccasionValue>(
            data.candidates?.occasion,
            OCCASION_LABEL_MAP,
            OCCASION_VALUE_SET
        ),
        selectedOccasions,
        OCCASION_LABEL_MAP
    );
    const seasonCandidates = ensureMultiCandidates(
        normalizeCandidateList<SeasonValue>(
            data.candidates?.season,
            SEASON_LABEL_MAP,
            SEASON_VALUE_SET
        ),
        selectedSeasons,
        SEASON_LABEL_MAP
    );
    const colorCandidates = normalizedColor
        ? ensureMultiCandidates(
            normalizeCandidateList<ColorValue>(
                data.candidates?.color,
                COLOR_LABEL_MAP,
                COLOR_VALUE_SET
            ),
            [normalizedColor],
            COLOR_LABEL_MAP
        )
        : normalizeCandidateList<ColorValue>(
            data.candidates?.color,
            COLOR_LABEL_MAP,
            COLOR_VALUE_SET
        );

    return {
        legacy: {
            category: categoryLabel,
            occasion: joinLabels(
                selectedOccasions.map((value) => getLabel(OCCASION_LABEL_MAP, value))
            ),
            colorTone: colorLabel,
            colorTags: selectedColors.map((value) => getLabel(COLOR_LABEL_MAP, value)),
            season: joinLabels(
                selectedSeasons.map((value) => getLabel(SEASON_LABEL_MAP, value))
            ),
        },
        latest: {
            route: data.route,
            coarseType: data.coarseType,
            name: data.name,
            category: selectedCategory,
            categoryLabel,
            color: normalizedColor,
            colorLabel,
            occasion: selectedOccasions,
            season: selectedSeasons,
            score: typeof data.score === "number" ? data.score : 0,
            detected: Boolean(data.detected),
            detectedLabel:
                typeof data.detectedLabel === "string" ? data.detectedLabel : null,
            bbox:
                Array.isArray(data.bbox) && data.bbox.every((item) => typeof item === "number")
                    ? data.bbox
                    : null,
            validation: {
                bestLabel:
                    typeof data.validation?.best_label === "string"
                        ? data.validation.best_label
                        : "",
                validScore:
                    typeof data.validation?.valid_score === "number"
                        ? data.validation.valid_score
                        : 0,
                invalidScore:
                    typeof data.validation?.invalid_score === "number"
                        ? data.validation.invalid_score
                        : 0,
            },
        },
        categorySelection: {
            selected: selectedCategory,
            label: categoryLabel,
            score: scores.category,
            candidates: categoryCandidates,
        },
        occasions: {
            selected: selectedOccasions,
            candidates: occasionCandidates,
            threshold: 0.62,
        },
        seasons: {
            selected: selectedSeasons,
            candidates: seasonCandidates,
            threshold: 0.58,
        },
        colors: {
            selected: selectedColors,
            candidates: colorCandidates,
            threshold: 0.58,
            maxSelected: 1,
        },
        scores,
    };
}

function normalizePreview(data: PredictSuccessData): PredictPreview | null {
    const base64 = typeof data.preview?.base64 === "string" ? data.preview.base64.trim() : "";

    if (!base64) {
        return null;
    }

    const filename =
        typeof data.preview?.filename === "string" && data.preview.filename.trim()
            ? data.preview.filename.trim()
            : "image.png";
    const mimeType =
        typeof data.preview?.mimeType === "string" && data.preview.mimeType.trim()
            ? data.preview.mimeType.trim()
            : "image/png";

    return {
        base64,
        filename,
        mimeType,
        dataUrl: `data:${mimeType};base64,${base64}`,
    };
}

export function useAttributes() {
    const [attributes, setAttributes] = useState<AttributeResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function predict(
        input: ProcessedImageInput,
        filename = "image.png",
        options: PredictOptions = {}
    ): Promise<PredictResult | null> {
        const { silent = false } = options;

        if (!silent) {
            setLoading(true);
        }
        setError(null);

        try {
            const body = JSON.stringify({
                base64: input.base64,
                filename: input.filename || filename,
                mimeType: input.mimeType || "image/png",
            });

            const res = await fetch("/api/attributes", {
                method: "POST",
                body,
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const text = await res.text();
            const payload = parseApiResponse(text);

            if (!res.ok || payload.ok === false) {
                const message =
                    payload.ok === false
                        ? normalizeErrorMessage(payload.error)
                        : "屬性辨識失敗。";
                throw new Error(message);
            }

            const normalizedAttributes = normalizeResult(payload.data);
            const preview = normalizePreview(payload.data);
            const result: PredictResult = {
                attributes: normalizedAttributes,
                preview,
            };

            if (!silent) {
                setAttributes(normalizedAttributes);
            }

            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : "屬性辨識失敗。";

            if (!silent) {
                setError(message);
            }

            throw new Error(message);
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
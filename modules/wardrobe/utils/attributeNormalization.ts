import type {
    AttributeResult,
    CandidateItem,
} from "@/modules/wardrobe/types/attribute";

type JsonObject = Record<string, unknown>;

type CandidateInput = {
    value?: unknown;
    label?: unknown;
    score?: unknown;
};

type CandidateGroupInput = {
    selected?: unknown;
    candidates?: unknown;
};

type AttributePayloadInput = {
    latest?: {
        route?: unknown;
        coarseType?: unknown;
        name?: unknown;
        category?: unknown;
        categoryLabel?: unknown;
        color?: unknown;
        colorLabel?: unknown;
        occasion?: unknown;
        season?: unknown;
        score?: unknown;
        detected?: unknown;
        detectedLabel?: unknown;
        bbox?: unknown;
        validation?: {
            bestLabel?: unknown;
            validScore?: unknown;
            invalidScore?: unknown;
        };
    };
    categorySelection?: CandidateGroupInput;
    occasions?: CandidateGroupInput;
    seasons?: CandidateGroupInput;
    colors?: CandidateGroupInput;
    scores?: {
        category?: unknown;
        occasion?: unknown;
        colorTone?: unknown;
        season?: unknown;
    };
};

type ParsedApiResponse = {
    ok?: boolean;
    data?: unknown;
    error?: unknown;
};

function isRecord(value: unknown): value is JsonObject {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
    return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter((item): item is string => typeof item === "string");
}

function asNumber(value: unknown, fallback = 0): number {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
    return typeof value === "boolean" ? value : fallback;
}

function asNumberArray(value: unknown): number[] | null {
    if (!Array.isArray(value)) {
        return null;
    }

    const result = value.filter((item): item is number => typeof item === "number");
    return result.length ? result : null;
}

function toAttributePayload(raw: unknown): AttributePayloadInput {
    if (!isRecord(raw)) {
        return {};
    }

    return raw as AttributePayloadInput;
}

export function parseAttributesApiResponse(text: string): ParsedApiResponse {
    try {
        return JSON.parse(text) as ParsedApiResponse;
    } catch {
        return {
            ok: false,
            error: {
                message: "回傳格式錯誤（非 JSON）",
            },
        };
    }
}

export function normalizeAttributeErrorMessage(error: unknown): string {
    if (!error) {
        return "屬性辨識失敗";
    }

    if (typeof error === "string") {
        return error;
    }

    if (isRecord(error)) {
        const message = error.message;
        if (typeof message === "string" && message.trim()) {
            return message;
        }
    }

    return "屬性辨識失敗";
}

function normalizeCandidates(input: unknown): CandidateItem[] {
    if (!Array.isArray(input)) {
        return [];
    }

    return input.map((item) => {
        const candidate = isRecord(item) ? (item as CandidateInput) : {};

        const value = asString(candidate.value);
        const label = asString(candidate.label, value);
        const score = asNumber(candidate.score, 0);

        return {
            value,
            label,
            score,
        };
    });
}

function normalizeSingleSelectField(input: CandidateGroupInput | undefined) {
    const candidates = normalizeCandidates(input?.candidates);
    const selected = asString(input?.selected) || candidates[0]?.value || "top";

    return {
        selected,
        candidates,
    };
}

function normalizeMultiSelectField(input: CandidateGroupInput | undefined) {
    return {
        selected: asStringArray(input?.selected),
        candidates: normalizeCandidates(input?.candidates),
    };
}

export function normalizeAttributeResult(raw: unknown): AttributeResult {
    const payload = toAttributePayload(raw);
    const latest = payload.latest;

    return {
        legacy: {
            category: asString(latest?.categoryLabel),
            occasion: asStringArray(latest?.occasion).join("、"),
            colorTone: asString(latest?.colorLabel),
            colorTags: asString(latest?.colorLabel)
                .split(/[、,]/)
                .map((item) => item.trim())
                .filter(Boolean),
            season: asStringArray(latest?.season).join("、"),
        },
        latest: {
            route: asString(latest?.route),
            coarseType: asString(latest?.coarseType),
            name: asString(latest?.name),
            category: (asString(latest?.category, "top") as AttributeResult["latest"]["category"]),
            categoryLabel: asString(latest?.categoryLabel),
            color: asString(latest?.color)
                ? (asString(latest?.color) as AttributeResult["latest"]["color"])
                : null,
            colorLabel: asString(latest?.colorLabel),
            occasion: asStringArray(latest?.occasion) as AttributeResult["latest"]["occasion"],
            season: asStringArray(latest?.season) as AttributeResult["latest"]["season"],
            score: asNumber(latest?.score),
            detected: asBoolean(latest?.detected),
            detectedLabel: asString(latest?.detectedLabel) || null,
            bbox: asNumberArray(latest?.bbox),
            validation: {
                bestLabel: asString(latest?.validation?.bestLabel),
                validScore: asNumber(latest?.validation?.validScore),
                invalidScore: asNumber(latest?.validation?.invalidScore),
            },
        },
        categorySelection: normalizeSingleSelectField(
            payload.categorySelection
        ) as AttributeResult["categorySelection"],
        occasions: normalizeMultiSelectField(payload.occasions) as AttributeResult["occasions"],
        seasons: normalizeMultiSelectField(payload.seasons) as AttributeResult["seasons"],
        colors: normalizeMultiSelectField(payload.colors) as AttributeResult["colors"],
        scores: {
            category: asNumber(payload.scores?.category),
            occasion: asNumber(payload.scores?.occasion),
            colorTone: asNumber(payload.scores?.colorTone),
            season: asNumber(payload.scores?.season),
        },
    };
}
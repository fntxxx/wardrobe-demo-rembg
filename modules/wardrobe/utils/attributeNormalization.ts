import type {
    AttributeResult,
    CandidateItem,
    PredictPreview,
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
        name?: unknown;
    };
    category?: CandidateGroupInput;
    occasions?: CandidateGroupInput;
    seasons?: CandidateGroupInput;
    colors?: CandidateGroupInput;
    preview?: {
        dataUrl?: unknown;
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

function asNullableString(value: unknown): string | null {
    return typeof value === "string" ? value : null;
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

function toAttributePayload(raw: unknown): AttributePayloadInput {
    if (!isRecord(raw)) {
        return {};
    }

    return raw as AttributePayloadInput;
}

/**
 * 安全 JSON parse
 */
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

/**
 * normalize error message
 */
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

/**
 * 轉 candidate
 */
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
    return {
        selected: asNullableString(input?.selected),
        candidates: normalizeCandidates(input?.candidates),
    };
}

function normalizeMultiSelectField(input: CandidateGroupInput | undefined) {
    return {
        selected: asStringArray(input?.selected),
        candidates: normalizeCandidates(input?.candidates),
    };
}

/**
 * 主 normalize
 */
export function normalizeAttributeResult(raw: unknown): AttributeResult {
    const payload = toAttributePayload(raw);

    return {
        latest: {
            name: asString(payload.latest?.name),
        },
        categorySelection: normalizeSingleSelectField(payload.category),
        occasions: normalizeMultiSelectField(payload.occasions),
        seasons: normalizeMultiSelectField(payload.seasons),
        colors: normalizeMultiSelectField(payload.colors),
    };
}

/**
 * preview normalize
 */
export function normalizePredictPreview(raw: unknown): PredictPreview | null {
    const payload = toAttributePayload(raw);
    const dataUrl = payload.preview?.dataUrl;

    if (typeof dataUrl !== "string" || !dataUrl) {
        return null;
    }

    return {
        dataUrl,
    };
}
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
import type {
  AttributeResult,
  CandidateItem,
  PredictOptions,
  PredictResult,
} from "@/modules/wardrobe/types/attribute";

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

type ParsedHttpResponse = {
  status: number;
  statusText: string;
  contentType: string | null;
  text: string;
  json: unknown | null;
};

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
const RAW_TEXT_PREVIEW_LIMIT = 600;

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

function getObjectKeysText(value: unknown): string {
  if (!isObject(value)) {
    return typeof value;
  }

  const keys = Object.keys(value);
  return keys.length > 0 ? keys.join(", ") : "(no keys)";
}

function parseJsonSafely(text: string): unknown | null {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function truncateText(value: string): string {
  const normalized = value.trim();

  if (!normalized) {
    return "(empty body)";
  }

  return normalized.slice(0, RAW_TEXT_PREVIEW_LIMIT);
}

function buildHttpSummary(response: ParsedHttpResponse): string {
  const summaryParts = [
    `HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ""}`,
    response.contentType ? `content-type=${response.contentType}` : null,
  ].filter((part): part is string => Boolean(part));

  return summaryParts.join(" | ");
}

async function readResponsePayload(res: Response): Promise<ParsedHttpResponse> {
  const text = await res.text();
  return {
    status: res.status,
    statusText: res.statusText,
    contentType: res.headers.get("content-type"),
    text,
    json: parseJsonSafely(text),
  };
}

function parseApiResponse(response: ParsedHttpResponse): RawApiResponse {
  const { json } = response;

  if (json === null) {
    throw new Error(
      `屬性服務回傳的不是有效 JSON。${buildHttpSummary(response)} body=${truncateText(
        response.text
      )}`
    );
  }

  if (!isObject(json) || typeof json.ok !== "boolean") {
    throw new Error(
      `屬性服務 JSON 結構不符合預期。${buildHttpSummary(response)} keys=${getObjectKeysText(
        json
      )}`
    );
  }

  if (json.ok === false) {
    if (!isApiErrorPayload(json.error)) {
      throw new Error(
        `屬性服務錯誤回應結構不符合預期。${buildHttpSummary(
          response
        )} errorKeys=${getObjectKeysText(isObject(json) ? json.error : null)}`
      );
    }

    return {
      ok: false,
      error: json.error,
    };
  }

  if (!isPredictSuccessData(json.data)) {
    throw new Error(
      `屬性服務成功回應結構不符合預期。${buildHttpSummary(
        response
      )} dataKeys=${getObjectKeysText(isObject(json) ? json.data : null)}`
    );
  }

  return {
    ok: true,
    data: json.data,
  };
}

function normalizeErrorMessage(error: ApiErrorPayload): string {
  const message = error.message?.trim() || "屬性辨識失敗。";
  const details = isObject(error.details) ? error.details : null;

  if (!details) {
    return message;
  }

  const upstreamStatus =
    typeof details.upstreamStatus === "number" ? details.upstreamStatus : null;
  const upstreamContentType =
    typeof details.upstreamContentType === "string" && details.upstreamContentType.trim()
      ? details.upstreamContentType.trim()
      : null;
  const upstreamUrl =
    typeof details.upstreamUrl === "string" && details.upstreamUrl.trim()
      ? details.upstreamUrl.trim()
      : null;
  const rawBodyPreview =
    typeof details.rawBodyPreview === "string" && details.rawBodyPreview.trim()
      ? details.rawBodyPreview.trim()
      : null;
  const parsedBodyKeys = isObject(details.parsedBody)
    ? Object.keys(details.parsedBody).join(", ") || "(no keys)"
    : null;
  const cause =
    typeof details.cause === "string" && details.cause.trim()
      ? details.cause.trim()
      : null;

  const summaryParts = [
    upstreamStatus !== null ? `status=${upstreamStatus}` : null,
    upstreamContentType ? `content-type=${upstreamContentType}` : null,
    upstreamUrl ? `upstream=${upstreamUrl}` : null,
    parsedBodyKeys ? `parsedBodyKeys=${parsedBodyKeys}` : null,
    cause ? `cause=${cause}` : null,
  ].filter((part): part is string => Boolean(part));

  if (summaryParts.length === 0 && !rawBodyPreview) {
    return message;
  }

  const diagnosticText = [
    summaryParts.length > 0 ? `[${summaryParts.join(" | ")}]` : null,
    rawBodyPreview ? `body=${rawBodyPreview}` : null,
  ]
    .filter((part): part is string => Boolean(part))
    .join(" ");

  return diagnosticText ? `${message} ${diagnosticText}` : message;
}

function dedupeCandidates<T extends string>(
  candidates: CandidateItem<T>[]
): CandidateItem<T>[] {
  const seen = new Set<string>();
  const result: CandidateItem<T>[] = [];

  candidates.forEach((candidate) => {
    if (!candidate.value) {
      return;
    }

    if (seen.has(candidate.value)) {
      return;
    }

    seen.add(candidate.value);
    result.push(candidate);
  });

  return result;
}

function normalizeCandidateArray<T extends string>(
  rawCandidates: unknown,
  valueSet: Set<T>,
  labelMap: Map<T, string>
): CandidateItem<T>[] {
  if (!Array.isArray(rawCandidates)) {
    return [];
  }

  const parsed = rawCandidates
    .filter(isCandidateItem)
    .map((candidate) => {
      if (!valueSet.has(candidate.value as T)) {
        return null;
      }

      const value = candidate.value as T;
      return {
        value,
        label: candidate.label || labelMap.get(value) || value,
        score: candidate.score,
      };
    })
    .filter((candidate): candidate is CandidateItem<T> => candidate !== null)
    .sort((a, b) => b.score - a.score);

  return dedupeCandidates(parsed);
}

function normalizeCategoryValue(raw: string): CategoryValue {
  if (CATEGORY_VALUE_SET.has(raw as CategoryValue)) {
    return raw as CategoryValue;
  }

  return CATEGORY_OPTIONS[0].value;
}

function normalizeOccasionValues(raw: string[]): OccasionValue[] {
  const values = raw.filter((item): item is OccasionValue =>
    OCCASION_VALUE_SET.has(item as OccasionValue)
  );

  return values.length ? Array.from(new Set(values)) : [OCCASION_OPTIONS[0].value];
}

function normalizeSeasonValues(raw: string[]): SeasonValue[] {
  const values = raw.filter((item): item is SeasonValue =>
    SEASON_VALUE_SET.has(item as SeasonValue)
  );

  return values.length ? Array.from(new Set(values)) : [SEASON_OPTIONS[0].value];
}

function normalizeColorValues(rawColor: string): ColorValue | null {
  if (COLOR_VALUE_SET.has(rawColor as ColorValue)) {
    return rawColor as ColorValue;
  }

  return null;
}

function normalizeColorSelections(
  rawColor: string,
  rawCandidates: unknown
): {
  selected: ColorValue[];
  candidates: CandidateItem<ColorValue>[];
} {
  const normalizedCandidates = normalizeCandidateArray(
    rawCandidates,
    COLOR_VALUE_SET,
    COLOR_LABEL_MAP
  );

  const selectedColor = normalizeColorValues(rawColor);

  if (selectedColor) {
    return {
      selected: [selectedColor],
      candidates:
        normalizedCandidates.length > 0
          ? normalizedCandidates
          : [
            {
              value: selectedColor,
              label: COLOR_LABEL_MAP.get(selectedColor) || selectedColor,
              score: 1,
            },
          ],
    };
  }

  return {
    selected: normalizedCandidates[0] ? [normalizedCandidates[0].value] : [],
    candidates: normalizedCandidates,
  };
}

function buildColorTags(rawColorLabel: string): string[] {
  if (!rawColorLabel.trim()) {
    return [];
  }

  return rawColorLabel
    .split(/[、,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeAttributes(data: PredictSuccessData): AttributeResult {
  const category = normalizeCategoryValue(data.category);
  const categoryCandidates = normalizeCandidateArray(
    data.candidates?.category,
    CATEGORY_VALUE_SET,
    CATEGORY_LABEL_MAP
  );
  const occasionValues = normalizeOccasionValues(data.occasion);
  const occasionCandidates = normalizeCandidateArray(
    data.candidates?.occasion,
    OCCASION_VALUE_SET,
    OCCASION_LABEL_MAP
  );
  const seasonValues = normalizeSeasonValues(data.season);
  const seasonCandidates = normalizeCandidateArray(
    data.candidates?.season,
    SEASON_VALUE_SET,
    SEASON_LABEL_MAP
  );
  const normalizedColors = normalizeColorSelections(data.color, data.candidates?.color);

  return {
    legacy: {
      category: data.categoryLabel,
      occasion: data.occasion.join("、"),
      colorTone: data.colorLabel,
      colorTags: buildColorTags(data.colorLabel),
      season: data.season.join("、"),
    },
    latest: {
      route: data.route,
      coarseType: data.coarseType,
      name: data.name,
      category,
      categoryLabel: data.categoryLabel,
      color: normalizedColors.selected[0] ?? null,
      colorLabel: data.colorLabel,
      occasion: occasionValues,
      season: seasonValues,
      score: data.score,
      detected: Boolean(data.detected),
      detectedLabel:
        typeof data.detectedLabel === "string" ? data.detectedLabel : null,
      bbox: Array.isArray(data.bbox) ? data.bbox.filter((item) => typeof item === "number") : null,
      validation: {
        bestLabel: data.validation?.best_label ?? "",
        validScore: data.validation?.valid_score ?? 0,
        invalidScore: data.validation?.invalid_score ?? 0,
      },
    },
    categorySelection: {
      selected: category,
      label: CATEGORY_LABEL_MAP.get(category),
      score: data.scores?.category,
      candidates:
        categoryCandidates.length > 0
          ? categoryCandidates
          : [
            {
              value: category,
              label: data.categoryLabel || CATEGORY_LABEL_MAP.get(category) || category,
              score: data.scores?.category ?? data.score,
            },
          ],
    },
    occasions: {
      selected: occasionValues,
      candidates: occasionCandidates,
      threshold: 0.3,
      maxSelected: 3,
    },
    seasons: {
      selected: seasonValues,
      candidates: seasonCandidates,
      threshold: 0.3,
      maxSelected: 2,
    },
    colors: {
      selected: normalizedColors.selected,
      candidates: normalizedColors.candidates,
      threshold: 0.2,
      maxSelected: 1,
    },
    scores: {
      category: data.scores?.category ?? data.scores?.mainCategory ?? 0,
      occasion: data.scores?.occasion ?? 0,
      colorTone: data.scores?.color ?? 0,
      season: data.scores?.season ?? 0,
    },
  };
}

export function useAttributes() {
  const [attributes, setAttributes] = useState<AttributeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function predict(
    assetId: string,
    options: PredictOptions = {}
  ): Promise<PredictResult | null> {
    const { silent = false } = options;

    if (!silent) {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetch("/api/attributes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assetId,
        }),
      });

      const response = await readResponsePayload(res);
      const payload = parseApiResponse(response);

      if (!res.ok || payload.ok === false) {
        throw new Error(
          payload.ok === false
            ? normalizeErrorMessage(payload.error)
            : `屬性辨識失敗。${buildHttpSummary(response)}`
        );
      }

      const normalizedAttributes = normalizeAttributes(payload.data);
      const result: PredictResult = {
        attributes: normalizedAttributes,
      };

      if (!silent) {
        setAttributes(normalizedAttributes);
      }

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "屬性辨識失敗。";

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
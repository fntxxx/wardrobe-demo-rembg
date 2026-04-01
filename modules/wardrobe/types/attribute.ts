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

export type PredictOptions = {
  silent?: boolean;
};

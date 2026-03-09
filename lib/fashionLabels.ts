// lib/fashionLabels.ts

export const CATEGORY_LABELS = [
    "t-shirt",
    "shirt",
    "hoodie",
    "sweater",
    "jacket",
    "coat",
    "dress",
    "skirt",
    "pants",
    "jeans",
    "shorts",
] as const;

export const OCCASION_LABELS = [
    "casual",
    "work",
    "formal",
    "sport",
    "outdoor",
    "party",
] as const;

// 色系用「色系」而不是單一顏色，demo 更好講
export const COLOR_TONE_LABELS = [
    "black tone",
    "white tone",
    "gray tone",
    "blue tone",
    "green tone",
    "red tone",
    "brown tone",
    "beige tone",
] as const;

export const SEASON_LABELS = [
    "spring",
    "summer",
    "autumn",
    "winter",
] as const;

export type CategoryLabel = (typeof CATEGORY_LABELS)[number];
export type OccasionLabel = (typeof OCCASION_LABELS)[number];
export type ColorToneLabel = (typeof COLOR_TONE_LABELS)[number];
export type SeasonLabel = (typeof SEASON_LABELS)[number];
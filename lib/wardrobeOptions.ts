export const CATEGORY_OPTIONS = [
    { value: "top", label: "上衣" },
    { value: "pants", label: "褲子" },
    { value: "skirt", label: "裙子" },
    { value: "dress", label: "連身裙" },
    { value: "outer", label: "外套" },
    { value: "shoes", label: "鞋子" },
] as const;

export const OCCASION_OPTIONS = [
    { value: "social", label: "社交聚會" },
    { value: "campus_casual", label: "校園休閒" },
    { value: "business_casual", label: "商務休閒" },
    { value: "professional", label: "專業職場" },
] as const;

export const SEASON_OPTIONS = [
    { value: "spring", label: "春季" },
    { value: "summer", label: "夏季" },
    { value: "autumn", label: "秋季" },
    { value: "winter", label: "冬季" },
] as const;

export const COLOR_OPTIONS = [
    { value: "light_beige", label: "淺米白", swatches: ["#F3F0EA", "#EEE8DE", "#E2DBCF", "#D7CEC0"] },
    { value: "dark_gray_black", label: "深灰黑", swatches: ["#1B1B1D", "#343438", "#56565A", "#78787B"] },
    { value: "neutral_gray", label: "中性灰", swatches: ["#A5A5A8", "#B6B7BB", "#C7C8CC", "#D9DADD"] },
    { value: "earth_brown", label: "大地棕", swatches: ["#996A3E", "#B2824E", "#C5A476", "#D1C0A3"] },
    { value: "warm_orange_red", label: "暖橘紅", swatches: ["#C83C2E", "#EB5441", "#E6851F", "#F09D0C"] },
    { value: "rose_pink", label: "粉嫩玫瑰", swatches: ["#EFC3C7", "#EEA7AF", "#E08084", "#C0408A"] },
    { value: "natural_green", label: "自然綠", swatches: ["#4F835B", "#6BA06B", "#87B487", "#A2C39B"] },
    { value: "fresh_blue", label: "清爽藍", swatches: ["#224A7B", "#3B75B1", "#5D9ED3", "#95BFE3"] },
    { value: "elegant_purple", label: "優雅紫", swatches: ["#5C2B7A", "#7C53B0", "#A07BD1", "#C4A7DD"] },
    { value: "pattern", label: "花紋圖案", swatches: ["#7C7C7C", "#B62E36", "#B78A4A", "#1F1F1F"] },
] as const;

export type CategoryValue = (typeof CATEGORY_OPTIONS)[number]["value"];
export type OccasionValue = (typeof OCCASION_OPTIONS)[number]["value"];
export type SeasonValue = (typeof SEASON_OPTIONS)[number]["value"];
export type ColorValue = (typeof COLOR_OPTIONS)[number]["value"];
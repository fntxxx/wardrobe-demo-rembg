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
    { value: "light_beige", label: "淺米白", swatches: ["#F1F1F1", "#E7E3DD", "#E5E2DD", "#D7D2C8"] },
    { value: "dark_gray_black", label: "深灰黑", swatches: ["#111214", "#2E2E32", "#59595E", "#7A7A7F"] },
    { value: "neutral_gray", label: "中性灰", swatches: ["#A7A7AA", "#B9B9BC", "#CDCDD0", "#DDDDDF"] },
    { value: "earth_brown", label: "大地棕", swatches: ["#9A693F", "#B88D5C", "#CBAE80", "#D6C19E"] },
    { value: "butter_yellow", label: "奶油黃", swatches: ["#E7D9A4", "#F0E7B5", "#D8B22C", "#EBD98D"] },
    { value: "warm_orange_red", label: "暖橘紅", swatches: ["#C93A2D", "#EC4A37", "#F38B0F", "#F3AB15"] },
    { value: "rose_pink", label: "粉桃紅", swatches: ["#E8C1C3", "#E9A3A8", "#E57E7B", "#C1458B"] },
    { value: "natural_green", label: "自然綠", swatches: ["#588A63", "#75A66F", "#8EB689", "#B8D1B0"] },
    { value: "fresh_blue", label: "清爽藍", swatches: ["#224A79", "#3778B6", "#5D93C3", "#A9C9E5"] },
    { value: "elegant_purple", label: "優雅紫", swatches: ["#5C2A78", "#7A52AD", "#A57DCD", "#C4ADDE"] },
] as const;

export type CategoryValue = (typeof CATEGORY_OPTIONS)[number]["value"];
export type OccasionValue = (typeof OCCASION_OPTIONS)[number]["value"];
export type SeasonValue = (typeof SEASON_OPTIONS)[number]["value"];
export type ColorValue = (typeof COLOR_OPTIONS)[number]["value"];
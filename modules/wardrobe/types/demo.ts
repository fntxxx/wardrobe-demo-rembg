export type ProcessStage = "idle" | "removing" | "predicting";

export type FormState = {
    name: string;
    category: string | null;
    occasions: string[];
    seasons: string[];
    colors: string[];
};
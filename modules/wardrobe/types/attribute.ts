export type CandidateItem = {
    value: string;
    label: string;
    score: number;
};

export type SingleSelectField = {
    selected: string | null;
    candidates: CandidateItem[];
};

export type MultiSelectField = {
    selected: string[];
    candidates: CandidateItem[];
};

export type AttributeResult = {
    latest: {
        name: string;
    };
    categorySelection: SingleSelectField;
    occasions: MultiSelectField;
    seasons: MultiSelectField;
    colors: MultiSelectField;
};

export type PredictPreview = {
    dataUrl: string;
};

export type PredictResult = {
    attributes: AttributeResult;
    preview: PredictPreview | null;
};

export type ProcessedImageInput = {
    base64: string;
    filename?: string;
    mimeType?: string;
};

export type PredictOptions = {
    silent?: boolean;
};
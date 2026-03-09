import { useState } from "react";

export type Attributes = {
    category: string;
    occasion: string;
    colorTone: string;
    season: string;
    scores?: {
        category: number;
        occasion: number;
        colorTone: number;
        season: number;
    };
};

export function useAttributes() {
    const [attributes, setAttributes] = useState<Attributes | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const predict = async (
        input: File | Blob,
        filename = "image.png",
        options?: { silent?: boolean }
    ) => {
        setLoading(true);
        setError(null);

        try {
            const file =
                input instanceof File ? input : new File([input], filename, { type: input.type || "image/png" });

            const fd = new FormData();
            fd.append("file", file);

            const res = await fetch("/api/attributes", {
                method: "POST",
                body: fd,
            });

            if (!res.ok) throw new Error(`API failed: ${res.status}`);

            const data = (await res.json()) as Attributes;
            if (!options?.silent) {
                setAttributes(data);
            }
            return data;
        } catch (e) {
            setError(e instanceof Error ? e.message : "unknown error");
            setAttributes(null);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { attributes, loading, error, predict, setAttributes };
}
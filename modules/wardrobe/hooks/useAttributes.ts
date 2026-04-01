import { useState } from "react";
import type {
    AttributeResult,
    PredictOptions,
    PredictResult,
    ProcessedImageInput,
} from "@/modules/wardrobe/types/attribute";
import {
    normalizeAttributeErrorMessage,
    normalizeAttributeResult,
    normalizePredictPreview,
    parseAttributesApiResponse,
} from "@/modules/wardrobe/utils/attributeNormalization";

export function useAttributes() {
    const [attributes, setAttributes] = useState<AttributeResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function predict(
        input: ProcessedImageInput,
        filename = "image.png",
        options: PredictOptions = {}
    ): Promise<PredictResult | null> {
        const { silent = false } = options;

        if (!silent) {
            setLoading(true);
        }
        setError(null);

        try {
            const body = JSON.stringify({
                base64: input.base64,
                filename: input.filename || filename,
                mimeType: input.mimeType || "image/png",
            });

            const res = await fetch("/api/attributes", {
                method: "POST",
                body,
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const text = await res.text();
            const payload = parseAttributesApiResponse(text);

            if (!res.ok || payload.ok === false) {
                const message = payload.ok === false ? normalizeAttributeErrorMessage(payload.error) : "屬性辨識失敗。";
                throw new Error(message);
            }

            const normalizedAttributes = normalizeAttributeResult(payload.data);
            const preview = normalizePredictPreview(payload.data);
            const result: PredictResult = {
                attributes: normalizedAttributes,
                preview,
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
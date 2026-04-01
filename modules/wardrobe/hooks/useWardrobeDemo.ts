import { useEffect, useMemo, useState } from "react";
import { useAttributes } from "@/modules/wardrobe/hooks/useAttributes";
import type { FormState, ProcessStage } from "@/modules/wardrobe/types/demo";
import type { CandidateItem } from "@/modules/wardrobe/types/attribute";
import { parseRemoveBgResponse } from "@/modules/wardrobe/utils/demo";

export function useWardrobeDemo() {
    const [stage, setStage] = useState<ProcessStage>("idle");
    const [error, setError] = useState<string | null>(null);
    const [originalUrl, setOriginalUrl] = useState<string | null>(null);
    const [processedUrl, setProcessedUrl] = useState<string | null>(null);
    const [formState, setFormState] = useState<FormState | null>(null);

    const {
        attributes,
        error: attrError,
        loading,
        predict,
        setAttributes,
        setError: setAttrError,
    } = useAttributes();

    useEffect(() => {
        return () => {
            if (originalUrl) {
                URL.revokeObjectURL(originalUrl);
            }
            if (processedUrl) {
                URL.revokeObjectURL(processedUrl);
            }
        };
    }, [originalUrl, processedUrl]);

    useEffect(() => {
        if (!attributes) {
            return;
        }

        setFormState({
            name: attributes.latest.name,
            category: attributes.categorySelection.selected,
            occasions: attributes.occasions.selected,
            seasons: attributes.seasons.selected,
            colors: attributes.colors.selected,
        });
    }, [attributes]);

    async function runAutoPipeline(picked: File) {
        const formData = new FormData();
        formData.append("file", picked);

        setStage("removing");

        const removeRes = await fetch("/api/remove-bg", {
            method: "POST",
            body: formData,
            headers: {
                "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY ?? "",
            },
        });

        const removePayload = await parseRemoveBgResponse(removeRes);

        if (!removeRes.ok || removePayload.ok === false) {
            throw new Error(removePayload.ok === false ? removePayload.error.message : "去背失敗。");
        }

        const { image } = removePayload.data;

        setStage("predicting");

        const predictResult = await predict(
            {
                base64: image.base64,
                filename: image.filename,
                mimeType: image.mime_type,
            },
            image.filename
        );

        return {
            removePayload,
            predictResult,
            processedImage: image,
        };
    }

    async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        const picked = event.target.files?.[0];
        event.target.value = "";

        if (!picked) {
            return;
        }

        setError(null);
        setAttrError(null);
        setStage("idle");

        const nextOriginalUrl = URL.createObjectURL(picked);
        setOriginalUrl((previous) => {
            if (previous) {
                URL.revokeObjectURL(previous);
            }

            return nextOriginalUrl;
        });

        setProcessedUrl((previous) => {
            if (previous) {
                URL.revokeObjectURL(previous);
            }

            return null;
        });

        setAttributes(null);
        setFormState(null);

        try {
            const { predictResult } = await runAutoPipeline(picked);

            if (predictResult?.preview) {
                setProcessedUrl(predictResult.preview.dataUrl);
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : "處理失敗，請稍後再試。");
        } finally {
            setStage("idle");
        }
    }

    const categoryCandidates = useMemo<CandidateItem[]>(() => {
        return attributes?.categorySelection.candidates ?? [];
    }, [attributes]);

    const occasionCandidates = useMemo<CandidateItem[]>(() => {
        return attributes?.occasions.candidates ?? [];
    }, [attributes]);

    const seasonCandidates = useMemo<CandidateItem[]>(() => {
        return attributes?.seasons.candidates ?? [];
    }, [attributes]);

    const colorCandidates = useMemo<CandidateItem[]>(() => {
        return attributes?.colors.candidates ?? [];
    }, [attributes]);

    return {
        stage,
        error,
        attrError,
        loading,
        originalUrl,
        processedUrl,
        attributes,
        formState,
        setFormState,
        handleFileChange,
        categoryCandidates,
        occasionCandidates,
        seasonCandidates,
        colorCandidates,
        isBusy: stage !== "idle",
    };
}
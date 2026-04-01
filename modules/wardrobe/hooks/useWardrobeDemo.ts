import { useEffect, useMemo, useState } from "react";
import { useAttributes } from "@/modules/wardrobe/hooks/useAttributes";
import type { FormState, ProcessStage } from "@/modules/wardrobe/types/demo";
import type {
  CandidateItem,
  ProcessedImageAsset,
} from "@/modules/wardrobe/types/attribute";
import { parseRemoveBgResponse } from "@/modules/wardrobe/utils/demo";

export function useWardrobeDemo() {
  const [stage, setStage] = useState<ProcessStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [processedAsset, setProcessedAsset] = useState<ProcessedImageAsset | null>(null);
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
    };
  }, [originalUrl]);

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

    setProcessedAsset(removePayload.data);
    setStage("predicting");

    const processedResult = await predict(removePayload.data.assetId, {
      silent: true,
    });

    if (!processedResult) {
      throw new Error("辨識結果為空。");
    }

    setAttributes(processedResult.attributes);
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    if (!picked) {
      return;
    }

    setError(null);
    setAttrError(null);
    setAttributes(null);
    setFormState(null);
    setProcessedAsset(null);

    setOriginalUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }
      return null;
    });

    const nextOriginalUrl = URL.createObjectURL(picked);
    setOriginalUrl(nextOriginalUrl);

    try {
      await runAutoPipeline(picked);
    } catch (error) {
      const message = error instanceof Error ? error.message : "處理失敗";
      setError(message);
      setProcessedAsset(null);
    } finally {
      setStage("idle");
      event.target.value = "";
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
    processedUrl: processedAsset?.previewUrl ?? null,
    processedAsset,
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
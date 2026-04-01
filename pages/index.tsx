/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from "react";
import { useAttributes } from "@/lib/useAttributes";
import {
  CATEGORY_OPTIONS,
  OCCASION_OPTIONS,
  SEASON_OPTIONS,
  COLOR_OPTIONS,
  type CategoryValue,
  type OccasionValue,
  type SeasonValue,
  type ColorValue,
} from "@/lib/wardrobeOptions";

type ProcessStage = "idle" | "removing" | "predicting";

type FormState = {
  name: string;
  category: CategoryValue;
  occasions: OccasionValue[];
  seasons: SeasonValue[];
  colors: ColorValue[];
};

type ApiErrorPayload = {
  code: string;
  message: string;
  details?: unknown;
};

type RemoveBgSuccessData = {
  image: {
    filename: string;
    mime_type: string;
    base64: string;
    width: number;
    height: number;
  };
  model: string;
  fallback_used: boolean;
  edge_quality_low_candidate: boolean;
  metrics: {
    edge_band_ratio: number;
    edge_band_mid_ratio: number;
    edge_band_low_ratio: number;
  };
  processing: {
    max_side: number;
    quality: string;
    reject_low_confidence: boolean;
    reject_edge_quality: boolean;
  };
};

type RemoveBgResponse =
  | { ok: true; data: RemoveBgSuccessData }
  | { ok: false; error: ApiErrorPayload };

function useIsMobile(breakpoint = 900) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth <= breakpoint);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [breakpoint]);

  return isMobile;
}

function toggleMultiValue<T extends string>(current: T[], value: T) {
  if (current.includes(value)) {
    return current.filter((item) => item !== value);
  }

  return [...current, value];
}

function toggleSingleValue<T extends string>(current: T[], value: T) {
  if (current.length === 1 && current[0] === value) {
    return [];
  }

  return [value];
}

function getStageText(stage: ProcessStage) {
  if (stage === "removing") return "去背中...";
  if (stage === "predicting") return "辨識中...";
  return "上傳圖片後會自動去背並辨識";
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatTextList(values: string[]) {
  return values.length ? values.join("、") : "-";
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 30, fontWeight: 800, color: "#111827" }}>{title}</div>
      {subtitle ? (
        <div style={{ marginTop: 6, fontSize: 14, color: "#6b7280", lineHeight: 1.6 }}>
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}

function BlockTitle({
  title,
  helper,
}: {
  title: string;
  helper?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 6,
        marginBottom: 12,
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 800, color: "#171717", letterSpacing: "0.01em" }}>
        {title}
      </div>
      {helper ? (
        <div style={{ fontSize: 12, fontWeight: 700, color: "#4b5563" }}>{helper}</div>
      ) : null}
    </div>
  );
}

function FilterChip({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        height: 36,
        padding: "0 14px",
        borderRadius: 999,
        border: active ? "1px solid #25324B" : "1px solid #CFCFD4",
        background: active ? "#25324B" : "#FFFFFF",
        color: active ? "#FFFFFF" : "#4B5563",
        fontSize: 15,
        fontWeight: 700,
        lineHeight: "36px",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.15s ease",
        whiteSpace: "nowrap",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {label}
    </button>
  );
}

function ColorCard({
  label,
  swatches,
  active,
  disabled,
  onClick,
}: {
  label: string;
  swatches: readonly string[];
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      style={{
        position: "relative",
        border: active ? "3px solid #25324B" : "1px solid transparent",
        borderRadius: 22,
        background: "transparent",
        padding: 0,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        transition: "all 0.15s ease",
      }}
    >
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          aspectRatio: "1 / 1.14",
          borderRadius: 20,
          background: "#ffffff",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
        }}
      >
        {swatches.slice(0, 4).map((swatch, idx) => (
          <span
            key={`${label}-${idx}`}
            style={{
              background: swatch,
              borderRight: idx % 2 === 0 ? "2px solid rgba(255,255,255,0.72)" : "none",
              borderBottom: idx < 2 ? "2px solid rgba(255,255,255,0.72)" : "none",
            }}
          />
        ))}

        {active ? (
          <span
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "#25324B",
              color: "#FFFFFF",
              display: "grid",
              placeItems: "center",
              fontSize: 18,
              fontWeight: 900,
              lineHeight: 1,
            }}
          >
            ✓
          </span>
        ) : null}

        <span
          style={{
            position: "absolute",
            left: "50%",
            bottom: 10,
            transform: "translateX(-50%)",
            minWidth: 54,
            padding: "6px 11px 5px",
            borderRadius: 999,
            background: active ? "rgba(126, 101, 21, 0.92)" : "rgba(118, 118, 118, 0.75)",
            color: "#FFFFFF",
            fontSize: 12,
            fontWeight: 800,
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      </div>
    </button>
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isRemoveBgResponse(value: unknown): value is RemoveBgResponse {
  if (!isObject(value) || typeof value.ok !== "boolean") {
    return false;
  }

  if (value.ok === false) {
    return (
      isObject(value.error) &&
      typeof value.error.code === "string" &&
      typeof value.error.message === "string"
    );
  }

  return isObject(value.data) && isObject(value.data.image);
}

async function parseRemoveBgResponse(response: Response): Promise<RemoveBgResponse> {
  const text = await response.text();
  let json: unknown;

  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("去背服務回傳格式不是有效 JSON。");
  }

  if (!isRemoveBgResponse(json)) {
    throw new Error("去背服務回傳格式不符合預期。");
  }

  return json;
}

export default function HomePage() {
  const isMobile = useIsMobile();

  const [stage, setStage] = useState<ProcessStage>("idle");
  const [error, setError] = useState<string | null>(null);

  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);

  const {
    attributes,
    error: attrError,
    predict,
    setAttributes,
    setError: setAttrError,
  } = useAttributes();

  const [formState, setFormState] = useState<FormState | null>(null);

  const isBusy = stage !== "idle";

  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (processedUrl) URL.revokeObjectURL(processedUrl);
    };
  }, [originalUrl, processedUrl]);

  useEffect(() => {
    if (!attributes) return;
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
      throw new Error(
        removePayload.ok === false ? removePayload.error.message : "去背失敗。"
      );
    }

    setStage("predicting");

    const processedInput = {
      base64: removePayload.data.image.base64,
      filename: removePayload.data.image.filename,
      mimeType: removePayload.data.image.mime_type,
    };

    const processedResult = await predict(
      processedInput,
      removePayload.data.image.filename,
      { silent: true }
    );

    if (!processedResult) {
      throw new Error("辨識結果為空。");
    }

    const nextProcessedUrl =
      processedResult.preview?.dataUrl ||
      `data:${processedInput.mimeType};base64,${processedInput.base64}`;

    if (processedUrl) {
      URL.revokeObjectURL(processedUrl);
    }
    setProcessedUrl(nextProcessedUrl);
    setAttributes(processedResult.attributes);
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;

    setError(null);
    setAttrError(null);
    setAttributes(null);
    setFormState(null);

    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (processedUrl) URL.revokeObjectURL(processedUrl);

    setOriginalUrl(null);
    setProcessedUrl(null);

    const nextOriginalUrl = URL.createObjectURL(picked);
    setOriginalUrl(nextOriginalUrl);

    try {
      await runAutoPipeline(picked);
    } catch (err) {
      const message = err instanceof Error ? err.message : "處理失敗";
      setError(message);
      setProcessedUrl(null);
    } finally {
      setStage("idle");
      e.target.value = "";
    }
  }

  const categoryCandidates = useMemo(
    () => attributes?.categorySelection.candidates ?? [],
    [attributes]
  );
  const occasionCandidates = useMemo(
    () => attributes?.occasions.candidates ?? [],
    [attributes]
  );
  const seasonCandidates = useMemo(
    () => attributes?.seasons.candidates ?? [],
    [attributes]
  );
  const colorCandidates = useMemo(
    () => attributes?.colors.candidates ?? [],
    [attributes]
  );

  const canEdit = Boolean(formState) && !isBusy;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F7F6",
        color: "#111827",
        padding: isMobile ? "24px 16px 40px" : "36px 28px 56px",
        fontFamily:
          "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
        }}
      >
        <SectionTitle
          title="Wardrobe Demo"
          subtitle="圖片上傳後會先做去背，再使用處理後圖片進行服飾屬性辨識。"
        />

        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: 24,
            alignItems: "start",
          }}
        >
          <section
            style={{
              flex: 1,
              minWidth: 0,
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: 24,
              padding: 18,
            }}
          >
            <BlockTitle title="上傳圖片" helper={getStageText(stage)} />

            <label
              style={{
                display: "grid",
                placeItems: "center",
                minHeight: 160,
                borderRadius: 20,
                border: "1.5px dashed #CBD5E1",
                background: "#F8FAFC",
                cursor: isBusy ? "not-allowed" : "pointer",
                opacity: isBusy ? 0.65 : 1,
                padding: 20,
                textAlign: "center",
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={onPickFile}
                disabled={isBusy}
                style={{ display: "none" }}
              />
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#1F2937" }}>
                  選擇衣物圖片
                </div>
                <div style={{ marginTop: 8, fontSize: 14, color: "#6B7280", lineHeight: 1.7 }}>
                  支援拍照或從相簿選取。
                  <br />
                  流程固定為：上傳 → 去背 → 辨識 → 編輯確認。
                </div>
              </div>
            </label>

            {(error || attrError) ? (
              <div
                style={{
                  marginTop: 16,
                  borderRadius: 16,
                  border: "1px solid #FECACA",
                  background: "#FEF2F2",
                  color: "#991B1B",
                  padding: "12px 14px",
                  fontSize: 14,
                  fontWeight: 700,
                  lineHeight: 1.6,
                }}
              >
                {error || attrError}
              </div>
            ) : null}

            <div style={{ height: 20 }} />

            <BlockTitle title="編輯欄位" helper={canEdit ? "可調整" : "請先完成辨識"} />

            <div style={{ display: "grid", gap: 22 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: "#374151" }}>
                  名稱
                </div>
                <input
                  value={formState?.name ?? ""}
                  disabled={!canEdit}
                  onChange={(e) =>
                    setFormState((prev) =>
                      prev
                        ? {
                          ...prev,
                          name: e.target.value,
                        }
                        : prev
                    )
                  }
                  placeholder="辨識完成後會帶入"
                  style={{
                    width: "100%",
                    height: 46,
                    borderRadius: 14,
                    border: "1px solid #D1D5DB",
                    background: canEdit ? "#FFFFFF" : "#F9FAFB",
                    padding: "0 14px",
                    fontSize: 15,
                    color: "#111827",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: "#374151" }}>
                  類別
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {CATEGORY_OPTIONS.map((option) => (
                    <FilterChip
                      key={option.value}
                      label={option.label}
                      active={formState?.category === option.value}
                      disabled={!canEdit}
                      onClick={() =>
                        setFormState((prev) =>
                          prev
                            ? {
                              ...prev,
                              category: option.value,
                            }
                            : prev
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: "#374151" }}>
                  場合
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {OCCASION_OPTIONS.map((option) => (
                    <FilterChip
                      key={option.value}
                      label={option.label}
                      active={Boolean(formState?.occasions.includes(option.value))}
                      disabled={!canEdit}
                      onClick={() =>
                        setFormState((prev) =>
                          prev
                            ? {
                              ...prev,
                              occasions: toggleMultiValue(prev.occasions, option.value),
                            }
                            : prev
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: "#374151" }}>
                  季節
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {SEASON_OPTIONS.map((option) => (
                    <FilterChip
                      key={option.value}
                      label={option.label}
                      active={Boolean(formState?.seasons.includes(option.value))}
                      disabled={!canEdit}
                      onClick={() =>
                        setFormState((prev) =>
                          prev
                            ? {
                              ...prev,
                              seasons: toggleSingleValue(prev.seasons, option.value),
                            }
                            : prev
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#374151" }}>
                  色系
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(5, minmax(0, 1fr))",
                    gap: 12,
                  }}
                >
                  {COLOR_OPTIONS.map((option) => (
                    <ColorCard
                      key={option.value}
                      label={option.label}
                      swatches={option.swatches}
                      active={Boolean(formState?.colors.includes(option.value))}
                      disabled={!canEdit}
                      onClick={() =>
                        setFormState((prev) =>
                          prev
                            ? {
                              ...prev,
                              colors: toggleSingleValue(prev.colors, option.value),
                            }
                            : prev
                        )
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section
            style={{
              width: isMobile ? "100%" : 360,
              flexShrink: 0,
              display: "grid",
              gap: 24,
            }}
          >
            <section
              style={{
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: 24,
                padding: 18,
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>圖片預覽</div>

              <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 10 }}>原圖</div>
              <div
                style={{
                  minHeight: 220,
                  borderRadius: 18,
                  background: "#F8FAFC",
                  border: "1px solid #E5E7EB",
                  overflow: "hidden",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {originalUrl ? (
                  <img src={originalUrl} alt="original" style={{ width: "100%", display: "block" }} />
                ) : (
                  <span style={{ color: "#9CA3AF", fontWeight: 600 }}>尚未選擇圖片</span>
                )}
              </div>

              <div style={{ height: 16 }} />

              <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 10 }}>處理後辨識圖</div>
              <div
                style={{
                  minHeight: 220,
                  borderRadius: 18,
                  border: "1px solid #E5E7EB",
                  overflow: "hidden",
                  display: "grid",
                  placeItems: "center",
                  background:
                    "linear-gradient(45deg, #f3f4f6 25%, transparent 25%), linear-gradient(-45deg, #f3f4f6 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f3f4f6 75%), linear-gradient(-45deg, transparent 75%, #f3f4f6 75%)",
                  backgroundSize: "16px 16px",
                  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                }}
              >
                {processedUrl ? (
                  <img src={processedUrl} alt="processed" style={{ width: "100%", display: "block" }} />
                ) : (
                  <span style={{ color: "#9CA3AF", fontWeight: 600 }}>
                    {stage === "predicting" ? "處理中..." : "尚未產生處理後辨識圖"}
                  </span>
                )}
              </div>

              {attributes ? (
                <div style={{ marginTop: 16, fontSize: 13, color: "#6B7280", lineHeight: 1.7 }}>
                  <div>
                    辨識名稱：<b style={{ color: "#374151" }}>{attributes.latest.name}</b>
                  </div>
                  <div>
                    類別：<b style={{ color: "#374151" }}>{attributes.latest.categoryLabel}</b>
                  </div>
                  <div>
                    場合：<b style={{ color: "#374151" }}>{attributes.legacy.occasion}</b>
                  </div>
                  <div>
                    季節：<b style={{ color: "#374151" }}>{attributes.legacy.season}</b>
                  </div>
                  <div>
                    色系：<b style={{ color: "#374151" }}>{attributes.latest.colorLabel}</b>
                  </div>
                  <div>
                    總分：<b style={{ color: "#374151" }}>{formatPercent(attributes.latest.score)}</b>
                  </div>
                  <div>
                    驗證標籤：<b style={{ color: "#374151" }}>{attributes.latest.validation.bestLabel || "-"}</b>
                    <span style={{ marginLeft: 6 }}>
                      （valid {formatPercent(attributes.latest.validation.validScore)} / invalid {formatPercent(attributes.latest.validation.invalidScore)}）
                    </span>
                  </div>
                  <div>
                    偵測資訊：
                    <b style={{ color: "#374151" }}>
                      {attributes.latest.detected
                        ? attributes.latest.detectedLabel || "已偵測到衣物區域"
                        : "未額外偵測"}
                    </b>
                  </div>
                  {attributes.latest.bbox ? (
                    <div>
                      偵測框：
                      <b style={{ color: "#374151" }}>
                        {formatTextList(attributes.latest.bbox.map((value) => String(value)))}
                      </b>
                    </div>
                  ) : null}
                  <div style={{ marginTop: 10 }}>
                    類別候選：
                    <b style={{ color: "#374151" }}>
                      {categoryCandidates
                        .slice(0, 2)
                        .map((item) => `${item.label} ${formatPercent(item.score)}`)
                        .join("、") || "-"}
                    </b>
                  </div>
                  <div>
                    場合候選：
                    <b style={{ color: "#374151" }}>
                      {occasionCandidates
                        .slice(0, 2)
                        .map((item) => `${item.label} ${formatPercent(item.score)}`)
                        .join("、") || "-"}
                    </b>
                  </div>
                  <div>
                    季節候選：
                    <b style={{ color: "#374151" }}>
                      {seasonCandidates
                        .slice(0, 2)
                        .map((item) => `${item.label} ${formatPercent(item.score)}`)
                        .join("、") || "-"}
                    </b>
                  </div>
                  <div>
                    色系候選：
                    <b style={{ color: "#374151" }}>
                      {colorCandidates
                        .slice(0, 2)
                        .map((item) => `${item.label} ${formatPercent(item.score)}`)
                        .join("、") || "-"}
                    </b>
                  </div>
                </div>
              ) : null}
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}
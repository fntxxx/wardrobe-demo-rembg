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
  swatches: string[];
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
  const [removedUrl, setRemovedUrl] = useState<string | null>(null);

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
      if (removedUrl) URL.revokeObjectURL(removedUrl);
    };
  }, [originalUrl, removedUrl]);

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

    const originalResult = await predict(picked, picked.name, { silent: true });
    const removedResult = await predict(
      {
        base64: removePayload.data.image.base64,
        filename: removePayload.data.image.filename,
        mimeType: removePayload.data.image.mime_type,
      },
      removePayload.data.image.filename,
      { silent: true }
    );

    if (!originalResult || !removedResult) {
      throw new Error("辨識結果為空。");
    }

    if (!removedResult.preview) {
      throw new Error("辨識結果缺少預覽圖資料。");
    }

    if (removedUrl) {
      URL.revokeObjectURL(removedUrl);
    }
    setRemovedUrl(removedResult.preview.dataUrl);

    const merged = {
      ...originalResult.attributes,
      colors: removedResult.attributes.colors,
      legacy: {
        ...originalResult.attributes.legacy,
        colorTone: removedResult.attributes.legacy.colorTone,
        colorTags: removedResult.attributes.legacy.colorTags,
      },
      latest: {
        ...originalResult.attributes.latest,
        color: removedResult.attributes.latest.color,
        colorLabel: removedResult.attributes.latest.colorLabel,
      },
      scores: {
        ...originalResult.attributes.scores,
        colorTone: removedResult.attributes.scores.colorTone,
      },
    };

    setAttributes(merged);
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;

    setError(null);
    setAttrError(null);
    setAttributes(null);
    setFormState(null);

    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (removedUrl) URL.revokeObjectURL(removedUrl);

    setOriginalUrl(null);
    setRemovedUrl(null);

    const nextOriginalUrl = URL.createObjectURL(picked);
    setOriginalUrl(nextOriginalUrl);

    try {
      await runAutoPipeline(picked);
    } catch (err) {
      const message = err instanceof Error ? err.message : "處理失敗";
      setError(message);
      setRemovedUrl(null);
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

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F3F4F6",
        padding: isMobile ? "20px 14px 40px" : "32px 16px 56px",
        color: "#111827",
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionTitle
          title="衣物屬性辨識 Demo"
          subtitle="模型會先自動填入名稱、類別、場合、季節與色系，之後可由使用者人工修正。"
        />

        <section
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: 24,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 16px",
                borderRadius: 14,
                border: "1px solid #D1D5DB",
                background: "#FFFFFF",
                cursor: isBusy ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 700,
                opacity: isBusy ? 0.65 : 1,
              }}
            >
              <span>{isBusy ? "處理中" : "選擇圖片"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={onPickFile}
                disabled={isBusy}
                style={{ display: "none" }}
              />
            </label>

            <div
              style={{
                fontSize: 14,
                color: stage === "idle" ? "#6B7280" : "#374151",
                fontWeight: stage === "idle" ? 500 : 700,
              }}
            >
              {getStageText(stage)}
            </div>
          </div>
        </section>

        {(error || attrError) && (
          <div
            style={{
              marginBottom: 20,
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              color: "#991B1B",
              padding: 14,
              borderRadius: 16,
              whiteSpace: "pre-wrap",
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 6 }}>發生錯誤</div>
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>{error || attrError}</div>
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "360px 1fr",
            gap: 24,
            alignItems: "start",
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

            <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 10 }}>去背圖</div>
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
              {removedUrl ? (
                <img src={removedUrl} alt="removed" style={{ width: "100%", display: "block" }} />
              ) : (
                <span style={{ color: "#9CA3AF", fontWeight: 600 }}>
                  {stage === "predicting" ? "處理中..." : "尚未產生去背圖"}
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
                  偵測資訊：<b style={{ color: "#374151" }}>{attributes.latest.detected ? attributes.latest.detectedLabel || "已偵測到衣物區域" : "未額外偵測"}</b>
                </div>
                {attributes.latest.bbox ? (
                  <div>
                    偵測框：<b style={{ color: "#374151" }}>{formatTextList(attributes.latest.bbox.map((value) => String(value)))}</b>
                  </div>
                ) : null}
                <div style={{ marginTop: 10 }}>
                  類別候選：<b style={{ color: "#374151" }}>{categoryCandidates.slice(0, 2).map((item) => `${item.label} ${formatPercent(item.score)}`).join("、") || "-"}</b>
                </div>
                <div>
                  場合候選：<b style={{ color: "#374151" }}>{occasionCandidates.slice(0, 2).map((item) => `${item.label} ${formatPercent(item.score)}`).join("、") || "-"}</b>
                </div>
                <div>
                  季節候選：<b style={{ color: "#374151" }}>{seasonCandidates.slice(0, 2).map((item) => `${item.label} ${formatPercent(item.score)}`).join("、") || "-"}</b>
                </div>
                <div>
                  色系候選：<b style={{ color: "#374151" }}>{colorCandidates.slice(0, 2).map((item) => `${item.label} ${formatPercent(item.score)}`).join("、") || "-"}</b>
                </div>
              </div>
            ) : null}
          </section>

          <section
            style={{
              background: "#F3F4F6",
              borderRadius: 28,
              padding: isMobile ? "0" : "4px 0 0",
            }}
          >
            <div style={{ maxWidth: isMobile ? 360 : 760 }}>
              <div style={{ marginBottom: 30 }}>
                <BlockTitle title="名稱" />
                <input
                  type="text"
                  value={formState?.name ?? ""}
                  onChange={(event) =>
                    setFormState((prev) =>
                      prev
                        ? {
                          ...prev,
                          name: event.target.value,
                        }
                        : null
                    )
                  }
                  placeholder="請輸入名稱"
                  disabled={!formState}
                  style={{
                    width: "100%",
                    height: 48,
                    borderRadius: 999,
                    border: "1px solid #DEDEE3",
                    background: "#FFFFFF",
                    padding: "0 18px",
                    fontSize: 16,
                    fontWeight: 500,
                    color: "#374151",
                    outline: "none",
                    boxShadow: "none",
                    opacity: formState ? 1 : 0.65,
                  }}
                />
              </div>

              <div style={{ marginBottom: 30 }}>
                <BlockTitle title="類別" />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {CATEGORY_OPTIONS.map((option) => (
                    <FilterChip
                      key={option.value}
                      label={option.label}
                      active={formState?.category === option.value}
                      disabled={!formState}
                      onClick={() =>
                        setFormState((prev) =>
                          prev
                            ? { ...prev, category: option.value }
                            : {
                              name: "",
                              category: option.value,
                              occasions: [],
                              seasons: [],
                              colors: [],
                            }
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 30 }}>
                <BlockTitle title="場合" helper="(可多選)" />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {OCCASION_OPTIONS.map((option) => (
                    <FilterChip
                      key={option.value}
                      label={option.label}
                      active={Boolean(formState?.occasions.includes(option.value))}
                      disabled={!formState}
                      onClick={() =>
                        setFormState((prev) =>
                          prev
                            ? {
                              ...prev,
                              occasions: toggleMultiValue(
                                prev.occasions,
                                option.value
                              ),
                            }
                            : null
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 30 }}>
                <BlockTitle title="季節" helper="(可多選)" />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {SEASON_OPTIONS.map((option) => (
                    <FilterChip
                      key={option.value}
                      label={option.label}
                      active={Boolean(formState?.seasons.includes(option.value))}
                      disabled={!formState}
                      onClick={() =>
                        setFormState((prev) =>
                          prev
                            ? {
                              ...prev,
                              seasons: toggleMultiValue(
                                prev.seasons,
                                option.value
                              ),
                            }
                            : null
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <BlockTitle title="色系" />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "repeat(3, minmax(0, 1fr))" : "repeat(auto-fit, minmax(104px, 1fr))",
                    gap: 14,
                    alignItems: "stretch",
                  }}
                >
                  {COLOR_OPTIONS.map((option) => (
                    <ColorCard
                      key={option.value}
                      label={option.label}
                      swatches={[...option.swatches]}
                      active={Boolean(formState?.colors.includes(option.value))}
                      disabled={!formState}
                      onClick={() =>
                        setFormState((prev) =>
                          prev
                            ? {
                              ...prev,
                              colors: toggleSingleValue(
                                prev.colors,
                                option.value
                              ),
                            }
                            : null
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              <div
                style={{
                  marginTop: 24,
                  padding: 16,
                  borderRadius: 18,
                  background: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>目前表單值</div>
                <pre
                  style={{
                    margin: 0,
                    fontSize: 13,
                    lineHeight: 1.7,
                    color: "#374151",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {JSON.stringify(formState, null, 2)}
                </pre>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
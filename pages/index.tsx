import { useEffect, useMemo, useState } from "react";
import { useAttributes, type AttributeResult } from "@/lib/useAttributes";
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
  category: CategoryValue;
  occasions: OccasionValue[];
  seasons: SeasonValue[];
  colors: ColorValue[];
};

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

function arrayToggle<T extends string>(
  current: T[],
  value: T,
  maxSelected: number
) {
  if (current.includes(value)) {
    return current.filter((item) => item !== value);
  }
  if (current.length >= maxSelected) {
    return [...current.slice(1), value];
  }
  return [...current, value];
}

function getStageText(stage: ProcessStage) {
  if (stage === "removing") return "去背中...";
  if (stage === "predicting") return "辨識中...";
  return "上傳圖片後會自動去背並辨識";
}

function getChipStyle(active: boolean): React.CSSProperties {
  return {
    borderRadius: 999,
    padding: "10px 16px",
    border: active ? "1px solid #4b5563" : "1px solid #cbd5e1",
    background: active ? "#4b5563" : "#ffffff",
    color: active ? "#ffffff" : "#1f2937",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.15s ease",
  };
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

function FieldTitle({
  title,
  helper,
}: {
  title: string;
  helper?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>{title}</div>
      {helper ? (
        <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>{helper}</div>
      ) : null}
    </div>
  );
}

function ColorCard({
  label,
  swatches,
  active,
  onClick,
}: {
  label: string;
  swatches: string[];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        borderRadius: 24,
        border: active ? "3px solid #8b8f97" : "1px solid #e5e7eb",
        background: "#ffffff",
        padding: "14px 16px 12px",
        cursor: "pointer",
        textAlign: "center",
        boxShadow: active ? "0 0 0 2px rgba(139, 143, 151, 0.08)" : "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 10 }}>
        {swatches.map((swatch, idx) => (
          <span
            key={`${label}-${idx}`}
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: swatch,
              border: "1px solid rgba(0,0,0,0.06)",
              display: "inline-block",
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#1f2937" }}>{label}</div>
    </button>
  );
}

function CandidateSummary({
  items,
}: {
  items: { label: string; score: number }[];
}) {
  if (!items.length) return null;

  return (
    <div style={{ marginTop: 10, fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
      模型候選：
      <span style={{ fontWeight: 600, color: "#374151" }}>
        {" "}
        {items
          .slice(0, 2)
          .map((item) => `${item.label} ${Math.round(item.score * 100)}%`)
          .join("、")}
      </span>
    </div>
  );
}

export default function HomePage() {
  const isMobile = useIsMobile();

  const [stage, setStage] = useState<ProcessStage>("idle");
  const [error, setError] = useState<string | null>(null);

  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [removedUrl, setRemovedUrl] = useState<string | null>(null);

  const [removedBlob, setRemovedBlob] = useState<Blob | null>(null);

  const { attributes, error: attrError, predict, setAttributes } = useAttributes();

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

    if (!removeRes.ok) {
      const text = await removeRes.text().catch(() => "");
      throw new Error(`去背失敗：${removeRes.status}${text ? `\n${text}` : ""}`);
    }

    const blob = await removeRes.blob();
    setRemovedBlob(blob);

    const outputUrl = URL.createObjectURL(blob);
    setRemovedUrl(outputUrl);

    setStage("predicting");

    const originalResult = await predict(picked, picked.name, { silent: true });
    const removedResult = await predict(blob, "removed.png", { silent: true });

    if (!originalResult || !removedResult) {
      throw new Error("辨識結果為空");
    }

    const merged: AttributeResult = {
      ...originalResult,
      colors: removedResult.colors,
      legacy: {
        ...originalResult.legacy,
        colorTone: removedResult.legacy.colorTone,
        colorTags: removedResult.legacy.colorTags,
      },
      scores: {
        ...originalResult.scores,
        colorTone: removedResult.scores.colorTone,
      },
    };

    setAttributes(merged);
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;

    setError(null);
    setAttributes(null);
    setFormState(null);
    setRemovedBlob(null);

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
      setRemovedBlob(null);
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
        background: "#f5f5f5",
        padding: "32px 16px 56px",
        color: "#111827",
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionTitle
          title="衣物屬性辨識 Demo"
          subtitle="模型會先自動填入類別、場合、季節與色系，之後可由使用者人工修正。類別為單選；場合、季節與色系可多選。"
        />

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
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
                border: "1px solid #d1d5db",
                background: "#ffffff",
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
                color: stage === "idle" ? "#6b7280" : "#374151",
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
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
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
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 24,
              padding: 18,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>圖片預覽</div>

            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 10 }}>原圖</div>
            <div
              style={{
                minHeight: 220,
                borderRadius: 18,
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
                overflow: "hidden",
                display: "grid",
                placeItems: "center",
                marginBottom: 16,
              }}
            >
              {originalUrl ? (
                <img src={originalUrl} alt="original" style={{ width: "100%", display: "block" }} />
              ) : (
                <span style={{ color: "#9ca3af", fontWeight: 600 }}>尚未選擇圖片</span>
              )}
            </div>

            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 10 }}>去背圖</div>
            <div
              style={{
                minHeight: 220,
                borderRadius: 18,
                border: "1px solid #e5e7eb",
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
                <span style={{ color: "#9ca3af", fontWeight: 600 }}>
                  {removedBlob ? "處理中..." : "尚未產生去背圖"}
                </span>
              )}
            </div>

            {attributes ? (
              <div style={{ marginTop: 16, fontSize: 13, color: "#6b7280", lineHeight: 1.7 }}>
                <div>舊版類別：<b style={{ color: "#374151" }}>{attributes.legacy.category}</b></div>
                <div>舊版場合：<b style={{ color: "#374151" }}>{attributes.legacy.occasion}</b></div>
                <div>舊版季節：<b style={{ color: "#374151" }}>{attributes.legacy.season}</b></div>
                <div>舊版色系：<b style={{ color: "#374151" }}>{attributes.legacy.colorTone}</b></div>
              </div>
            ) : null}
          </section>

          <section
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 24,
              padding: 24,
            }}
          >
            <FieldTitle title="類別" />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {CATEGORY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  style={getChipStyle(formState?.category === option.value)}
                  onClick={() =>
                    setFormState((prev) =>
                      prev
                        ? { ...prev, category: option.value }
                        : {
                          category: option.value,
                          occasions: [],
                          seasons: [],
                          colors: [],
                        }
                    )
                  }
                  disabled={!formState}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <CandidateSummary items={categoryCandidates.map((x) => ({ label: x.label, score: x.score }))} />

            <div style={{ height: 22 }} />

            <FieldTitle title="場合" />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {OCCASION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  style={getChipStyle(Boolean(formState?.occasions.includes(option.value)))}
                  onClick={() =>
                    setFormState((prev) =>
                      prev
                        ? {
                          ...prev,
                          occasions: arrayToggle(
                            prev.occasions,
                            option.value,
                            attributes?.occasions.maxSelected ?? 2
                          ),
                        }
                        : null
                    )
                  }
                  disabled={!formState}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <CandidateSummary items={occasionCandidates.map((x) => ({ label: x.label, score: x.score }))} />

            <div style={{ height: 22 }} />

            <FieldTitle title="季節" />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {SEASON_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  style={getChipStyle(Boolean(formState?.seasons.includes(option.value)))}
                  onClick={() =>
                    setFormState((prev) =>
                      prev
                        ? {
                          ...prev,
                          seasons: arrayToggle(
                            prev.seasons,
                            option.value,
                            attributes?.seasons.maxSelected ?? 2
                          ),
                        }
                        : null
                    )
                  }
                  disabled={!formState}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <CandidateSummary items={seasonCandidates.map((x) => ({ label: x.label, score: x.score }))} />

            <div style={{ height: 22 }} />

            <FieldTitle title="色系" helper="（可多選）" />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: 16,
              }}
            >
              {COLOR_OPTIONS.map((option) => (
                <ColorCard
                  key={option.value}
                  label={option.label}
                  swatches={[...option.swatches]}
                  active={Boolean(formState?.colors.includes(option.value))}
                  onClick={() =>
                    setFormState((prev) =>
                      prev
                        ? {
                          ...prev,
                          colors: arrayToggle(
                            prev.colors,
                            option.value,
                            attributes?.colors.maxSelected ?? 2
                          ),
                        }
                        : null
                    )
                  }
                />
              ))}
            </div>
            <CandidateSummary items={colorCandidates.map((x) => ({ label: x.label, score: x.score }))} />

            <div
              style={{
                marginTop: 24,
                padding: 16,
                borderRadius: 18,
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
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
          </section>
        </div>
      </div>
    </main>
  );
}
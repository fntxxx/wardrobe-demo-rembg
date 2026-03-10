import { useEffect, useMemo, useState } from "react";
import { useAttributes } from "@/lib/useAttributes";

type AttributeItemProps = {
  label: string;
  value?: string;
  score?: number;
};

function getConfidenceLevel(score?: number) {
  if (typeof score !== "number") return "未知";
  if (score >= 0.75) return "高";
  if (score >= 0.55) return "中";
  return "低";
}

function getConfidenceStyle(score?: number): React.CSSProperties {
  if (typeof score !== "number") {
    return {
      background: "#f3f4f6",
      color: "#6b7280",
      border: "1px solid #e5e7eb",
    };
  }

  if (score >= 0.75) {
    return {
      background: "#ecfdf3",
      color: "#067647",
      border: "1px solid #abefc6",
    };
  }

  if (score >= 0.55) {
    return {
      background: "#fffaeb",
      color: "#b54708",
      border: "1px solid #fedf89",
    };
  }

  return {
    background: "#fef3f2",
    color: "#b42318",
    border: "1px solid #fecdca",
  };
}

function AttributeItem({ label, value, score }: AttributeItemProps) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        background: "#ffffff",
        padding: 16,
        boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: "#667085",
            fontWeight: 600,
            letterSpacing: 0.2,
          }}
        >
          {label}
        </span>

        <span
          style={{
            ...getConfidenceStyle(score),
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 40,
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1.2,
            whiteSpace: "nowrap",
          }}
        >
          {getConfidenceLevel(score)}
        </span>
      </div>

      <div
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: "#101828",
          lineHeight: 1.35,
          minHeight: 28,
        }}
      >
        {value || "—"}
      </div>

      <div
        style={{
          marginTop: 10,
          fontSize: 13,
          color: "#667085",
        }}
      >
        信心分數：
        <span style={{ fontWeight: 700, color: "#344054" }}>
          {typeof score === "number" ? ` ${Math.round(score * 100)}%` : " —"}
        </span>
      </div>
    </div>
  );
}

function useIsMobile(breakpoint = 860) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [breakpoint]);

  return isMobile;
}

export default function HomePage() {
  const isMobile = useIsMobile();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [removedUrl, setRemovedUrl] = useState<string | null>(null);

  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [removedBlob, setRemovedBlob] = useState<Blob | null>(null);

  const {
    attributes,
    loading,
    error: attrError,
    predict,
    setAttributes,
  } = useAttributes();

  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (removedUrl) URL.revokeObjectURL(removedUrl);
    };
  }, [originalUrl, removedUrl]);

  const isPredictDisabled = useMemo(() => {
    return busy || loading || !originalFile || !removedBlob;
  }, [busy, loading, originalFile, removedBlob]);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;

    setOriginalFile(picked);
    setRemovedBlob(null);
    setBusy(true);
    setError(null);

    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (removedUrl) URL.revokeObjectURL(removedUrl);

    setOriginalUrl(null);
    setRemovedUrl(null);
    setAttributes(null);

    const ori = URL.createObjectURL(picked);
    setOriginalUrl(ori);

    const formData = new FormData();
    formData.append("file", picked);

    try {
      const r = await fetch("/api/remove-bg", {
        method: "POST",
        body: formData,
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_INTERNAL_API_KEY ?? "",
        },
      });

      if (!r.ok) {
        const t = await r.text().catch(() => "");
        throw new Error(`去背失敗：${r.status}${t ? `\n${t}` : ""}`);
      }

      const blob = await r.blob();
      setRemovedBlob(blob);

      const out = URL.createObjectURL(blob);
      setRemovedUrl(out);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "去背失敗";
      setError(msg);
      setRemovedBlob(null);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  async function handlePredict() {
    if (!originalFile || !removedBlob) return;

    setError(null);

    try {
      const originalResult = await predict(originalFile, originalFile.name, {
        silent: true,
      });

      const removedResult = await predict(removedBlob, "removed.png", {
        silent: true,
      });

      if (!originalResult || !removedResult) {
        throw new Error("辨識結果為空");
      }

      setAttributes({
        ...originalResult,
        colorTone: removedResult.colorTone ?? originalResult.colorTone,
        scores: {
          category: originalResult.scores?.category ?? 0,
          occasion: originalResult.scores?.occasion ?? 0,
          colorTone:
            removedResult.scores?.colorTone ??
            originalResult.scores?.colorTone ??
            0,
          season: originalResult.scores?.season ?? 0,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "屬性辨識失敗";
      setError(msg);
      console.error("attribute predict failed:", err);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f8fafc 0%, #f9fafb 45%, #ffffff 100%)",
        padding: "32px 16px 56px",
        color: "#101828",
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
        }}
      >
        <header
          style={{
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              borderRadius: 999,
              background: "#eef4ff",
              color: "#3538cd",
              border: "1px solid #c7d7fe",
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 14,
            }}
          >
            衣物屬性辨識 Demo
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 32,
              lineHeight: 1.2,
              fontWeight: 800,
              letterSpacing: -0.6,
              color: "#101828",
            }}
          >
            Wardrobe Demo
          </h1>

          <p
            style={{
              margin: "10px 0 0",
              fontSize: 15,
              lineHeight: 1.7,
              color: "#475467",
              maxWidth: 760,
            }}
          >
            上傳衣物圖片後，系統會先進行去背，再做屬性辨識。
            類別、場合、季節以原圖判斷，色系則以去背圖判斷，避免背景干擾。
          </p>
        </header>

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #eaecf0",
            borderRadius: 24,
            padding: 20,
            boxShadow: "0 8px 24px rgba(16, 24, 40, 0.06)",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 12,
            }}
          >
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 16px",
                borderRadius: 14,
                border: "1px solid #d0d5dd",
                background: "#ffffff",
                cursor: busy ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 700,
                color: "#344054",
                boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)",
                opacity: busy ? 0.65 : 1,
              }}
            >
              <span>選擇圖片</span>
              <input
                type="file"
                accept="image/*"
                onChange={onPickFile}
                disabled={busy}
                style={{ display: "none" }}
              />
            </label>

            <div
              style={{
                fontSize: 14,
                color: "#667085",
              }}
            >
              {busy ? "正在進行去背處理…" : "支援一般衣物照片上傳"}
            </div>
          </div>
        </section>

        {error && (
          <div
            style={{
              marginBottom: 20,
              background: "#fef3f2",
              border: "1px solid #fecdca",
              color: "#912018",
              padding: 14,
              borderRadius: 16,
              whiteSpace: "pre-wrap",
              boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)",
            }}
          >
            <div
              style={{
                fontWeight: 800,
                marginBottom: 6,
              }}
            >
              發生錯誤
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>{error}</div>
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: 20,
          }}
        >
          <section
            style={{
              background: "#ffffff",
              border: "1px solid #eaecf0",
              borderRadius: 24,
              padding: 18,
              boxShadow: "0 8px 24px rgba(16, 24, 40, 0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 14,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#101828",
                  }}
                >
                  原圖
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 13,
                    color: "#667085",
                  }}
                >
                  用於判斷類別、場合與季節
                </div>
              </div>
            </div>

            {originalUrl ? (
              <div
                style={{
                  borderRadius: 18,
                  overflow: "hidden",
                  background: "#f8fafc",
                  border: "1px solid #f2f4f7",
                }}
              >
                <img
                  src={originalUrl}
                  alt="original"
                  style={{
                    display: "block",
                    width: "100%",
                    height: "auto",
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  height: 320,
                  borderRadius: 18,
                  background:
                    "linear-gradient(180deg, #f8fafc 0%, #f2f4f7 100%)",
                  display: "grid",
                  placeItems: "center",
                  color: "#98a2b3",
                  border: "1px dashed #d0d5dd",
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                尚未選擇圖片
              </div>
            )}
          </section>

          <section
            style={{
              background: "#ffffff",
              border: "1px solid #eaecf0",
              borderRadius: 24,
              padding: 18,
              boxShadow: "0 8px 24px rgba(16, 24, 40, 0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 14,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#101828",
                  }}
                >
                  去背圖
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 13,
                    color: "#667085",
                  }}
                >
                  用於判斷主色系，降低背景干擾
                </div>
              </div>
            </div>

            {removedUrl ? (
              <div
                style={{
                  borderRadius: 18,
                  overflow: "hidden",
                  background:
                    "linear-gradient(45deg, #f2f4f7 25%, transparent 25%), linear-gradient(-45deg, #f2f4f7 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f2f4f7 75%), linear-gradient(-45deg, transparent 75%, #f2f4f7 75%)",
                  backgroundSize: "18px 18px",
                  backgroundPosition: "0 0, 0 9px, 9px -9px, -9px 0px",
                  border: "1px solid #f2f4f7",
                }}
              >
                <img
                  src={removedUrl}
                  alt="bg-removed"
                  style={{
                    display: "block",
                    width: "100%",
                    height: "auto",
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  height: 320,
                  borderRadius: 18,
                  background:
                    "linear-gradient(180deg, #f8fafc 0%, #f2f4f7 100%)",
                  display: "grid",
                  placeItems: "center",
                  color: "#98a2b3",
                  border: "1px dashed #d0d5dd",
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                尚未產生去背結果
              </div>
            )}
          </section>
        </div>

        <section
          style={{
            marginTop: 20,
            background: "#ffffff",
            border: "1px solid #eaecf0",
            borderRadius: 24,
            padding: 20,
            boxShadow: "0 8px 24px rgba(16, 24, 40, 0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              marginBottom: 16,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#101828",
                }}
              >
                屬性辨識
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 14,
                  color: "#667085",
                  lineHeight: 1.6,
                }}
              >
                類別、場合、季節使用原圖辨識；色系使用去背圖辨識。
              </div>
            </div>

            <button
              type="button"
              onClick={handlePredict}
              disabled={isPredictDisabled}
              style={{
                border: "1px solid #111827",
                background: isPredictDisabled ? "#e5e7eb" : "#111827",
                color: isPredictDisabled ? "#98a2b3" : "#ffffff",
                borderRadius: 14,
                padding: "12px 18px",
                fontSize: 14,
                fontWeight: 800,
                cursor: isPredictDisabled ? "not-allowed" : "pointer",
                boxShadow: isPredictDisabled
                  ? "none"
                  : "0 8px 20px rgba(17, 24, 39, 0.18)",
                transition: "all 0.2s ease",
              }}
            >
              {loading ? "辨識中…" : "辨識屬性"}
            </button>
          </div>

          {attrError && (
            <div
              style={{
                marginBottom: 14,
                background: "#fef3f2",
                border: "1px solid #fecdca",
                color: "#912018",
                padding: 12,
                borderRadius: 14,
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              辨識失敗：{attrError}
            </div>
          )}

          {attributes ? (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: 16,
                }}
              >
                <AttributeItem
                  label="類別"
                  value={attributes.category}
                  score={attributes.scores?.category}
                />
                <AttributeItem
                  label="場合"
                  value={attributes.occasion}
                  score={attributes.scores?.occasion}
                />
                <AttributeItem
                  label="色系"
                  value={attributes.colorTone}
                  score={attributes.scores?.colorTone}
                />
                <AttributeItem
                  label="季節"
                  value={attributes.season}
                  score={attributes.scores?.season}
                />
              </div>

              <div
                style={{
                  marginTop: 14,
                  padding: "12px 14px",
                  borderRadius: 14,
                  background: "#f8fafc",
                  border: "1px solid #eaecf0",
                  fontSize: 13,
                  lineHeight: 1.7,
                  color: "#667085",
                }}
              >
                場合與季節屬於推測結果，若信心較低，建議視為參考資訊。
              </div>
            </>
          ) : (
            <div
              style={{
                borderRadius: 16,
                border: "1px dashed #d0d5dd",
                background: "#fcfcfd",
                padding: "28px 16px",
                textAlign: "center",
                color: "#98a2b3",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              先完成去背，再按下「辨識屬性」查看結果
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
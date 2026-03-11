import { useEffect, useState } from "react";
import { useAttributes } from "@/lib/useAttributes";

type AttributeItemProps = {
  label: string;
  value?: string;
  score?: number;
};

type ColorTagListProps = {
  label: string;
  tags?: string[];
  rawTone?: string;
  score?: number;
};

type ProcessStage = "idle" | "removing" | "predicting";

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

function getColorTagStyle(tag: string): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "7px 12px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.2,
    border: "1px solid #d0d5dd",
    background: "#ffffff",
    color: "#344054",
  };

  switch (tag) {
    case "淺米白":
      return {
        ...base,
        background: "#fffdf7",
        border: "1px solid #ece7da",
        color: "#6b5f45",
      };
    case "深灰黑":
      return {
        ...base,
        background: "#1f242f",
        border: "1px solid #1f242f",
        color: "#ffffff",
      };
    case "中性灰":
      return {
        ...base,
        background: "#f2f4f7",
        border: "1px solid #d0d5dd",
        color: "#475467",
      };
    case "大地棕":
      return {
        ...base,
        background: "#f6efe7",
        border: "1px solid #e4d7c7",
        color: "#8b5e34",
      };
    case "暖橘紅":
      return {
        ...base,
        background: "#fff1eb",
        border: "1px solid #f7c9b8",
        color: "#c2410c",
      };
    case "粉嫩玫瑰":
      return {
        ...base,
        background: "#fff1f3",
        border: "1px solid #f8c7d0",
        color: "#c14d74",
      };
    case "自然綠":
      return {
        ...base,
        background: "#eefbf3",
        border: "1px solid #b7e4c7",
        color: "#1f7a4d",
      };
    case "清爽藍":
      return {
        ...base,
        background: "#eef6ff",
        border: "1px solid #bfd6ff",
        color: "#245bba",
      };
    case "優雅紫":
      return {
        ...base,
        background: "#f5f0ff",
        border: "1px solid #d7c7ff",
        color: "#6941c6",
      };
    case "花紋圖案":
      return {
        ...base,
        background: "#f8f9fc",
        border: "1px solid #d0d5dd",
        color: "#344054",
      };
    default:
      return base;
  }
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

function ColorTagList({ label, tags = [], rawTone, score }: ColorTagListProps) {
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

      {tags.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            minHeight: 34,
          }}
        >
          {tags.map((tag) => (
            <span key={tag} style={getColorTagStyle(tag)}>
              {tag}
            </span>
          ))}
        </div>
      ) : (
        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: "#101828",
            lineHeight: 1.35,
            minHeight: 28,
          }}
        >
          —
        </div>
      )}

      <div
        style={{
          marginTop: 10,
          fontSize: 13,
          color: "#667085",
        }}
      >
        基礎色系：
        <span style={{ fontWeight: 700, color: "#344054" }}>
          {rawTone ? ` ${rawTone}` : " —"}
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

  const [stage, setStage] = useState<ProcessStage>("idle");
  const [error, setError] = useState<string | null>(null);

  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [removedUrl, setRemovedUrl] = useState<string | null>(null);

  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [removedBlob, setRemovedBlob] = useState<Blob | null>(null);

  const { attributes, error: attrError, predict, setAttributes } = useAttributes();

  const isBusy = stage !== "idle";

  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (removedUrl) URL.revokeObjectURL(removedUrl);
    };
  }, [originalUrl, removedUrl]);

  function getStageText() {
    if (stage === "removing") return "去背中...";
    if (stage === "predicting") return "辨識中...";
    return "上傳圖片後會自動去背並辨識";
  }

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

    const originalResult = await predict(picked, picked.name, {
      silent: true,
    });

    const removedResult = await predict(blob, "removed.png", {
      silent: true,
    });

    if (!originalResult || !removedResult) {
      throw new Error("辨識結果為空");
    }

    setAttributes({
      ...originalResult,
      colorTone: removedResult.colorTone ?? originalResult.colorTone,
      colorTags:
        removedResult.colorTags?.length
          ? removedResult.colorTags
          : originalResult.colorTags ?? [],
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
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;

    setError(null);
    setAttributes(null);
    setOriginalFile(picked);
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
      const message =
        err instanceof Error ? err.message : "處理失敗";
      setError(message);
      setRemovedBlob(null);
    } finally {
      setStage("idle");
      e.target.value = "";
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
            上傳衣物圖片後，系統會自動進行去背與屬性辨識。
            類別、場合、季節使用原圖辨識；色系使用去背圖辨識，避免背景干擾。
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
                cursor: isBusy ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 700,
                color: "#344054",
                boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)",
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
                color: stage === "idle" ? "#667085" : "#3538cd",
                fontWeight: stage === "idle" ? 400 : 700,
              }}
            >
              {getStageText()}
            </div>
          </div>
        </section>

        {(error || attrError) && (
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
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>
              {error || attrError}
            </div>
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
                {stage === "removing" ? "去背中..." : "尚未產生去背結果"}
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
                上傳後會自動完成去背與辨識，不需要再手動按按鈕。
              </div>
            </div>

            <div
              style={{
                border: "1px solid #d0d5dd",
                background: isBusy ? "#111827" : "#f8fafc",
                color: isBusy ? "#ffffff" : "#667085",
                borderRadius: 14,
                padding: "12px 18px",
                fontSize: 14,
                fontWeight: 800,
                boxShadow: isBusy
                  ? "0 8px 20px rgba(17, 24, 39, 0.18)"
                  : "none",
              }}
            >
              {stage === "removing"
                ? "去背中..."
                : stage === "predicting"
                  ? "辨識中..."
                  : "等待上傳"}
            </div>
          </div>

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
                <ColorTagList
                  label="色系"
                  tags={attributes.colorTags}
                  rawTone={attributes.colorTone}
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
                場合與季節屬於推測結果，若信心較低，建議視為參考資訊。色系區塊優先顯示正式產品用色票標籤，並保留基礎色系作為除錯與 fallback 資訊。
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
              {stage === "removing"
                ? "去背中..."
                : stage === "predicting"
                  ? "辨識中..."
                  : "上傳圖片後會自動開始處理"}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
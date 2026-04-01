/* eslint-disable @next/next/no-img-element */
import type { AttributeResult, CandidateItem } from "@/modules/wardrobe/types/attribute";
import type { ProcessStage } from "@/modules/wardrobe/types/demo";

type PreviewPanelProps = {
  stage: ProcessStage;
  originalUrl: string | null;
  processedUrl: string | null;
  attributes: AttributeResult | null;
  categoryCandidates: CandidateItem[];
  occasionCandidates: CandidateItem[];
  seasonCandidates: CandidateItem[];
  colorCandidates: CandidateItem[];
  isMobile: boolean;
};

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatTextList(values: string[]) {
  return values.length ? values.join("、") : "-";
}

export function PreviewPanel({
  stage,
  originalUrl,
  processedUrl,
  attributes,
  categoryCandidates,
  occasionCandidates,
  seasonCandidates,
  colorCandidates,
  isMobile,
}: PreviewPanelProps) {
  return (
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
  );
}

import type { ProcessStage } from "@/modules/wardrobe/types/demo";
import { BlockTitle } from "@/modules/wardrobe/components/BlockTitle";

type UploadPanelProps = {
  stage: ProcessStage;
  isBusy: boolean;
  error: string | null;
  attrError: string | null;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

function getStageText(stage: ProcessStage) {
  if (stage === "removing") return "去背中...";
  if (stage === "predicting") return "辨識中...";
  return "上傳圖片後會自動去背並辨識";
}

export function UploadPanel({ stage, isBusy, error, attrError, onChange }: UploadPanelProps) {
  return (
    <>
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
          onChange={onChange}
          disabled={isBusy}
          style={{ display: "none" }}
        />
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#1F2937" }}>選擇衣物圖片</div>
          <div style={{ marginTop: 8, fontSize: 14, color: "#6B7280", lineHeight: 1.7 }}>
            支援拍照或從相簿選取。
            <br />
            流程固定為：上傳 → 去背 → 辨識 → 編輯確認。
          </div>
        </div>
      </label>

      {error || attrError ? (
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
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {error || attrError}
        </div>
      ) : null}
    </>
  );
}
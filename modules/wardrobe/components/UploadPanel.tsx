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
    switch (stage) {
        case "removing":
            return "正在去背中…";
        case "predicting":
            return "正在辨識屬性…";
        default:
            return "尚未開始處理";
    }
}

export function UploadPanel({
    stage,
    isBusy,
    error,
    attrError,
    onChange,
}: UploadPanelProps) {
    const message = error || attrError;

    return (
        <section
            style={{
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: 20,
                padding: 24,
                boxShadow: "0 8px 30px rgba(15, 23, 42, 0.04)",
            }}
        >
            <BlockTitle
                title="1. 上傳圖片"
                description="選擇單張服飾圖片後，系統會先送去背，再進行屬性辨識。"
            />

            <label
                htmlFor="wardrobe-file-input"
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 220,
                    borderRadius: 18,
                    border: "2px dashed #CBD5E1",
                    background: "#F8FAFC",
                    cursor: isBusy ? "not-allowed" : "pointer",
                    opacity: isBusy ? 0.7 : 1,
                    textAlign: "center",
                    padding: 24,
                }}
            >
                <div
                    style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#0F172A",
                    }}
                >
                    {isBusy ? "圖片處理中" : "點擊或重新選擇圖片"}
                </div>

                <div
                    style={{
                        marginTop: 8,
                        fontSize: 14,
                        color: "#64748B",
                        lineHeight: 1.6,
                    }}
                >
                    支援一般圖片檔，上傳後會自動執行去背與服飾屬性辨識。
                </div>

                <input
                    id="wardrobe-file-input"
                    type="file"
                    accept="image/*"
                    onChange={onChange}
                    disabled={isBusy}
                    style={{ display: "none" }}
                />
            </label>

            <div
                style={{
                    marginTop: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                }}
            >
                <div
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        alignSelf: "flex-start",
                        minHeight: 34,
                        padding: "6px 12px",
                        borderRadius: 999,
                        background: "#EEF2FF",
                        color: "#4338CA",
                        fontSize: 13,
                        fontWeight: 700,
                    }}
                >
                    目前狀態：{getStageText(stage)}
                </div>

                {message ? (
                    <div
                        style={{
                            borderRadius: 14,
                            background: "#FEF2F2",
                            border: "1px solid #FECACA",
                            color: "#B91C1C",
                            padding: "12px 14px",
                            fontSize: 14,
                            lineHeight: 1.6,
                        }}
                    >
                        {message}
                    </div>
                ) : null}
            </div>
        </section>
    );
}
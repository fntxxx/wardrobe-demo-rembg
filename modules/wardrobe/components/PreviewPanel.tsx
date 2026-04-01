import type { AttributeResult, CandidateItem } from "@/modules/wardrobe/types/attribute";
import type { ProcessStage } from "@/modules/wardrobe/types/demo";
import { BlockTitle } from "@/modules/wardrobe/components/BlockTitle";
import { ColorCard } from "@/modules/wardrobe/components/ColorCard";

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

function formatPercent(score?: number) {
    if (typeof score !== "number" || Number.isNaN(score)) {
        return "0%";
    }

    return `${Math.round(score * 100)}%`;
}

function CandidateList({
    title,
    items,
}: {
    title: string;
    items: CandidateItem[];
}) {
    return (
        <div
            style={{
                borderRadius: 16,
                border: "1px solid #E5E7EB",
                background: "#FFFFFF",
                padding: 16,
            }}
        >
            <div
                style={{
                    marginBottom: 12,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#111827",
                }}
            >
                {title}
            </div>

            {items.length === 0 ? (
                <div
                    style={{
                        fontSize: 13,
                        color: "#6B7280",
                        lineHeight: 1.6,
                    }}
                >
                    尚無候選資料
                </div>
            ) : (
                <div style={{ display: "grid", gap: 10 }}>
                    {items.map((item) => (
                        <div
                            key={`${title}-${item.value}`}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 12,
                                borderRadius: 12,
                                background: "#F8FAFC",
                                padding: "10px 12px",
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        fontSize: 14,
                                        fontWeight: 700,
                                        color: "#111827",
                                    }}
                                >
                                    {item.label}
                                </div>
                                <div
                                    style={{
                                        marginTop: 2,
                                        fontSize: 12,
                                        color: "#6B7280",
                                    }}
                                >
                                    value: {item.value}
                                </div>
                            </div>

                            <div
                                style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: "#2563EB",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {formatPercent(item.score)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
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
        <aside
            style={{
                width: isMobile ? "100%" : 460,
                flexShrink: 0,
                display: "grid",
                gap: 24,
            }}
        >
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
                    title="3. 預覽"
                    description="左圖為原始圖片，右圖為目前辨識流程使用的預覽結果。"
                />

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr",
                        gap: 16,
                    }}
                >
                    <ImagePreviewCard
                        title="原始圖片"
                        imageUrl={originalUrl}
                        emptyText={stage === "idle" ? "尚未上傳圖片" : "處理中…"}
                    />

                    <ImagePreviewCard
                        title="處理後預覽"
                        imageUrl={processedUrl}
                        emptyText={stage === "predicting" ? "正在產生辨識預覽…" : "尚未產生預覽"}
                    />
                </div>
            </section>

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
                    title="4. 辨識摘要"
                    description="顯示目前辨識後的主結果與候選分數，方便快速核對。"
                />

                <div style={{ display: "grid", gap: 16 }}>
                    <SummaryValue label="名稱" value={attributes?.latest.name || "—"} />
                    <SummaryValue
                        label="主類別"
                        value={attributes?.categorySelection.selected || "—"}
                    />
                    <SummaryValue
                        label="主場合"
                        value={
                            attributes?.occasions.selected.length
                                ? attributes.occasions.selected.join("、")
                                : "—"
                        }
                    />
                    <SummaryValue
                        label="主季節"
                        value={
                            attributes?.seasons.selected.length
                                ? attributes.seasons.selected.join("、")
                                : "—"
                        }
                    />
                    <SummaryValue
                        label="主色系"
                        value={
                            attributes?.colors.selected.length
                                ? attributes.colors.selected.join("、")
                                : "—"
                        }
                    />
                </div>
            </section>

            <section
                style={{
                    display: "grid",
                    gap: 16,
                }}
            >
                <CandidateList title="類別候選" items={categoryCandidates} />
                <CandidateList title="場合候選" items={occasionCandidates} />
                <CandidateList title="季節候選" items={seasonCandidates} />

                <div
                    style={{
                        borderRadius: 16,
                        border: "1px solid #E5E7EB",
                        background: "#FFFFFF",
                        padding: 16,
                    }}
                >
                    <div
                        style={{
                            marginBottom: 12,
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#111827",
                        }}
                    >
                        色系候選
                    </div>

                    {colorCandidates.length === 0 ? (
                        <div
                            style={{
                                fontSize: 13,
                                color: "#6B7280",
                                lineHeight: 1.6,
                            }}
                        >
                            尚無候選資料
                        </div>
                    ) : (
                        <div style={{ display: "grid", gap: 10 }}>
                            {colorCandidates.map((item) => (
                                <ColorCard
                                    key={`color-${item.value}`}
                                    label={item.label}
                                    score={item.score}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </aside>
    );
}

function ImagePreviewCard({
    title,
    imageUrl,
    emptyText,
}: {
    title: string;
    imageUrl: string | null;
    emptyText: string;
}) {
    return (
        <div>
            <div
                style={{
                    marginBottom: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#111827",
                }}
            >
                {title}
            </div>

            <div
                style={{
                    borderRadius: 18,
                    border: "1px solid #E5E7EB",
                    background: "#F8FAFC",
                    overflow: "hidden",
                    minHeight: 260,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={title}
                        style={{
                            display: "block",
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            background: "#FFFFFF",
                        }}
                    />
                ) : (
                    <div
                        style={{
                            padding: 20,
                            textAlign: "center",
                            fontSize: 14,
                            lineHeight: 1.6,
                            color: "#94A3B8",
                        }}
                    >
                        {emptyText}
                    </div>
                )}
            </div>
        </div>
    );
}

function SummaryValue({ label, value }: { label: string; value: string }) {
    return (
        <div
            style={{
                borderRadius: 14,
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                padding: 14,
            }}
        >
            <div
                style={{
                    fontSize: 12,
                    lineHeight: 1.4,
                    fontWeight: 700,
                    color: "#64748B",
                }}
            >
                {label}
            </div>

            <div
                style={{
                    marginTop: 6,
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: "#0F172A",
                    wordBreak: "break-word",
                }}
            >
                {value}
            </div>
        </div>
    );
}
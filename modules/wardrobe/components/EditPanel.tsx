import { useMemo } from "react";
import { FilterChip } from "@/modules/wardrobe/components/FilterChip";
import { BlockTitle } from "@/modules/wardrobe/components/BlockTitle";
import type { FormState } from "@/modules/wardrobe/types/demo";
import { CATEGORY_OPTIONS, COLOR_OPTIONS, OCCASION_OPTIONS, SEASON_OPTIONS } from "@/lib/wardrobeOptions";

type EditPanelProps = {
    formState: FormState | null;
    setFormState: React.Dispatch<React.SetStateAction<FormState | null>>;
    canEdit: boolean;
    isMobile: boolean;
};

function toggleMultiValue(values: string[], nextValue: string) {
    if (values.includes(nextValue)) {
        return values.filter((item) => item !== nextValue);
    }

    return [...values, nextValue];
}

export function EditPanel({
    formState,
    setFormState,
    canEdit,
    isMobile,
}: EditPanelProps) {
    const layoutStyle = useMemo<React.CSSProperties>(() => {
        return {
            display: "grid",
            gap: 20,
        };
    }, []);

    function updateName(value: string) {
        setFormState((previous) => {
            if (!previous) return previous;

            return {
                ...previous,
                name: value,
            };
        });
    }

    function updateCategory(value: string) {
        setFormState((previous) => {
            if (!previous) return previous;

            return {
                ...previous,
                category: previous.category === value ? null : value,
            };
        });
    }

    function updateOccasion(value: string) {
        setFormState((previous) => {
            if (!previous) return previous;

            return {
                ...previous,
                occasions: toggleMultiValue(previous.occasions, value),
            };
        });
    }

    function updateSeason(value: string) {
        setFormState((previous) => {
            if (!previous) return previous;

            return {
                ...previous,
                seasons: toggleMultiValue(previous.seasons, value),
            };
        });
    }

    function updateColor(value: string) {
        setFormState((previous) => {
            if (!previous) return previous;

            return {
                ...previous,
                colors: toggleMultiValue(previous.colors, value),
            };
        });
    }

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
                title="2. 編輯最終資料"
                description="辨識完成後，可直接在這裡調整名稱、類別、場合、季節與色系。"
            />

            {!formState ? (
                <div
                    style={{
                        borderRadius: 16,
                        background: "#F8FAFC",
                        border: "1px solid #E2E8F0",
                        color: "#64748B",
                        padding: 16,
                        fontSize: 14,
                        lineHeight: 1.7,
                    }}
                >
                    尚未有可編輯資料。請先上傳圖片並等待辨識完成。
                </div>
            ) : (
                <div style={layoutStyle}>
                    <div>
                        <label
                            htmlFor="wardrobe-name"
                            style={{
                                display: "block",
                                marginBottom: 8,
                                fontSize: 14,
                                fontWeight: 700,
                                color: "#111827",
                            }}
                        >
                            名稱
                        </label>

                        <input
                            id="wardrobe-name"
                            type="text"
                            value={formState.name}
                            onChange={(event) => updateName(event.target.value)}
                            disabled={!canEdit}
                            style={{
                                width: "100%",
                                minHeight: 44,
                                borderRadius: 12,
                                border: "1px solid #D1D5DB",
                                padding: "10px 12px",
                                fontSize: 14,
                                color: "#111827",
                                background: canEdit ? "#FFFFFF" : "#F9FAFB",
                                outline: "none",
                            }}
                        />
                    </div>

                    <div>
                        <div
                            style={{
                                marginBottom: 10,
                                fontSize: 14,
                                fontWeight: 700,
                                color: "#111827",
                            }}
                        >
                            類別
                        </div>

                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 10,
                            }}
                        >
                            {CATEGORY_OPTIONS.map((item) => (
                                <FilterChip
                                    key={item.value}
                                    label={item.label}
                                    active={formState.category === item.value}
                                    disabled={!canEdit}
                                    onClick={() => updateCategory(item.value)}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <div
                            style={{
                                marginBottom: 10,
                                fontSize: 14,
                                fontWeight: 700,
                                color: "#111827",
                            }}
                        >
                            場合
                        </div>

                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 10,
                            }}
                        >
                            {OCCASION_OPTIONS.map((item) => (
                                <FilterChip
                                    key={item.value}
                                    label={item.label}
                                    active={formState.occasions.includes(item.value)}
                                    disabled={!canEdit}
                                    onClick={() => updateOccasion(item.value)}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <div
                            style={{
                                marginBottom: 10,
                                fontSize: 14,
                                fontWeight: 700,
                                color: "#111827",
                            }}
                        >
                            季節
                        </div>

                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 10,
                            }}
                        >
                            {SEASON_OPTIONS.map((item) => (
                                <FilterChip
                                    key={item.value}
                                    label={item.label}
                                    active={formState.seasons.includes(item.value)}
                                    disabled={!canEdit}
                                    onClick={() => updateSeason(item.value)}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <div
                            style={{
                                marginBottom: 10,
                                fontSize: 14,
                                fontWeight: 700,
                                color: "#111827",
                            }}
                        >
                            色系
                        </div>

                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 10,
                            }}
                        >
                            {COLOR_OPTIONS.map((item) => (
                                <FilterChip
                                    key={item.value}
                                    label={item.label}
                                    active={formState.colors.includes(item.value)}
                                    disabled={!canEdit}
                                    onClick={() => updateColor(item.value)}
                                />
                            ))}
                        </div>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
                            gap: 12,
                            borderTop: "1px solid #E5E7EB",
                            paddingTop: 18,
                        }}
                    >
                        <SummaryItem label="最終類別" value={formState.category || "未選擇"} />
                        <SummaryItem
                            label="最終場合"
                            value={formState.occasions.length > 0 ? formState.occasions.join("、") : "未選擇"}
                        />
                        <SummaryItem
                            label="最終季節"
                            value={formState.seasons.length > 0 ? formState.seasons.join("、") : "未選擇"}
                        />
                        <SummaryItem
                            label="最終色系"
                            value={formState.colors.length > 0 ? formState.colors.join("、") : "未選擇"}
                        />
                    </div>
                </div>
            )}
        </section>
    );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
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
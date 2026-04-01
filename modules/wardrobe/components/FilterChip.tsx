type FilterChipProps = {
    label: string;
    active?: boolean;
    disabled?: boolean;
    onClick?: () => void;
};

export function FilterChip({
    label,
    active = false,
    disabled = false,
    onClick,
}: FilterChipProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 36,
                padding: "8px 14px",
                borderRadius: 999,
                border: `1px solid ${active ? "#2563EB" : "#D1D5DB"}`,
                background: active ? "#EFF6FF" : "#FFFFFF",
                color: active ? "#1D4ED8" : "#374151",
                fontSize: 14,
                fontWeight: 600,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.5 : 1,
                transition: "all 0.15s ease",
            }}
        >
            {label}
        </button>
    );
}
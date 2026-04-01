type ColorCardProps = {
    label: string;
    score?: number;
};

function formatPercent(score?: number) {
    if (typeof score !== "number" || Number.isNaN(score)) {
        return "0%";
    }

    return `${Math.round(score * 100)}%`;
}

export function ColorCard({ label, score }: ColorCardProps) {
    return (
        <div
            style={{
                border: "1px solid #E5E7EB",
                borderRadius: 14,
                padding: 12,
                background: "#FFFFFF",
            }}
        >
            <div
                style={{
                    fontSize: 14,
                    lineHeight: 1.4,
                    fontWeight: 700,
                    color: "#111827",
                }}
            >
                {label}
            </div>

            <div
                style={{
                    marginTop: 4,
                    fontSize: 12,
                    lineHeight: 1.4,
                    color: "#6B7280",
                }}
            >
                信心分數：{formatPercent(score)}
            </div>
        </div>
    );
}
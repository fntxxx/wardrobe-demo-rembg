type BlockTitleProps = {
    title: string;
    description?: string;
};

export function BlockTitle({ title, description }: BlockTitleProps) {
    return (
        <div style={{ marginBottom: 16 }}>
            <h2
                style={{
                    margin: 0,
                    fontSize: 18,
                    lineHeight: 1.4,
                    fontWeight: 700,
                    color: "#111827",
                }}
            >
                {title}
            </h2>

            {description ? (
                <p
                    style={{
                        marginTop: 6,
                        marginBottom: 0,
                        fontSize: 14,
                        lineHeight: 1.6,
                        color: "#6B7280",
                    }}
                >
                    {description}
                </p>
            ) : null}
        </div>
    );
}
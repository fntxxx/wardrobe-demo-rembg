type SectionTitleProps = {
    title: string;
    subtitle?: string;
};

export function SectionTitle({ title, subtitle }: SectionTitleProps) {
    return (
        <header style={{ marginBottom: 24 }}>
            <h1
                style={{
                    margin: 0,
                    fontSize: 28,
                    lineHeight: 1.2,
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    color: "#111827",
                }}
            >
                {title}
            </h1>

            {subtitle ? (
                <p
                    style={{
                        marginTop: 10,
                        marginBottom: 0,
                        fontSize: 15,
                        lineHeight: 1.7,
                        color: "#4B5563",
                        maxWidth: 880,
                    }}
                >
                    {subtitle}
                </p>
            ) : null}
        </header>
    );
}
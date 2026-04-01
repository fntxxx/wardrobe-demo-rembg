type SectionTitleProps = {
  title: string;
  subtitle?: string;
};

export function SectionTitle({ title, subtitle }: SectionTitleProps) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 30, fontWeight: 800, color: "#111827" }}>{title}</div>
      {subtitle ? (
        <div style={{ marginTop: 6, fontSize: 14, color: "#6b7280", lineHeight: 1.6 }}>
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}

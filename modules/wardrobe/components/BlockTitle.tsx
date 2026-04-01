type BlockTitleProps = {
  title: string;
  helper?: string;
};

export function BlockTitle({ title, helper }: BlockTitleProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 6,
        marginBottom: 12,
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 800, color: "#171717", letterSpacing: "0.01em" }}>
        {title}
      </div>
      {helper ? (
        <div style={{ fontSize: 12, fontWeight: 700, color: "#4b5563" }}>{helper}</div>
      ) : null}
    </div>
  );
}

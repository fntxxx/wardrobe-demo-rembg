type ColorCardProps = {
  label: string;
  swatches: readonly string[];
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
};

export function ColorCard({ label, swatches, active, disabled, onClick }: ColorCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      style={{
        position: "relative",
        border: active ? "3px solid #25324B" : "1px solid transparent",
        borderRadius: 22,
        background: "transparent",
        padding: 0,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        transition: "all 0.15s ease",
      }}
    >
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          aspectRatio: "1 / 1.14",
          borderRadius: 20,
          background: "#ffffff",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
        }}
      >
        {swatches.slice(0, 4).map((swatch, idx) => (
          <span
            key={`${label}-${idx}`}
            style={{
              background: swatch,
              borderRight: idx % 2 === 0 ? "2px solid rgba(255,255,255,0.72)" : "none",
              borderBottom: idx < 2 ? "2px solid rgba(255,255,255,0.72)" : "none",
            }}
          />
        ))}

        {active ? (
          <span
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "#25324B",
              color: "#FFFFFF",
              display: "grid",
              placeItems: "center",
              fontSize: 18,
              fontWeight: 900,
              lineHeight: 1,
            }}
          >
            ✓
          </span>
        ) : null}

        <span
          style={{
            position: "absolute",
            left: "50%",
            bottom: 10,
            transform: "translateX(-50%)",
            minWidth: 54,
            padding: "6px 11px 5px",
            borderRadius: 999,
            background: active ? "rgba(126, 101, 21, 0.92)" : "rgba(118, 118, 118, 0.75)",
            color: "#FFFFFF",
            fontSize: 12,
            fontWeight: 800,
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      </div>
    </button>
  );
}

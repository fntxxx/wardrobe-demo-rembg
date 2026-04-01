type FilterChipProps = {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
};

export function FilterChip({ label, active, disabled, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        height: 36,
        padding: "0 14px",
        borderRadius: 999,
        border: active ? "1px solid #25324B" : "1px solid #CFCFD4",
        background: active ? "#25324B" : "#FFFFFF",
        color: active ? "#FFFFFF" : "#4B5563",
        fontSize: 15,
        fontWeight: 700,
        lineHeight: "36px",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.15s ease",
        whiteSpace: "nowrap",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {label}
    </button>
  );
}

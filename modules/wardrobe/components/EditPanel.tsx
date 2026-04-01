import {
  CATEGORY_OPTIONS,
  OCCASION_OPTIONS,
  SEASON_OPTIONS,
  COLOR_OPTIONS,
  type CategoryValue,
  type OccasionValue,
  type SeasonValue,
  type ColorValue,
} from "@/lib/wardrobeOptions";
import { BlockTitle } from "@/modules/wardrobe/components/BlockTitle";
import { FilterChip } from "@/modules/wardrobe/components/FilterChip";
import { ColorCard } from "@/modules/wardrobe/components/ColorCard";
import type { FormState } from "@/modules/wardrobe/types/demo";

type EditPanelProps = {
  formState: FormState | null;
  setFormState: React.Dispatch<React.SetStateAction<FormState | null>>;
  canEdit: boolean;
  isMobile: boolean;
};

function toggleMultiValue<T extends string>(current: T[], value: T) {
  if (current.includes(value)) {
    if (current.length === 1) {
      return current;
    }

    return current.filter((item) => item !== value);
  }

  return [...current, value];
}

function toggleSingleValue<T extends string>(value: T) {
  return [value];
}

export function EditPanel({ formState, setFormState, canEdit, isMobile }: EditPanelProps) {
  function updateName(value: string) {
    setFormState((prev) =>
      prev
        ? {
            ...prev,
            name: value,
          }
        : prev
    );
  }

  function updateCategory(value: CategoryValue) {
    setFormState((prev) =>
      prev
        ? {
            ...prev,
            category: value,
          }
        : prev
    );
  }

  function updateOccasion(value: OccasionValue) {
    setFormState((prev) =>
      prev
        ? {
            ...prev,
            occasions: toggleMultiValue(prev.occasions, value),
          }
        : prev
    );
  }

  function updateSeason(value: SeasonValue) {
    setFormState((prev) =>
      prev
        ? {
            ...prev,
            seasons: toggleMultiValue(prev.seasons, value),
          }
        : prev
    );
  }

  function updateColor(value: ColorValue) {
    setFormState((prev) =>
      prev
        ? {
            ...prev,
            colors: toggleSingleValue(value),
          }
        : prev
    );
  }

  return (
    <>
      <div style={{ height: 20 }} />

      <BlockTitle title="編輯欄位" helper={canEdit ? "可調整" : "請先完成辨識"} />

      <div style={{ display: "grid", gap: 22 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: "#374151" }}>名稱</div>
          <input
            value={formState?.name ?? ""}
            disabled={!canEdit}
            onChange={(event) => updateName(event.target.value)}
            placeholder="辨識完成後會帶入"
            style={{
              width: "100%",
              height: 46,
              borderRadius: 14,
              border: "1px solid #D1D5DB",
              background: canEdit ? "#FFFFFF" : "#F9FAFB",
              padding: "0 14px",
              fontSize: 15,
              color: "#111827",
              outline: "none",
            }}
          />
        </div>

        <div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: "#374151" }}>類別</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {CATEGORY_OPTIONS.map((option) => (
              <FilterChip
                key={option.value}
                label={option.label}
                active={formState?.category === option.value}
                disabled={!canEdit}
                onClick={() => updateCategory(option.value)}
              />
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: "#374151" }}>場合</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {OCCASION_OPTIONS.map((option) => (
              <FilterChip
                key={option.value}
                label={option.label}
                active={Boolean(formState?.occasions.includes(option.value))}
                disabled={!canEdit}
                onClick={() => updateOccasion(option.value)}
              />
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: "#374151" }}>季節</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {SEASON_OPTIONS.map((option) => (
              <FilterChip
                key={option.value}
                label={option.label}
                active={Boolean(formState?.seasons.includes(option.value))}
                disabled={!canEdit}
                onClick={() => updateSeason(option.value)}
              />
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#374151" }}>色系</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(5, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            {COLOR_OPTIONS.map((option) => (
              <ColorCard
                key={option.value}
                label={option.label}
                swatches={option.swatches}
                active={Boolean(formState?.colors.includes(option.value))}
                disabled={!canEdit}
                onClick={() => updateColor(option.value)}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

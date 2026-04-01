import type {
  CategoryValue,
  OccasionValue,
  SeasonValue,
  ColorValue,
} from "@/lib/wardrobeOptions";

export type ProcessStage = "idle" | "removing" | "predicting";

export type FormState = {
  name: string;
  category: CategoryValue;
  occasions: OccasionValue[];
  seasons: SeasonValue[];
  colors: ColorValue[];
};

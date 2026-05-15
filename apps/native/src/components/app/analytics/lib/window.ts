import type { TFunction } from "i18next";

export type WeekWindow = "4w" | "12w" | "26w" | "52w";

export const WEEK_COUNTS: Record<WeekWindow, number> = {
  "4w": 4,
  "12w": 12,
  "26w": 26,
  "52w": 52,
};

export function windowLabel(_t: TFunction, w: WeekWindow): string {
  return w;
}

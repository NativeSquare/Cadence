import type { WorkoutCategory } from "./types";

export const BRAND_NEUTRALS = {
  w1: "#FFFFFF",
  w2: "#F8F8F6",
  w3: "#EEEEEC",
  wText: "#1A1A1A",
  wSub: "#5C5C5C",
  wMute: "#A3A3A0",
  wBrd: "rgba(0,0,0,0.06)",
} as const;

export const BRAND_COLORS = {
  lime: "#C8FF00",
  limeDim: "rgba(200,255,0,0.12)",
  limeGlow: "rgba(200,255,0,0.06)",

  ora: "#FF9500",
  oraDim: "rgba(255,149,0,0.12)",

  red: "#FF5A5A",
  redDim: "rgba(255,90,90,0.12)",

  blu: "#5B9EFF",
  bluDim: "rgba(91,158,255,0.12)",

  ylw: "#FBBF24",
  ylwDim: "rgba(251,191,36,0.12)",

  grn: "#4ADE80",
  grnDim: "rgba(74,222,128,0.12)",

  black: "#000000",
} as const;

export const WORKOUT_CATEGORY_COLORS: Record<WorkoutCategory, string> = {
  easy: "#00E676",
  tempo: "#FF6D00",
  long: "#00B0FF",
  race: "#FF0040",
} as const;

export const WORKOUT_CATEGORY_COLORS_DIM: Record<WorkoutCategory, string> = {
  easy: "rgba(0, 230, 118, 0.15)",
  tempo: "rgba(255, 109, 0, 0.15)",
  long: "rgba(0, 176, 255, 0.15)",
  race: "rgba(255, 0, 64, 0.15)",
} as const;

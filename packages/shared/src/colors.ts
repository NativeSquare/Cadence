import type { BlockType, WorkoutType } from "@nativesquare/agoge/schema";

export const BLOCK_TYPE_COLORS: Record<BlockType, string> = {
  base: "#6B9E3A",
  build: "#E8A030",
  peak: "#E64D4D",
  taper: "#5B9EFF",
} as const;

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

  black: "#000000",
} as const;

export const SYSTEM_COLORS = {
  red: "#FF5A5A",
  redDim: "rgba(255,90,90,0.12)",

  ylw: "#FBBF24",
  ylwDim: "rgba(251,191,36,0.12)",

  grn: "#4ADE80",
  grnDim: "rgba(74,222,128,0.12)",
} as const;

const WORKOUT_GRAY = "#A3A3A0";
const WORKOUT_GRAY_DIM = "rgba(163, 163, 160, 0.15)";

export const WORKOUT_TYPES_COLORS: Record<WorkoutType, string> = {
  easy: "#00E676",
  threshold: "#FF6D00",
  intervals: "#FFC400",
  long: "#00B0FF",
  race: "#AA00FF",
  race_pace: "#FF0040",
  recovery: WORKOUT_GRAY,
  test: WORKOUT_GRAY,
} as const;

export const WORKOUT_TYPES_COLORS_DIM: Record<WorkoutType, string> = {
  easy: "rgba(0, 230, 118, 0.15)",
  threshold: "rgba(255, 109, 0, 0.15)",
  intervals: "rgba(255, 196, 0, 0.15)",
  long: "rgba(0, 176, 255, 0.15)",
  race: "rgba(170, 0, 255, 0.15)",
  race_pace: "rgba(255, 0, 64, 0.15)",
  recovery: WORKOUT_GRAY_DIM,
  test: WORKOUT_GRAY_DIM,
} as const;

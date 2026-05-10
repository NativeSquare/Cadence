import {
  BRAND_COLORS,
  BRAND_NEUTRALS,
  SYSTEM_COLORS,
} from "@packages/shared/colors";

export const COLORS = { ...BRAND_COLORS, ...SYSTEM_COLORS };
export const LIGHT_THEME = BRAND_NEUTRALS;

export const GRAYS = {
  g1: "rgba(255,255,255,0.92)",
  g2: "rgba(255,255,255,0.70)",
  g3: "rgba(255,255,255,0.45)",
  g4: "rgba(255,255,255,0.25)",
  g5: "rgba(255,255,255,0.10)",
  g6: "rgba(255,255,255,0.06)",
} as const;

export const SURFACES = {
  brd: "rgba(255,255,255,0.08)",
  card: "rgba(255,255,255,0.03)",
} as const;

import { BRAND_COLORS, BRAND_NEUTRALS, WORKOUT_CATEGORY_COLORS } from "@packages/shared";

export const COLORS = BRAND_COLORS;
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

export const CARD_SHADOW = {
  borderWidth: 1,
  borderColor: "rgba(0,0,0,0.12)",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 16,
  elevation: 4,
} as const;

export const FONTS = {
  coach: "Outfit",
  mono: "JetBrainsMono",
} as const;

export const FONT_WEIGHTS = {
  light: "Outfit-Light",
  regular: "Outfit-Regular",
  medium: "Outfit-Medium",
  semibold: "Outfit-SemiBold",
  bold: "Outfit-Bold",
  extrabold: "Outfit-ExtraBold",
} as const;

export const MONO_WEIGHTS = {
  regular: "JetBrainsMono-Regular",
  medium: "JetBrainsMono-Medium",
} as const;

export const ANIMATIONS = {
  blink: "blink 0.8s infinite",
  pulseGlow: "pulseGlow 1.5s ease infinite",
  slideIn: "slideIn 0.35s ease",
  dotPulse: "dotPulse 2s ease infinite",
  msgIn: "msgIn 0.3s ease",
  countUp: "countUp 0.4s ease",
  waveform: "waveform 0.4s ease infinite alternate",
  typingDot: "typingDot 1.2s ease infinite",
  fabIn: "fabIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

export const KEYFRAMES = {
  blink: {
    "0%, 50%": { opacity: 1 },
    "51%, 100%": { opacity: 0 },
  },
  pulseGlow: {
    "0%, 100%": { opacity: 0.4 },
    "50%": { opacity: 1 },
  },
  slideIn: {
    from: { opacity: 0, transform: "translateX(12px)" },
    to: { opacity: 1, transform: "translateX(0)" },
  },
  dotPulse: {
    "0%, 100%": { transform: "scale(1)", opacity: 0.6 },
    "50%": { transform: "scale(1.3)", opacity: 1 },
  },
  msgIn: {
    from: { opacity: 0, transform: "translateY(10px) scale(0.97)" },
    to: { opacity: 1, transform: "translateY(0) scale(1)" },
  },
  countUp: {
    from: { opacity: 0, transform: "translateY(8px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
  waveform: {
    "0%, 100%": { transform: "scaleY(0.3)" },
    "50%": { transform: "scaleY(1)" },
  },
  typingDot: {
    "0%, 60%, 100%": { opacity: 0.3, transform: "translateY(0)" },
    "30%": { opacity: 1, transform: "translateY(-4px)" },
  },
  fabIn: {
    from: { opacity: 0, transform: "scale(0.7) translateY(20px)" },
    to: { opacity: 1, transform: "scale(1) translateY(0)" },
  },
} as const;

export type ColorToken = keyof typeof COLORS;

export type GrayToken = keyof typeof GRAYS;

export type SurfaceToken = keyof typeof SURFACES;

export type LightThemeToken = keyof typeof LIGHT_THEME;

export type FontToken = keyof typeof FONTS;

export type AnimationToken = keyof typeof ANIMATIONS;

export const tailwindColors = {
  ...COLORS,
  ...GRAYS,
  ...SURFACES,
  ...LIGHT_THEME,
  ...WORKOUT_CATEGORY_COLORS,
} as const;
/**
 * Design tokens aligned with the Cadence visual prototype.
 * Reference: cadence-v3.jsx lines 4-16
 *
 * Usage: Import tokens for type-safe access to design system values.
 * For NativeWind classes, use the corresponding utility names defined
 * in tailwind.config.ts (e.g., `bg-lime`, `text-g1`, `border-brd`).
 */

/**
 * Primary accent colors with dim variants for subtle backgrounds.
 * Dim variants use 12% opacity for hover/selected states.
 */
export const COLORS = {
  /** Lime accent - primary brand color #C8FF00 */
  lime: "#C8FF00",
  /** Lime dim - rgba(200,255,0,0.12) for subtle lime backgrounds */
  limeDim: "rgba(200,255,0,0.12)",
  /** Lime glow - rgba(200,255,0,0.06) for very subtle lime backgrounds */
  limeGlow: "rgba(200,255,0,0.06)",

  /** Orange accent - secondary highlight #FF8A00 */
  ora: "#FF8A00",
  /** Orange dim - rgba(255,138,0,0.12) for subtle orange backgrounds */
  oraDim: "rgba(255,138,0,0.12)",

  /** Red accent - error/warning states #FF5A5A */
  red: "#FF5A5A",
  /** Red dim - rgba(255,90,90,0.12) for subtle red backgrounds */
  redDim: "rgba(255,90,90,0.12)",

  /** Blue accent - info/link states #5B9EFF */
  blu: "#5B9EFF",
  /** Blue dim - rgba(91,158,255,0.12) for subtle blue backgrounds */
  bluDim: "rgba(91,158,255,0.12)",

  /** Pure black background */
  black: "#000000",
} as const;

/**
 * Gray scale using white at varying opacities.
 * Used for text hierarchy and subtle UI elements.
 */
export const GRAYS = {
  /** g1 - Primary text, 92% white opacity */
  g1: "rgba(255,255,255,0.92)",
  /** g2 - Secondary text, 70% white opacity */
  g2: "rgba(255,255,255,0.70)",
  /** g3 - Tertiary/placeholder text, 45% white opacity */
  g3: "rgba(255,255,255,0.45)",
  /** g4 - Subtle/disabled text, 25% white opacity */
  g4: "rgba(255,255,255,0.25)",
  /** g5 - Borders/dividers, 10% white opacity */
  g5: "rgba(255,255,255,0.10)",
  /** g6 - Cards/surfaces, 6% white opacity */
  g6: "rgba(255,255,255,0.06)",
} as const;

/**
 * Surface tokens for borders, cards, and selection states.
 */
export const SURFACES = {
  /** Default border - 8% white opacity */
  brd: "rgba(255,255,255,0.08)",
  /** Card background - 3% white opacity */
  card: "rgba(255,255,255,0.03)",
  /** Selected border - lime at 40% opacity */
  sb: "rgba(200,255,0,0.4)",
  /** Selected glow - lime at 6% opacity */
  sg: "rgba(200,255,0,0.06)",
} as const;

/**
 * Font family mappings.
 * Requires fonts to be loaded via expo-font.
 */
export const FONTS = {
  /** Coach voice, UI text - Outfit family */
  coach: "Outfit",
  /** Data, terminal output - JetBrains Mono */
  mono: "JetBrainsMono",
} as const;

/**
 * Font weight mappings for Outfit font family.
 */
export const FONT_WEIGHTS = {
  light: "Outfit-Light",
  regular: "Outfit-Regular",
  medium: "Outfit-Medium",
  semibold: "Outfit-SemiBold",
  bold: "Outfit-Bold",
} as const;

/**
 * Font weight mappings for JetBrains Mono font family.
 */
export const MONO_WEIGHTS = {
  regular: "JetBrainsMono-Regular",
  medium: "JetBrainsMono-Medium",
} as const;

/** Type for color token keys */
export type ColorToken = keyof typeof COLORS;

/** Type for gray token keys */
export type GrayToken = keyof typeof GRAYS;

/** Type for surface token keys */
export type SurfaceToken = keyof typeof SURFACES;

/** Type for font token keys */
export type FontToken = keyof typeof FONTS;

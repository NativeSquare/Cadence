/**
 * Design tokens aligned with the Cadence visual prototype.
 * Reference: cadence-full-v9.jsx T object (lines 3-14)
 *
 * Usage: Import tokens for type-safe access to design system values.
 * For NativeWind classes, use the corresponding utility names defined
 * in tailwind.config.ts (e.g., `bg-lime`, `text-g1`, `border-brd`).
 *
 * Design Pattern: "Dark chrome, light content"
 * - Dark theme (g* tokens): Header/status bar areas, black backgrounds
 * - Light theme (w* tokens): Content areas, scrollable white/cream cards
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

  /** Orange accent - secondary highlight, caution states #FF9500 */
  ora: "#FF9500",
  /** Orange dim - rgba(255,149,0,0.12) for subtle orange backgrounds */
  oraDim: "rgba(255,149,0,0.12)",

  /** Red accent - error/warning states #FF5A5A */
  red: "#FF5A5A",
  /** Red dim - rgba(255,90,90,0.12) for subtle red backgrounds */
  redDim: "rgba(255,90,90,0.12)",

  /** Blue accent - info/link states, rest day color #5B9EFF */
  blu: "#5B9EFF",
  /** Blue dim - rgba(91,158,255,0.12) for subtle blue backgrounds */
  bluDim: "rgba(91,158,255,0.12)",

  /** Pure black background */
  black: "#000000",
} as const;

/**
 * Light theme colors for content areas (scrollable white/cream cards).
 * Used in the "light content" portion of the dark chrome/light content pattern.
 */
export const LIGHT_THEME = {
  /** w1 - Pure white #FFFFFF */
  w1: "#FFFFFF",
  /** w2 - Off-white/cream, main content background #F8F8F6 */
  w2: "#F8F8F6",
  /** w3 - Slightly darker cream for subtle backgrounds #EEEEEC */
  w3: "#EEEEEC",
  /** wText - Primary text on light backgrounds #1A1A1A */
  wText: "#1A1A1A",
  /** wSub - Secondary text on light backgrounds #5C5C5C */
  wSub: "#5C5C5C",
  /** wMute - Muted/tertiary text on light backgrounds #A3A3A0 */
  wMute: "#A3A3A0",
  /** wBrd - Border color on light backgrounds, 6% black opacity */
  wBrd: "rgba(0,0,0,0.06)",
} as const;

/**
 * Activity intensity colors for charts, bars, and workout indicators.
 * Used to visually distinguish workout intensities across the app.
 */
export const ACTIVITY_COLORS = {
  /** barHigh - High intensity (tempo, intervals, Z4-5) #A8D900 */
  barHigh: "#A8D900",
  /** barEasy - Easy/recovery (Z2-3) #7CB342 */
  barEasy: "#7CB342",
  /** barRest - Rest day / Zone 2 base #5B9EFF */
  barRest: "#5B9EFF",
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

/**
 * Animation keyframe definitions from the prototype.
 * Reference: cadence-full-v9.jsx CSS constant (lines 16-28)
 *
 * Note: NativeWind supports basic keyframe animations via tailwindcss-animate.
 * Complex transform animations should use react-native-reanimated instead.
 * These definitions are for reference and CSS-based animations where supported.
 */
export const ANIMATIONS = {
  /** Cursor blink animation for typing indicators */
  blink: "blink 0.8s infinite",
  /** Pulsing glow for status indicators */
  pulseGlow: "pulseGlow 1.5s ease infinite",
  /** Slide in from right for list items */
  slideIn: "slideIn 0.35s ease",
  /** Dot pulse for loading/status indicators */
  dotPulse: "dotPulse 2s ease infinite",
  /** Message appearance animation */
  msgIn: "msgIn 0.3s ease",
  /** Count up number animation */
  countUp: "countUp 0.4s ease",
  /** Waveform for audio indicators */
  waveform: "waveform 0.4s ease infinite alternate",
  /** Typing indicator dots */
  typingDot: "typingDot 1.2s ease infinite",
  /** FAB button entrance */
  fabIn: "fabIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

/**
 * CSS keyframe definitions for web/CSS-in-JS contexts.
 * Use these for reference or in CSS files where keyframes are supported.
 */
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

/** Type for color token keys */
export type ColorToken = keyof typeof COLORS;

/** Type for gray token keys */
export type GrayToken = keyof typeof GRAYS;

/** Type for surface token keys */
export type SurfaceToken = keyof typeof SURFACES;

/** Type for light theme token keys */
export type LightThemeToken = keyof typeof LIGHT_THEME;

/** Type for activity color token keys */
export type ActivityColorToken = keyof typeof ACTIVITY_COLORS;

/** Type for font token keys */
export type FontToken = keyof typeof FONTS;

/** Type for animation keys */
export type AnimationToken = keyof typeof ANIMATIONS;

/**
 * Combined colors export for Tailwind config integration.
 * Use this to spread all design token colors into tailwind.config.ts
 */
export const tailwindColors = {
  ...COLORS,
  ...GRAYS,
  ...SURFACES,
  ...LIGHT_THEME,
  ...ACTIVITY_COLORS,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT USAGE PATTERNS
// ═══════════════════════════════════════════════════════════════════════════
//
// This section documents common NativeWind class patterns for Cadence UI.
//
// ─────────────────────────────────────────────────────────────────────────────
// DARK CHROME (Headers, Status Bars, Navigation)
// ─────────────────────────────────────────────────────────────────────────────
//
// Background:
//   className="bg-black"
//
// Text hierarchy:
//   className="text-g1"     // Primary text (92% white)
//   className="text-g2"     // Secondary text (70% white)
//   className="text-g3"     // Tertiary/placeholder (45% white)
//   className="text-g4"     // Subtle/disabled (25% white)
//
// Borders and surfaces:
//   className="border-brd"          // Standard border (8% white)
//   className="bg-card-surface"     // Card background (3% white)
//
// Accent highlights:
//   className="text-lime"           // Primary accent
//   className="bg-lime"             // Accent background
//   className="bg-lime-dim"         // Subtle accent background
//
// ─────────────────────────────────────────────────────────────────────────────
// LIGHT CONTENT (Scrollable Cards, Content Areas)
// ─────────────────────────────────────────────────────────────────────────────
//
// Background:
//   className="bg-w1"       // Pure white
//   className="bg-w2"       // Off-white/cream (main content bg)
//   className="bg-w3"       // Slightly darker cream
//
// Text hierarchy:
//   className="text-wText"  // Primary text (#1A1A1A)
//   className="text-wSub"   // Secondary text (#5C5C5C)
//   className="text-wMute"  // Muted/tertiary (#A3A3A0)
//
// Borders:
//   className="border-wBrd" // Light border (6% black)
//
// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY INDICATORS (Charts, Workout Bars)
// ─────────────────────────────────────────────────────────────────────────────
//
// Intensity colors:
//   className="bg-barHigh"  // High intensity (tempo, intervals)
//   className="bg-barEasy"  // Easy/recovery
//   className="bg-barRest"  // Rest day / Z2
//
// ─────────────────────────────────────────────────────────────────────────────
// TYPOGRAPHY
// ─────────────────────────────────────────────────────────────────────────────
//
// Font families:
//   className="font-coach"  // Outfit - UI text, coach voice
//   className="font-mono"   // JetBrains Mono - data display
//
// ─────────────────────────────────────────────────────────────────────────────
// ANIMATIONS (NativeWind utility classes)
// ─────────────────────────────────────────────────────────────────────────────
//
// Available animation classes:
//   className="animate-blink"       // Cursor blink
//   className="animate-pulse-glow"  // Status indicator pulse
//   className="animate-slide-in"    // List item entrance
//   className="animate-dot-pulse"   // Loading dots
//   className="animate-msg-in"      // Message appearance
//   className="animate-count-up"    // Number animation
//   className="animate-waveform"    // Audio waveform
//   className="animate-typing-dot"  // Typing indicator
//   className="animate-fab-in"      // FAB button entrance
//
// Note: Complex transform animations should use react-native-reanimated
// for better performance on native platforms.
//
// ═══════════════════════════════════════════════════════════════════════════

import type { Config } from "tailwindcss";
import {
  COLORS,
  GRAYS,
  SURFACES,
  LIGHT_THEME,
  ACTIVITY_COLORS,
} from "./src/lib/design-tokens";

const { hairlineWidth } = require("nativewind/theme");

export default {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // ═══════════════════════════════════════════════════════════════
        // CADENCE DESIGN TOKENS - Imported from design-tokens.ts
        // Reference: cadence-full-v9.jsx T object
        // ═══════════════════════════════════════════════════════════════

        // Accent colors with dim variants
        lime: {
          DEFAULT: COLORS.lime,
          dim: COLORS.limeDim,
          glow: COLORS.limeGlow,
        },
        ora: {
          DEFAULT: COLORS.ora,
          dim: COLORS.oraDim,
        },
        red: {
          DEFAULT: COLORS.red,
          dim: COLORS.redDim,
        },
        blu: {
          DEFAULT: COLORS.blu,
          dim: COLORS.bluDim,
        },

        // Gray scale (white at varying opacities - for text on dark bg)
        g1: GRAYS.g1,
        g2: GRAYS.g2,
        g3: GRAYS.g3,
        g4: GRAYS.g4,
        g5: GRAYS.g5,
        g6: GRAYS.g6,

        // Dark theme surfaces
        brd: SURFACES.brd,
        "card-surface": SURFACES.card,
        sb: SURFACES.sb,
        sg: SURFACES.sg,

        // Light theme colors (content areas - white/cream backgrounds)
        w1: LIGHT_THEME.w1,
        w2: LIGHT_THEME.w2,
        w3: LIGHT_THEME.w3,
        wText: LIGHT_THEME.wText,
        wSub: LIGHT_THEME.wSub,
        wMute: LIGHT_THEME.wMute,
        wBrd: LIGHT_THEME.wBrd,

        // Activity intensity colors (for charts/bars)
        barHigh: ACTIVITY_COLORS.barHigh,
        barEasy: ACTIVITY_COLORS.barEasy,
        barRest: ACTIVITY_COLORS.barRest,
      },
      fontFamily: {
        coach: ["Outfit"],
        mono: ["JetBrainsMono"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // Cadence design system animations (from cadence-full-v9.jsx)
        // Note: Keyframes are defined in global.css as CSS @keyframes
        // These are references for the animation utility classes
        blink: {
          "0%, 50%": { opacity: "1" },
          "51%, 100%": { opacity: "0" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        slideIn: {
          from: { opacity: "0", transform: "translateX(12px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        dotPulse: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.6" },
          "50%": { transform: "scale(1.3)", opacity: "1" },
        },
        msgIn: {
          from: { opacity: "0", transform: "translateY(10px) scale(0.97)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        countUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        waveform: {
          "0%, 100%": { transform: "scaleY(0.3)" },
          "50%": { transform: "scaleY(1)" },
        },
        typingDot: {
          "0%, 60%, 100%": { opacity: "0.3", transform: "translateY(0)" },
          "30%": { opacity: "1", transform: "translateY(-4px)" },
        },
        fabIn: {
          from: { opacity: "0", transform: "scale(0.7) translateY(20px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        // Cadence design system animations
        blink: "blink 0.8s infinite",
        "pulse-glow": "pulseGlow 1.5s ease infinite",
        "slide-in": "slideIn 0.35s ease both",
        "dot-pulse": "dotPulse 2s ease infinite",
        "msg-in": "msgIn 0.3s ease both",
        "count-up": "countUp 0.4s ease both",
        waveform: "waveform 0.4s ease infinite alternate",
        "typing-dot": "typingDot 1.2s ease infinite",
        "fab-in": "fabIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

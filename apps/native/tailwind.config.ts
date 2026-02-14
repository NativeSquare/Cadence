import type { Config } from "tailwindcss";
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
        // Accent colors with dim variants (Cadence design tokens)
        lime: {
          DEFAULT: "#C8FF00",
          dim: "rgba(200,255,0,0.12)",
          glow: "rgba(200,255,0,0.06)",
        },
        ora: {
          DEFAULT: "#FF8A00",
          dim: "rgba(255,138,0,0.12)",
        },
        red: {
          DEFAULT: "#FF5A5A",
          dim: "rgba(255,90,90,0.12)",
        },
        blu: {
          DEFAULT: "#5B9EFF",
          dim: "rgba(91,158,255,0.12)",
        },
        // Gray scale (white at varying opacities)
        g1: "rgba(255,255,255,0.92)",
        g2: "rgba(255,255,255,0.70)",
        g3: "rgba(255,255,255,0.45)",
        g4: "rgba(255,255,255,0.25)",
        g5: "rgba(255,255,255,0.10)",
        g6: "rgba(255,255,255,0.06)",
        // Surface tokens
        brd: "rgba(255,255,255,0.08)",
        "card-surface": "rgba(255,255,255,0.03)",
        sb: "rgba(200,255,0,0.4)",
        sg: "rgba(200,255,0,0.06)",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

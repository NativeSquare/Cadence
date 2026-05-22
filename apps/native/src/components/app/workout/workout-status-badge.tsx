/**
 * WorkoutStatusBadge — pill badge surfacing a workout's effective status.
 *
 * Same shape (icon + tinted pill + uppercase tracked label) wherever a
 * workout's status needs to be communicated at a glance (TodayCard,
 * detail hero, future surfaces). The `tone` prop swaps the palette so the
 * badge stays legible on dark vs. light backgrounds without changing
 * silhouette.
 */

import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import {
  workoutStatusLabel,
  type DerivedWorkoutStatus,
} from "@/components/app/workout/workout-helpers";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

type Tone = "dark" | "light";

interface Palette {
  bg: string;
  border: string;
  fg: string;
}

const PALETTES: Record<DerivedWorkoutStatus, Record<Tone, Palette>> = {
  planned: {
    dark: {
      bg: "rgba(255,255,255,0.06)",
      border: "rgba(255,255,255,0.12)",
      fg: "rgba(255,255,255,0.65)",
    },
    light: {
      bg: "rgba(0,0,0,0.04)",
      border: "rgba(0,0,0,0.08)",
      fg: "#5C5C5C",
    },
  },
  completed: {
    dark: {
      bg: "rgba(200,255,0,0.14)",
      border: "rgba(200,255,0,0.30)",
      fg: COLORS.lime,
    },
    light: {
      bg: COLORS.grnDim,
      border: "rgba(74,222,128,0.32)",
      fg: "#15803D",
    },
  },
  missed: {
    dark: {
      bg: "rgba(255,90,90,0.14)",
      border: "rgba(255,90,90,0.30)",
      fg: COLORS.red,
    },
    light: {
      bg: COLORS.redDim,
      border: "rgba(255,90,90,0.30)",
      fg: "#B91C1C",
    },
  },
  needs_feedback: {
    dark: {
      bg: "rgba(255,196,0,0.14)",
      border: "rgba(255,196,0,0.30)",
      fg: COLORS.ylw,
    },
    light: {
      bg: COLORS.ylwDim,
      border: "rgba(251,191,36,0.32)",
      fg: "#B45309",
    },
  },
};

function CheckIcon({ color }: { color: string }) {
  return (
    <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 12.5L9.5 18L20 6"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function AlertIcon({ color }: { color: string }) {
  return (
    <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
      <Path d="M12 6V14" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M12 18V18.01" stroke={color} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

function CalendarIcon({ color }: { color: string }) {
  return (
    <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7H20M7 3V6M17 3V6M5 7H19V20H5V7Z"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function iconFor(status: DerivedWorkoutStatus, color: string) {
  switch (status) {
    case "planned":
      return <CalendarIcon color={color} />;
    case "completed":
      return <CheckIcon color={color} />;
    case "missed":
    case "needs_feedback":
      return <AlertIcon color={color} />;
  }
}

export interface WorkoutStatusBadgeProps {
  status: DerivedWorkoutStatus;
  tone?: Tone;
}

export function WorkoutStatusBadge({
  status,
  tone = "dark",
}: WorkoutStatusBadgeProps) {
  const { t } = useTranslation();
  const palette = PALETTES[status][tone];
  return (
    <View
      className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1"
      style={{
        backgroundColor: palette.bg,
        borderWidth: 1,
        borderColor: palette.border,
      }}
    >
      {iconFor(status, palette.fg)}
      <Text
        className="font-coach-semibold text-[11px] uppercase tracking-wider"
        style={{ color: palette.fg }}
      >
        {workoutStatusLabel(t, status)}
      </Text>
    </View>
  );
}

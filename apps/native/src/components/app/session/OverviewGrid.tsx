/**
 * OverviewGrid - 3-column stats grid
 * Reference: cadence-full-v10.jsx lines 335-351
 *
 * Features:
 * - 3-column grid layout
 * - Distance card with lime background (hero style)
 * - Duration and Intensity cards with white background
 * - Card padding: 14px 12px, borderRadius 16px
 * - Value: 20px, fontWeight 800; Label: 10px uppercase
 */

import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME, FONT_WEIGHTS } from "@/lib/design-tokens";
import type { SessionIntensity } from "../plan/types";

export interface OverviewGridProps {
  /** Distance in km */
  km: string;
  /** Duration (e.g., "48min") */
  duration: string;
  /** Intensity level */
  intensity: SessionIntensity;
}

interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  isHero?: boolean;
}

function StatCard({ label, value, unit, isHero = false }: StatCardProps) {
  const bgColor = isHero ? COLORS.lime : LIGHT_THEME.w1;
  const textColor = isHero ? "#000000" : LIGHT_THEME.wText;
  const labelColor = isHero ? "rgba(0,0,0,0.45)" : LIGHT_THEME.wMute;
  const unitColor = isHero ? "rgba(0,0,0,0.4)" : LIGHT_THEME.wMute;

  return (
    <View
      style={{
        flex: 1,
        padding: 14,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: bgColor,
        borderWidth: isHero ? 0 : 1,
        borderColor: LIGHT_THEME.wBrd,
        alignItems: "center",
      }}
    >
      <Text
        style={{
          fontSize: 10,
          fontFamily: FONT_WEIGHTS.medium,
          color: labelColor,
          textTransform: "uppercase",
          letterSpacing: 0.04 * 10,
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <View className="flex-row items-baseline">
        <Text
          style={{
            fontSize: 20,
            fontFamily: FONT_WEIGHTS.extrabold,
            color: textColor,
          }}
        >
          {value}
        </Text>
        {unit && (
          <Text
            style={{
              fontSize: 12,
              color: unitColor,
              marginLeft: 2,
            }}
          >
            {unit}
          </Text>
        )}
      </View>
    </View>
  );
}

function getIntensityLabel(intensity: SessionIntensity): string {
  switch (intensity) {
    case "high":
      return "High";
    case "low":
      return "Low";
    case "key":
      return "Key";
    default:
      return "-";
  }
}

export function OverviewGrid({ km, duration, intensity }: OverviewGridProps) {
  return (
    <View className="mb-4">
      {/* Section header */}
      <Text
        className="text-[11px] font-coach-semibold text-wMute uppercase px-1 mb-2.5"
        style={{ letterSpacing: 0.05 * 11 }}
      >
        Overview
      </Text>

      {/* 3-column grid */}
      <View className="flex-row gap-2">
        <StatCard
          label="Distance"
          value={km}
          unit="km"
          isHero
        />
        <StatCard
          label="Duration"
          value={duration}
        />
        <StatCard
          label="Intensity"
          value={getIntensityLabel(intensity)}
        />
      </View>
    </View>
  );
}

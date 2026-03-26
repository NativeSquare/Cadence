/**
 * FocusPoints - Focus tips section
 * Reference: cadence-full-v10.jsx lines 353-370
 *
 * Features:
 * - Section header: "Focus Points"
 * - 3 focus items with emoji + text
 * - Rest days: yoga, easy walk, sleep/hydration tips
 * - Workout days: pace guidance, hydration, route/fueling tips
 * - Container: rounded 16px, background w1, border wBrd
 */

import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME, CARD_SHADOW } from "@/lib/design-tokens";
import type { SessionIntensity } from "../plan/types";

export interface FocusPointsProps {
  /** Whether this is a rest day */
  isRest: boolean;
  /** Session intensity */
  intensity: SessionIntensity;
  /** Distance in km (for conditional tips) */
  km: number;
}

interface FocusItem {
  icon: string;
  text: string;
}

/**
 * Get focus items based on session type
 */
function getFocusItems(isRest: boolean, intensity: SessionIntensity, km: number): FocusItem[] {
  if (isRest) {
    return [
      { icon: "🧘", text: "Light stretching or yoga (15–20 min)" },
      { icon: "🚶", text: "Optional: easy walk for blood flow" },
      { icon: "💤", text: "Prioritize sleep and hydration" },
    ];
  }

  return [
    {
      icon: "🎯",
      text: intensity === "high"
        ? "Hit target pace but don't exceed it"
        : "Keep the effort conversational",
    },
    { icon: "💧", text: "Stay hydrated — sip throughout if warm" },
    {
      icon: "👟",
      text: km >= 10
        ? "Consider fueling during the run"
        : "Flat route preferred for even effort",
    },
  ];
}

export function FocusPoints({ isRest, intensity, km }: FocusPointsProps) {
  const focusItems = getFocusItems(isRest, intensity, km);

  return (
    <View className="mb-4">
      {/* Section header */}
      <Text
        className="text-[11px] font-coach-semibold text-wSub uppercase px-1 mb-2.5"
        style={{ letterSpacing: 0.05 * 11 }}
      >
        Focus Points
      </Text>

      {/* Focus items container */}
      <View
        className="rounded-2xl bg-w1"
        style={{ padding: 16, paddingHorizontal: 18, ...CARD_SHADOW }}
      >
        {focusItems.map((item, index) => (
          <View
            key={index}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingVertical: 8,
              borderBottomWidth: index < focusItems.length - 1 ? 1 : 0,
              borderBottomColor: LIGHT_THEME.wBrd,
            }}
          >
            <Text style={{ fontSize: 18 }}>{item.icon}</Text>
            <Text
              style={{
                fontSize: 14,
                color: LIGHT_THEME.wText,
                lineHeight: 14 * 1.4,
                flex: 1,
              }}
            >
              {item.text}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * CoachInsightCard - Lime-colored coach message card
 * Reference: cadence-full-v10.jsx lines 297-306
 *
 * Features:
 * - Lime background (#C8FF00)
 * - Dot indicator + "Coach Insight" label
 * - Coach message text with proper typography
 * - Border radius: 18px, padding: 18px 20px
 */

import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { COLORS, FONT_WEIGHTS } from "@/lib/design-tokens";

export interface CoachInsightCardProps {
  /** Coach's personalized note */
  coachNote: string;
}

export function CoachInsightCard({ coachNote }: CoachInsightCardProps) {
  return (
    <View
      className="mb-4"
      style={{
        padding: 18,
        paddingHorizontal: 20,
        borderRadius: 18,
        backgroundColor: COLORS.lime,
      }}
    >
      {/* Header row with dot and label */}
      <View className="flex-row items-center gap-[7px] mb-2.5">
        {/* Dot indicator */}
        <View
          style={{
            width: 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: "#000000",
            opacity: 0.2,
          }}
        />
        {/* Label */}
        <Text
          style={{
            fontSize: 11,
            fontFamily: FONT_WEIGHTS.semibold,
            color: "rgba(0,0,0,0.4)",
          }}
        >
          Coach Insight
        </Text>
      </View>

      {/* Coach message */}
      <Text
        style={{
          fontSize: 15,
          fontFamily: FONT_WEIGHTS.medium,
          color: "#000000",
          lineHeight: 15 * 1.55,
        }}
      >
        {coachNote}
      </Text>
    </View>
  );
}

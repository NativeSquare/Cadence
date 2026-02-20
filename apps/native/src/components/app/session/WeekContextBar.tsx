/**
 * WeekContextBar - Week progress bar at bottom of content
 * Reference: cadence-full-v10.jsx lines 372-383
 *
 * Features:
 * - Dark background card (background wText)
 * - Week/phase label (e.g., "Week 4 · Build Phase")
 * - Planned km (e.g., "57.2 km planned")
 * - 7 dots showing week completion status (lime for completed/current, dim otherwise)
 */

import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME, GRAYS, FONT_WEIGHTS } from "@/lib/design-tokens";
import type { SessionDetailData } from "./types";

export interface WeekContextBarProps {
  /** Current day index (0-6) */
  dayIdx: number;
  /** All sessions in the week */
  sessions: SessionDetailData[];
  /** Week number (default: 4) */
  weekNumber?: number;
  /** Phase name (default: "Build Phase") */
  phase?: string;
}

/**
 * Calculate total planned km for the week
 */
function calculatePlannedKm(sessions: SessionDetailData[]): number {
  return sessions.reduce((acc, session) => {
    const km = parseFloat(session.km);
    return acc + (isNaN(km) ? 0 : km);
  }, 0);
}

export function WeekContextBar({
  dayIdx,
  sessions,
  weekNumber = 4,
  phase = "Build Phase",
}: WeekContextBarProps) {
  const plannedKm = calculatePlannedKm(sessions);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 14,
        paddingHorizontal: 18,
        borderRadius: 16,
        backgroundColor: LIGHT_THEME.wText,
      }}
    >
      {/* Week info */}
      <View>
        <Text
          style={{
            fontSize: 10,
            fontFamily: FONT_WEIGHTS.medium,
            color: "rgba(255,255,255,0.4)",
            textTransform: "uppercase",
            letterSpacing: 0.04 * 10,
          }}
        >
          Week {weekNumber} · {phase}
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontFamily: FONT_WEIGHTS.semibold,
            color: GRAYS.g1,
            marginTop: 3,
          }}
        >
          {plannedKm > 0 ? `${plannedKm.toFixed(1)} km planned` : "Rest week"}
        </Text>
      </View>

      {/* Day dots */}
      <View className="flex-row gap-[3px]">
        {[0, 1, 2, 3, 4, 5, 6].map((index) => {
          const session = sessions[index];
          const isCompleted = session?.done ?? false;
          const isCurrent = index === dayIdx;

          let dotColor = "rgba(255,255,255,0.15)";
          if (isCurrent) {
            dotColor = COLORS.lime;
          } else if (isCompleted) {
            dotColor = `${COLORS.lime}88`; // 53% opacity
          }

          return (
            <View
              key={index}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: dotColor,
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

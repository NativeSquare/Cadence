/**
 * WeekStatsRow - Volume and streak cards row
 * Reference: cadence-full-v9.jsx TodayTab stats section (lines 223-236)
 *
 * Features:
 * - Volume card: progress bar, completed/planned km
 * - Streak card: dark background, lime accent number
 */

import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";

interface WeekStatsRowProps {
  /** Kilometers completed this week */
  volumeCompleted: number;
  /** Total planned kilometers for the week */
  volumePlanned: number;
  /** Current streak in days */
  streak: number;
}

/**
 * Volume card showing weekly progress
 * Reference: prototype lines 224-231
 */
function VolumeCard({
  completed,
  planned,
}: {
  completed: number;
  planned: number;
}) {
  const progressPercent = Math.min((completed / planned) * 100, 100);

  return (
    <View
      className="flex-[2] px-4 py-3.5 rounded-2xl bg-w1 border border-wBrd"
      style={{ minHeight: 80 }}
    >
      {/* Label */}
      <Text className="text-[11px] font-coach-medium text-wMute mb-1.5">Volume</Text>

      {/* Values */}
      <View className="flex-row items-baseline gap-1">
        <Text className="text-2xl font-coach-bold text-wText">{completed}</Text>
        <Text className="text-[13px] font-coach text-wMute">/ {planned} km</Text>
      </View>

      {/* Progress bar */}
      <View
        className="h-0.5 bg-w3 rounded-sm mt-2 overflow-hidden"
        style={{ height: 3 }}
      >
        <View
          style={{
            height: "100%",
            width: `${progressPercent}%`,
            backgroundColor: COLORS.lime,
            borderRadius: 2,
          }}
        />
      </View>
    </View>
  );
}

/**
 * Streak card with dark background
 * Reference: prototype lines 232-235
 */
function StreakCard({ streak }: { streak: number }) {
  return (
    <View
      className="w-[90px] py-3.5 px-3.5 rounded-2xl items-center justify-center"
      style={{ backgroundColor: LIGHT_THEME.wText, minHeight: 80 }}
    >
      {/* Streak number */}
      <Text
        className="text-[28px] font-coach-extrabold"
        style={{ color: COLORS.lime, lineHeight: 28 }}
      >
        {streak}
      </Text>

      {/* Label */}
      <Text
        className="text-[10px] font-coach-medium mt-0.5"
        style={{ color: "rgba(255,255,255,0.45)" }}
      >
        day streak
      </Text>
    </View>
  );
}

/**
 * WeekStatsRow - Combined volume and streak display
 */
export function WeekStatsRow({
  volumeCompleted,
  volumePlanned,
  streak,
}: WeekStatsRowProps) {
  return (
    <View className="flex-row gap-2">
      <VolumeCard completed={volumeCompleted} planned={volumePlanned} />
      <StreakCard streak={streak} />
    </View>
  );
}

"use no memo";
/**
 * StatsGrid Component - Training stats display grid
 *
 * Features:
 * - 2-column grid: Total Distance, Workouts, Longest Run
 * - Staggered entrance animations via Reanimated entering prop (UI thread)
 */

import { memo, useMemo } from "react";
import { View, useWindowDimensions } from "react-native";
import Animated, { FadeInUp, Easing } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";

const CARD_SHADOW = {
  borderWidth: 1,
  borderColor: "rgba(0,0,0,0.08)",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 16,
  elevation: 4,
} as const;

import { MOCK_STATS } from "./mock-data";

const PARENT_PX = 20;
const COLUMN_GAP = 8;

export interface StatItem {
  label: string;
  value: number;
  unit?: string;
  sub: string;
}

export interface StatsGridProps {
  stats?: {
    totalDistance: number;
    totalPlanned: number;
    workouts: number;
    workoutsPlanned: number;
    longestRun: number;
    longestRunWeek: number;
  };
}

const StatCard = memo(function StatCard({
  stat,
  index,
  cardWidth,
}: {
  stat: StatItem;
  index: number;
  cardWidth: number;
}) {
  return (
    <Animated.View
      entering={FadeInUp.delay(300 + index * 80)
        .duration(400)
        .easing(Easing.out(Easing.cubic))}
      className="p-4 rounded-2xl"
      style={{
        width: cardWidth,
        backgroundColor: LIGHT_THEME.w1,
        ...CARD_SHADOW,
      }}
    >
      <Text
        className="text-[12px] font-coach-medium mb-[6px]"
        style={{ color: LIGHT_THEME.wSub }}
      >
        {stat.label}
      </Text>

      <View className="flex-row items-baseline gap-[2px]">
        <Text
          className="text-[28px] font-coach-extrabold"
          style={{ color: LIGHT_THEME.wText }}
        >
          {stat.value}
        </Text>
        {stat.unit && (
          <Text
            className="text-[14px] font-coach"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {stat.unit}
          </Text>
        )}
      </View>

      <Text
        className="text-[12px] font-coach mt-1"
        style={{ color: LIGHT_THEME.wSub }}
      >
        {stat.sub}
      </Text>
    </Animated.View>
  );
});

export function StatsGrid({ stats = MOCK_STATS }: StatsGridProps) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.floor(
    (screenWidth - PARENT_PX * 2 - COLUMN_GAP) / 2
  );

  const statItems: StatItem[] = useMemo(
    () => [
      {
        label: "Total Distance",
        value: stats.totalDistance,
        unit: "km",
        sub: `of ~${stats.totalPlanned} km`,
      },
      {
        label: "Workouts",
        value: stats.workouts,
        sub: `of ${stats.workoutsPlanned} planned`,
      },
      {
        label: "Longest Run",
        value: stats.longestRun,
        unit: "km",
        sub: `Week ${stats.longestRunWeek}`,
      },
    ],
    [stats]
  );

  return (
    <View>
      <Text
        className="text-[12px] font-coach-semibold text-wSub uppercase mb-3"
        style={{ letterSpacing: 0.05 * 12 }}
      >
        Training Stats
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {statItems.map((stat, index) => (
          <StatCard
            key={stat.label}
            stat={stat}
            index={index}
            cardWidth={cardWidth}
          />
        ))}
      </View>
    </View>
  );
}

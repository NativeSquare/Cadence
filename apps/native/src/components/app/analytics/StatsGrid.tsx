/**
 * StatsGrid Component - 2x2 stats display grid
 * Reference: cadence-full-v9.jsx lines 584-596
 *
 * Features:
 * - 2x2 grid layout
 * - Cards: Total Distance, Sessions, Longest Run, Avg HR
 * - Staggered entrance animations via Reanimated entering prop (UI thread)
 * - Avg HR card uses dark theme (inverted colors)
 */

import { memo, useMemo } from "react";
import { View, useWindowDimensions } from "react-native";
import Animated, { FadeInUp, Easing } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME, ACTIVITY_COLORS } from "@/lib/design-tokens";
import { MOCK_STATS } from "./mock-data";

export interface StatItem {
  label: string;
  value: number;
  unit?: string;
  sub: string;
  dark?: boolean;
}

export interface StatsGridProps {
  stats?: {
    totalDistance: number;
    totalPlanned: number;
    sessions: number;
    sessionsPlanned: number;
    longestRun: number;
    longestRunWeek: number;
    avgHR: number;
    avgHRChange: number;
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
  const isDark = stat.dark;

  return (
    <Animated.View
      entering={FadeInUp.delay(300 + index * 80)
        .duration(400)
        .easing(Easing.out(Easing.cubic))}
      className="p-4 rounded-2xl"
      style={{
        width: cardWidth,
        backgroundColor: isDark ? "#1A1A1A" : LIGHT_THEME.w1,
        borderWidth: isDark ? 0 : 1,
        borderColor: isDark ? "transparent" : LIGHT_THEME.wBrd,
      }}
    >
      <Text
        className="text-[11px] font-coach-medium mb-[6px]"
        style={{
          color: isDark ? "rgba(255,255,255,0.4)" : LIGHT_THEME.wMute,
        }}
      >
        {stat.label}
      </Text>

      <View className="flex-row items-baseline gap-[2px]">
        <Text
          className="text-[26px] font-coach-extrabold"
          style={{
            color: isDark ? COLORS.lime : LIGHT_THEME.wText,
          }}
        >
          {stat.value}
        </Text>
        {stat.unit && (
          <Text
            className="text-[13px] font-coach"
            style={{
              color: isDark ? "rgba(255,255,255,0.35)" : LIGHT_THEME.wMute,
            }}
          >
            {stat.unit}
          </Text>
        )}
      </View>

      <Text
        className="text-[11px] font-coach mt-1"
        style={{
          color: isDark ? ACTIVITY_COLORS.barHigh : LIGHT_THEME.wMute,
        }}
      >
        {stat.sub}
      </Text>
    </Animated.View>
  );
});

export function StatsGrid({
  stats = MOCK_STATS,
}: StatsGridProps) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = useMemo(() => {
    const availableWidth = screenWidth - 32 - 8;
    return (availableWidth / 2) - 4;
  }, [screenWidth]);

  const statItems: StatItem[] = useMemo(
    () => [
      {
        label: "Total Distance",
        value: stats.totalDistance,
        unit: "km",
        sub: `of ~${stats.totalPlanned} km`,
      },
      {
        label: "Sessions",
        value: stats.sessions,
        sub: `of ${stats.sessionsPlanned} planned`,
      },
      {
        label: "Longest Run",
        value: stats.longestRun,
        unit: "km",
        sub: `Week ${stats.longestRunWeek}`,
      },
      {
        label: "Avg HR",
        value: stats.avgHR,
        unit: "bpm",
        sub: `${stats.avgHRChange >= 0 ? "+" : ""}${stats.avgHRChange} bpm`,
        dark: true,
      },
    ],
    [stats]
  );

  return (
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
  );
}

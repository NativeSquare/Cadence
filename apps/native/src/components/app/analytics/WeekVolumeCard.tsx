/**
 * WeekVolumeCard Component - Weekly volume progress display
 * Reference: cadence-full-v9.jsx lines 521-530
 *
 * Features:
 * - Current volume vs planned display (e.g., "24.7 / 57.2 km")
 * - Progress bar with lime fill
 * - Week-over-week comparison text (e.g., "+8% vs last week")
 */

import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { COLORS, ACTIVITY_COLORS, LIGHT_THEME } from "@/lib/design-tokens";

const CARD_SHADOW = {
  borderWidth: 1,
  borderColor: "rgba(0,0,0,0.08)",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.10,
  shadowRadius: 16,
  elevation: 4,
} as const;
import { MOCK_VOLUME_STATS } from "./mock-data";

interface WeekVolumeCardProps {
  currentVolume?: number;
  plannedVolume?: number;
  weekOverWeekChange?: number;
}

export function WeekVolumeCard({
  currentVolume = MOCK_VOLUME_STATS.currentVolume,
  plannedVolume = MOCK_VOLUME_STATS.plannedVolume,
  weekOverWeekChange = MOCK_VOLUME_STATS.weekOverWeekChange,
}: WeekVolumeCardProps) {
  const targetPercent = (currentVolume / plannedVolume) * 100;
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withDelay(
      200,
      withTiming(targetPercent, {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      })
    );

    return () => {
      cancelAnimation(progressWidth);
    };
  }, []);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const changeText = weekOverWeekChange >= 0
    ? `+${weekOverWeekChange}% vs last week`
    : `${weekOverWeekChange}% vs last week`;

  return (
    <View className="flex-[2] px-5 py-4 rounded-[20px]" style={{ backgroundColor: LIGHT_THEME.w1, ...CARD_SHADOW }}>
      <Text className="text-[12px] font-coach-medium mb-2" style={{ color: LIGHT_THEME.wSub }}>
        Weekly Volume
      </Text>

      <View className="flex-row items-baseline gap-1">
        <Text className="text-[32px] font-coach-extrabold" style={{ color: "#4A7300" }}>
          {currentVolume}
        </Text>
        <Text className="text-[14px] font-coach" style={{ color: LIGHT_THEME.wSub }}>
          / {plannedVolume} km
        </Text>
      </View>

      <View
        className="h-1 rounded-sm mt-[10px] overflow-hidden"
        style={{ backgroundColor: "rgba(0,0,0,0.12)" }}
      >
        <Animated.View
          className="h-full rounded-sm"
          style={[{ backgroundColor: "#7CB342" }, progressBarStyle]}
        />
      </View>

      <Text
        className="text-[11px] font-coach mt-[6px]"
        style={{ color: ACTIVITY_COLORS.barHigh }}
      >
        {changeText}
      </Text>
    </View>
  );
}

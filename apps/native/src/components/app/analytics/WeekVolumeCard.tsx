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
import { COLORS, LIGHT_THEME, ACTIVITY_COLORS } from "@/lib/design-tokens";
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
    <View className="flex-[2] px-[18px] py-4 rounded-[20px] bg-w1 border border-wBrd">
      <Text className="text-[11px] font-coach-medium text-wMute mb-2">
        Weekly Volume
      </Text>

      <View className="flex-row items-baseline gap-1">
        <Text className="text-[28px] font-coach-extrabold text-wText">
          {currentVolume}
        </Text>
        <Text className="text-[13px] font-coach text-wMute">
          / {plannedVolume} km
        </Text>
      </View>

      <View
        className="h-1 rounded-sm mt-[10px] overflow-hidden"
        style={{ backgroundColor: LIGHT_THEME.w3 }}
      >
        <Animated.View
          className="h-full rounded-sm"
          style={[{ backgroundColor: COLORS.lime }, progressBarStyle]}
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

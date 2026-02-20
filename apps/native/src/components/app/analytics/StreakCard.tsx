/**
 * StreakCard Component - Training streak counter display
 * Reference: cadence-full-v9.jsx lines 531-535
 *
 * Features:
 * - Large streak number display (lime on dark)
 * - "day streak" label
 * - 7-day activity dots row (lime for active, dim for inactive)
 */

import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useEffect } from "react";
import { Text } from "@/components/ui/text";
import { COLORS, GRAYS } from "@/lib/design-tokens";
import { MOCK_VOLUME_STATS } from "./mock-data";

interface StreakCardProps {
  /** Current streak count */
  streak?: number;
  /** Last 7 days activity (true = active) */
  streakDays?: boolean[];
  /** Whether to animate on mount */
  animate?: boolean;
}

/** Activity dot component */
function ActivityDot({
  active,
  index,
  animate,
}: {
  active: boolean;
  index: number;
  animate: boolean;
}) {
  const scale = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (animate) {
      scale.value = withDelay(
        400 + index * 50,
        withSequence(
          withTiming(1.3, { duration: 100 }),
          withTiming(1, { duration: 150 })
        )
      );
    }
  }, [animate, index]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      className="w-[6px] h-[6px] rounded-full"
      style={[
        {
          backgroundColor: active ? COLORS.lime : "rgba(255,255,255,0.15)",
        },
        dotStyle,
      ]}
    />
  );
}

/**
 * StreakCard main component
 */
export function StreakCard({
  streak = MOCK_VOLUME_STATS.streak,
  streakDays = MOCK_VOLUME_STATS.streakDays,
  animate = true,
}: StreakCardProps) {
  const numberOpacity = useSharedValue(animate ? 0 : 1);
  const numberTranslateY = useSharedValue(animate ? 8 : 0);

  useEffect(() => {
    if (animate) {
      numberOpacity.value = withDelay(
        200,
        withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) })
      );
      numberTranslateY.value = withDelay(
        200,
        withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) })
      );
    }
  }, [animate]);

  const numberStyle = useAnimatedStyle(() => ({
    opacity: numberOpacity.value,
    transform: [{ translateY: numberTranslateY.value }],
  }));

  return (
    <View
      className="w-[100px] p-4 rounded-[20px] items-center justify-center"
      style={{ backgroundColor: "#1A1A1A" }}
    >
      {/* Streak number */}
      <Animated.View style={numberStyle}>
        <Text
          className="text-[36px] font-coach-extrabold leading-none"
          style={{ color: COLORS.lime }}
        >
          {streak}
        </Text>
      </Animated.View>

      {/* Label */}
      <Text
        className="text-[10px] font-coach-medium mt-1"
        style={{ color: "rgba(255,255,255,0.4)" }}
      >
        day streak
      </Text>

      {/* Activity dots */}
      <View className="flex-row gap-[2px] mt-2">
        {streakDays.map((active, index) => (
          <ActivityDot
            key={index}
            active={active}
            index={index}
            animate={animate}
          />
        ))}
      </View>
    </View>
  );
}

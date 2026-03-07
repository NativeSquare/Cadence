/**
 * StreakCard Component - Training streak counter display
 * Reference: cadence-full-v9.jsx lines 531-535
 *
 * Features:
 * - Large streak number display (lime on dark)
 * - "day streak" label
 * - 7-day activity dots row (lime for active, dim for inactive)
 */

import { memo, useEffect } from "react";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";

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

interface StreakCardProps {
  streak?: number;
  streakDays?: boolean[];
}

const ActivityDot = memo(function ActivityDot({
  active,
  index,
}: {
  active: boolean;
  index: number;
}) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      400 + index * 50,
      withSequence(
        withTiming(1.3, { duration: 100 }),
        withTiming(1, { duration: 150 })
      )
    );

    return () => {
      cancelAnimation(scale);
    };
  }, []);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      className="w-[6px] h-[6px] rounded-full"
      style={[
        {
          backgroundColor: active ? "#4A7300" : "rgba(0,0,0,0.15)",
        },
        dotStyle,
      ]}
    />
  );
});

export function StreakCard({
  streak = MOCK_VOLUME_STATS.streak,
  streakDays = MOCK_VOLUME_STATS.streakDays,
}: StreakCardProps) {
  const numberOpacity = useSharedValue(0);
  const numberTranslateY = useSharedValue(8);

  useEffect(() => {
    numberOpacity.value = withDelay(
      200,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) })
    );
    numberTranslateY.value = withDelay(
      200,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) })
    );

    return () => {
      cancelAnimation(numberOpacity);
      cancelAnimation(numberTranslateY);
    };
  }, []);

  const numberStyle = useAnimatedStyle(() => ({
    opacity: numberOpacity.value,
    transform: [{ translateY: numberTranslateY.value }],
  }));

  return (
    <View
      className="w-[110px] p-4 rounded-[20px] items-center justify-center"
      style={{ backgroundColor: LIGHT_THEME.w1, ...CARD_SHADOW }}
    >
      <Animated.View style={numberStyle}>
        <Text
          className="text-[40px] font-coach-extrabold leading-none"
          style={{ color: "#4A7300" }}
        >
          {streak}
        </Text>
      </Animated.View>

      <Text
        className="text-[11px] font-coach-medium mt-1"
        style={{ color: LIGHT_THEME.wSub }}
      >
        day streak
      </Text>

      <View className="flex-row gap-[2px] mt-2">
        {streakDays.map((active, index) => (
          <ActivityDot
            key={index}
            active={active}
            index={index}
          />
        ))}
      </View>
    </View>
  );
}

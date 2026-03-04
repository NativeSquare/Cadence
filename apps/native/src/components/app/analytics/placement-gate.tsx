import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { COLORS, GRAYS } from "@/lib/design-tokens";

interface PlacementGateProps {
  completedRuns: number;
  threshold: number;
  onSkip?: () => void;
}

function RunDot({
  completed,
  index,
}: {
  completed: boolean;
  index: number;
}) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      300 + index * 80,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.back(1.5)) })
    );
    return () => cancelAnimation(scale);
  }, []);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      className="w-7 h-7 rounded-full items-center justify-center"
      style={[
        {
          backgroundColor: completed
            ? COLORS.lime
            : "rgba(255,255,255,0.08)",
          borderWidth: completed ? 0 : 1,
          borderColor: "rgba(255,255,255,0.12)",
        },
        dotStyle,
      ]}
    >
      {completed && (
        <Text
          className="text-[11px] font-coach-bold"
          style={{ color: COLORS.black }}
        >
          ✓
        </Text>
      )}
    </Animated.View>
  );
}

export function PlacementGate({
  completedRuns,
  threshold,
  onSkip,
}: PlacementGateProps) {
  const progressWidth = useSharedValue(0);
  const targetPercent = Math.min((completedRuns / threshold) * 100, 100);

  useEffect(() => {
    progressWidth.value = withDelay(
      600,
      withTiming(targetPercent, {
        duration: 1200,
        easing: Easing.out(Easing.cubic),
      })
    );
    return () => cancelAnimation(progressWidth);
  }, [targetPercent]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <View className="flex-1 bg-black items-center justify-center px-8">
      <Animated.View
        entering={FadeInUp.delay(100).duration(600)}
        className="items-center"
      >
        <View
          className="w-16 h-16 rounded-full items-center justify-center mb-6"
          style={{ backgroundColor: "rgba(200,255,0,0.08)" }}
        >
          <Text className="text-3xl">🏃</Text>
        </View>

        <Text
          className="text-2xl font-coach-bold text-center mb-2"
          style={{ color: GRAYS.g1 }}
        >
          Placement Runs
        </Text>

        <Text
          className="text-sm font-coach text-center mb-8 leading-5"
          style={{ color: GRAYS.g3 }}
        >
          Complete {threshold} runs to unlock your full analytics.{"\n"}
          We need enough data to build your profile.
        </Text>

        <View className="w-full mb-6">
          <View className="flex-row items-baseline justify-center gap-1 mb-3">
            <Text
              className="text-[48px] font-coach-extrabold"
              style={{ color: COLORS.lime }}
            >
              {completedRuns}
            </Text>
            <Text
              className="text-lg font-coach"
              style={{ color: GRAYS.g3 }}
            >
              / {threshold}
            </Text>
          </View>

          <View
            className="h-[6px] rounded-full overflow-hidden"
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          >
            <Animated.View
              className="h-full rounded-full"
              style={[{ backgroundColor: COLORS.lime }, barStyle]}
            />
          </View>
        </View>

        <View className="flex-row flex-wrap justify-center gap-2">
          {Array.from({ length: threshold }).map((_, i) => (
            <RunDot key={i} completed={i < completedRuns} index={i} />
          ))}
        </View>

        <Text
          className="text-xs font-coach mt-8 text-center"
          style={{ color: GRAYS.g4 }}
        >
          {threshold - completedRuns > 0
            ? `${threshold - completedRuns} more ${threshold - completedRuns === 1 ? "run" : "runs"} to go`
            : "Almost there!"}
        </Text>

        {__DEV__ && onSkip && (
          <View
            className="mt-6 px-5 py-2 rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
            onTouchEnd={onSkip}
          >
            <Text
              className="text-xs font-coach-medium"
              style={{ color: GRAYS.g3 }}
            >
              Skip (dev only)
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

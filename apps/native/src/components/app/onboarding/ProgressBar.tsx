import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  interpolate,
  Extrapolation,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";

type ProgressBarProps = {
  /** Progress value from 0-100 */
  value: number;
  /** Whether to show percentage label */
  showLabel?: boolean;
  /** Whether to show milestone glow effects at 25%, 50%, 75%, 100% */
  showMilestoneGlow?: boolean;
};

const MILESTONES = [25, 50, 75, 100];

/**
 * Onboarding progress bar with animated fill and optional label.
 * Uses design system tokens: bg-primary for fill, bg-muted for track.
 */
export function ProgressBar({
  value,
  showLabel = false,
  showMilestoneGlow = false,
}: ProgressBarProps) {
  const progress = useDerivedValue(() => value);

  // Check if current value is at a milestone
  const isAtMilestone = MILESTONES.includes(value);

  // Animated width for the progress indicator
  const indicatorStyle = useAnimatedStyle(() => {
    return {
      width: withSpring(
        `${interpolate(progress.value, [0, 100], [0, 100], Extrapolation.CLAMP)}%`,
        {
          damping: 15,
          stiffness: 100,
          overshootClamping: true,
        }
      ),
    };
  });

  // Glow effect at milestones
  const glowStyle = useAnimatedStyle(() => {
    if (!showMilestoneGlow) {
      return { opacity: 0 };
    }

    const isMilestone = MILESTONES.includes(progress.value);
    if (isMilestone) {
      return {
        opacity: withSequence(
          withTiming(0.8, { duration: 200 }),
          withTiming(0.3, { duration: 400 }),
          withTiming(0, { duration: 300 })
        ),
      };
    }

    return { opacity: 0 };
  });

  return (
    <View className="w-full">
      {/* Progress track */}
      <View className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        {/* Progress indicator */}
        <Animated.View
          style={indicatorStyle}
          className="h-full rounded-full bg-primary"
        >
          {/* Milestone glow overlay */}
          {showMilestoneGlow && (
            <Animated.View
              style={[glowStyle, { position: "absolute", inset: 0 }]}
              className="rounded-full bg-primary"
            />
          )}
        </Animated.View>
      </View>

      {/* Optional percentage label */}
      {showLabel && (
        <View className="mt-1 items-end">
          <Text className="text-xs text-muted-foreground">{value}%</Text>
        </View>
      )}
    </View>
  );
}

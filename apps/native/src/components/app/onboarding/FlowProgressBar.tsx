/**
 * FlowProgressBar - Animated progress bar for onboarding flow.
 *
 * Fixed position at top of screen, lime fill, smooth width animation.
 * Matches cadence-v3.jsx prototype PBar component.
 *
 * Source: Story 3.5 - Task 5 (AC#4)
 */

import { StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/text";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { useEffect } from "react";
import { COLORS, GRAYS } from "@/lib/design-tokens";

// =============================================================================
// Types
// =============================================================================

export interface FlowProgressBarProps {
  /** Current progress value 0-100 */
  progress: number;
  /** Whether to animate changes (default: true) */
  animate?: boolean;
  /** Test ID for visual regression */
  testID?: string;
}

// =============================================================================
// Component
// =============================================================================

export function FlowProgressBar({
  progress,
  animate = true,
  testID,
}: FlowProgressBarProps) {
  const progressValue = useSharedValue(progress);

  useEffect(() => {
    if (animate) {
      progressValue.value = withSpring(progress, {
        damping: 20,
        stiffness: 100,
        overshootClamping: true,
      });
    } else {
      progressValue.value = progress;
    }
  }, [progress, animate, progressValue]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${interpolate(
      progressValue.value,
      [0, 100],
      [0, 100],
      Extrapolation.CLAMP
    )}%`,
  }));

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Text style={styles.label}>Runner Profile</Text>
        <Text style={styles.percentage}>{Math.round(progress)}%</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 54,
    left: 28,
    right: 28,
    zIndex: 90,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 10,
    fontWeight: "500",
    color: GRAYS.g4,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  percentage: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 10,
    fontWeight: "500",
    color: COLORS.lime,
    letterSpacing: 0.5,
  },
  track: {
    height: 2,
    backgroundColor: GRAYS.g6,
    borderRadius: 1,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: COLORS.lime,
    borderRadius: 1,
  },
});

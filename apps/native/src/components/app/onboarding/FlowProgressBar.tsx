/**
 * FlowProgressBar - Animated progress bar for onboarding flow.
 *
 * Fixed position at top of screen, lime fill, smooth width animation.
 *
 * Source: Story 3.5 - Task 5 (AC#4)
 */

import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
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
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 54, // Account for status bar
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  track: {
    height: 3,
    backgroundColor: GRAYS.g6,
    borderRadius: 1.5,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: COLORS.lime,
    borderRadius: 1.5,
  },
});

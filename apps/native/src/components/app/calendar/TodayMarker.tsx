/**
 * TodayMarker - Pulsing animated circle for "today" indicators.
 * Reused in PhaseTimeline (dot on bar) and PhaseBand (day number halo).
 * Reference: cadence-calendar-final.jsx todayBlink keyframe
 */

import React, { useEffect } from "react";
import { InteractionManager, type ViewStyle } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { COLORS } from "@/lib/design-tokens";
import { useCalendarFocused } from "./CalendarFocusContext";

interface TodayMarkerProps {
  /** Diameter of the pulsing circle */
  size: number;
  /** Border color (default: lime) */
  borderColor?: string;
  /** Border width */
  borderWidth?: number;
  /** Background color (default: transparent) */
  backgroundColor?: string;
  /** Additional styles */
  style?: ViewStyle;
}

export const TodayMarker = React.memo(function TodayMarker({
  size,
  borderColor = `${COLORS.lime}50`,
  borderWidth: bw = 1.5,
  backgroundColor = "transparent",
  style,
}: TodayMarkerProps) {
  const isFocused = useCalendarFocused();
  const opacity = useSharedValue(0.6);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    if (!isFocused) {
      cancelAnimation(opacity);
      cancelAnimation(scale);
      return;
    }
    const task = InteractionManager.runAfterInteractions(() => {
      opacity.value = withRepeat(
        withSequence(
          withTiming(1, {
            duration: 750,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0.6, {
            duration: 750,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        true
      );
      scale.value = withRepeat(
        withSequence(
          withTiming(1.15, {
            duration: 750,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0.9, {
            duration: 750,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        true
      );
    });
    return () => {
      task.cancel();
      cancelAnimation(opacity);
      cancelAnimation(scale);
    };
  }, [isFocused, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: bw,
          borderColor,
          backgroundColor,
          position: "absolute",
        },
        animatedStyle,
        style,
      ]}
      pointerEvents="none"
    />
  );
});

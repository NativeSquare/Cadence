/**
 * Animation hooks for Cadence app using react-native-reanimated.
 * These hooks return animated styles for use with Animated.View.
 *
 * Usage:
 * const style = useSpringUp(isVisible);
 * <Animated.View style={style}>...</Animated.View>
 */
import { useEffect } from "react";
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  CURSOR_BLINK_MS,
  SPRING_CONFIG,
  SPRING_SNAPPY,
  TIMING_FADE,
} from "./animations";

/**
 * Spring up animation hook - enters from below with overshoot.
 * @param trigger - Boolean to trigger animation
 * @param delay - Optional delay in ms before animation starts
 */
export function useSpringUp(trigger: boolean, delay: number = 0) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(24);
  const scale = useSharedValue(0.98);

  useEffect(() => {
    if (trigger) {
      opacity.value = withDelay(delay, withTiming(1, TIMING_FADE));
      translateY.value = withDelay(delay, withSpring(0, SPRING_CONFIG));
      scale.value = withDelay(delay, withSpring(1, SPRING_CONFIG));
    } else {
      opacity.value = 0;
      translateY.value = 24;
      scale.value = 0.98;
    }
  }, [trigger, delay]);

  return useAnimatedStyle(() => {
    "worklet";
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value } as const,
        { scale: scale.value } as const,
      ],
    };
  });
}

/**
 * Fade up animation hook - opacity + translate Y.
 * @param trigger - Boolean to trigger animation
 * @param delay - Optional delay in ms before animation starts
 * @param duration - Optional animation duration in ms
 */
export function useFadeUp(
  trigger: boolean,
  delay: number = 0,
  duration: number = 300
) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);

  useEffect(() => {
    if (trigger) {
      const config = { duration, easing: Easing.out(Easing.ease) };
      opacity.value = withDelay(delay, withTiming(1, config));
      translateY.value = withDelay(delay, withTiming(0, config));
    } else {
      opacity.value = 0;
      translateY.value = 14;
    }
  }, [trigger, delay, duration]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}

/**
 * Scale in animation hook - opacity + scale.
 * @param trigger - Boolean to trigger animation
 * @param delay - Optional delay in ms before animation starts
 * @param duration - Optional animation duration in ms
 */
export function useScaleIn(
  trigger: boolean,
  delay: number = 0,
  duration: number = 300
) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    if (trigger) {
      const config = { duration, easing: Easing.out(Easing.ease) };
      opacity.value = withDelay(delay, withTiming(1, config));
      scale.value = withDelay(delay, withTiming(1, config));
    } else {
      opacity.value = 0;
      scale.value = 0.95;
    }
  }, [trigger, delay, duration]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
}

/**
 * Pulse glow animation hook - infinite opacity cycle for loading indicators.
 * Cycles between 0.5 and 1 opacity.
 */
export function usePulseGlow() {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
}

/**
 * Blink cursor animation hook - sharp on/off blink for cursor visibility.
 * @param active - Whether the cursor should be blinking
 */
export function useBlinkCursor(active: boolean) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (active) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 0 }),
          withDelay(CURSOR_BLINK_MS / 2, withTiming(0, { duration: 0 })),
          withDelay(CURSOR_BLINK_MS / 2, withTiming(1, { duration: 0 }))
        ),
        -1,
        false
      );
    } else {
      opacity.value = 0;
    }
  }, [active]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
}

/**
 * Check pop animation hook - scale bounce for selection feedback.
 * @param checked - Whether the checkbox is checked
 */
export function useCheckPop(checked: boolean) {
  const scale = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    if (checked) {
      scale.value = withSequence(
        withTiming(1.15, { duration: 150, easing: Easing.out(Easing.ease) }),
        withSpring(1, SPRING_SNAPPY)
      );
    } else {
      scale.value = withTiming(0, { duration: 100 });
    }
  }, [checked]);

  return useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
}

/**
 * Shimmer animation hook - infinite opacity cycle for skeleton loading.
 * Cycles between 0.4 and 1 opacity.
 */
export function useShimmer() {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
}

/**
 * Spin animation hook - continuous 360deg rotation.
 * @param active - Whether the spinner should be spinning
 */
export function useSpin(active: boolean = true) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (active) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      rotation.value = 0;
    }
  }, [active]);

  return useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
}

/**
 * Grow bar animation hook - vertical scale from 0 to 1.
 * @param trigger - Boolean to trigger animation
 * @param duration - Animation duration in ms
 */
export function useGrowBar(trigger: boolean, duration: number = 1400) {
  const scaleY = useSharedValue(0);

  useEffect(() => {
    if (trigger) {
      scaleY.value = withTiming(1, {
        duration,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      scaleY.value = 0;
    }
  }, [trigger, duration]);

  return useAnimatedStyle(() => ({
    transform: [{ scaleY: scaleY.value }],
  }));
}

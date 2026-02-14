/**
 * Animation presets for Cadence app using react-native-reanimated.
 * Reference: cadence-v3.jsx lines 23-35
 *
 * Usage: Use withX functions for imperative animation, useX hooks for declarative.
 */
import {
  Easing,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type WithSpringConfig,
  type WithTimingConfig,
} from "react-native-reanimated";

// ============================================================================
// TIMING CONSTANTS
// ============================================================================

/** Character streaming speed (ms per character) */
export const STREAM_CHAR_MS = 28;

/** Cursor blink interval */
export const CURSOR_BLINK_MS = 800;

/** MiniAnalysis line reveal timing */
export const MINI_ANALYSIS_LINE_MS = 280;

/** Spring animation duration feel */
export const SPRING_DURATION_MS = 500;

/** RadarChart polygon animation duration */
export const PROGRESS_BAR_MS = 1400;

// ============================================================================
// SPRING CONFIGURATIONS
// ============================================================================

/** Default spring config for entrance animations */
export const SPRING_CONFIG: WithSpringConfig = {
  damping: 12,
  stiffness: 180,
  mass: 0.8,
};

/** Snappy spring for quick feedback */
export const SPRING_SNAPPY: WithSpringConfig = {
  damping: 15,
  stiffness: 300,
  mass: 0.5,
};

/** Bouncy spring for playful animations */
export const SPRING_BOUNCY: WithSpringConfig = {
  damping: 8,
  stiffness: 150,
  mass: 1,
};

// ============================================================================
// TIMING CONFIGURATIONS
// ============================================================================

/** Standard fade timing */
export const TIMING_FADE: WithTimingConfig = {
  duration: 300,
  easing: Easing.out(Easing.ease),
};

/** Quick timing for micro-interactions */
export const TIMING_QUICK: WithTimingConfig = {
  duration: 150,
  easing: Easing.out(Easing.ease),
};

// ============================================================================
// ANIMATION PRESETS (Worklet functions)
// ============================================================================

/**
 * Spring up animation - enters from below with overshoot.
 * Translate Y from 24px + scale from 0.98, overshoot to -3px, settle.
 */
export function createSpringUpStyle(toValue: number = 1) {
  "worklet";
  return {
    opacity: withTiming(toValue, TIMING_FADE),
    transform: [
      { translateY: withSpring(0, SPRING_CONFIG) },
      { scale: withSpring(1, SPRING_CONFIG) },
    ],
  };
}

/**
 * Spring up initial values (before animation).
 */
export function springUpInitial() {
  "worklet";
  return {
    opacity: 0,
    transform: [{ translateY: 24 }, { scale: 0.98 }],
  };
}

/**
 * Fade up animation - opacity 0→1 + translate Y from 14px to 0.
 */
export function createFadeUpStyle(duration: number = 300) {
  "worklet";
  return {
    opacity: withTiming(1, { duration, easing: Easing.out(Easing.ease) }),
    transform: [
      {
        translateY: withTiming(0, { duration, easing: Easing.out(Easing.ease) }),
      },
    ],
  };
}

/**
 * Fade up initial values.
 */
export function fadeUpInitial() {
  "worklet";
  return {
    opacity: 0,
    transform: [{ translateY: 14 }],
  };
}

/**
 * Fade in animation - opacity 0→1 only.
 */
export function createFadeInStyle(duration: number = 300) {
  "worklet";
  return {
    opacity: withTiming(1, { duration, easing: Easing.out(Easing.ease) }),
  };
}

/**
 * Scale in animation - opacity 0→1 + scale from 0.95 to 1.0.
 */
export function createScaleInStyle(duration: number = 300) {
  "worklet";
  return {
    opacity: withTiming(1, { duration, easing: Easing.out(Easing.ease) }),
    transform: [
      {
        scale: withTiming(1, { duration, easing: Easing.out(Easing.ease) }),
      },
    ],
  };
}

/**
 * Scale in initial values.
 */
export function scaleInInitial() {
  "worklet";
  return {
    opacity: 0,
    transform: [{ scale: 0.95 }],
  };
}

/**
 * Pulse glow animation - opacity cycles 0.5→1→0.5 (for loading indicators).
 * Returns animated opacity value for infinite loop.
 */
export function createPulseGlowValue() {
  "worklet";
  return withRepeat(
    withSequence(
      withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      withTiming(0.5, { duration: 600, easing: Easing.inOut(Easing.ease) })
    ),
    -1,
    true
  );
}

/**
 * Shimmer animation - opacity cycles 0.4→1→0.4 (for skeleton states).
 * Returns animated opacity value for infinite loop.
 */
export function createShimmerValue() {
  "worklet";
  return withRepeat(
    withSequence(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) })
    ),
    -1,
    true
  );
}

/**
 * Check pop animation - scale 0→1.15→1 for checkbox/selection feedback.
 * Returns animated scale value.
 */
export function createCheckPopValue() {
  "worklet";
  return withSequence(
    withTiming(1.15, { duration: 150, easing: Easing.out(Easing.ease) }),
    withSpring(1, SPRING_SNAPPY)
  );
}

/**
 * Blink animation - sharp 0.8s on/off blink for cursor.
 * Returns animated opacity value for infinite loop.
 */
export function createBlinkValue() {
  "worklet";
  return withRepeat(
    withSequence(
      withTiming(1, { duration: 0 }),
      withDelay(CURSOR_BLINK_MS / 2, withTiming(0, { duration: 0 })),
      withDelay(CURSOR_BLINK_MS / 2, withTiming(1, { duration: 0 }))
    ),
    -1,
    false
  );
}

/**
 * Grow bar animation - scale Y from 0 to 1 (transform-origin bottom).
 * Returns animated scale value.
 */
export function createGrowBarValue(duration: number = PROGRESS_BAR_MS) {
  "worklet";
  return withTiming(1, { duration, easing: Easing.out(Easing.cubic) });
}

/**
 * Draw line animation - stroke dash offset animation for line drawing.
 * Returns animated strokeDashoffset value.
 */
export function createDrawLineValue(
  totalLength: number,
  duration: number = 1000
) {
  "worklet";
  return withTiming(0, { duration, easing: Easing.out(Easing.ease) });
}

/**
 * Spin animation - 360deg rotation (1s loop).
 * Returns animated rotation value for infinite loop.
 */
export function createSpinValue() {
  "worklet";
  return withRepeat(
    withTiming(360, { duration: 1000, easing: Easing.linear }),
    -1,
    false
  );
}

// ============================================================================
// ANIMATION HELPERS (Non-worklet)
// ============================================================================

/**
 * Create delayed animation wrapper.
 */
export function withAnimationDelay<T>(delay: number, animation: T): T {
  "worklet";
  return withDelay(delay, animation as any) as T;
}

/**
 * Stagger delay calculator for list animations.
 */
export function getStaggerDelay(index: number, baseDelay: number = 50): number {
  return index * baseDelay;
}

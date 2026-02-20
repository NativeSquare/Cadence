/**
 * TypingIndicator - Three-dot animation for coach typing state
 * Reference: cadence-full-v9.jsx CoachTab typing (line 353)
 *
 * Animation from prototype typingDot keyframe:
 * @keyframes typingDot {
 *   0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
 *   30% { opacity: 1; transform: translateY(-4px); }
 * }
 *
 * Styling:
 * - Container: padding:"14px 18px", borderRadius:"18px 18px 18px 6px"
 *   bg:T.w1, border:"1px solid "+T.wBrd
 * - Dots: width:6, height:6, borderRadius:3, bg:T.wMute
 * - Animation: 1.2s ease, staggered delay (i * 0.2s)
 *
 * Source: Story 10.3 - AC#3, Task 5
 */

import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  FadeInDown,
  FadeOut,
} from "react-native-reanimated";
import { useEffect } from "react";

import type { TypingIndicatorProps } from "./types";

// =============================================================================
// Sub-components
// =============================================================================

/**
 * Single animated dot
 * Reference: prototype typingDot keyframe (line 25)
 */
function AnimatedDot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);
  const translateY = useSharedValue(0);

  useEffect(() => {
    // Animation: 0% -> 30% -> 60% -> 100%
    // At 30%: opacity 1, translateY -4
    // At 0%, 60%, 100%: opacity 0.3, translateY 0
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 360, easing: Easing.ease }), // 0% -> 30%
          withTiming(0.3, { duration: 840, easing: Easing.ease }) // 30% -> 100%
        ),
        -1,
        false
      )
    );

    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-4, { duration: 360, easing: Easing.ease }), // 0% -> 30%
          withTiming(0, { duration: 840, easing: Easing.ease }) // 30% -> 100%
        ),
        -1,
        false
      )
    );
  }, [delay, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className="w-1.5 h-1.5 rounded-full bg-wMute"
    />
  );
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * TypingIndicator component
 *
 * Shows three animated dots when coach is typing.
 * Uses staggered animation matching the prototype.
 */
export function TypingIndicator({ visible }: TypingIndicatorProps) {
  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      exiting={FadeOut.duration(150)}
      className="flex-row justify-start mb-2.5"
    >
      <View
        className="px-4 py-3.5 flex-row items-center gap-1 bg-w1 border border-wBrd"
        style={{
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          borderBottomLeftRadius: 6,
          borderBottomRightRadius: 18,
        }}
      >
        {/* Three dots with staggered delay: 0ms, 200ms, 400ms */}
        <AnimatedDot delay={0} />
        <AnimatedDot delay={200} />
        <AnimatedDot delay={400} />
      </View>
    </Animated.View>
  );
}

/**
 * ChatHeader - Header with title and online/typing status
 * Reference: cadence-full-v9.jsx CoachTab header (lines 324-336)
 *
 * Layout:
 * - Left: "Coach" title (24px bold), status with dot
 * - Right: "Context" button pill
 *
 * Font specifications from prototype:
 * - Title: fontSize:24, fontWeight:700, color:T.g1, letterSpacing:"-.03em"
 * - Status: fontSize:12, color:T.g3
 * - Context button: fontSize:12, fontWeight:500, color:T.g3
 *
 * Source: Story 10.3 - AC#1, Task 2
 */

import { View, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useEffect } from "react";

import type { ChatHeaderProps } from "./types";

// =============================================================================
// Sub-components
// =============================================================================

/**
 * Status dot indicator
 * Reference: prototype line 329
 *
 * Dot colors:
 * - Typing: orange (T.ora)
 * - Online: lime (T.lime)
 */
function StatusDot({ isTyping }: { isTyping: boolean }) {
  const opacity = useSharedValue(1);

  // Pulse animation when typing
  useEffect(() => {
    if (isTyping) {
      opacity.value = withRepeat(
        withTiming(0.5, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      opacity.value = withTiming(1, { duration: 150 });
    }
  }, [isTyping, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className={`w-1.5 h-1.5 rounded-full ${isTyping ? "bg-ora" : "bg-lime"}`}
    />
  );
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * ChatHeader component
 *
 * Renders the header for the coach chat screen with:
 * - "Coach" title with proper typography
 * - Status indicator with animated dot
 * - Optional "Context" button pill
 */
export function ChatHeader({ isTyping, statusText }: ChatHeaderProps) {
  const status = isTyping ? "Typing..." : statusText ?? "Online · Week 4 Build";

  return (
    <View className="flex-row items-center justify-between">
      {/* Left side: Title and status */}
      <View>
        {/* Coach title - 24px, weight 700, letter-spacing -0.03em */}
        <Text
          className="text-[24px] font-coach-bold text-g1"
          style={{ letterSpacing: -0.03 * 24 }}
        >
          Coach
        </Text>

        {/* Status row with dot - 12px, color g3 */}
        <View className="flex-row items-center gap-1.5 mt-1">
          <StatusDot isTyping={isTyping} />
          <Text className="text-[12px] font-coach text-g3">{status}</Text>
        </View>
      </View>

      {/* Right side: Context button */}
      <Pressable
        className="px-3.5 py-1.5 rounded-[14px] bg-card-surface border border-brd active:opacity-70"
      >
        <Text className="text-[12px] font-coach-medium text-g3">Context</Text>
      </Pressable>
    </View>
  );
}

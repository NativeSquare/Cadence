/**
 * ChatHeader - Header with title, online/typing status, and verbose toggle
 *
 * Layout:
 * - Left: "Coach" title (24px bold), status with dot
 * - Right: Eye / EyeOff icon toggle for the verbose preference (controls
 *   whether reading-tool pills like "Checking sessions…" render in chat)
 */

import { View, Pressable } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
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
 * - Typing/streaming: orange (T.ora)
 * - Offline/error: red
 * - Online: lime (T.lime)
 */
function StatusDot({
  isTyping,
  statusText,
}: {
  isTyping: boolean;
  statusText?: string;
}) {
  const opacity = useSharedValue(1);
  const isOfflineOrError =
    statusText?.startsWith("Offline") || statusText?.startsWith("Error");

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

  const dotColor = isOfflineOrError
    ? "bg-red-500"
    : isTyping
      ? "bg-ora"
      : "bg-lime";

  return <Animated.View style={animatedStyle} className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />;
}

// =============================================================================
// Main Component
// =============================================================================

export function ChatHeader({
  isTyping,
  statusText,
  verbose,
  onToggleVerbose,
}: ChatHeaderProps) {
  const status = isTyping ? "Thinking..." : statusText ?? "Online";
  const Icon = verbose ? Eye : EyeOff;

  return (
    <View className="flex-row items-center justify-between">
      <View>
        <Text
          className="text-[24px] font-coach-bold text-g1"
          style={{ letterSpacing: -0.03 * 24 }}
        >
          Coach
        </Text>

        <View className="flex-row items-center gap-1.5 mt-1">
          <StatusDot isTyping={isTyping} statusText={statusText} />
          <Text className="text-[12px] font-coach text-g3">{status}</Text>
        </View>
      </View>

      <Pressable
        onPress={onToggleVerbose}
        accessibilityRole="switch"
        accessibilityState={{ checked: verbose }}
        accessibilityLabel={
          verbose ? "Hide tool activity" : "Show tool activity"
        }
        className="w-9 h-9 rounded-full items-center justify-center bg-card-surface border border-brd active:opacity-70"
      >
        <Icon size={16} color="#a3a3a0" strokeWidth={1.75} />
      </Pressable>
    </View>
  );
}

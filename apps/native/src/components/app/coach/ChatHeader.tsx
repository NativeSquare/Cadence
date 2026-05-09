/**
 * ChatHeader - Header with title and online/typing status
 */

import { View } from "react-native";
import { Text } from "@/components/ui/text";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import type { ChatHeaderProps, ChatStatusKind } from "./types";

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
  statusKind,
}: {
  isTyping: boolean;
  statusKind: ChatStatusKind;
}) {
  const opacity = useSharedValue(1);
  const isOfflineOrError = statusKind === "offline" || statusKind === "error";

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

export function ChatHeader({ isTyping, statusKind }: ChatHeaderProps) {
  const { t } = useTranslation();
  const status = isTyping
    ? t("coach.status.thinking")
    : t(`coach.status.${statusKind === "error" ? "errorTapRetry" : statusKind}`);

  return (
    <View>
      <Text
        className="text-[24px] font-coach-bold text-g1"
        style={{ letterSpacing: -0.03 * 24 }}
      >
        {t("coach.title")}
      </Text>

      <View className="flex-row items-center gap-1.5 mt-1">
        <StatusDot isTyping={isTyping} statusKind={statusKind} />
        <Text className="text-[12px] font-coach text-g3">{status}</Text>
      </View>
    </View>
  );
}

/**
 * ChatMessage - Claude-style message rendering.
 * - User: right-aligned dark bubble, max 75% width.
 * - Coach: full-width plain text with Cadence icon shown AFTER the message
 *   (Claude-style footer mark), no bubble background.
 */

import { View, Image } from "react-native";
import { Text } from "@/components/ui/text";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSmoothText } from "@convex-dev/agent/react";

import type { ChatMessageProps } from "./types";

const CADENCE_ICON = require("../../../../assets/icons/ios-icon.png");

export function ChatMessage({
  message,
  isCoach,
  showFooterIcon,
}: ChatMessageProps) {
  // Typewriter only for the actively-streaming assistant bubble; historical
  // messages render instantly because startStreaming is false.
  const [smoothContent] = useSmoothText(message.content, {
    charsPerSec: 60,
    startStreaming: isCoach && message.isStreaming,
  });
  const displayContent = isCoach ? smoothContent : message.content;

  if (isCoach) {
    return (
      <Animated.View entering={FadeIn.duration(200)}>
        <Text
          className="text-[16px] font-coach text-wText"
          style={{ lineHeight: 16 * 1.55 }}
        >
          {displayContent}
        </Text>
        {showFooterIcon && (
          <View className="w-7 h-7 rounded-full overflow-hidden mt-3">
            <Image source={CADENCE_ICON} className="w-7 h-7" />
          </View>
        )}
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      className="flex-row justify-end"
    >
      <View
        className="max-w-[75%] px-4 py-3.5 bg-wText"
        style={{
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          borderBottomLeftRadius: 18,
          borderBottomRightRadius: 6,
        }}
      >
        <Text
          className="text-[16px] font-coach text-w1"
          style={{ lineHeight: 16 * 1.55 }}
        >
          {displayContent}
        </Text>
      </View>
    </Animated.View>
  );
}

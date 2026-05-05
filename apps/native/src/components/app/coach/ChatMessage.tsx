/**
 * ChatMessage - Claude-style message rendering.
 * - User: right-aligned dark bubble, max 75% width.
 * - Coach: full-width markdown text with Cadence icon shown AFTER the message
 *   (Claude-style footer mark), no bubble background.
 */

import { Fragment } from "react";
import { View, Image } from "react-native";
import { Text } from "@/components/ui/text";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSmoothText } from "@convex-dev/agent/react";
import { useMarkdown } from "react-native-marked";

import { LIGHT_THEME } from "@/lib/design-tokens";
import type { ChatMessageProps } from "./types";

const CADENCE_ICON = require("../../../../assets/icons/ios-icon.png");

const COACH_BODY_LINE_HEIGHT = 16 * 1.55;

const COACH_MD_STYLES = {
  text: {
    color: LIGHT_THEME.wText,
    fontFamily: "Outfit-Regular",
    fontSize: 16,
    lineHeight: COACH_BODY_LINE_HEIGHT,
  },
  paragraph: {
    paddingVertical: 0,
    marginVertical: 4,
    flexWrap: "wrap" as const,
    flexDirection: "row" as const,
  },
  strong: { fontFamily: "Outfit-Bold" },
  em: { fontStyle: "italic" as const },
  link: { color: LIGHT_THEME.wText, textDecorationLine: "underline" as const },
  h1: { fontFamily: "Outfit-Bold", fontSize: 20, marginTop: 8, marginBottom: 4 },
  h2: { fontFamily: "Outfit-Bold", fontSize: 18, marginTop: 8, marginBottom: 4 },
  h3: { fontFamily: "Outfit-SemiBold", fontSize: 17, marginTop: 6, marginBottom: 4 },
  h4: { fontFamily: "Outfit-SemiBold", fontSize: 16, marginTop: 6, marginBottom: 2 },
  h5: { fontFamily: "Outfit-SemiBold", fontSize: 16, marginTop: 4, marginBottom: 2 },
  h6: { fontFamily: "Outfit-SemiBold", fontSize: 16, marginTop: 4, marginBottom: 2 },
  codespan: {
    fontFamily: "JetBrainsMono-Regular",
    fontSize: 14,
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  code: {
    backgroundColor: "rgba(0,0,0,0.06)",
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
  },
  list: { marginVertical: 4 },
  li: {
    color: LIGHT_THEME.wText,
    fontFamily: "Outfit-Regular",
    fontSize: 16,
    lineHeight: COACH_BODY_LINE_HEIGHT,
  },
  blockquote: {
    borderLeftColor: "rgba(0,0,0,0.15)",
    borderLeftWidth: 3,
    paddingLeft: 12,
    marginVertical: 4,
  },
};

const COACH_MD_THEME = {
  colors: {
    text: LIGHT_THEME.wText,
    link: LIGHT_THEME.wText,
    code: LIGHT_THEME.wText,
    border: "rgba(0,0,0,0.1)",
  },
};

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

  const markdownElements = useMarkdown(isCoach ? displayContent : "", {
    colorScheme: "light",
    styles: COACH_MD_STYLES,
    theme: COACH_MD_THEME,
  });

  if (isCoach) {
    return (
      <Animated.View entering={FadeIn.duration(200)}>
        {markdownElements.map((el, i) => (
          <Fragment key={i}>{el}</Fragment>
        ))}
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

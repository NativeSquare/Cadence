/**
 * TodayCard - Main card showing today's session with coach message
 * Reference: cadence-full-v9.jsx TodayTab session card (lines 187-216)
 *
 * Features:
 * - Coach quote section with lime background
 * - Pulsing dot during streaming animation
 * - Session details with vertical accent bar
 * - "Start Session" CTA button
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
import Svg, { Polygon } from "react-native-svg";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { type SessionData } from "./types";
import { getSessionColor, formatShortDate } from "./utils";
import { useStream } from "./use-stream";

interface TodayCardProps {
  /** Today's session data */
  session: SessionData;
  /** Coach message to display with streaming effect */
  coachMessage: string;
}

/**
 * Pulsing dot for coach section (indicates streaming)
 * Reference: prototype line 194
 */
function CoachPulsingDot({ isStreaming }: { isStreaming: boolean }) {
  const opacity = useSharedValue(0.25);

  useEffect(() => {
    if (isStreaming) {
      opacity.value = withRepeat(
        withTiming(1, { duration: 750, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      opacity.value = 0.25;
    }
  }, [isStreaming, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className="w-1.5 h-1.5 rounded-full bg-black"
    />
  );
}

/**
 * Blinking cursor for typing effect
 * Reference: prototype Blink component (line 53)
 */
function BlinkingCursor() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0, { duration: 400 }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          width: 2,
          height: 14,
          backgroundColor: COLORS.black,
          marginLeft: 2,
        },
      ]}
    />
  );
}

/**
 * Play icon for the Start Session button
 */
function PlayIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Polygon points="5,3 19,12 5,21" fill={COLORS.lime} />
    </Svg>
  );
}

/**
 * Decorative quotation mark for coach section
 * Reference: adds visual flair to the coach quote
 */
function QuoteMark({ position }: { position: "open" | "close" }) {
  const isOpen = position === "open";
  const quoteChar = isOpen ? "\u201C" : "\u201D"; // " and "
  return (
    <Text
      className="font-coach"
      style={{
        position: "absolute",
        top: isOpen ? 8 : undefined,
        bottom: isOpen ? undefined : 4,
        left: isOpen ? 12 : undefined,
        right: isOpen ? undefined : 12,
        fontSize: 48,
        fontWeight: "800",
        color: "rgba(0,0,0,0.08)",
        lineHeight: 48,
      }}
    >
      {quoteChar}
    </Text>
  );
}

/**
 * Coach quote section with streaming text
 * Reference: prototype lines 191-199
 */
function CoachQuote({
  message,
  displayed,
  done,
  started,
}: {
  message: string;
  displayed: string;
  done: boolean;
  started: boolean;
}) {
  return (
    <View
      className="mx-3.5 mt-3.5 p-4 rounded-2xl bg-lime"
      style={{ position: "relative", overflow: "hidden" }}
    >
      {/* Decorative quotation marks */}
      <QuoteMark position="open" />
      <QuoteMark position="close" />

      {/* Header with pulsing dot */}
      <View className="flex-row items-center gap-1.5 mb-2.5" style={{ position: "relative", zIndex: 2 }}>
        <CoachPulsingDot isStreaming={!done && started} />
        <Text
          className="text-[11px] font-coach-semibold"
          style={{ color: "rgba(0,0,0,0.4)" }}
        >
          Coach
        </Text>
      </View>

      {/* Message text with cursor */}
      <View className="flex-row flex-wrap items-end" style={{ position: "relative", zIndex: 2 }}>
        <Text className="text-[15px] font-coach-medium text-black" style={{ lineHeight: 23 }}>
          {displayed}
        </Text>
        {!done && started && <BlinkingCursor />}
      </View>
    </View>
  );
}

/**
 * Session details section
 * Reference: prototype lines 201-215
 */
function SessionDetails({ session }: { session: SessionData }) {
  const accentColor = getSessionColor(session);
  const isRest = session.intensity === "rest";
  const dateStr = formatShortDate();

  return (
    <View className="px-4 py-4 pb-4">
      <View className="flex-row gap-3.5">
        {/* Vertical accent bar */}
        <View
          style={{
            width: 4,
            borderRadius: 2,
            backgroundColor: accentColor,
            alignSelf: "stretch",
          }}
        />

        {/* Session info */}
        <View className="flex-1">
          <Text className="text-xs font-coach-medium text-wMute">
            {dateStr} · {isRest ? "" : session.dur}
          </Text>
          <Text
            className="text-[22px] font-coach-bold text-wText mt-0.5"
            style={{ letterSpacing: -0.02 * 22, lineHeight: 26 }}
          >
            {session.type}
          </Text>
          <Text className="text-[13px] font-coach text-wSub mt-1">
            {isRest ? session.desc : `${session.zone} · ${session.km} km`}
          </Text>
          {!isRest && (
            <Text className="text-sm font-coach text-wMute mt-2" style={{ lineHeight: 21 }}>
              {session.desc}
            </Text>
          )}
        </View>
      </View>

      {/* Start Session CTA */}
      <Pressable
        className="mt-4 py-3.5 px-5 rounded-xl flex-row items-center justify-center gap-2"
        style={{ backgroundColor: LIGHT_THEME.wText }}
        onPress={() => {
          // TODO: Navigate to session start flow
          console.log("Start session pressed");
        }}
      >
        <PlayIcon />
        <Text className="text-[15px] font-coach-semibold text-w1">Start Session</Text>
      </Pressable>
    </View>
  );
}

/**
 * TodayCard - Main component
 * Combines coach quote and session details in a single card
 */
export function TodayCard({ session, coachMessage }: TodayCardProps) {
  const { displayed, done, started } = useStream(coachMessage, {
    speed: 20,
    delay: 800,
  });

  return (
    <View>
      {/* Section label */}
      <Text
        className="text-[11px] font-coach-semibold text-wMute px-1 mb-2 uppercase"
        style={{ letterSpacing: 0.05 * 11 }}
      >
        Today
      </Text>

      {/* Card container */}
      <View
        className="rounded-[20px] bg-w1 border border-wBrd overflow-hidden"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 16,
          elevation: 2,
        }}
      >
        <CoachQuote
          message={coachMessage}
          displayed={displayed}
          done={done}
          started={started}
        />
        <SessionDetails session={session} />
      </View>
    </View>
  );
}

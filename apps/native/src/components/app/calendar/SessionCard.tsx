/**
 * SessionCard - Colored card for a calendar day cell.
 * Reference: cadence-calendar-final.jsx lines 617-656
 */

import React, { useEffect } from "react";
import { InteractionManager, View, Text, StyleSheet } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { useCalendarFocused } from "./CalendarFocusContext";
import { WatermarkIcon } from "./WatermarkIcon";
import { blendWithBg } from "./helpers";
import { SESSION_COLORS } from "./constants";
import type { CalSession } from "./types";

interface SessionCardProps {
  session: CalSession;
  isToday: boolean;
  isOutside: boolean;
}

/** Small checkmark SVG for done badge — module-level to avoid recreation */
const CheckSvg = React.memo(function CheckSvg() {
  return (
    <Svg width={6} height={6} viewBox="0 0 8 8" fill="none">
      <Path
        d="M1.5 4L3.2 5.7L6.5 2.3"
        stroke="#fff"
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
});

/** Animated glow ring for today's card — pauses when tab is not focused */
const TodayGlowRing = React.memo(function TodayGlowRing() {
  const isFocused = useCalendarFocused();
  const glowOpacity = useSharedValue(0.2);

  useEffect(() => {
    if (!isFocused) {
      cancelAnimation(glowOpacity);
      return;
    }
    const task = InteractionManager.runAfterInteractions(() => {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.55, {
            duration: 1250,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0.2, {
            duration: 1250,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        true
      );
    });
    return () => {
      task.cancel();
      cancelAnimation(glowOpacity);
    };
  }, [isFocused, glowOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Animated.View
      style={[styles.todayGlowRing, animatedStyle]}
      pointerEvents="none"
    />
  );
});

export const SessionCard = React.memo(
  function SessionCard({ session, isToday, isOutside }: SessionCardProps) {
    const baseColor = SESSION_COLORS[session.type];
    const cardOpacity = isOutside
      ? 0.15
      : isToday
        ? 1
        : session.done
          ? 1
          : 0.75;

    const bgColor =
      cardOpacity < 1 ? blendWithBg(baseColor, cardOpacity) : baseColor;

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: bgColor },
          isToday && styles.todayBorder,
        ]}
      >
        {/* Watermark icon */}
        <View style={styles.watermarkContainer}>
          <WatermarkIcon
            type={session.type}
            size={30}
            color={
              cardOpacity < 1
                ? `rgba(255,255,255,${0.18 * cardOpacity})`
                : undefined
            }
          />
        </View>

        {/* Content */}
        <Text
          style={[
            styles.kmText,
            cardOpacity < 1 && { color: `rgba(255,255,255,${cardOpacity})` },
          ]}
        >
          {session.km}
        </Text>
        <Text
          style={[
            styles.durText,
            cardOpacity < 1 && {
              color: `rgba(255,255,255,${0.65 * cardOpacity})`,
            },
          ]}
        >
          {session.dur}
        </Text>

        {/* Checkmark badge */}
        {session.done && (
          <View style={styles.checkBadge}>
            <CheckSvg />
          </View>
        )}

        {/* Today glow ring */}
        {isToday && <TodayGlowRing />}
      </View>
    );
  },
  (prev, next) =>
    prev.session.type === next.session.type &&
    prev.session.done === next.session.done &&
    prev.session.km === next.session.km &&
    prev.isToday === next.isToday &&
    prev.isOutside === next.isOutside
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    position: "relative",
    overflow: "hidden",
  },
  todayBorder: {
    borderWidth: 2,
    borderColor: COLORS.lime,
    shadowColor: COLORS.lime,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  watermarkContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -15 }, { translateY: -15 }],
  },
  kmText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Outfit-Bold",
    color: "#FFFFFF",
    lineHeight: 14,
    position: "relative",
    zIndex: 2,
    fontVariant: ["tabular-nums"],
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  durText: {
    fontSize: 8,
    fontWeight: "300",
    fontFamily: "Outfit-Light",
    color: "rgba(255,255,255,0.65)",
    lineHeight: 10,
    position: "relative",
    zIndex: 2,
    fontVariant: ["tabular-nums"],
    textShadowColor: "rgba(0,0,0,0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  checkBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  todayGlowRing: {
    position: "absolute",
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: COLORS.lime,
    zIndex: 4,
  },
});

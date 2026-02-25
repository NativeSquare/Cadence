/**
 * SessionCard - White card with colored left accent strip for a calendar day cell.
 * Shows km and duration with a subtle session-type icon watermark.
 * Reference: cadence-calendar-v2 prototype session card section
 */

import React, { useEffect, useMemo } from "react";
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
import Svg, { Circle, Path } from "react-native-svg";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { useCalendarFocused } from "./CalendarFocusContext";
import { SESSION_COLORS } from "./constants";
import type { CalSession, CalSessionType } from "./types";

interface SessionCardProps {
  session: CalSession;
  isToday: boolean;
  isOutside: boolean;
}

/* ── Small inline session-type icon (10px watermark) ── */

const ICON_SW = 2;

const SmallSessionIcon = React.memo(function SmallSessionIcon({
  type,
  size = 10,
  color = LIGHT_THEME.wText,
}: {
  type: CalSessionType;
  size?: number;
  color?: string;
}) {
  switch (type) {
    case "easy":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={8} stroke={color} strokeWidth={ICON_SW} />
          <Path
            d="M12 8v4"
            stroke={color}
            strokeWidth={ICON_SW}
            strokeLinecap="round"
          />
        </Svg>
      );
    case "specific":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"
            stroke={color}
            strokeWidth={ICON_SW}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case "long":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 17l4-8 4 4 4-6 6 10"
            stroke={color}
            strokeWidth={ICON_SW}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case "race":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M6 4h12v6c0 3.3-2.7 6-6 6s-6-2.7-6-6V4z"
            stroke={color}
            strokeWidth={ICON_SW}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M12 16v3"
            stroke={color}
            strokeWidth={ICON_SW}
            strokeLinecap="round"
          />
          <Path
            d="M8 22h8"
            stroke={color}
            strokeWidth={ICON_SW}
            strokeLinecap="round"
          />
        </Svg>
      );
    default:
      return null;
  }
});

/* ── Animated pulsing lime dot for today's card ── */

const TodayDot = React.memo(function TodayDot() {
  const isFocused = useCalendarFocused();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    if (!isFocused) {
      cancelAnimation(scale);
      cancelAnimation(opacity);
      return;
    }
    const task = InteractionManager.runAfterInteractions(() => {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.3, {
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, {
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        true
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(1, {
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0.6, {
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        true
      );
    });
    return () => {
      task.cancel();
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, [isFocused, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[styles.todayDot, animatedStyle]}
      pointerEvents="none"
    />
  );
});

/* ── Main component ── */

export const SessionCard = React.memo(
  function SessionCard({ session, isToday, isOutside }: SessionCardProps) {
    const accentColor = SESSION_COLORS[session.type];

    const cardStyle = useMemo(
      () => [
        styles.card,
        isToday ? styles.todayCard : styles.normalCard,
        isOutside && styles.outsideCard,
      ],
      [isToday, isOutside]
    );

    const accentStyle = useMemo(
      () => [
        styles.accentStrip,
        {
          backgroundColor: accentColor,
          opacity: session.done ? 1 : 0.5,
        },
      ],
      [accentColor, session.done]
    );

    return (
      <View style={cardStyle}>
        {/* Left colored accent strip */}
        <View style={accentStyle} />

        {/* Content area */}
        <View style={styles.content}>
          <Text style={[styles.kmText, session.done && styles.kmTextDone]}>
            {session.km}
          </Text>
          <Text style={[styles.durText, session.done && styles.durTextDone]}>
            {session.dur}
          </Text>

          {/* Subtle type icon watermark */}
          <View style={styles.iconWatermark} pointerEvents="none">
            <SmallSessionIcon type={session.type} />
          </View>
        </View>

        {/* Today pulsing dot */}
        {isToday && <TodayDot />}
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
    borderRadius: 7,
    flexDirection: "row",
    overflow: "hidden",
    position: "relative",
    backgroundColor: LIGHT_THEME.w1,
  },
  normalCard: {
    borderWidth: 1,
    borderColor: LIGHT_THEME.wBrd,
  },
  todayCard: {
    borderWidth: 1.5,
    borderColor: COLORS.lime,
    shadowColor: COLORS.lime,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  outsideCard: {
    opacity: 0.3,
    backgroundColor: "transparent",
  },
  accentStrip: {
    width: 3,
    borderTopLeftRadius: 7,
    borderBottomLeftRadius: 7,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    paddingVertical: 3,
    paddingHorizontal: 2,
    position: "relative",
  },
  kmText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Outfit-Bold",
    color: LIGHT_THEME.wText,
    lineHeight: 13,
    fontVariant: ["tabular-nums"],
  },
  kmTextDone: {
    opacity: 0.55,
  },
  durText: {
    fontSize: 7.5,
    fontWeight: "500",
    fontFamily: "Outfit-Medium",
    color: LIGHT_THEME.wMute,
    lineHeight: 9,
    fontVariant: ["tabular-nums"],
    opacity: 0.7,
  },
  durTextDone: {
    opacity: 0.5,
  },
  iconWatermark: {
    position: "absolute",
    bottom: 2,
    right: 2,
    opacity: 0.12,
  },
  todayDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.lime,
    zIndex: 3,
  },
});

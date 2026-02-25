/**
 * PhaseTimeline - Horizontal progress bar showing training phases.
 * 22pt tall with proportional colored segments and animated "today" dot.
 * Reference: cadence-calendar-final.jsx lines 311-361
 */

import React, { useEffect, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { PHASES, TODAY_KEY } from "./constants";

/** Animated today dot on the timeline */
const TimelineTodayDot = React.memo(function TimelineTodayDot({
  offset,
}: {
  offset: number;
}) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, {
          duration: 750,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0.9, {
          duration: 750,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      true
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 750,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0.6, {
          duration: 750,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      true
    );
    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, [scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View
      style={[
        styles.todayContainer,
        { left: `${offset * 100}%` as any },
      ]}
      pointerEvents="none"
    >
      {/* Vertical line behind dot */}
      <View style={styles.todayLine} />

      {/* Pulsing lime dot */}
      <Animated.View style={[styles.todayDot, animatedStyle]} />
    </View>
  );
});

export const PhaseTimeline = React.memo(function PhaseTimeline() {
  const { segments, todayOffset } = useMemo(() => {
    const allStart = new Date(PHASES[0].start + "T00:00:00");
    const allEnd = new Date(
      PHASES[PHASES.length - 1].end + "T00:00:00"
    );
    const totalDays = Math.max(
      1,
      (allEnd.getTime() - allStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    const todayDate = new Date(TODAY_KEY + "T00:00:00");
    const offset = Math.max(
      0,
      Math.min(
        1,
        (todayDate.getTime() - allStart.getTime()) /
          (1000 * 60 * 60 * 24) /
          totalDays
      )
    );

    const segs = PHASES.map((p) => {
      const start = new Date(p.start + "T00:00:00");
      const end = new Date(p.end + "T00:00:00");
      const days = Math.max(
        1,
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1
      );
      const widthPct = (days / totalDays) * 100;
      return { phase: p, widthPct };
    });

    return { segments: segs, todayOffset: offset };
  }, []);

  return (
    <View style={styles.outerContainer}>
      <View style={styles.barContainer}>
        {segments.map((s, i) => (
          <View
            key={i}
            style={[
              styles.segment,
              {
                width: `${s.widthPct}%` as any,
                backgroundColor: s.phase.color,
                borderRightWidth:
                  i < segments.length - 1 ? 1.5 : 0,
                borderRightColor: LIGHT_THEME.w2,
              },
            ]}
          >
            {s.widthPct > 10 && (
              <Text style={styles.segmentLabel}>{s.phase.name}</Text>
            )}
          </View>
        ))}

        {/* Today marker */}
        <TimelineTodayDot offset={todayOffset} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  barContainer: {
    flexDirection: "row",
    height: 22,
    borderRadius: 11,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  segment: {
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  segmentLabel: {
    fontSize: 8,
    fontWeight: "700",
    fontFamily: "Outfit-Bold",
    color: "rgba(255,255,255,0.95)",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  todayContainer: {
    position: "absolute",
    top: -2,
    bottom: -2,
    width: 10,
    marginLeft: -5,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  todayLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 4,
    width: 2,
    backgroundColor: LIGHT_THEME.wText,
    borderRadius: 1,
    opacity: 0.5,
  },
  todayDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.lime,
    borderWidth: 2,
    borderColor: LIGHT_THEME.wText,
    shadowColor: COLORS.lime,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
});

/**
 * WeekRow - A single week row in the month view with staggered entrance
 * and pulsing today column highlight.
 */

import React, { useEffect, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  Easing,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { PhaseBand } from "./PhaseBand";
import { WorkoutCard } from "./WorkoutCard";
import { computePhaseSegments } from "./helpers";
import type { CalWorkout, CalendarDay, Phase } from "./types";

const HIGHLIGHT_COLORS = ["rgba(200,255,0,0.047)", "rgba(200,255,0,0.024)"] as const;

interface WeekRowProps {
  week: CalendarDay[];
  weekIndex: number;
  phaseLookup: Map<string, Phase>;
  workouts: Record<string, CalWorkout[]>;
  todayKey: string;
  onWorkoutPress?: (dateKey: string, workout: CalWorkout) => void;
  enterDelay?: number;
}

function TodayColumnPulse({ style }: { style: any[] }) {
  const pulseOpacity = useSharedValue(0.7);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [pulseOpacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }));

  return (
    <Animated.View style={[...style, animStyle]} pointerEvents="none">
      <LinearGradient colors={HIGHLIGHT_COLORS} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

export const WeekRow = React.memo(function WeekRow({
  week,
  weekIndex,
  phaseLookup,
  workouts,
  todayKey,
  onWorkoutPress,
  enterDelay = 0,
}: WeekRowProps) {
  const segments = useMemo(() => computePhaseSegments(week, phaseLookup), [week, phaseLookup]);

  const weekHasWorkouts = useMemo(
    () => week.some((d) => (workouts[d.key] || []).length > 0),
    [week, workouts]
  );

  const todayColIdx = useMemo(() => week.findIndex((d) => d.key === todayKey), [week, todayKey]);

  const highlightPositionStyle = useMemo(
    () =>
      todayColIdx >= 0
        ? [
            styles.todayHighlight,
            {
              left: `${(todayColIdx / 7) * 100}%` as any,
              width: `${(1 / 7) * 100}%` as any,
            },
          ]
        : null,
    [todayColIdx]
  );

  return (
    <Animated.View
      entering={FadeInUp.delay(enterDelay).duration(350).easing(Easing.out(Easing.cubic))}
      style={[
        weekHasWorkouts ? styles.flexRow : styles.autoRow,
        weekIndex > 0 && styles.separator,
      ]}
    >
      {highlightPositionStyle && <TodayColumnPulse style={highlightPositionStyle} />}

      <PhaseBand segments={segments} week={week} todayKey={todayKey} />

      <View style={styles.cardsGrid}>
        {week.map((d, di) => {
          const dayWorkouts = workouts[d.key] || [];
          const hasWorkout = dayWorkouts.length > 0;
          const w = dayWorkouts[0];
          const isToday = d.key === todayKey;

          return (
            <View key={di} style={styles.cardCell}>
              {hasWorkout && w ? (
                <WorkoutCard
                  workout={w}
                  isToday={isToday}
                  isOutside={d.outside}
                  onPress={onWorkoutPress ? () => onWorkoutPress(d.key, w) : undefined}
                  enterDelay={enterDelay + di * 30}
                />
              ) : (
                <View style={styles.emptyCell} />
              )}
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  flexRow: {
    flex: 1,
    flexDirection: "column",
    position: "relative",
    overflow: "hidden",
  },
  autoRow: {
    height: 32,
    flexDirection: "column",
    position: "relative",
    overflow: "hidden",
  },
  separator: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.04)",
  },
  todayHighlight: {
    position: "absolute",
    top: 0,
    bottom: 0,
    zIndex: 0,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: "rgba(200,255,0,0.08)",
    borderRightColor: "rgba(200,255,0,0.08)",
  },
  cardsGrid: {
    flex: 1,
    flexDirection: "row",
    gap: 2,
    paddingVertical: 1,
  },
  cardCell: {
    flex: 1,
  },
  emptyCell: {
    flex: 1,
  },
});

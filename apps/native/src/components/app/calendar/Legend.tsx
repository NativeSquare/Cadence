/**
 * Legend - Workout type colors + phase indicators with fade-in entrance.
 */

import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { WORKOUT_COLORS, WORKOUT_LABELS, PHASES } from "./constants";
import { blendWithBg, formatDateKey, getDaysInMonth } from "./helpers";
import type { CalWorkoutType } from "./types";

interface LegendProps {
  currentYear: number;
  currentMonth: number;
}

const WORKOUT_TYPES: CalWorkoutType[] = ["easy", "specific", "long", "race"];

export const Legend = React.memo(function Legend({ currentYear, currentMonth }: LegendProps) {
  const visiblePhases = useMemo(() => {
    const monthStart = formatDateKey(currentYear, currentMonth, 1);
    const monthEnd = formatDateKey(currentYear, currentMonth, getDaysInMonth(currentYear, currentMonth));
    return PHASES.filter((p) => p.end >= monthStart && p.start <= monthEnd);
  }, [currentYear, currentMonth]);

  return (
    <Animated.View entering={FadeIn.delay(400).duration(400)} style={styles.container}>
      <View style={styles.row}>
        {WORKOUT_TYPES.map((type) => (
          <View key={type} style={styles.item}>
            <View style={[styles.workoutDot, { backgroundColor: WORKOUT_COLORS[type] }]} />
            <Text style={styles.workoutLabel}>{WORKOUT_LABELS[type]}</Text>
          </View>
        ))}
      </View>
      <View style={[styles.row, { gap: 12 }]}>
        {visiblePhases.map((p) => (
          <View key={p.name} style={styles.item}>
            <View
              style={[
                styles.phasePill,
                { backgroundColor: blendWithBg(p.color, 0.25), borderLeftColor: p.color },
              ]}
            />
            <Text style={styles.phaseLabel}>{p.name}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    marginBottom: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  workoutDot: {
    width: 3,
    height: 12,
    borderRadius: 2,
  },
  workoutLabel: {
    fontSize: 11,
    fontWeight: "500",
    fontFamily: "Outfit-Medium",
    color: LIGHT_THEME.wSub,
  },
  phasePill: {
    width: 16,
    height: 8,
    borderRadius: 4,
    borderLeftWidth: 2.5,
  },
  phaseLabel: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "Outfit-SemiBold",
    color: LIGHT_THEME.wMute,
  },
});

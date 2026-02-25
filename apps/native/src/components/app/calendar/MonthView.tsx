/**
 * MonthView - Full month grid with PhaseTimeline, DayHeaders, WeekRows, and Legend.
 * Reference: cadence-calendar-final.jsx lines 464-688
 *
 * Uses a plain View (not FlatList) for the weeks container because:
 * - Only 4-6 rows — no virtualization benefit
 * - WeekRows need flex distribution from parent, which FlatList can't provide
 */

import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { PhaseTimeline } from "./PhaseTimeline";
import { DayHeaders } from "./DayHeaders";
import { WeekRow } from "./WeekRow";
import { Legend } from "./Legend";
import { buildWeeks, buildPhaseLookup } from "./helpers";
import { PHASES, TODAY_KEY } from "./constants";
import type { CalSession } from "./types";

interface MonthViewProps {
  year: number;
  month: number;
  sessions: Record<string, CalSession[]>;
}

export const MonthView = React.memo(function MonthView({
  year,
  month,
  sessions,
}: MonthViewProps) {
  const weeks = useMemo(() => buildWeeks(year, month), [year, month]);

  const phaseLookup = useMemo(
    () => buildPhaseLookup(PHASES),
    []
  );

  return (
    <View style={styles.container}>
      <PhaseTimeline />
      <DayHeaders />

      <View style={styles.weeksContainer}>
        {weeks.map((week, index) => (
          <WeekRow
            key={`week-${index}`}
            week={week}
            weekIndex={index}
            phaseLookup={phaseLookup}
            sessions={sessions}
            todayKey={TODAY_KEY}
          />
        ))}
      </View>

      <Legend currentYear={year} currentMonth={month} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_THEME.w2,
  },
  weeksContainer: {
    flex: 1,
    paddingHorizontal: 3,
  },
});

/**
 * MonthView - Full month grid with PhaseTimeline, DayHeaders, WeekRows, and Legend.
 * Passes staggered entrance delays to WeekRows and session press callbacks.
 */

import React, { useMemo, useRef } from "react";
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
  onSessionPress?: (dateKey: string, session: CalSession) => void;
}

export const MonthView = React.memo(function MonthView({
  year,
  month,
  sessions,
  onSessionPress,
}: MonthViewProps) {
  const weeks = useMemo(() => buildWeeks(year, month), [year, month]);
  const phaseLookup = useMemo(() => buildPhaseLookup(PHASES), []);

  const isFirstRender = useRef(true);
  const stagger = isFirstRender.current;
  if (isFirstRender.current) isFirstRender.current = false;

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
            onSessionPress={onSessionPress}
            enterDelay={stagger ? index * 60 : 0}
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

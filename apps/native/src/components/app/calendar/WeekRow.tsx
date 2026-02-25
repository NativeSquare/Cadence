/**
 * WeekRow - A single week row in the month view.
 * Combines PhaseBand (day numbers with phase strips) and a 7-column session card grid.
 * Reference: cadence-calendar-final.jsx lines 484-661
 */

import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "@/lib/design-tokens";
import { PhaseBand } from "./PhaseBand";
import { SessionCard } from "./SessionCard";
import { computePhaseSegments } from "./helpers";
import type { CalSession, CalendarDay, Phase } from "./types";

interface WeekRowProps {
  week: CalendarDay[];
  weekIndex: number;
  phaseLookup: Map<string, Phase>;
  sessions: Record<string, CalSession[]>;
  todayKey: string;
}

export const WeekRow = React.memo(function WeekRow({
  week,
  weekIndex,
  phaseLookup,
  sessions,
  todayKey,
}: WeekRowProps) {
  const segments = useMemo(
    () => computePhaseSegments(week, phaseLookup),
    [week, phaseLookup]
  );

  const weekHasSessions = week.some(
    (d) => (sessions[d.key] || []).length > 0
  );

  const todayColIdx = week.findIndex((d) => d.key === todayKey);

  return (
    <View
      style={[
        weekHasSessions ? styles.flexRow : styles.autoRow,
        weekIndex > 0 && styles.separator,
      ]}
    >
      {/* Today column highlight */}
      {todayColIdx >= 0 && (
        <LinearGradient
          colors={[
            "rgba(200,255,0,0.047)",
            "rgba(200,255,0,0.024)",
          ]}
          style={[
            styles.todayHighlight,
            {
              left: `${(todayColIdx / 7) * 100}%` as any,
              width: `${(1 / 7) * 100}%` as any,
            },
          ]}
          pointerEvents="none"
        />
      )}

      {/* Phase band with day numbers */}
      <PhaseBand
        segments={segments}
        week={week}
        todayKey={todayKey}
      />

      {/* Session cards grid */}
      <View style={styles.cardsGrid}>
        {week.map((d, di) => {
          const daySessions = sessions[d.key] || [];
          const hasSession = daySessions.length > 0;
          const s = daySessions[0];
          const isToday = d.key === todayKey;

          return (
            <View key={di} style={styles.cardCell}>
              {hasSession && s ? (
                <SessionCard
                  session={s}
                  isToday={isToday}
                  isOutside={d.outside}
                />
              ) : (
                <View style={styles.emptyCell} />
              )}
            </View>
          );
        })}
      </View>
    </View>
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

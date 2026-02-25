/**
 * PhaseBand - Continuous colored strips across the day-number row.
 * Segments span multiple columns with phase-specific styling.
 * Reference: cadence-calendar-final.jsx lines 512-604
 */

import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { TodayMarker } from "./TodayMarker";
import { blendWithBg } from "./helpers";
import type { CalendarDay, PhaseSegment } from "./types";

interface PhaseBandProps {
  segments: PhaseSegment[];
  week: CalendarDay[];
  todayKey: string;
}

/** Memoized segment band to avoid recreating style objects */
const BandSegment = React.memo(function BandSegment({
  segment,
  segments,
}: {
  segment: PhaseSegment;
  segments: PhaseSegment[];
}) {
  const s = segment;
  const leftPct = (s.start / 7) * 100;
  const widthPct = ((s.end - s.start + 1) / 7) * 100;
  const c = s.phase.color;
  const isLeftEdge = s.isPhaseStart || s.start === 0;
  const nextDayIdx = s.end + 1;
  const isRightEdge =
    nextDayIdx > 6 || !segments.find((seg) => seg.start === nextDayIdx);
  const spanCols = s.end - s.start + 1;

  const segStyle = useMemo(
    () => ({
      position: "absolute" as const,
      top: 1,
      bottom: 1,
      left: `${leftPct}%` as any,
      width: `${widthPct}%` as any,
      backgroundColor: blendWithBg(c, 0.35),
      borderTopLeftRadius: isLeftEdge ? 7 : 2,
      borderBottomLeftRadius: isLeftEdge ? 7 : 2,
      borderTopRightRadius: isRightEdge ? 7 : 2,
      borderBottomRightRadius: isRightEdge ? 7 : 2,
      borderTopWidth: 1,
      borderTopColor: blendWithBg(c, 0.25),
      borderBottomWidth: 1,
      borderBottomColor: blendWithBg(c, 0.25),
      borderLeftWidth: s.isPhaseStart ? 3 : isLeftEdge ? 2 : 1,
      borderLeftColor: s.isPhaseStart
        ? c
        : isLeftEdge
          ? c
          : blendWithBg(c, 0.15),
      borderRightWidth: 1,
      borderRightColor: isRightEdge
        ? blendWithBg(c, 0.25)
        : blendWithBg(c, 0.15),
      zIndex: 1,
    }),
    [c, leftPct, widthPct, isLeftEdge, isRightEdge, s.isPhaseStart]
  );

  const labelStyle = useMemo(
    () => ({
      position: "absolute" as const,
      top: 2,
      left: 6,
      fontSize: 7,
      fontWeight: "700" as const,
      fontFamily: "Outfit-Bold",
      letterSpacing: 0.4,
      color: c,
      textTransform: "uppercase" as const,
      lineHeight: 9,
      opacity: 0.85,
    }),
    [c]
  );

  return (
    <View style={segStyle}>
      {s.isPhaseStart && spanCols >= 2 && (
        <Text style={labelStyle} numberOfLines={1}>
          {s.phase.name}
        </Text>
      )}
    </View>
  );
});

export const PhaseBand = React.memo(function PhaseBand({
  segments,
  week,
  todayKey,
}: PhaseBandProps) {
  return (
    <View style={styles.container}>
      {/* Phase band segments (absolute positioned) */}
      {segments.map((s, si) => (
        <BandSegment key={si} segment={s} segments={segments} />
      ))}

      {/* Day numbers (z-index 2, above bands) */}
      {week.map((d, di) => {
        const isToday = d.key === todayKey;

        return (
          <View key={di} style={styles.dayCell}>
            {/* Today pulse halo */}
            {isToday && <TodayMarker size={30} />}

            {/* Day number circle */}
            <View
              style={[
                styles.dayCircle,
                isToday && styles.todayCircle,
              ]}
            >
              <Text
                style={[
                  styles.dayNumber,
                  isToday && styles.todayNumber,
                  d.outside && styles.outsideNumber,
                ]}
              >
                {d.day}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    height: 30,
    position: "relative",
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    zIndex: 2,
  },
  dayCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  todayCircle: {
    backgroundColor: LIGHT_THEME.wText,
    shadowColor: COLORS.lime,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  dayNumber: {
    fontSize: 10,
    fontWeight: "500",
    fontFamily: "Outfit-Medium",
    color: LIGHT_THEME.wText,
    fontVariant: ["tabular-nums"],
  },
  todayNumber: {
    fontWeight: "800",
    fontFamily: "Outfit-ExtraBold",
    color: COLORS.lime,
  },
  outsideNumber: {
    fontWeight: "400",
    fontFamily: "Outfit-Regular",
    color: "rgba(163,163,160,0.27)",
  },
});

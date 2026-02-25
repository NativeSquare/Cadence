/**
 * WeekView - Detailed vertical list of 7 days with session cards and week summary.
 * Reference: cadence-calendar-final.jsx lines 692-801
 */

import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { COLORS, LIGHT_THEME, ACTIVITY_COLORS } from "@/lib/design-tokens";
import { PHASES, SESSION_COLORS, SESSION_LABELS, MONTH_NAMES } from "./constants";
import { getWeekDates, buildPhaseLookup } from "./helpers";
import type { CalSession } from "./types";

interface WeekViewProps {
  selectedDate: string;
  sessions: Record<string, CalSession[]>;
  todayKey: string;
}

/** Small session type icon */
const SessionIcon = React.memo(function SessionIcon({
  type,
  size = 13,
  color,
}: {
  type: string;
  size?: number;
  color: string;
}) {
  if (type === "easy") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={8} stroke={color} strokeWidth={2} />
        <Path d="M12 8v4" stroke={color} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    );
  }
  if (type === "specific") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  if (type === "long") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M3 17l4-8 4 4 4-6 6 10"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  if (type === "race") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M6 4h12v6c0 3.3-2.7 6-6 6s-6-2.7-6-6V4z"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path d="M12 16v3" stroke={color} strokeWidth={2} strokeLinecap="round" />
        <Path d="M8 22h8" stroke={color} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    );
  }
  return null;
});

export const WeekView = React.memo(function WeekView({
  selectedDate,
  sessions,
  todayKey,
}: WeekViewProps) {
  const weekDates = useMemo(
    () => getWeekDates(selectedDate),
    [selectedDate]
  );

  const phaseLookup = useMemo(() => buildPhaseLookup(PHASES), []);

  const { totalKm, sessCount, doneCount } = useMemo(() => {
    let km = 0;
    let sess = 0;
    let done = 0;
    for (const d of weekDates) {
      const daySess = sessions[d.key] || [];
      sess += daySess.length;
      for (const s of daySess) {
        km += parseFloat(s.km) || 0;
        if (s.done) done++;
      }
    }
    return { totalKm: km, sessCount: sess, doneCount: done };
  }, [weekDates, sessions]);

  // Phase indicator
  const phase =
    phaseLookup.get(weekDates[0].key) ||
    phaseLookup.get(weekDates[6].key);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Phase indicator */}
      {phase && (
        <View style={styles.phaseIndicator}>
          <View
            style={[styles.phaseBar, { backgroundColor: phase.color }]}
          />
          <Text style={styles.phaseName}>{phase.name} Phase</Text>
          <Text style={styles.phaseRange}>
            · {MONTH_NAMES[weekDates[0].month].slice(0, 3)}{" "}
            {weekDates[0].day}–{weekDates[6].day}
          </Text>
        </View>
      )}

      {/* Day cards */}
      {weekDates.map((d, i) => {
        const daySess = sessions[d.key] || [];
        const isToday = d.key === todayKey;
        const isRest = daySess.length === 0;

        return (
          <View
            key={i}
            style={[
              styles.dayCard,
              isRest ? styles.restCard : styles.sessionCardOuter,
            ]}
          >
            {isRest ? (
              <View style={styles.restContent}>
                <View style={styles.dayInfo}>
                  <Text style={styles.dayLabel}>{d.dayName}</Text>
                  <Text style={styles.dayNum}>{d.day}</Text>
                  {isToday && (
                    <View style={styles.todayBadge}>
                      <Text style={styles.todayBadgeText}>TODAY</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.restLabel}>Rest</Text>
              </View>
            ) : (
              daySess.map((s, si) => {
                const color = SESSION_COLORS[s.type];
                return (
                  <View key={si} style={styles.sessionRow}>
                    {/* Color bar */}
                    <View
                      style={[
                        styles.colorBar,
                        {
                          backgroundColor: color,
                          opacity: s.done ? 1 : 0.5,
                        },
                      ]}
                    />
                    <View style={styles.sessionContent}>
                      {/* Header row */}
                      <View style={styles.sessionHeader}>
                        <View style={styles.dayInfo}>
                          <Text style={styles.dayLabel}>
                            {d.dayName} {d.day}
                          </Text>
                          {isToday && (
                            <View style={styles.todayBadge}>
                              <Text style={styles.todayBadgeText}>
                                TODAY
                              </Text>
                            </View>
                          )}
                        </View>
                        {s.done && (
                          <View style={styles.doneBadge}>
                            <Svg
                              width={9}
                              height={9}
                              viewBox="0 0 12 12"
                              fill="none"
                            >
                              <Path
                                d="M2.5 6L5 8.5L9.5 3.5"
                                stroke={COLORS.lime}
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </Svg>
                          </View>
                        )}
                      </View>

                      {/* Session type with icon */}
                      <View style={styles.sessionTypeRow}>
                        <View
                          style={[
                            styles.iconBox,
                            { backgroundColor: color + "18" },
                          ]}
                        >
                          <SessionIcon
                            type={s.type}
                            size={13}
                            color={color}
                          />
                        </View>
                        <Text style={styles.sessionLabel}>
                          {s.label}
                        </Text>
                      </View>

                      {/* Metrics */}
                      <View style={styles.metricsRow}>
                        <Text style={styles.kmText}>{s.km} km</Text>
                        <Text style={styles.durText}>{s.dur}</Text>
                        <View
                          style={[
                            styles.typeBadge,
                            { backgroundColor: color + "18" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.typeBadgeText,
                              { color },
                            ]}
                          >
                            {SESSION_LABELS[s.type]}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        );
      })}

      {/* Week summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Week</Text>
          <Text style={styles.summaryCount}>
            {doneCount}/{sessCount}
          </Text>
        </View>
        <View style={styles.summaryBody}>
          <View>
            <Text style={styles.summaryKm}>{Math.round(totalKm)}</Text>
            <Text style={styles.summaryUnit}> km</Text>
          </View>
          <View style={styles.summaryBars}>
            {weekDates.map((d, i) => {
              const daySess = sessions[d.key] || [];
              const hasSess = daySess.length > 0;
              const done = daySess.some((s) => s.done);
              const color = hasSess
                ? SESSION_COLORS[daySess[0].type]
                : "rgba(255,255,255,0.06)";
              return (
                <View
                  key={i}
                  style={[
                    styles.summaryBarItem,
                    {
                      backgroundColor: color,
                      opacity: hasSess ? (done ? 1 : 0.35) : 1,
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_THEME.w2,
  },
  content: {
    padding: 14,
    paddingBottom: 80,
  },
  // Phase indicator
  phaseIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 2,
    marginBottom: 8,
  },
  phaseBar: {
    width: 3,
    height: 14,
    borderRadius: 2,
  },
  phaseName: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Outfit-SemiBold",
    color: LIGHT_THEME.wSub,
  },
  phaseRange: {
    fontSize: 11,
    fontFamily: "Outfit-Regular",
    color: LIGHT_THEME.wMute,
  },
  // Day cards
  dayCard: {
    marginBottom: 6,
    borderRadius: 14,
    overflow: "hidden",
  },
  restCard: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: LIGHT_THEME.wBrd,
  },
  sessionCardOuter: {
    backgroundColor: LIGHT_THEME.w1,
    borderWidth: 1,
    borderColor: LIGHT_THEME.wBrd,
  },
  restContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    paddingHorizontal: 14,
  },
  restLabel: {
    fontSize: 11,
    fontFamily: "Outfit-Regular",
    color: LIGHT_THEME.wMute,
  },
  // Session row
  sessionRow: {
    flexDirection: "row",
    overflow: "hidden",
  },
  colorBar: {
    width: 4,
    flexShrink: 0,
  },
  sessionContent: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  dayInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: "500",
    fontFamily: "Outfit-Medium",
    color: LIGHT_THEME.wMute,
  },
  dayNum: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Outfit-SemiBold",
    color: LIGHT_THEME.wMute,
  },
  todayBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 5,
    backgroundColor: "rgba(200,255,0,0.12)",
  },
  todayBadgeText: {
    fontSize: 8,
    fontWeight: "700",
    fontFamily: "Outfit-Bold",
    color: ACTIVITY_COLORS.barHigh,
  },
  doneBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: LIGHT_THEME.wText,
    alignItems: "center",
    justifyContent: "center",
  },
  // Session type
  sessionTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionLabel: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Outfit-SemiBold",
    color: LIGHT_THEME.wText,
  },
  // Metrics
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 3,
  },
  kmText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Outfit-SemiBold",
    color: LIGHT_THEME.wText,
    fontVariant: ["tabular-nums"],
  },
  durText: {
    fontSize: 12,
    fontWeight: "300",
    fontFamily: "Outfit-Light",
    color: LIGHT_THEME.wSub,
    fontVariant: ["tabular-nums"],
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: "auto",
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: "600",
    fontFamily: "Outfit-SemiBold",
    textTransform: "uppercase",
  },
  // Week summary
  summaryCard: {
    padding: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: LIGHT_THEME.wText,
    marginTop: 8,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "Outfit-SemiBold",
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  summaryCount: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "Outfit-SemiBold",
    color: COLORS.lime,
  },
  summaryBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  summaryKm: {
    fontSize: 24,
    fontWeight: "800",
    fontFamily: "Outfit-ExtraBold",
    color: "rgba(255,255,255,0.92)",
    letterSpacing: -0.7,
    fontVariant: ["tabular-nums"],
  },
  summaryUnit: {
    fontSize: 11,
    fontWeight: "400",
    fontFamily: "Outfit-Regular",
    color: "rgba(255,255,255,0.45)",
  },
  summaryBars: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  summaryBarItem: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },
});

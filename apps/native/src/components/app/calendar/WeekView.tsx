/**
 * WeekView - Detailed vertical list with dark session cards, animated summary,
 * and staggered entrance animations.
 */

import React, { useEffect, useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, {
  Easing,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path, Circle } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { PHASES, SESSION_COLORS, SESSION_LABELS, MONTH_NAMES } from "./constants";
import { getWeekDates, buildPhaseLookup } from "./helpers";
import type { CalSession } from "./types";

interface WeekViewProps {
  selectedDate: string;
  sessions: Record<string, CalSession[]>;
  todayKey: string;
  onSessionPress?: (dateKey: string, session: CalSession) => void;
}

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
        <Path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  if (type === "long") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M3 17l4-8 4 4 4-6 6 10" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  if (type === "race") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M6 4h12v6c0 3.3-2.7 6-6 6s-6-2.7-6-6V4z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M12 16v3" stroke={color} strokeWidth={2} strokeLinecap="round" />
        <Path d="M8 22h8" stroke={color} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    );
  }
  return null;
});

function AnimatedSummaryBar({
  hasSess,
  done,
  color,
  index,
}: {
  hasSess: boolean;
  done: boolean;
  color: string;
  index: number;
}) {
  const scaleX = useSharedValue(0);

  useEffect(() => {
    scaleX.value = withDelay(600 + index * 60, withSpring(1, { damping: 14, stiffness: 120 }));
  }, [scaleX, index]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: scaleX.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.summaryBarItem,
        {
          backgroundColor: color,
          opacity: hasSess ? (done ? 1 : 0.35) : 1,
        },
        animStyle,
      ]}
    />
  );
}

function AnimatedKm({ value }: { value: number }) {
  const displayValue = useSharedValue(0);

  useEffect(() => {
    displayValue.value = withDelay(
      400,
      withTiming(value, { duration: 800, easing: Easing.out(Easing.cubic) })
    );
  }, [displayValue, value]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, displayValue.value / Math.max(1, value) + 0.3),
  }));

  return (
    <Animated.View style={animStyle}>
      <Text style={styles.summaryKm}>{Math.round(value)}</Text>
    </Animated.View>
  );
}

export const WeekView = React.memo(function WeekView({
  selectedDate,
  sessions,
  todayKey,
  onSessionPress,
}: WeekViewProps) {
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
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

  const phase = phaseLookup.get(weekDates[0].key) || phaseLookup.get(weekDates[6].key);

  return (
    <Animated.ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Phase indicator */}
      {phase && (
        <Animated.View entering={FadeInUp.delay(50).duration(300)} style={styles.phaseIndicator}>
          <View style={[styles.phaseBar, { backgroundColor: phase.color }]} />
          <Text style={styles.phaseName}>{phase.name} Phase</Text>
          <Text style={styles.phaseRange}>
            · {MONTH_NAMES[weekDates[0].month].slice(0, 3)} {weekDates[0].day}–{weekDates[6].day}
          </Text>
        </Animated.View>
      )}

      {/* Day cards */}
      {weekDates.map((d, i) => {
        const daySess = sessions[d.key] || [];
        const isToday = d.key === todayKey;
        const isRest = daySess.length === 0;

        return (
          <Animated.View
            key={i}
            entering={FadeInUp.delay(100 + i * 50).duration(350).easing(Easing.out(Easing.cubic))}
          >
            <Pressable
              onPress={
                !isRest && onSessionPress
                  ? () => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onSessionPress(d.key, daySess[0]);
                    }
                  : undefined
              }
              style={({ pressed }) => [pressed && !isRest && styles.cardPressed]}
            >
              <View style={[styles.dayCard, isRest ? styles.restCard : styles.sessionCardOuter]}>
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
                        <View style={[styles.colorBar, { backgroundColor: color, opacity: s.done ? 1 : 0.5 }]} />
                        <View style={styles.sessionContent}>
                          <View style={styles.sessionHeader}>
                            <View style={styles.dayInfo}>
                              <Text style={styles.dayLabelDark}>{d.dayName} {d.day}</Text>
                              {isToday && (
                                <View style={styles.todayBadgeDark}>
                                  <Text style={styles.todayBadgeTextDark}>TODAY</Text>
                                </View>
                              )}
                            </View>
                            {s.done && (
                              <View style={styles.doneBadge}>
                                <Svg width={9} height={9} viewBox="0 0 12 12" fill="none">
                                  <Path d="M2.5 6L5 8.5L9.5 3.5" stroke={COLORS.lime} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                </Svg>
                              </View>
                            )}
                          </View>

                          <View style={styles.sessionTypeRow}>
                            <View style={[styles.iconBox, { backgroundColor: color + "25" }]}>
                              <SessionIcon type={s.type} size={13} color={color} />
                            </View>
                            <Text style={styles.sessionLabel}>{s.label}</Text>
                          </View>

                          <View style={styles.metricsRow}>
                            <Text style={styles.kmText}>{s.km} km</Text>
                            <Text style={styles.durText}>{s.dur}</Text>
                            <View style={[styles.typeBadge, { backgroundColor: color + "20" }]}>
                              <Text style={[styles.typeBadgeText, { color }]}>{SESSION_LABELS[s.type]}</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </Pressable>
          </Animated.View>
        );
      })}

      {/* Week summary card */}
      <Animated.View entering={FadeInUp.delay(500).duration(400)}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Week</Text>
            <Text style={styles.summaryCount}>{doneCount}/{sessCount}</Text>
          </View>
          <View style={styles.summaryBody}>
            <View>
              <AnimatedKm value={totalKm} />
              <Text style={styles.summaryUnit}> km</Text>
            </View>
            <View style={styles.summaryBars}>
              {weekDates.map((d, i) => {
                const daySess = sessions[d.key] || [];
                const hasSess = daySess.length > 0;
                const done = daySess.some((s) => s.done);
                const color = hasSess ? SESSION_COLORS[daySess[0].type] : "rgba(255,255,255,0.06)";
                return (
                  <AnimatedSummaryBar
                    key={i}
                    hasSess={hasSess}
                    done={done}
                    color={color}
                    index={i}
                  />
                );
              })}
            </View>
          </View>
        </View>
      </Animated.View>
    </Animated.ScrollView>
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
  cardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  phaseIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 2,
    marginBottom: 8,
  },
  phaseBar: { width: 3, height: 14, borderRadius: 2 },
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
    backgroundColor: "#1A1A1A",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
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
  sessionRow: {
    flexDirection: "row",
    overflow: "hidden",
  },
  colorBar: { width: 4, flexShrink: 0 },
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
  dayLabelDark: {
    fontSize: 11,
    fontWeight: "500",
    fontFamily: "Outfit-Medium",
    color: "rgba(255,255,255,0.45)",
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
    color: "#A8D900",
  },
  todayBadgeDark: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 5,
    backgroundColor: "rgba(200,255,0,0.15)",
  },
  todayBadgeTextDark: {
    fontSize: 8,
    fontWeight: "700",
    fontFamily: "Outfit-Bold",
    color: COLORS.lime,
  },
  doneBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
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
    color: "rgba(255,255,255,0.92)",
  },
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
    color: "rgba(255,255,255,0.92)",
    fontVariant: ["tabular-nums"],
  },
  durText: {
    fontSize: 12,
    fontWeight: "300",
    fontFamily: "Outfit-Light",
    color: "rgba(255,255,255,0.45)",
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
  summaryCard: {
    padding: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: LIGHT_THEME.wText,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
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

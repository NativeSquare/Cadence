/**
 * CalendarScreen - Monthly calendar with two toggleable perspectives:
 *
 * 1. **Sessions** – rounded-square tiles with colored dots for each session type.
 * 2. **Blocks** – same tile grid but tiles are tinted by training phase color
 *    (Base / Build / Taper / Race / Recovery) with a phase legend.
 *
 * - Animated month navigation with haptic feedback
 * - Tap month name to return to today
 * - Tap a training day to view session details in a bottom sheet
 */

import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { api } from "@packages/backend/convex/_generated/api";

import {
  COLORS,
  GRAYS,
  LIGHT_THEME,
  SESSION_TYPE_COLORS,
} from "@/lib/design-tokens";
import {
  MONTH_NAMES,
  DAY_HEADERS,
  SESSION_LABELS,
  TODAY_KEY,
} from "./constants";
import {
  buildWeeks,
  buildPhaseLookup,
  blendWithBg,
  buildCalendarSessions,
  buildPhasesFromBlocks,
} from "./helpers";
import type { CalSession, CalSessionType } from "./types";

type ViewMode = "sessions" | "blocks";

const GRID_GAP = 6;
const GRID_PADDING = 10;

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toUtcRangeStart(d: Date): string {
  return `${toIsoDate(d)}T00:00:00.000Z`;
}

function toUtcRangeEnd(d: Date): string {
  return `${toIsoDate(d)}T23:59:59.999Z`;
}

function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  const indicatorX = useSharedValue(value === "sessions" ? 0 : 1);

  const handlePress = useCallback(
    (mode: ViewMode) => {
      if (mode === value) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      indicatorX.value = withTiming(mode === "sessions" ? 0 : 1, {
        duration: 180,
      });
      onChange(mode);
    },
    [value, onChange, indicatorX],
  );

  const indicatorStyle = useAnimatedStyle(() => ({
    left: `${indicatorX.value * 50}%` as unknown as number,
  }));

  return (
    <View style={toggleStyles.container}>
      <Animated.View style={[toggleStyles.indicator, indicatorStyle]} />
      <Pressable
        style={toggleStyles.option}
        onPress={() => handlePress("sessions")}
        hitSlop={4}
      >
        <Text
          style={[
            toggleStyles.label,
            value === "sessions" && toggleStyles.labelActive,
          ]}
        >
          Sessions
        </Text>
      </Pressable>
      <Pressable
        style={toggleStyles.option}
        onPress={() => handlePress("blocks")}
        hitSlop={4}
      >
        <Text
          style={[
            toggleStyles.label,
            value === "blocks" && toggleStyles.labelActive,
          ]}
        >
          Blocks
        </Text>
      </Pressable>
    </View>
  );
}

export function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const router = useRouter();
  const todayDate = useMemo(() => new Date(TODAY_KEY + "T00:00:00"), []);

  const tileSize = useMemo(
    () => Math.floor((screenWidth - GRID_PADDING * 2 - GRID_GAP * 6) / 7),
    [screenWidth],
  );

  const [currentMonth, setCurrentMonth] = useState(todayDate.getMonth());
  const [currentYear, setCurrentYear] = useState(todayDate.getFullYear());
  const [viewMode, setViewMode] = useState<ViewMode>("sessions");

  const contentFade = useSharedValue(1);
  const contentTranslateX = useSharedValue(0);

  const monthRange = useMemo(() => {
    const start = new Date(currentYear, currentMonth, 1);
    const end = new Date(currentYear, currentMonth + 1, 0);
    return {
      startDate: toUtcRangeStart(start),
      endDate: toUtcRangeEnd(end),
    };
  }, [currentYear, currentMonth]);

  const workouts = useQuery(api.agoge.workouts.listWorkouts, monthRange);
  const activePlan = useQuery(api.agoge.plans.getAthletePlan);
  const blocks = useQuery(
    api.agoge.blocks.listBlocks,
    activePlan ? { planId: activePlan._id } : "skip",
  );

  const calSessions = useMemo(
    () => (workouts ? buildCalendarSessions(workouts) : {}),
    [workouts],
  );

  const phases = useMemo(
    () => (blocks ? buildPhasesFromBlocks(blocks) : []),
    [blocks],
  );

  const weeks = useMemo(
    () => buildWeeks(currentYear, currentMonth),
    [currentYear, currentMonth],
  );

  const phaseLookup = useMemo(() => buildPhaseLookup(phases), [phases]);

  const visiblePhases = useMemo(() => {
    const monthStart = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const monthEnd = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
    return phases.filter((p) => p.end >= monthStart && p.start <= monthEnd);
  }, [currentYear, currentMonth, phases]);

  // ─── Month navigation ──────────────────────────────────────────────

  const updateMonth = useCallback((direction: "prev" | "next") => {
    if (direction === "next") {
      setCurrentMonth((m) => {
        if (m === 11) {
          setCurrentYear((y) => y + 1);
          return 0;
        }
        return m + 1;
      });
    } else {
      setCurrentMonth((m) => {
        if (m === 0) {
          setCurrentYear((y) => y - 1);
          return 11;
        }
        return m - 1;
      });
    }
  }, []);

  const animateMonthChange = useCallback(
    (direction: "prev" | "next") => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const exit = direction === "next" ? -1 : 1;
      contentFade.value = withTiming(0, { duration: 80 });
      contentTranslateX.value = withTiming(exit * 16, { duration: 80 }, () => {
        runOnJS(updateMonth)(direction);
        contentTranslateX.value = exit * -16;
        contentFade.value = withTiming(1, { duration: 150 });
        contentTranslateX.value = withTiming(0, { duration: 150 });
      });
    },
    [contentFade, contentTranslateX, updateMonth],
  );

  const handleReturnToToday = useCallback(() => {
    if (
      currentMonth !== todayDate.getMonth() ||
      currentYear !== todayDate.getFullYear()
    ) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      contentFade.value = withTiming(0, { duration: 100 }, () => {
        runOnJS(setCurrentMonth)(todayDate.getMonth());
        runOnJS(setCurrentYear)(todayDate.getFullYear());
        contentFade.value = withTiming(1, { duration: 250 });
      });
    }
  }, [currentMonth, currentYear, contentFade, todayDate]);

  const contentAnimStyle = useAnimatedStyle(() => ({
    opacity: contentFade.value,
    transform: [{ translateX: contentTranslateX.value }],
  }));

  // ─── Day / session press ─────────────────────────────────────────

  const handleDayPress = useCallback((dateKey: string) => {
    const sessions = calSessions[dateKey];
    if (sessions && sessions.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push({ pathname: "/(app)/session/[id]", params: { id: sessions[0].sessionId } });
    }
  }, [calSessions, router]);

  // ─── Render ───────────────────────────────────────────────────────

  const isCurrentMonth =
    currentMonth === todayDate.getMonth() &&
    currentYear === todayDate.getFullYear();

  if (workouts === undefined) {
    return (
      <View style={[st.root, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={GRAYS.g3} />
      </View>
    );
  }

  return (
    <View style={st.root}>
      {/* Dark header */}
      <View style={[st.header, { paddingTop: insets.top + 12 }]}>
        <View style={st.nav}>
          <Pressable
            onPress={() => animateMonthChange("prev")}
            hitSlop={16}
            style={st.navBtn}
          >
            <ChevronLeft size={20} color={GRAYS.g2} strokeWidth={2} />
          </Pressable>
          <Pressable onPress={handleReturnToToday} hitSlop={8}>
            <View style={st.monthRow}>
              <Text style={st.monthText}>{MONTH_NAMES[currentMonth]}</Text>
              <Text style={st.yearText}>{currentYear}</Text>
              {!isCurrentMonth && <View style={st.returnDot} />}
            </View>
          </Pressable>
          <Pressable
            onPress={() => animateMonthChange("next")}
            hitSlop={16}
            style={st.navBtn}
          >
            <ChevronRight size={20} color={GRAYS.g2} strokeWidth={2} />
          </Pressable>
        </View>

        <View style={st.toggleRow}>
          <ViewToggle value={viewMode} onChange={setViewMode} />
        </View>
      </View>

      {/* Rounded transition from dark header to light content */}
      <View style={st.cornerTransition} />

      {/* Calendar body */}
      <ScrollView
        style={st.body}
        contentContainerStyle={st.bodyContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View style={contentAnimStyle}>
          {/* Day-of-week headers */}
          <View style={st.dayHeaders}>
            {DAY_HEADERS.map((label) => (
              <View key={label} style={st.dayHeaderCell}>
                <Text style={st.dayHeaderText}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Week rows — tile grid */}
          {weeks.map((week, wi) => (
            <View key={`w-${wi}`} style={st.weekRow}>
              {week.map((day) => {
                const sessions = calSessions[day.key];
                const hasSession = sessions && sessions.length > 0;
                const isToday = day.key === TODAY_KEY;
                const phase = phaseLookup.get(day.key);
                const isBlocks = viewMode === "blocks";

                const tileStyle = {
                  width: tileSize,
                  height: tileSize,
                };

                if (day.outside) {
                  return (
                    <View key={day.key} style={st.cellWrapper}>
                      <View style={[st.tile, tileStyle]}>
                        <Text style={[st.dayNum, st.dayNumOutside]}>
                          {day.day}
                        </Text>
                      </View>
                    </View>
                  );
                }

                const blockTileBg =
                  isBlocks && phase
                    ? {
                        backgroundColor: blendWithBg(phase.color, 0.18),
                        borderWidth: 1,
                        borderColor: blendWithBg(phase.color, 0.25),
                      }
                    : undefined;

                return (
                  <View key={day.key} style={st.cellWrapper}>
                    <Pressable onPress={() => handleDayPress(day.key)}>
                      <View
                        style={[
                          st.tile,
                          tileStyle,
                          isBlocks
                            ? blockTileBg ?? st.tileEmpty
                            : hasSession
                              ? st.tileWithSession
                              : st.tileEmpty,
                          isToday && st.tileToday,
                        ]}
                      >
                        <Text
                          style={[
                            st.dayNum,
                            isToday && st.dayNumToday,
                            !isToday &&
                              ((isBlocks && phase) ||
                                (!isBlocks && hasSession)) &&
                              st.dayNumActive,
                          ]}
                        >
                          {day.day}
                        </Text>

                        {isBlocks ? (
                          phase && day.key === phase.start ? (
                            <View style={st.dotsRow}>
                              <View
                                style={[
                                  st.sessionDot,
                                  { backgroundColor: phase.color },
                                ]}
                              />
                            </View>
                          ) : (
                            <View style={st.dotsSpacer} />
                          )
                        ) : hasSession ? (
                          <View style={st.dotsRow}>
                            {sessions!.map((s, si) => (
                              <View
                                key={si}
                                style={[
                                  st.sessionDot,
                                  {
                                    backgroundColor:
                                      SESSION_TYPE_COLORS[s.type],
                                  },
                                  s.done && st.sessionDotDone,
                                ]}
                              />
                            ))}
                          </View>
                        ) : (
                          <View style={st.dotsSpacer} />
                        )}
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ))}

          {/* Legend — swaps between session types and training blocks */}
          <View style={st.legend}>
            <View style={st.legendCard}>
              {viewMode === "sessions"
                ? (
                    Object.entries(SESSION_LABELS) as [
                      CalSessionType,
                      string,
                    ][]
                  ).map(([type, label]) => (
                    <View key={type} style={st.legendItem}>
                      <View
                        style={[
                          st.legendDot,
                          { backgroundColor: SESSION_TYPE_COLORS[type] },
                        ]}
                      />
                      <Text style={st.legendLabel}>{label}</Text>
                    </View>
                  ))
                : visiblePhases.map((p) => (
                    <View key={p.key} style={st.legendItem}>
                      <View
                        style={[
                          st.legendDot,
                          { backgroundColor: p.color },
                        ]}
                      />
                      <Text style={st.legendLabel}>{p.name}</Text>
                    </View>
                  ))}
            </View>
          </View>
        </Animated.View>
      </ScrollView>

    </View>
  );
}

const st = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.black,
  },

  header: {
    backgroundColor: COLORS.black,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navBtn: {
    padding: 8,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    position: "relative",
  },
  monthText: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Outfit-Bold",
    color: GRAYS.g1,
  },
  yearText: {
    fontSize: 20,
    fontWeight: "300",
    fontFamily: "Outfit-Light",
    color: GRAYS.g3,
  },
  returnDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.lime,
    position: "absolute",
    top: -2,
    right: -10,
  },
  toggleRow: {
    alignItems: "center",
    marginTop: 14,
  },

  cornerTransition: {
    height: 24,
    backgroundColor: LIGHT_THEME.w2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  body: {
    flex: 1,
    backgroundColor: LIGHT_THEME.w2,
  },
  bodyContent: {
    paddingHorizontal: GRID_PADDING,
    paddingBottom: 32,
  },

  dayHeaders: {
    flexDirection: "row",
    marginBottom: 6,
    gap: GRID_GAP,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: "center",
  },
  dayHeaderText: {
    fontSize: 12,
    fontFamily: "Outfit-Medium",
    fontWeight: "500",
    color: LIGHT_THEME.wMute,
  },

  weekRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },

  // ─── Tile styles ────────────────────────────────────────────────────

  cellWrapper: {
    alignItems: "center",
  },
  tile: {
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  tileEmpty: {
    backgroundColor: "#EAEAE8",
  },
  tileWithSession: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tileToday: {
    backgroundColor: LIGHT_THEME.w1,
    borderWidth: 2,
    borderColor: LIGHT_THEME.wText,
  },

  // ─── Day number ─────────────────────────────────────────────────────

  dayNum: {
    fontSize: 16,
    fontFamily: "Outfit-Regular",
    fontWeight: "400",
    color: LIGHT_THEME.wMute,
  },
  dayNumOutside: {
    opacity: 0.2,
  },
  dayNumToday: {
    fontFamily: "Outfit-Bold",
    fontWeight: "700",
    color: LIGHT_THEME.wText,
  },
  dayNumActive: {
    fontFamily: "Outfit-SemiBold",
    fontWeight: "600",
    color: LIGHT_THEME.wText,
  },

  // ─── Session dots inside tile ───────────────────────────────────────

  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
  },
  sessionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sessionDotDone: {
    opacity: 0.45,
  },
  dotsSpacer: {
    height: 10,
  },

  // ─── Legend ─────────────────────────────────────────────────────────

  legend: {
    marginTop: 18,
  },
  legendCard: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: LIGHT_THEME.w1,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: LIGHT_THEME.wBrd,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "50%" as unknown as number,
    paddingVertical: 8,
    gap: 10,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendPill: {
    width: 18,
    height: 10,
    borderRadius: 5,
    borderLeftWidth: 2.5,
  },
  legendLabel: {
    fontSize: 13,
    fontFamily: "Outfit-Regular",
    fontWeight: "400",
    color: LIGHT_THEME.wSub,
  },
});

const toggleStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: 2,
    width: 200,
    position: "relative",
  },
  indicator: {
    position: "absolute",
    top: 2,
    bottom: 2,
    width: "50%",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 8,
  },
  option: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    zIndex: 1,
  },
  label: {
    fontSize: 13,
    fontFamily: "Outfit-Medium",
    fontWeight: "500",
    color: GRAYS.g3,
  },
  labelActive: {
    fontFamily: "Outfit-SemiBold",
    fontWeight: "600",
    color: GRAYS.g1,
  },
});

/**
 * CalendarScreen - Vertically scrollable monthly calendar.
 *
 * - Months stack vertically (Apple-Calendar-style); auto-scrolls to today on mount.
 * - Tap a day to select it — the bottom panel lists that day's workouts.
 * - Workout cards in the panel link to the workout detail page.
 * - Layers toggle in the header tints tiles by training-block phase.
 */

import React, { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  type LayoutChangeEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Layers } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { api } from "@packages/backend/convex/_generated/api";

import { COLORS, GRAYS, LIGHT_THEME } from "@/lib/design-tokens";
import { WORKOUT_CATEGORY_COLORS } from "@packages/shared";
import {
  formatDayLabelShort,
  formatLongDate,
  formatMonthName,
} from "@/lib/format";
import { useLanguage } from "@/lib/i18n";
import { TODAY_KEY } from "./constants";
import {
  buildWeeks,
  buildPhaseLookup,
  blendWithBg,
  buildCalendarWorkouts,
  buildPhasesFromBlocks,
} from "./helpers";
import { AddWorkoutButton } from "@/components/app/workout/add-workout-button";
import { WorkoutCard } from "@/components/app/workout/workout-card";
import type { CalWorkout, Phase } from "./types";

type ViewMode = "workouts" | "blocks";

const GRID_GAP = 6;
const GRID_PADDING = 10;
const MONTHS_BEFORE = 6;
const MONTHS_AFTER = 12;

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

function buildMonthsList(centerDate: Date): Array<{ year: number; month: number }> {
  const list: Array<{ year: number; month: number }> = [];
  for (let i = -MONTHS_BEFORE; i <= MONTHS_AFTER; i++) {
    const d = new Date(centerDate.getFullYear(), centerDate.getMonth() + i, 1);
    list.push({ year: d.getFullYear(), month: d.getMonth() });
  }
  return list;
}

export function CalendarScreen() {
  const { t } = useTranslation();
  const locale = useLanguage();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const router = useRouter();
  const todayDate = useMemo(() => new Date(TODAY_KEY + "T00:00:00"), []);

  const dayHeaderLabels = useMemo(() => {
    // Mondays-Sundays of any week — use ISO week starting on Monday.
    const ref = new Date(2024, 0, 1); // 2024-01-01 was a Monday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(ref);
      d.setDate(ref.getDate() + i);
      return formatDayLabelShort(locale, d);
    });
  }, [locale]);

  const tileSize = useMemo(
    () => Math.floor((screenWidth - GRID_PADDING * 2 - GRID_GAP * 6) / 7),
    [screenWidth],
  );

  const monthsList = useMemo(() => buildMonthsList(todayDate), [todayDate]);
  const monthRange = useMemo(() => {
    const first = monthsList[0];
    const last = monthsList[monthsList.length - 1];
    return {
      startDate: toUtcRangeStart(new Date(first.year, first.month, 1)),
      endDate: toUtcRangeEnd(new Date(last.year, last.month + 1, 0)),
    };
  }, [monthsList]);

  const [viewMode, setViewMode] = useState<ViewMode>("workouts");
  const [selectedDate, setSelectedDate] = useState<string>(TODAY_KEY);

  const workouts = useQuery(api.agoge.workouts.listWorkouts, monthRange);
  const activePlan = useQuery(api.agoge.plans.getAthletePlan);
  const blocks = useQuery(
    api.agoge.blocks.listBlocks,
    activePlan ? { planId: activePlan._id } : "skip",
  );

  const calWorkouts = useMemo(
    () => (workouts ? buildCalendarWorkouts(workouts) : {}),
    [workouts],
  );

  const workoutsByDate = useMemo(() => {
    const map: Record<string, typeof workouts> = {};
    if (!workouts) return map;
    for (const w of workouts) {
      const dateIso = w.planned?.date ?? w.actual?.date;
      if (!dateIso) continue;
      const key = dateIso.slice(0, 10);
      (map[key] ??= []).push(w);
    }
    return map;
  }, [workouts]);

  const phases = useMemo(
    () => (blocks ? buildPhasesFromBlocks(blocks) : []),
    [blocks],
  );

  const phaseLookup = useMemo(() => buildPhaseLookup(phases), [phases]);

  // ─── Auto-scroll to today on mount ────────────────────────────────

  const scrollRef = useRef<ScrollView>(null);
  const didInitialScroll = useRef(false);
  const todayMonthIndex = MONTHS_BEFORE;

  const handleMonthLayout = useCallback(
    (idx: number) => (e: LayoutChangeEvent) => {
      if (idx === todayMonthIndex && !didInitialScroll.current) {
        didInitialScroll.current = true;
        const y = e.nativeEvent.layout.y;
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({ y, animated: false });
        });
      }
    },
    [todayMonthIndex],
  );

  // ─── Interaction handlers ─────────────────────────────────────────

  const handleDayPress = useCallback((dateKey: string) => {
    Haptics.selectionAsync();
    setSelectedDate(dateKey);
  }, []);

  const handleWorkoutPress = useCallback(
    (workoutId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/(app)/workouts/${workoutId}`);
    },
    [router],
  );

  const handleToggleBlocks = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewMode((m) => (m === "workouts" ? "blocks" : "workouts"));
  }, []);

  const handleAddWorkout = useCallback(() => {
    Haptics.selectionAsync();
    router.push({
      pathname: "/(app)/workouts/schedule",
      params: { date: selectedDate },
    });
  }, [router, selectedDate]);

  // ─── Render ───────────────────────────────────────────────────────

  const isBlocksMode = viewMode === "blocks";

  if (workouts === undefined) {
    return (
      <View style={[st.root, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={GRAYS.g3} />
      </View>
    );
  }

  const selectedDateObj = new Date(selectedDate + "T00:00:00");
  const selectedWorkouts = workoutsByDate[selectedDate] ?? [];

  return (
    <View style={st.root}>
      {/* Dark header — title + subtitle + blocks toggle */}
      <View style={[st.header, { paddingTop: insets.top + 8 }]}>
        <View style={st.headerRow}>
          <View style={st.headerText}>
            <Text style={st.titleText}>{t("calendar.title")}</Text>
            <Text style={st.subtitleText}>{t("calendar.subtitle")}</Text>
          </View>
          <Pressable
            onPress={handleToggleBlocks}
            accessibilityRole="switch"
            accessibilityState={{ checked: isBlocksMode }}
            accessibilityLabel={t(
              isBlocksMode
                ? "calendar.toggleBlocks.hide"
                : "calendar.toggleBlocks.show",
            )}
            hitSlop={6}
            style={({ pressed }) => [
              st.blocksToggle,
              isBlocksMode && st.blocksToggleActive,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Layers
              size={16}
              color={isBlocksMode ? COLORS.lime : GRAYS.g3}
              strokeWidth={1.75}
            />
          </Pressable>
        </View>
      </View>

      {/* Rounded transition from dark header to light content */}
      <View style={st.cornerTransition} />

      {/* Light area: day-of-week headers + scrollable month list + bottom panel */}
      <View style={st.light}>
        <View style={st.dayHeaders}>
          {dayHeaderLabels.map((label, i) => (
            <View key={i} style={st.dayHeaderCell}>
              <Text style={st.dayHeaderText}>{label}</Text>
            </View>
          ))}
        </View>

        <ScrollView
          ref={scrollRef}
          style={st.calendarScroll}
          contentContainerStyle={st.calendarContent}
          showsVerticalScrollIndicator={false}
        >
          {monthsList.map((m, idx) => (
            <View
              key={`${m.year}-${m.month}`}
              onLayout={handleMonthLayout(idx)}
              style={st.monthSection}
            >
              <Text style={st.monthSectionTitle}>
                {formatMonthName(locale, m.month, m.year)}{" "}
                <Text style={st.monthSectionYear}>{m.year}</Text>
              </Text>
              <MonthGrid
                year={m.year}
                month={m.month}
                tileSize={tileSize}
                calWorkouts={calWorkouts}
                phaseLookup={phaseLookup}
                isBlocksMode={isBlocksMode}
                selectedDate={selectedDate}
                onDayPress={handleDayPress}
              />
            </View>
          ))}
        </ScrollView>

        <View style={st.panel}>
          <View style={st.panelHeader}>
            <Text style={st.panelTitle}>
              {formatLongDate(locale, selectedDateObj)}
            </Text>
            {selectedWorkouts.length > 0 && (
              <View style={st.panelBadge}>
                <Text style={st.panelBadgeText}>{selectedWorkouts.length}</Text>
              </View>
            )}
          </View>

          <ScrollView
            style={st.panelList}
            contentContainerStyle={st.panelListContent}
            showsVerticalScrollIndicator={false}
          >
            {selectedWorkouts.length === 0 ? (
              <Text style={st.emptyPanelText}>
                {t("calendar.selectedDay.empty")}
              </Text>
            ) : (
              selectedWorkouts.map((w) => (
                <WorkoutCard
                  key={w._id}
                  workout={w}
                  onPress={() => handleWorkoutPress(w._id)}
                />
              ))
            )}
            <AddWorkoutButton
              label={t("account.trainingPlan.addWorkout")}
              onPress={handleAddWorkout}
            />
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

// ─── MonthGrid ───────────────────────────────────────────────────────

interface MonthGridProps {
  year: number;
  month: number;
  tileSize: number;
  calWorkouts: Record<string, CalWorkout[]>;
  phaseLookup: Map<string, Phase>;
  isBlocksMode: boolean;
  selectedDate: string;
  onDayPress: (dateKey: string) => void;
}

const MonthGrid = React.memo(function MonthGrid({
  year,
  month,
  tileSize,
  calWorkouts,
  phaseLookup,
  isBlocksMode,
  selectedDate,
  onDayPress,
}: MonthGridProps) {
  const weeks = useMemo(() => buildWeeks(year, month), [year, month]);

  return (
    <View>
      {weeks.map((week, wi) => (
        <View key={`w-${wi}`} style={st.weekRow}>
          {week.map((day) => {
            const dayWorkouts = calWorkouts[day.key];
            const hasWorkout = dayWorkouts && dayWorkouts.length > 0;
            const isToday = day.key === TODAY_KEY;
            const isSelected = day.key === selectedDate;
            const phase = phaseLookup.get(day.key);
            const tileStyle = { width: tileSize, height: tileSize };

            // Days outside the current month section render dimmed + non-pressable
            // so the user only ever taps the canonical month they belong to.
            if (day.outside) {
              return (
                <View key={day.key} style={st.cellWrapper}>
                  <View style={[st.tile, tileStyle]}>
                    <Text style={[st.dayNum, st.dayNumOutside]}>{day.day}</Text>
                  </View>
                </View>
              );
            }

            const blockTileBg =
              isBlocksMode && phase
                ? {
                    backgroundColor: blendWithBg(phase.color, 0.18),
                    borderWidth: 1,
                    borderColor: blendWithBg(phase.color, 0.25),
                  }
                : undefined;

            const baseTileBg = isBlocksMode && phase ? blockTileBg : st.tileWhite;
            // Gray today-marker only applies when no phase tint is active,
            // so block coloring still wins in blocks mode.
            const isTodayMarker = isToday && !isSelected && !(isBlocksMode && phase);

            return (
              <View key={day.key} style={st.cellWrapper}>
                <Pressable onPress={() => onDayPress(day.key)}>
                  <View
                    style={[
                      st.tile,
                      tileStyle,
                      baseTileBg,
                      isTodayMarker && st.tileToday,
                      isSelected && st.tileSelected,
                    ]}
                  >
                    <Text
                      style={[
                        st.dayNum,
                        isSelected && st.dayNumSelected,
                        !isSelected && isToday && st.dayNumToday,
                        !isSelected &&
                          !isToday &&
                          ((isBlocksMode && phase) ||
                            (!isBlocksMode && hasWorkout)) &&
                          st.dayNumActive,
                      ]}
                    >
                      {day.day}
                    </Text>

                    {isBlocksMode ? (
                      phase && day.key === phase.start ? (
                        <View style={st.dotsRow}>
                          <View
                            style={[
                              st.workoutDot,
                              { backgroundColor: phase.color },
                            ]}
                          />
                        </View>
                      ) : (
                        <View style={st.dotsSpacer} />
                      )
                    ) : hasWorkout ? (
                      <View style={st.dotsRow}>
                        {dayWorkouts!.map((w, di) => (
                          <View
                            key={di}
                            style={[
                              st.workoutDot,
                              {
                                backgroundColor:
                                  WORKOUT_CATEGORY_COLORS[w.type],
                              },
                              w.done && st.workoutDotDone,
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
    </View>
  );
});

// ─── Styles ──────────────────────────────────────────────────────────

const st = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.black,
  },

  // Dark header
  header: {
    backgroundColor: COLORS.black,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerText: {
    flex: 1,
  },
  titleText: {
    fontSize: 24,
    fontFamily: "Outfit-Bold",
    fontWeight: "700",
    color: GRAYS.g1,
    letterSpacing: -0.03 * 24,
  },
  subtitleText: {
    fontSize: 13,
    fontFamily: "Outfit-Regular",
    fontWeight: "400",
    color: GRAYS.g3,
    marginTop: 4,
  },
  blocksToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  blocksToggleActive: {
    backgroundColor: "rgba(168,217,0,0.15)",
    borderColor: "rgba(168,217,0,0.4)",
  },

  cornerTransition: {
    height: 24,
    backgroundColor: LIGHT_THEME.w2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  // Light area
  light: {
    flex: 1,
    backgroundColor: LIGHT_THEME.w2,
  },

  dayHeaders: {
    flexDirection: "row",
    paddingHorizontal: GRID_PADDING,
    paddingBottom: 8,
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

  // Calendar scroll (months stacked)
  calendarScroll: {
    flex: 1,
  },
  calendarContent: {
    paddingHorizontal: GRID_PADDING,
    paddingBottom: 16,
  },
  monthSection: {
    marginBottom: 18,
  },
  monthSectionTitle: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    fontWeight: "700",
    color: LIGHT_THEME.wText,
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: -0.02 * 18,
  },
  monthSectionYear: {
    fontFamily: "Outfit-Light",
    fontWeight: "300",
    color: LIGHT_THEME.wMute,
  },

  weekRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },

  // Tile
  cellWrapper: {
    alignItems: "center",
  },
  tile: {
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  tileWhite: {
    backgroundColor: LIGHT_THEME.w1,
    borderWidth: 1,
    borderColor: LIGHT_THEME.wBrd,
  },
  tileToday: {
    backgroundColor: LIGHT_THEME.w3,
    borderWidth: 1,
    borderColor: LIGHT_THEME.wBrd,
  },
  tileSelected: {
    borderWidth: 2,
    borderColor: LIGHT_THEME.wText,
  },

  // Day number
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
  dayNumSelected: {
    fontFamily: "Outfit-Bold",
    fontWeight: "700",
    color: LIGHT_THEME.wText,
  },
  dayNumActive: {
    fontFamily: "Outfit-SemiBold",
    fontWeight: "600",
    color: LIGHT_THEME.wText,
  },

  // Workout dots inside tile
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
  },
  workoutDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  workoutDotDone: {
    opacity: 0.45,
  },
  dotsSpacer: {
    height: 10,
  },

  // Bottom panel
  panel: {
    minHeight: 220,
    maxHeight: 280,
    backgroundColor: LIGHT_THEME.w2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: LIGHT_THEME.wBrd,
    paddingTop: 14,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  panelTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Outfit-SemiBold",
    fontWeight: "600",
    color: LIGHT_THEME.wText,
    textTransform: "capitalize",
  },
  panelBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 7,
    backgroundColor: LIGHT_THEME.w3,
    alignItems: "center",
    justifyContent: "center",
  },
  panelBadgeText: {
    fontSize: 12,
    fontFamily: "Outfit-SemiBold",
    fontWeight: "600",
    color: LIGHT_THEME.wSub,
    fontVariant: ["tabular-nums"],
  },
  panelList: {
    flex: 1,
  },
  panelListContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  emptyPanelText: {
    fontSize: 14,
    fontFamily: "Outfit-Regular",
    fontWeight: "400",
    color: LIGHT_THEME.wMute,
    textAlign: "center",
    paddingVertical: 16,
  },
});

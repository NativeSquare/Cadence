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
import {
  formatDayLabelShort,
  formatLongDate,
  formatMonthName,
} from "@/lib/format";
import { useLanguage } from "@/lib/i18n";
import { buildBlockLookup, dateKey } from "./helpers";
import { MonthGrid, GRID_GAP } from "./MonthGrid";
import { AddWorkoutButton } from "@/components/app/workout/add-workout-button";
import { WorkoutCard } from "@/components/app/workout/workout-card";
import type { WorkoutDoc } from "@nativesquare/agoge/schema";

type ViewMode = "workouts" | "blocks";

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

function buildMonthsList(
  centerDate: Date,
): Array<{ year: number; month: number }> {
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
  // Frozen at mount: anchors the months list and the initial selected day.
  // Avoids reflowing the calendar when the day rolls over while the app is open.
  const mountTodayKey = useMemo(() => dateKey(new Date()), []);
  const mountTodayDate = useMemo(
    () => new Date(mountTodayKey + "T00:00:00"),
    [mountTodayKey],
  );
  // Recomputed every render so the today highlight follows the wall clock.
  const todayKey = dateKey(new Date());

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

  const monthsList = useMemo(
    () => buildMonthsList(mountTodayDate),
    [mountTodayDate],
  );
  const monthRange = useMemo(() => {
    const first = monthsList[0];
    const last = monthsList[monthsList.length - 1];
    return {
      startDate: toUtcRangeStart(new Date(first.year, first.month, 1)),
      endDate: toUtcRangeEnd(new Date(last.year, last.month + 1, 0)),
    };
  }, [monthsList]);

  const [viewMode, setViewMode] = useState<ViewMode>("workouts");
  const [selectedDate, setSelectedDate] = useState<string>(mountTodayKey);

  const workouts = useQuery(api.agoge.workouts.listWorkouts, monthRange);
  const activePlan = useQuery(api.agoge.plans.getAthletePlan);
  const blocks = useQuery(
    api.agoge.blocks.listBlocks,
    activePlan ? { planId: activePlan._id } : "skip",
  );

  const workoutsByDate = useMemo(() => {
    const map: Record<string, WorkoutDoc[]> = {};
    if (!workouts) return map;
    for (const w of workouts) {
      const dateIso = w.planned?.date ?? w.actual?.date;
      if (!dateIso) continue;
      const key = dateIso.slice(0, 10);
      (map[key] ??= []).push(w);
    }
    return map;
  }, [workouts]);

  const blockLookup = useMemo(() => buildBlockLookup(blocks ?? []), [blocks]);

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
      <View
        style={[st.root, { alignItems: "center", justifyContent: "center" }]}
      >
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
                workoutsByDate={workoutsByDate}
                blockLookup={blockLookup}
                todayKey={todayKey}
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

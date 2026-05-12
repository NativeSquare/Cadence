import React, { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  Pressable,
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

import { cn } from "@/lib/utils";
import { COLORS, GRAYS } from "@/lib/design-tokens";
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
    activePlan ? { planId: activePlan.plan._id } : "skip",
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
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color={GRAYS.g3} />
      </View>
    );
  }

  const selectedDateObj = new Date(selectedDate + "T00:00:00");
  const selectedWorkouts = workoutsByDate[selectedDate] ?? [];

  return (
    <View className="flex-1 bg-black">
      {/* Dark header — title + subtitle + blocks toggle */}
      <View
        className="bg-black px-6 pb-4"
        style={{ paddingTop: insets.top + 8 }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text
              className="text-2xl font-coach-bold text-g1"
              style={{ letterSpacing: -0.03 * 24 }}
            >
              {t("calendar.title")}
            </Text>
            <Text className="text-[13px] font-coach text-g3 mt-1">
              {t("calendar.subtitle")}
            </Text>
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
            className={cn(
              "h-9 px-3 flex-row items-center justify-center gap-1.5 rounded-full border bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] active:opacity-70",
              isBlocksMode &&
                "bg-[rgba(168,217,0,0.15)] border-[rgba(168,217,0,0.4)]",
            )}
          >
            <Layers
              size={14}
              color={isBlocksMode ? COLORS.lime : GRAYS.g3}
              strokeWidth={1.75}
            />
            <Text
              className={cn(
                "text-[13px] font-coach-medium text-g3",
                isBlocksMode && "text-lime",
              )}
            >
              {t("calendar.toggleBlocks.label")}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Rounded transition from dark header to light content */}
      <View className="h-6 bg-w2 rounded-t-3xl" />

      {/* Light area: day-of-week headers + scrollable month list + bottom panel */}
      <View className="flex-1 bg-w2">
        <View
          className="flex-row pb-2"
          style={{ paddingHorizontal: GRID_PADDING, gap: GRID_GAP }}
        >
          {dayHeaderLabels.map((label, i) => (
            <View key={i} className="flex-1 items-center">
              <Text className="text-xs font-coach-medium text-wMute">
                {label}
              </Text>
            </View>
          ))}
        </View>

        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: GRID_PADDING,
            paddingBottom: 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          {monthsList.map((m, idx) => (
            <View
              key={`${m.year}-${m.month}`}
              onLayout={handleMonthLayout(idx)}
              className="mb-[18px]"
            >
              <Text
                className="text-lg font-coach-bold text-wText mb-2 ml-1"
                style={{ letterSpacing: -0.02 * 18 }}
              >
                {formatMonthName(locale, m.month, m.year)}{" "}
                <Text className="font-coach-light text-wMute">{m.year}</Text>
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

        <View className="min-h-[220px] max-h-[280px] bg-w2 border-t-hairline border-wBrd pt-3.5">
          <View className="flex-row items-center px-5 pb-3 gap-2">
            <Text className="flex-1 text-base font-coach-semibold text-wText capitalize">
              {formatLongDate(locale, selectedDateObj)}
            </Text>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerClassName="px-4 pb-4 gap-2.5"
            showsVerticalScrollIndicator={false}
          >
            {selectedWorkouts.length === 0 ? (
              <Text className="text-sm font-coach text-wMute text-center py-4">
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

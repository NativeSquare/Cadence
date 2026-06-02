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
import { Info } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";
import { api } from "@packages/backend/convex/_generated/api";

import { GRAYS } from "@/lib/design-tokens";
import { formatDayLabelShort, formatMonthName } from "@/lib/format";
import { useLanguage } from "@/lib/i18n";
import { buildBlockLookup, dateKey } from "./helpers";
import { MonthGrid, GRID_GAP } from "./MonthGrid";
import { CalendarLegendSheet } from "./CalendarLegendSheet";
import { CalendarDaySheet } from "./CalendarDaySheet";
import { RescheduleSheet } from "@/components/app/workout/reschedule-sheet";
import { SwapSheet } from "@/components/app/workout/swap-sheet";
import type { WorkoutDoc } from "@nativesquare/agoge/schema";

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

  const [selectedDate, setSelectedDate] = useState<string>(mountTodayKey);

  const workouts = useQuery(api.agoge.workouts.listWorkouts, monthRange);
  const activePlan = useQuery(api.agoge.plans.getAthletePlan);
  const blocks = useQuery(
    api.agoge.blocks.listBlocks,
    activePlan ? { planId: activePlan.plan._id } : "skip",
  );

  const activePlanId = activePlan?.plan._id ?? null;

  const workoutsByDate = useMemo(() => {
    const map: Record<string, WorkoutDoc[]> = {};
    if (!workouts || !activePlanId) return map;
    for (const w of workouts) {
      if (w.planId !== activePlanId) continue;
      const dateIso = w.planned?.date ?? w.actual?.date;
      if (!dateIso) continue;
      const key = dateIso.slice(0, 10);
      (map[key] ??= []).push(w);
    }
    return map;
  }, [workouts, activePlanId]);

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

  // ─── Sheets ───────────────────────────────────────────────────────

  const legendSheetRef = useRef<GorhomBottomSheetModal>(null);
  const daySheetRef = useRef<GorhomBottomSheetModal>(null);
  const rescheduleSheetRef = useRef<GorhomBottomSheetModal>(null);
  const swapSheetRef = useRef<GorhomBottomSheetModal>(null);
  // The action sheets are shared across rows; hold the workout they target.
  const [actionWorkout, setActionWorkout] = useState<WorkoutDoc | null>(null);

  // ─── Interaction handlers ─────────────────────────────────────────

  const handleDayPress = useCallback((dateKey: string) => {
    Haptics.selectionAsync();
    setSelectedDate(dateKey);
    daySheetRef.current?.present();
  }, []);

  const handleWorkoutPress = useCallback(
    (workoutId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/(app)/workouts/${workoutId}`);
    },
    [router],
  );

  // Swap the day sheet out for the action sheet. The workout state mounts the
  // target sheet with the right props; present it on the next frame so it's
  // mounted by the time we ask for it.
  const handleReschedule = useCallback((w: WorkoutDoc) => {
    Haptics.selectionAsync();
    setActionWorkout(w);
    daySheetRef.current?.dismiss();
    requestAnimationFrame(() => rescheduleSheetRef.current?.present());
  }, []);

  const handleSwap = useCallback((w: WorkoutDoc) => {
    Haptics.selectionAsync();
    setActionWorkout(w);
    daySheetRef.current?.dismiss();
    requestAnimationFrame(() => swapSheetRef.current?.present());
  }, []);

  const handleShowLegend = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    legendSheetRef.current?.present();
  }, []);

  const handleAddWorkout = useCallback(() => {
    Haptics.selectionAsync();
    router.push({
      pathname: "/(app)/workouts/schedule",
      params: { date: selectedDate },
    });
  }, [router, selectedDate]);

  // ─── Render ───────────────────────────────────────────────────────

  if (workouts === undefined || activePlan === undefined) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color={GRAYS.g3} />
      </View>
    );
  }

  const selectedWorkouts = workoutsByDate[selectedDate] ?? [];

  return (
    <View className="flex-1 bg-black">
      {/* Dark header — title + subtitle + legend info */}
      <View
        className="bg-black px-6 pb-4"
        style={{ paddingTop: insets.top + 8 }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text
              className="text-[28px] font-coach-bold text-g1"
              style={{ letterSpacing: -0.03 * 28 }}
            >
              {t("calendar.title")}
            </Text>
          </View>
          <Pressable
            onPress={handleShowLegend}
            accessibilityRole="button"
            accessibilityLabel={t("calendar.legend.open")}
            hitSlop={10}
            className="h-9 w-9 items-center justify-center rounded-full border bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] active:opacity-70"
          >
            <Info size={16} color={GRAYS.g2} strokeWidth={1.75} />
          </Pressable>
        </View>
      </View>

      {/* Rounded transition from dark header to light content */}
      <View className="h-6 bg-w2 rounded-t-3xl" />

      {/* Light area: day-of-week headers + scrollable month list */}
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
            paddingBottom: insets.bottom + 16,
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
                onDayPress={handleDayPress}
              />
            </View>
          ))}
        </ScrollView>
      </View>

      <CalendarLegendSheet sheetRef={legendSheetRef} />
      <CalendarDaySheet
        sheetRef={daySheetRef}
        selectedDate={selectedDate}
        workouts={selectedWorkouts}
        onWorkoutPress={handleWorkoutPress}
        onAddWorkout={handleAddWorkout}
        onReschedule={handleReschedule}
        onSwap={handleSwap}
      />

      {actionWorkout?.planned && (
        <RescheduleSheet
          sheetRef={rescheduleSheetRef}
          workoutId={actionWorkout._id}
          plannedDate={actionWorkout.planned.date}
        />
      )}
      {actionWorkout && (
        <SwapSheet
          sheetRef={swapSheetRef}
          workoutId={actionWorkout._id}
          blockId={actionWorkout.blockId ?? undefined}
        />
      )}
    </View>
  );
}

/**
 * PlanScreen - Main container for the Today/Plan tab
 *
 * Features:
 * - Scroll-based header collapse animation
 * - Date header with greeting
 * - Calendar strip with day selection
 * - Today's workout card with coach message
 * - This Week insights (volume, streak, adherence)
 */

import { useState, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Pressable,
  StatusBar,
  ActivityIndicator,
  type LayoutChangeEvent,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { Text } from "@/components/ui/text";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedReaction,
  interpolateColor,
  runOnJS,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { DateHeader } from "./DateHeader";
import { CalendarStrip } from "./CalendarStrip";
import { TodayCard } from "./TodayCard";
import { NeedsFeedbackCard } from "./NeedsFeedbackCard";
import { RaceCountdown } from "./RaceCountdown";
import { QuickActions } from "./QuickActions";
import { TrainingPulseCard } from "./TrainingPulseCard";
import { RaceUpgradeCTA } from "./RaceUpgradeCTA";
import { ExportToProviderSheet } from "./ExportToProviderSheet";
import { MarkDoneBottomSheet } from "@/components/app/workout/mark-done-bottom-sheet";
import { LIGHT_THEME } from "@/lib/design-tokens";
import {
  buildWorkoutsByDate,
  computeTrainingPulse,
  mapRaceToGoalData,
} from "./utils";
import type { WorkoutData } from "./types";

const REST_FALLBACK: WorkoutData = {
  type: "Rest",
  km: "-",
  dur: "-",
  done: false,
  intensity: "rest",
  desc: "No workout scheduled for today.",
  zone: "-",
  today: true,
};

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

export function PlanScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const scrollY = useSharedValue(0);
  const headerHeight = useSharedValue(0);

  const athlete = useQuery(api.agoge.athletes.getAthlete);
  const userName = athlete?.name || t("plan.defaultName");

  const today = useMemo(() => new Date(), []);

  const workoutRange = useMemo(() => {
    const start = new Date(today);
    start.setDate(start.getDate() - 84);
    const end = new Date(today);
    end.setDate(end.getDate() + 84);
    return {
      startDate: toUtcRangeStart(start),
      endDate: toUtcRangeEnd(end),
    };
  }, [today]);

  const workouts = useQuery(api.agoge.workouts.listWorkouts, workoutRange);
  const activeGoal = useQuery(api.agoge.goals.getMyActiveGoal);

  const activePlanId = activeGoal?.plan?._id ?? null;

  const planWorkouts = useMemo(() => {
    if (!workouts) return undefined;
    if (!activePlanId) return [];
    return workouts.filter((w) => w.planId === activePlanId);
  }, [workouts, activePlanId]);

  const workoutsByDate = useMemo(
    () => (planWorkouts ? buildWorkoutsByDate(planWorkouts, today) : {}),
    [planWorkouts, today],
  );

  const isSelectedToday =
    selectedDate.getFullYear() === today.getFullYear() &&
    selectedDate.getMonth() === today.getMonth() &&
    selectedDate.getDate() === today.getDate();

  const selectedDateKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`;

  const baseSelectedWorkout: WorkoutData =
    workoutsByDate[selectedDateKey] ?? REST_FALLBACK;

  // Hydrate the "coach adjusted" badge for the currently-selected workout.
  // The query is skipped when no workout is selected (rest day fallback).
  const selectedIntervention = useQuery(
    api.coach.triggers.hrvLowReadiness.activeForWorkout,
    baseSelectedWorkout.workoutId
      ? { workoutId: baseSelectedWorkout.workoutId }
      : "skip",
  );

  const trainingPulse = useMemo(
    () => (planWorkouts ? computeTrainingPulse(planWorkouts, today) : null),
    [planWorkouts, today],
  );

  const exportSheetRef = useRef<BottomSheetModal>(null);
  const markDoneSheetRef = useRef<BottomSheetModal>(null);

  const selectedWorkout_: WorkoutData =
    selectedIntervention && selectedIntervention.revertedAt == null
      ? { ...baseSelectedWorkout, coachAdjusted: true }
      : baseSelectedWorkout;

  const handleOpenWorkoutDetail = useCallback(() => {
    const sid = baseSelectedWorkout.workoutId;
    if (sid) {
      router.push(`/(app)/workouts/${sid}`);
    }
  }, [router, baseSelectedWorkout.workoutId]);

  const handleOpenExportSheet = useCallback(() => {
    exportSheetRef.current?.present();
  }, []);

  const handleMarkDone = useCallback(() => {
    if (baseSelectedWorkout.workoutId) {
      markDoneSheetRef.current?.present();
    }
  }, [baseSelectedWorkout.workoutId]);

  const startOfToday = useMemo(() => {
    const d = new Date(today);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [today]);

  const selectedDayStart = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [selectedDate]);

  const canMarkDone =
    !!baseSelectedWorkout.workoutId &&
    !baseSelectedWorkout.done &&
    baseSelectedWorkout.intensity !== "rest" &&
    selectedDayStart.getTime() <= startOfToday.getTime();

  const handleScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleHeaderLayout = useCallback(
    (e: LayoutChangeEvent) => {
      headerHeight.value = e.nativeEvent.layout.height;
    },
    [headerHeight],
  );

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const progress = Math.min(1, Math.max(0, (scrollY.value - 20) / 60));
    return {
      opacity: 1 - progress,
      transform: [{ translateY: -progress * 30 }],
    };
  });

  const stickyOverlayStyle = useAnimatedStyle(() => {
    const threshold = headerHeight.value - insets.top;
    const isSticky = headerHeight.value > 0 && scrollY.value >= threshold;
    return {
      transform: [{ translateY: isSticky ? 0 : -(insets.top + 500) }],
    };
  });

  const [lightStatusBar, setLightStatusBar] = useState(false);

  useAnimatedReaction(
    () => {
      const threshold =
        headerHeight.value > 0 ? headerHeight.value - insets.top : 1;
      return scrollY.value / threshold >= 0.95;
    },
    (isLight, prev) => {
      if (isLight !== prev) {
        runOnJS(setLightStatusBar)(isLight);
      }
    },
  );

  const safeAreaCoverStyle = useAnimatedStyle(() => {
    const threshold =
      headerHeight.value > 0 ? headerHeight.value - insets.top : 1;
    const progress = Math.min(1, Math.max(0, scrollY.value / threshold));
    const backgroundColor = interpolateColor(
      progress,
      [0, 0.85, 1],
      ["#000000", "#000000", LIGHT_THEME.w2],
    );
    return { backgroundColor };
  });

  if (workouts === undefined || activeGoal === undefined) {
    return (
      <View className="flex-1 bg-w2 items-center justify-center">
        <ActivityIndicator size="large" color={LIGHT_THEME.wMute} />
      </View>
    );
  }

  const hasGoal = activeGoal !== null;

  return (
    <View className="flex-1 bg-w2">
      <View className="absolute top-0 left-0 right-0 h-1/2 bg-black" />
      <StatusBar
        animated
        barStyle={lightStatusBar ? "dark-content" : "light-content"}
      />
      <Animated.ScrollView
        className="flex-1"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32, flexGrow: 1 }}
      >
        {/* Dark header area with DateHeader + rounded corner transition */}
        <View className="bg-black" onLayout={handleHeaderLayout}>
          <View className="px-6 pb-5" style={{ paddingTop: insets.top + 8 }}>
            <Animated.View style={headerAnimatedStyle}>
              <DateHeader variant="full" userName={userName} />
            </Animated.View>
          </View>
          <View
            className="bg-w2 h-7"
            style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
          />
        </View>

        {/* CalendarStrip */}
        <View className="bg-w2 px-4">
          <CalendarStrip
            workoutsByDate={workoutsByDate}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
          />
          <View className="h-px bg-wBrd mt-3 -mx-4" />
        </View>

        {!hasGoal ? (
          <View className="flex-1 bg-w2 px-6 py-10 items-center justify-center">
            <Text
              className="text-[11px] font-coach-semibold text-wSub uppercase text-center"
              style={{ letterSpacing: 0.05 * 11 }}
            >
              {t("plan.setGoal.eyebrow")}
            </Text>
            <Text
              className="text-[28px] font-coach-bold text-wText mt-2 text-center"
              style={{ letterSpacing: -0.02 * 28, lineHeight: 32 }}
            >
              {t("plan.setGoal.title")}
            </Text>
            <Text
              className="text-[15px] font-coach-medium text-wSub mt-3 text-center"
              style={{ lineHeight: 22 }}
            >
              {t("plan.setGoal.body")}
            </Text>

            <Pressable
              onPress={() => router.push("/(app)/goal/new")}
              className="mt-10 flex-row items-center justify-center gap-2 rounded-full py-4 px-8 active:opacity-90"
              style={{
                backgroundColor: LIGHT_THEME.wText,
                alignSelf: "stretch",
              }}
            >
              <Text
                className="font-coach-bold text-[15px]"
                style={{ color: "#FFFFFF" }}
              >
                {t("plan.setGoal.cta")}
              </Text>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M5 12H19M19 12L13 6M19 12L13 18"
                  stroke="#FFFFFF"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>
          </View>
        ) : (
          <View className="flex-1 bg-w2 pb-6">
            {workouts && workouts.length > 0 && (
              <View className="px-4 pt-4">
                <NeedsFeedbackCard workouts={workouts} today={today} />
              </View>
            )}

            {/* Today's Workout Card */}
            <View className="px-4 pt-4">
              <TodayCard
                workout={selectedWorkout_}
                selectedDate={selectedDate}
                isToday={isSelectedToday}
                onExportPress={handleOpenExportSheet}
                onCardPress={handleOpenWorkoutDetail}
                onMarkDonePress={handleMarkDone}
                canMarkDone={canMarkDone}
              />
            </View>

            {activeGoal.goal.category === "race" && activeGoal.race ? (
              <View className="px-4 mt-5">
                <RaceCountdown
                  race={mapRaceToGoalData(activeGoal.race, activeGoal.plan)}
                />
              </View>
            ) : null}

            {activeGoal.goal.category === "fitness" &&
              activeGoal.goal.fitnessIntent &&
              trainingPulse && (
                <View className="px-4 mt-5">
                  <TrainingPulseCard
                    intent={activeGoal.goal.fitnessIntent}
                    pulse={trainingPulse}
                  />
                </View>
              )}

            {activeGoal.goal.category === "fitness" && (
              <View className="px-4 mt-5">
                <RaceUpgradeCTA
                  onPress={() => router.push("/(app)/goal/new")}
                />
              </View>
            )}

            {/* Quick Actions: Schedule + Log */}
            <View className="px-4 mt-5">
              <QuickActions
                selectedDateIso={toIsoDate(selectedDate)}
                onSchedule={(dateIso) =>
                  router.push({
                    pathname: "/(app)/workouts/schedule",
                    params: { date: dateIso },
                  })
                }
                onLog={(dateIso) =>
                  router.push({
                    pathname: "/(app)/workouts/log",
                    params: { date: dateIso },
                  })
                }
              />
            </View>
          </View>
        )}
      </Animated.ScrollView>

      {/* Safe area cover */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: insets.top,
            zIndex: 1,
          },
          safeAreaCoverStyle,
        ]}
      />

      {/* Sticky CalendarStrip overlay */}
      <Animated.View
        style={[
          { position: "absolute", top: 0, left: 0, right: 0, zIndex: 2 },
          stickyOverlayStyle,
        ]}
      >
        <View className="bg-w2" style={{ paddingTop: insets.top }}>
          <View className="px-4">
            <CalendarStrip
              workoutsByDate={workoutsByDate}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
            />
            <View className="h-px bg-wBrd mt-3 -mx-4" />
          </View>
        </View>
      </Animated.View>

      {/* Send to Provider Bottom Sheet (only when TodayCard can trigger it) */}
      {hasGoal && (
        <ExportToProviderSheet
          sheetRef={exportSheetRef}
          workoutType={selectedWorkout_.type}
          workoutId={selectedWorkout_.workoutId}
        />
      )}

      {hasGoal && selectedWorkout_.workoutId && (
        <MarkDoneBottomSheet
          sheetRef={markDoneSheetRef}
          workoutId={selectedWorkout_.workoutId}
          workoutName={selectedWorkout_.type}
        />
      )}
    </View>
  );
}

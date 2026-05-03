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
import { View, StatusBar, ActivityIndicator, type LayoutChangeEvent } from "react-native";
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
import { RaceCountdown } from "./RaceCountdown";
import { WeekInsights } from "./WeekInsights";
import { LogRunSection } from "./QuickActions";
import { ExportToProviderSheet } from "./ExportToProviderSheet";
import { LIGHT_THEME } from "@/lib/design-tokens";
import {
  buildWorkoutsByDate,
  buildRaceGoal,
  computeWeekInsights,
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

function computeWeekNumber(planStartDate: string, today: Date): number {
  const start = new Date(`${planStartDate}T00:00:00`);
  const diffDays = Math.floor(
    (today.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (diffDays < 0) return 0;
  return Math.floor(diffDays / 7) + 1;
}

export function PlanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const scrollY = useSharedValue(0);
  const headerHeight = useSharedValue(0);

  const athlete = useQuery(api.agoge.athletes.getAthlete);
  const userName = athlete?.name || "there";

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
  const activePlan = useQuery(api.agoge.plans.getAthletePlan);

  const workoutsByDate = useMemo(
    () => (workouts ? buildWorkoutsByDate(workouts, today) : {}),
    [workouts, today]
  );

  const isSelectedToday =
    selectedDate.getFullYear() === today.getFullYear() &&
    selectedDate.getMonth() === today.getMonth() &&
    selectedDate.getDate() === today.getDate();

  const selectedDateKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`;

  const baseSelectedWorkout: WorkoutData =
    workoutsByDate[selectedDateKey] ?? REST_FALLBACK;

  const weekInsights = useMemo(
    () => (workouts ? computeWeekInsights(workouts, today) : null),
    [workouts, today]
  );

  const raceGoal = useMemo(
    () => (workouts ? buildRaceGoal(workouts) : null),
    [workouts]
  );

  const weekNumber = activePlan ? computeWeekNumber(activePlan.startDate, today) : 0;
  const coachMessage = "Your coach is preparing your plan...";

  const exportSheetRef = useRef<BottomSheetModal>(null);

  const selectedWorkout_: WorkoutData = baseSelectedWorkout;

  const handleOpenWorkoutDetail = useCallback(() => {
    const sid = baseSelectedWorkout.workoutId;
    if (sid) {
      router.push(`/(app)/workouts/${sid}`);
    }
  }, [router, baseSelectedWorkout.workoutId]);

  const selectedDateIso = toIsoDate(selectedDate);
  const todayIso = toIsoDate(today);
  const canAddOnSelectedDate = selectedDateIso >= todayIso;
  const handleAddOnSelectedDate = useCallback(() => {
    const isFuture = selectedDateIso > todayIso;
    router.push({
      pathname: isFuture
        ? "/(app)/workouts/schedule"
        : "/(app)/workouts/log",
      params: { date: selectedDateIso },
    });
  }, [router, selectedDateIso, todayIso]);

  const handleOpenExportSheet = useCallback(() => {
    exportSheetRef.current?.present();
  }, []);

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
    [headerHeight]
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
    }
  );

  const safeAreaCoverStyle = useAnimatedStyle(() => {
    const threshold =
      headerHeight.value > 0 ? headerHeight.value - insets.top : 1;
    const progress = Math.min(1, Math.max(0, scrollY.value / threshold));
    const backgroundColor = interpolateColor(
      progress,
      [0, 0.85, 1],
      ["#000000", "#000000", LIGHT_THEME.w2]
    );
    return { backgroundColor };
  });

  // Loading state -- wait for the workouts query to resolve
  if (workouts === undefined) {
    return (
      <View className="flex-1 bg-w2 items-center justify-center">
        <ActivityIndicator size="large" color={LIGHT_THEME.wMute} />
      </View>
    );
  }

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
              <DateHeader
                variant="full"
                userName={userName}
                weekNumber={weekNumber}
              />
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

        {/* Scrollable content */}
        <View className="flex-1 bg-w2 pb-6">
          {/* Today's Workout Card */}
          <View className="px-4 pt-4">
            <TodayCard
              workout={selectedWorkout_}
              coachMessage={coachMessage}
              selectedDate={selectedDate}
              isToday={isSelectedToday}
              onExportPress={handleOpenExportSheet}
              onCardPress={handleOpenWorkoutDetail}
              onAddPress={canAddOnSelectedDate ? handleAddOnSelectedDate : undefined}
            />
          </View>

          {/* This Week Insights */}
          {weekInsights && (
            <View className="px-4 mt-5">
              <WeekInsights
                volumeCompleted={weekInsights.volumeCompleted}
                volumePlanned={weekInsights.volumePlanned}
                timeCompleted={weekInsights.timeCompleted}
                avgPace={weekInsights.avgPace}
                workouts={weekInsights.currentWeekWorkouts}
              />
            </View>
          )}

          {/* Primary Race Countdown */}
          {raceGoal && (
            <View className="px-4 mt-5">
              <RaceCountdown race={raceGoal} />
            </View>
          )}

          {/* Log a Run */}
          <View className="px-4 mt-5">
            <LogRunSection
              onSelectType={(category) => {
                router.push({
                  pathname: "/(app)/workouts/log",
                  params: {
                    type: category,
                    date: toIsoDate(selectedDate),
                  },
                });
              }}
            />
          </View>
        </View>
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

      {/* Send to Provider Bottom Sheet */}
      <ExportToProviderSheet
        sheetRef={exportSheetRef}
        workoutType={selectedWorkout_.type}
        workoutId={selectedWorkout_.workoutId}
      />
    </View>
  );
}

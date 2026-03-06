/**
 * PlanScreen - Main container for the Today/Plan tab
 * Reference: cadence-full-v9.jsx TodayTab component (lines 119-244)
 *
 * Features:
 * - Scroll-based header collapse animation
 * - Date header with greeting
 * - Calendar strip with day selection
 * - Today's session card with coach message
 * - This Week insights (volume, streak, adherence)
 */

import { useState, useCallback, useRef } from "react";
import { View, StatusBar, type LayoutChangeEvent } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  useAnimatedScrollHandler,
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
import { SessionBriefSheet } from "./SessionBriefSheet";
import { ExportToWatchSheet, type WatchProvider } from "./ExportToWatchSheet";
import { MOCK_PLAN_DATA, MOCK_RACE_GOAL, MOCK_CALENDAR_SESSIONS } from "./mock-data";
import { TODAY_INDEX } from "./types";
import type { SessionData, SyncStatus } from "./types";

/**
 * PlanScreen main component
 *
 * Scroll behavior from prototype (lines 143-156):
 * - Track scroll position with onScroll
 * - Calculate progress: p = Math.min(1, Math.max(0, (scrollY - 20) / 60))
 * - Full header fades/translates based on progress
 * - Collapsed header appears at p > 0.85
 */
export function PlanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const scrollY = useSharedValue(0);
  const headerHeight = useSharedValue(0);

  // Fetch runner data for personalized greeting
  const runner = useQuery(api.table.runners.getCurrentRunner);
  const userName = runner?.identity?.name || "there";

  // Bottom sheet state and refs
  const sessionBriefSheetRef = useRef<BottomSheetModal>(null);
  const exportSheetRef = useRef<BottomSheetModal>(null);
  const [selectedSession, setSelectedSession] = useState<{
    session: SessionData;
    dayIdx: number;
  } | null>(null);

  // Export-to-watch state for the today session
  const [exportStatus, setExportStatus] = useState<{
    syncStatus?: SyncStatus;
    syncSource?: string;
  }>({});

  const handleOpenSessionBrief = useCallback(
    (session: SessionData, dayIdx: number) => {
      setSelectedSession({ session, dayIdx });
      sessionBriefSheetRef.current?.present();
    },
    []
  );

  const handleOpenExportSheet = useCallback(() => {
    exportSheetRef.current?.present();
  }, []);

  const handleExportComplete = useCallback((provider: WatchProvider) => {
    setExportStatus({
      syncStatus: "exported",
      syncSource: provider,
    });
  }, []);

  const handleScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const baseTodaySession = MOCK_PLAN_DATA.sessions[TODAY_INDEX];
  const todaySession: SessionData = {
    ...baseTodaySession,
    ...(exportStatus.syncStatus
      ? { syncStatus: exportStatus.syncStatus, syncSource: exportStatus.syncSource }
      : {}),
  };

  const handleHeaderLayout = useCallback((e: LayoutChangeEvent) => {
    headerHeight.value = e.nativeEvent.layout.height;
  }, [headerHeight]);

  // Animated style for full header (fade out on scroll)
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const progress = Math.min(1, Math.max(0, (scrollY.value - 20) / 60));
    return {
      opacity: 1 - progress,
      transform: [{ translateY: -progress * 30 }],
    };
  });

  // Sticky CalendarStrip overlay: appears when the in-scroll strip would
  // scroll behind the safe area, positioned off-screen otherwise so it
  // doesn't intercept touches.
  const stickyOverlayStyle = useAnimatedStyle(() => {
    const threshold = headerHeight.value - insets.top;
    const isSticky = headerHeight.value > 0 && scrollY.value >= threshold;
    return {
      transform: [{ translateY: isSticky ? 0 : -(insets.top + 500) }],
    };
  });

  return (
    <View className="flex-1 bg-w2">
      <View className="absolute top-0 left-0 right-0 h-1/2 bg-black" />
      <StatusBar animated />
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
                weekNumber={MOCK_PLAN_DATA.weekNumber}
              />
            </Animated.View>
          </View>
          <View
            className="bg-w2 h-7"
            style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
          />
        </View>

        {/* CalendarStrip - scrolls normally, overlay takes over when sticky */}
        <View className="bg-w2 px-4">
          <CalendarStrip
            sessionsByDate={MOCK_CALENDAR_SESSIONS}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
          />
          <View className="h-px bg-wBrd mt-3 -mx-4" />
        </View>

        {/* Scrollable content */}
        <View className="flex-1 bg-w2 pb-6">
          {/* Today's Session Card */}
          <View className="px-4 pt-4">
            <TodayCard
              session={todaySession}
              coachMessage={MOCK_PLAN_DATA.coachMessage}
              onStartPress={() => handleOpenSessionBrief(todaySession, TODAY_INDEX)}
              onExportPress={handleOpenExportSheet}
              onCardPress={() => handleOpenSessionBrief(todaySession, TODAY_INDEX)}
            />
          </View>

          {/* This Week Insights */}
          <View className="px-4 mt-5">
            <WeekInsights
              volumeCompleted={MOCK_PLAN_DATA.volumeCompleted}
              volumePlanned={MOCK_PLAN_DATA.volumePlanned}
              timeCompleted={MOCK_PLAN_DATA.timeCompleted}
              streak={MOCK_PLAN_DATA.streak}
              streakDays={MOCK_PLAN_DATA.streakDays}
              sessions={MOCK_PLAN_DATA.sessions}
            />
          </View>

          {/* Primary Race Countdown */}
          <View className="px-4 mt-5">
            <RaceCountdown race={MOCK_RACE_GOAL} />
          </View>

          {/* Log a Run */}
          <View className="px-4 mt-5">
            <LogRunSection
              onSelectType={(category) => router.push("/session")}
            />
          </View>
        </View>
      </Animated.ScrollView>

      {/* Sticky CalendarStrip overlay - appears when the in-scroll strip
          scrolls behind the safe area */}
      <Animated.View
        style={[
          { position: "absolute", top: 0, left: 0, right: 0 },
          stickyOverlayStyle,
        ]}
      >
        <View className="bg-w2" style={{ paddingTop: insets.top }}>
          <View className="px-4">
            <CalendarStrip
              sessionsByDate={MOCK_CALENDAR_SESSIONS}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
            />
            <View className="h-px bg-wBrd mt-3 -mx-4" />
          </View>
        </View>
      </Animated.View>

      {/* Session Brief Bottom Sheet */}
      <SessionBriefSheet
        sheetRef={sessionBriefSheetRef}
        session={selectedSession?.session ?? null}
        dayIdx={selectedSession?.dayIdx ?? 0}
      />

      {/* Export to Watch Bottom Sheet */}
      <ExportToWatchSheet
        sheetRef={exportSheetRef}
        sessionType={todaySession.type}
        onExportComplete={handleExportComplete}
      />
    </View>
  );
}

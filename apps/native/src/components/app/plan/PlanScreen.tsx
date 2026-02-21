/**
 * PlanScreen - Main container for the Today/Plan tab
 * Reference: cadence-full-v9.jsx TodayTab component (lines 119-244)
 *
 * Features:
 * - Scroll-based header collapse animation
 * - Date header with greeting
 * - Calendar strip with day selection
 * - Today's session card with coach message
 * - Coming up section with upcoming sessions
 * - Weekly stats row
 */

import { useState, useCallback, useRef } from "react";
import { View, StatusBar } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedReaction,
  runOnJS,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { Text } from "@/components/ui/text";

import { DateHeader } from "./DateHeader";
import { CalendarStrip } from "./CalendarStrip";
import { TodayCard } from "./TodayCard";
import { SessionPreview } from "./SessionPreview";
import { WeekStatsRow } from "./WeekStatsRow";
import { SessionBriefSheet } from "./SessionBriefSheet";
import { MOCK_PLAN_DATA } from "./mock-data";
import { TODAY_INDEX } from "./types";
import type { SessionData } from "./types";

/**
 * PlanScreen main component
 *
 * Scroll behavior from prototype (lines 143-156):
 * - Track scroll position with onScroll
 * - Calculate progress: p = Math.min(1, Math.max(0, (scrollY - 20) / 60))
 * - Full header fades/translates based on progress
 * - Collapsed header appears at p > 0.85
 */
// Threshold where sticky header becomes active
const STICKY_THRESHOLD = 100;

export function PlanScreen() {
  const insets = useSafeAreaInsets();
  const [selectedDay, setSelectedDay] = useState(TODAY_INDEX);
  const [isSticky, setIsSticky] = useState(false);
  const scrollY = useSharedValue(0);

  // Fetch runner data for personalized greeting
  const runner = useQuery(api.table.runners.getCurrentRunner);
  const userName = runner?.identity?.name || "there";

  // Bottom sheet state and ref
  const sessionBriefSheetRef = useRef<BottomSheetModal>(null);
  const [selectedSession, setSelectedSession] = useState<{
    session: SessionData;
    dayIdx: number;
  } | null>(null);

  const handleOpenSessionBrief = useCallback(
    (session: SessionData, dayIdx: number) => {
      setSelectedSession({ session, dayIdx });
      sessionBriefSheetRef.current?.present();
    },
    []
  );

  const handleScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Toggle status bar visibility based on scroll position
  const updateStickyState = useCallback((sticky: boolean) => {
    setIsSticky(sticky);
  }, []);

  useAnimatedReaction(
    () => scrollY.value > STICKY_THRESHOLD,
    (isNowSticky, wasSticky) => {
      if (isNowSticky !== wasSticky) {
        runOnJS(updateStickyState)(isNowSticky);
      }
    },
    [scrollY]
  );

  const handleDaySelect = useCallback((dayIndex: number) => {
    setSelectedDay(dayIndex);
  }, []);

  // Get sessions after today for "Coming Up" section
  const upcomingSessions = MOCK_PLAN_DATA.sessions
    .map((session, idx) => ({ ...session, dayIdx: idx }))
    .filter((_, idx) => idx > TODAY_INDEX);

  // Get the selected day's session (for future: show different day when selected)
  const todaySession = MOCK_PLAN_DATA.sessions[TODAY_INDEX];

  // Animated style for full header (fade out on scroll)
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const progress = Math.min(1, Math.max(0, (scrollY.value - 20) / 60));
    return {
      opacity: 1 - progress,
      transform: [{ translateY: -progress * 30 }],
    };
  });

  return (
    <View className="flex-1 bg-w2">
      <StatusBar hidden={isSticky} animated />
      <Animated.ScrollView
        className="flex-1"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32, flexGrow: 1 }}
        stickyHeaderIndices={[1]}
      >
        {/* Child 0: Dark header area with DateHeader + rounded corner transition */}
        <View className="bg-black">
          <View className="px-6 pb-5" style={{ paddingTop: insets.top + 8 }}>
            <Animated.View style={headerAnimatedStyle}>
              <DateHeader
                variant="full"
                userName={userName}
                weekNumber={MOCK_PLAN_DATA.weekNumber}
              />
            </Animated.View>
          </View>
          {/* Rounded corner visual element */}
          <View
            className="bg-w2 h-7"
            style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
          />
        </View>

        {/* Child 1: CalendarStrip - STICKY */}
        <View className="bg-w2 px-4 pt-2">
          <CalendarStrip
            sessions={MOCK_PLAN_DATA.sessions}
            selectedDay={selectedDay}
            onDaySelect={handleDaySelect}
            weekNumber={MOCK_PLAN_DATA.weekNumber}
            phase={MOCK_PLAN_DATA.phase}
          />
          <View className="h-px bg-wBrd mt-3 -mx-4" />
        </View>

        {/* Child 2: Scrollable content */}
        <View className="flex-1 bg-w2 pb-6">
          {/* Today's Session Card */}
          <View className="px-4 pt-4">
            <TodayCard
              session={todaySession}
              coachMessage={MOCK_PLAN_DATA.coachMessage}
              onStartPress={() => handleOpenSessionBrief(todaySession, TODAY_INDEX)}
            />
          </View>

          {/* Coming Up Section */}
          <View className="px-4 mt-5">
            <Text
              className="text-[11px] font-coach-semibold text-wMute px-1 mb-2 uppercase"
              style={{ letterSpacing: 0.05 * 11 }}
            >
              Coming Up
            </Text>
            {upcomingSessions.map((session, index) => (
              <SessionPreview
                key={session.dayIdx}
                session={session}
                dayIdx={session.dayIdx}
                delay={index * 0.04}
                onPress={() => handleOpenSessionBrief(session, session.dayIdx)}
              />
            ))}
          </View>

          {/* Weekly Stats Row */}
          <View className="px-4 mt-4">
            <WeekStatsRow
              volumeCompleted={MOCK_PLAN_DATA.volumeCompleted}
              volumePlanned={MOCK_PLAN_DATA.volumePlanned}
              streak={MOCK_PLAN_DATA.streak}
            />
          </View>
        </View>
      </Animated.ScrollView>

      {/* Session Brief Bottom Sheet */}
      <SessionBriefSheet
        sheetRef={sessionBriefSheetRef}
        session={selectedSession?.session ?? null}
        dayIdx={selectedSession?.dayIdx ?? 0}
      />
    </View>
  );
}

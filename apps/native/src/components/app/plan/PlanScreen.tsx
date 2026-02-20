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

import { useState, useCallback } from "react";
import {
  View,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";

import { DateHeader } from "./DateHeader";
import { CalendarStrip } from "./CalendarStrip";
import { TodayCard } from "./TodayCard";
import { SessionPreview } from "./SessionPreview";
import { WeekStatsRow } from "./WeekStatsRow";
import { MOCK_PLAN_DATA } from "./mock-data";
import { TODAY_INDEX, DAYS, DATES } from "./types";

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
  const [selectedDay, setSelectedDay] = useState(TODAY_INDEX);
  const scrollY = useSharedValue(0);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollY.value = event.nativeEvent.contentOffset.y;
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

  // Animated style for collapsed header (fade in on scroll)
  const collapsedHeaderAnimatedStyle = useAnimatedStyle(() => {
    const progress = Math.min(1, Math.max(0, (scrollY.value - 20) / 60));
    const showCollapsed = progress > 0.85;
    return {
      opacity: withTiming(showCollapsed ? 1 : 0, { duration: 150 }),
      transform: [{ translateY: withTiming(showCollapsed ? 0 : -10, { duration: 150 }) }],
    };
  });

  return (
    <View className="flex-1 bg-black relative">
      {/* Collapsed header bar - shown when scrolled */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 90,
            paddingTop: insets.top,
            paddingHorizontal: 24,
            paddingBottom: 12,
            backgroundColor: "rgba(0,0,0,0.92)",
          },
          collapsedHeaderAnimatedStyle,
        ]}
        className="border-b border-brd"
        pointerEvents="box-none"
      >
        <DateHeader variant="collapsed" userName={MOCK_PLAN_DATA.userName} weekNumber={MOCK_PLAN_DATA.weekNumber} />
      </Animated.View>

      <ScrollView
        className="flex-1"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Dark header area with full DateHeader */}
        <View
          className="bg-black px-6 pb-5"
          style={{ paddingTop: insets.top + 8 }}
        >
          <Animated.View style={headerAnimatedStyle}>
            <DateHeader
              variant="full"
              userName={MOCK_PLAN_DATA.userName}
              weekNumber={MOCK_PLAN_DATA.weekNumber}
            />
          </Animated.View>
        </View>

        {/* Light content area with rounded top corners */}
        <View
          className="bg-w2 -mt-1"
          style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, minHeight: 700 }}
        >
          {/* Calendar Strip */}
          <View className="px-4 pt-5 pb-3">
            <CalendarStrip
              sessions={MOCK_PLAN_DATA.sessions}
              selectedDay={selectedDay}
              onDaySelect={handleDaySelect}
              weekNumber={MOCK_PLAN_DATA.weekNumber}
              phase={MOCK_PLAN_DATA.phase}
            />
          </View>

          {/* Divider */}
          <View className="h-px bg-wBrd mx-5" />

          {/* Today's Session Card */}
          <View className="px-4 pt-4">
            <TodayCard
              session={todaySession}
              coachMessage={MOCK_PLAN_DATA.coachMessage}
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
      </ScrollView>
    </View>
  );
}

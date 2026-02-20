/**
 * SessionDetailScreen - Pre-workout session detail modal
 * Reference: cadence-full-v10.jsx SessionDetailScreen (lines 251-399)
 *
 * Features:
 * - Full-screen modal with slide-up animation
 * - Scroll-based collapsed header
 * - Coach insight card
 * - Intensity profile chart
 * - Workout structure list
 * - Overview stats grid
 * - Focus points section
 * - Week context bar
 * - Sticky start CTA
 */

import { useCallback, useMemo } from "react";
import { View, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withTiming,
  interpolate,
  SlideInDown,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SessionDetailHeader } from "./SessionDetailHeader";
import { CollapsedHeader } from "./CollapsedHeader";
import { CoachInsightCard } from "./CoachInsightCard";
import { IntensityProfileChart } from "./IntensityProfileChart";
import { WorkoutStructure } from "./WorkoutStructure";
import { OverviewGrid } from "./OverviewGrid";
import { FocusPoints } from "./FocusPoints";
import { WeekContextBar } from "./WeekContextBar";
import { StartSessionCTA } from "./StartSessionCTA";
import type { SessionDetailData } from "./types";
import { getSessionColor } from "./types";

const AnimatedScrollView = Animated.createAnimatedComponent(
  Animated.ScrollView
);

export interface SessionDetailScreenProps {
  /** Session data to display */
  session: SessionDetailData;
  /** Day index (0-6 for Mon-Sun) */
  dayIdx: number;
  /** Array of all sessions in the week (for week context) */
  weekSessions?: SessionDetailData[];
  /** Callback when back button is pressed */
  onBack: () => void;
  /** Callback when start session is pressed */
  onStart: () => void;
}

/**
 * SessionDetailScreen main component
 *
 * Animation from prototype (line 259):
 * - animation: detailSlideUp .45s cubic-bezier(.32,.72,.37,1.0) both
 *
 * Scroll behavior (lines 256, 262-271):
 * - Track scroll position
 * - Calculate progress: p = Math.min(1, Math.max(0, (scrollY - 10) / 80))
 * - Collapsed header appears at p > 0.8
 */
export function SessionDetailScreen({
  session,
  dayIdx,
  weekSessions = [],
  onBack,
  onStart,
}: SessionDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);

  const isRest = session.intensity === "rest";
  const sessionColor = useMemo(
    () => getSessionColor(session.done, session.intensity),
    [session.done, session.intensity]
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Hero header fades out based on scroll
  const heroAnimatedStyle = useAnimatedStyle(() => {
    const progress = Math.min(1, Math.max(0, (scrollY.value - 10) / 80));
    return {
      opacity: interpolate(progress, [0, 0.6], [1, 0]),
      transform: [{ translateY: -progress * 15 }],
    };
  });

  // Collapsed header appears when scrolled past threshold
  const showCollapsed = useAnimatedStyle(() => {
    const progress = Math.min(1, Math.max(0, (scrollY.value - 10) / 80));
    const show = progress > 0.8;
    return {
      opacity: withTiming(show ? 1 : 0, { duration: 150 }),
      transform: [{ translateY: withTiming(show ? 0 : -10, { duration: 150 }) }],
    };
  });

  return (
    <Animated.View
      entering={SlideInDown.duration(450).springify().damping(20).stiffness(90)}
      className="absolute inset-0 z-[300] bg-black"
    >
      {/* Collapsed header - shown when scrolled */}
      <CollapsedHeader
        session={session}
        sessionColor={sessionColor}
        animatedStyle={showCollapsed}
      />

      {/* Main scrollable content */}
      <AnimatedScrollView
        className="flex-1"
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160 }}
      >
        {/* Hero header area */}
        <Animated.View
          style={[
            {
              paddingTop: insets.top + 8,
              paddingHorizontal: 24,
              paddingBottom: 28,
              backgroundColor: "#000000",
            },
            heroAnimatedStyle,
          ]}
        >
          <SessionDetailHeader
            session={session}
            dayIdx={dayIdx}
            sessionColor={sessionColor}
            onBack={onBack}
          />
        </Animated.View>

        {/* Light content area with rounded top corners */}
        <View
          className="bg-w2 -mt-1"
          style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, minHeight: 600 }}
        >
          <View className="px-4 py-6">
            {/* Coach Insight Card */}
            {session.coachNote && (
              <CoachInsightCard coachNote={session.coachNote} />
            )}

            {/* Intensity Profile Chart */}
            {!isRest && session.segments.length > 0 && (
              <IntensityProfileChart segments={session.segments} />
            )}

            {/* Workout Structure */}
            {!isRest && session.segments.length > 0 && (
              <WorkoutStructure segments={session.segments} />
            )}

            {/* Overview Stats Grid */}
            {!isRest && (
              <OverviewGrid
                km={session.km}
                duration={session.dur}
                intensity={session.intensity}
              />
            )}

            {/* Focus Points */}
            <FocusPoints
              isRest={isRest}
              intensity={session.intensity}
              km={parseFloat(session.km) || 0}
            />

            {/* Week Context Bar */}
            <WeekContextBar
              dayIdx={dayIdx}
              sessions={weekSessions}
            />
          </View>
        </View>
      </AnimatedScrollView>

      {/* Sticky Start Session CTA */}
      {!session.done && !isRest && (
        <StartSessionCTA onStart={onStart} />
      )}
    </Animated.View>
  );
}

/**
 * CalendarScreen Component - Weekly calendar visualization with coach commentary.
 *
 * Layout per cadence-calendar-v2.jsx prototype:
 * 1. Header with phase label
 * 2. Streaming coach intro text
 * 3. Summary strip (key sessions, easy runs, rest days)
 * 4. Expandable day cards
 * 5. Delayed coach comment (appears after 8s)
 * 6. Continue button
 *
 * Queries real plan data when available, falls back to mock data.
 *
 * Source: cadence-calendar-v2.jsx prototype
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { Text } from "@/components/ui/text";
import { Cursor } from "../Cursor";
import {
  CalendarWidget,
  CALENDAR_MOCK_SCHEDULE,
  type SessionData,
  type DayAbbrev,
} from "../viz/CalendarWidget";
import { Btn } from "../generative/Choice";
import { COLORS, GRAYS, SURFACES } from "@/lib/design-tokens";

// =============================================================================
// Session Type to Color Mapping
// =============================================================================

const DAY_FULL_NAMES: Record<DayAbbrev, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

function getSessionColors(
  type: string,
  isKey: boolean,
  isRest: boolean
): { color: string; colorDim: string } {
  if (isRest) {
    return { color: GRAYS.g4, colorDim: "transparent" };
  }
  if (isKey) {
    return { color: COLORS.lime, colorDim: COLORS.limeDim };
  }
  return { color: GRAYS.g3, colorDim: GRAYS.g6 };
}

// =============================================================================
// Types
// =============================================================================

export interface CalendarScreenProps {
  /** Optional mock path for path-specific messaging */
  mockPath?: "data" | "no-data";
  /** Custom schedule data (uses mock if not provided) */
  schedule?: SessionData[];
  /** Phase label for the calendar header */
  phaseLabel?: string;
  /** Callback when coach message + animation completes */
  onComplete?: () => void;
}

// =============================================================================
// Streaming Text Hook (from prototype)
// =============================================================================

function useStream(text: string, speed: number = 28, delay: number = 0, active: boolean = true) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!active) {
      setDisplayed("");
      setDone(false);
      setStarted(false);
      return;
    }
    setDisplayed("");
    setDone(false);

    const startTimer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(startTimer);
  }, [active, text, delay]);

  useEffect(() => {
    if (!started || !active) return;

    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [started, active, text, speed]);

  return { displayed, done, started };
}

// =============================================================================
// Coach Comment Component
// =============================================================================

function CoachComment() {
  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.coachComment}>
      <Text style={styles.coachCommentText}>
        <Text style={styles.coachCommentHighlight}>
          3 key sessions, 2 easy runs, 2 rest days.
        </Text>
        {" That's the structure. The key sessions do the building — everything else is recovery. Tap any day to see the reasoning."}
      </Text>
    </Animated.View>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function CalendarScreen({
  mockPath = "data",
  schedule: providedSchedule,
  phaseLabel: providedPhaseLabel,
  onComplete,
}: CalendarScreenProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCoachComment, setShowCoachComment] = useState(false);
  const [showButton, setShowButton] = useState(false);

  // Query runner to get active plan
  const runner = useQuery(api.table.runners.getCurrentRunner);
  const planId = useQuery(
    api.training.queries.getActivePlanForRunner,
    runner?._id ? { runnerId: runner._id } : "skip"
  );

  // Query week 1 sessions from plan (for onboarding preview)
  const weekSessions = useQuery(
    api.training.queries.getWeekSessions,
    planId ? { planId, weekNumber: 1 } : "skip"
  );

  // Determine loading and error states
  const isLoading = runner === undefined || (runner?._id && planId === undefined);
  const noPlanAvailable = runner !== undefined && planId === null;

  // Map backend data to SessionData format
  const schedule = useMemo((): SessionData[] | null => {
    // Use provided schedule first
    if (providedSchedule) return providedSchedule;

    // Use real plan data if available
    if (weekSessions?.sessions && weekSessions.sessions.length > 0) {
      return weekSessions.sessions.map((s) => {
        const colors = getSessionColors(s.type, s.key, s.rest);
        const dayAbbrev = s.day as DayAbbrev;
        return {
          day: DAY_FULL_NAMES[dayAbbrev] ?? s.day,
          short: dayAbbrev,
          type: s.type,
          dur: s.dur,
          effort: s.effort,
          key: s.key,
          color: colors.color,
          colorDim: colors.colorDim,
          pace: s.pace,
          desc: s.desc,
          structure: s.structure,
          why: s.why,
          rest: s.rest,
        };
      });
    }

    // No data available
    return null;
  }, [providedSchedule, weekSessions]);

  // Determine phase label (from plan or default)
  const phaseLabel = providedPhaseLabel ?? "Build Phase";

  // Streaming intro text
  const stream = useStream(
    "Here's what a typical training week looks like.",
    14,
    300,
    true
  );

  // Show calendar after streaming completes
  useEffect(() => {
    if (stream.done) {
      const timer = setTimeout(() => setShowCalendar(true), 400);
      return () => clearTimeout(timer);
    }
  }, [stream.done]);

  // Show coach comment after 8 seconds (per prototype)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCoachComment(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  // Show button after calendar animation completes
  const handleCalendarAnimationComplete = useCallback(() => {
    setShowButton(true);
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading your schedule...</Text>
        </View>
      </View>
    );
  }

  // Show error state when no plan is available
  if (noPlanAvailable || !schedule) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorTitle}>Schedule Not Ready</Text>
          <Text style={styles.errorText}>
            Your training schedule is still being generated. Please wait a moment and try again.
          </Text>
          {onComplete && (
            <View style={styles.errorButtonContainer}>
              <Btn label="Continue Anyway" onPress={onComplete} />
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Streaming intro text */}
        <View style={styles.introSection}>
          <View style={styles.introTextRow}>
            <Text style={styles.introText}>
              {stream.displayed}
            </Text>
            <Cursor visible={!stream.done && stream.started} height={22} />
          </View>
        </View>

        {/* Calendar widget - shows after streaming completes */}
        {showCalendar && (
          <View style={styles.calendarSection}>
            <CalendarWidget
              schedule={schedule}
              phaseLabel={phaseLabel}
              animate={true}
              onAnimationComplete={handleCalendarAnimationComplete}
            />
          </View>
        )}

        {/* Coach comment - appears after 8s */}
        {showCoachComment && <CoachComment />}
      </ScrollView>

      {/* Continue button */}
      {showButton && onComplete && (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.buttonContainer}
        >
          {/* Gradient fade */}
          <View style={styles.buttonGradient} />
          <View style={styles.buttonWrapper}>
            <Btn label="See projections" onPress={onComplete} />
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 70,
    backgroundColor: COLORS.black,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loadingText: {
    fontFamily: "Outfit-Light",
    fontSize: 18,
    color: GRAYS.g3,
  },
  errorTitle: {
    fontFamily: "Outfit-Medium",
    fontSize: 24,
    color: GRAYS.g1,
    marginBottom: 12,
    textAlign: "center",
  },
  errorText: {
    fontFamily: "Outfit-Light",
    fontSize: 16,
    color: GRAYS.g3,
    textAlign: "center",
    lineHeight: 24,
  },
  errorButtonContainer: {
    marginTop: 32,
    width: "100%",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  // Intro section
  introSection: {
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  introTextRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  introText: {
    fontFamily: "Outfit-Light",
    fontSize: 22,
    color: GRAYS.g1,
    lineHeight: 31,
    letterSpacing: -0.44,
  },
  // Calendar section
  calendarSection: {
    marginBottom: 0,
  },
  // Coach comment
  coachComment: {
    marginTop: 20,
    marginHorizontal: 8,
    padding: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(200,255,0,0.1)",
    backgroundColor: COLORS.limeGlow,
  },
  coachCommentText: {
    fontFamily: "Outfit-Light",
    fontSize: 14,
    color: GRAYS.g2,
    lineHeight: 22,
  },
  coachCommentHighlight: {
    fontFamily: "Outfit-Medium",
    color: COLORS.lime,
  },
  // Button container
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    paddingBottom: 48,
  },
  buttonGradient: {
    position: "absolute",
    top: -60,
    left: 0,
    right: 0,
    height: 60,
    // Note: Linear gradient needs expo-linear-gradient or similar
    // For now using solid black which matches the background
    backgroundColor: "transparent",
  },
  buttonWrapper: {
    position: "relative",
    zIndex: 2,
  },
});

// =============================================================================
// Export Types
// =============================================================================

export type { SessionData } from "../viz/CalendarWidget";

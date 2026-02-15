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
 * Source: cadence-calendar-v2.jsx prototype
 */

import { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { Cursor } from "../Cursor";
import {
  CalendarWidget,
  CALENDAR_MOCK_SCHEDULE,
  type SessionData,
} from "../viz/CalendarWidget";
import { Btn } from "../generative/Choice";
import { COLORS, GRAYS, SURFACES } from "@/lib/design-tokens";

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
  schedule = CALENDAR_MOCK_SCHEDULE,
  phaseLabel = "Build Phase",
  onComplete,
}: CalendarScreenProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCoachComment, setShowCoachComment] = useState(false);
  const [showButton, setShowButton] = useState(false);

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

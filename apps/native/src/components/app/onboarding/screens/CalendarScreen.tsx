/**
 * CalendarScreen Component - Weekly calendar visualization with coach commentary.
 *
 * Layout per prototype (cadence-v3.jsx lines 823-858):
 * 1. Header with phase label
 * 2. Calendar widget with 7-column grid
 * 3. Streaming coach text (appears after calendar animation)
 * 4. Continue button
 *
 * Source: Story 3.3 - AC#6
 */

import { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { StreamingText } from "../streaming-text";
import {
  CalendarWidget,
  CALENDAR_MOCK_SCHEDULE,
  type SessionData,
} from "../viz/CalendarWidget";
import { Btn } from "../generative/Choice";
import { COLORS } from "@/lib/design-tokens";
import type { StreamPhrase } from "@/hooks/use-streaming-text";

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
// Coach Phrases (per prototype lines 853)
// =============================================================================

const COACH_PHRASES: StreamPhrase[] = [
  {
    text: "Three key sessions: Monday tempo, Wednesday intervals, Sunday long run.",
    pauseAfter: 400,
    haptic: "insight",
  },
  {
    text: "The rest is recovery.",
    pauseAfter: 300,
  },
  {
    text: "And yes — two actual rest days. Non-negotiable.",
    haptic: "arrival",
  },
];

// =============================================================================
// Main Component
// =============================================================================

export function CalendarScreen({
  mockPath = "data",
  schedule = CALENDAR_MOCK_SCHEDULE,
  phaseLabel = "Build Phase",
  onComplete,
}: CalendarScreenProps) {
  const [showCoachText, setShowCoachText] = useState(false);
  const [showButton, setShowButton] = useState(false);

  // Show coach text after calendar animation completes
  const handleCalendarAnimationComplete = useCallback(() => {
    setShowCoachText(true);
  }, []);

  // Show button after streaming text completes
  const handleStreamingComplete = useCallback(() => {
    setShowButton(true);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar widget - shows first */}
        <View style={styles.calendarSection}>
          <CalendarWidget
            schedule={schedule}
            phaseLabel={phaseLabel}
            animate={true}
            onAnimationComplete={handleCalendarAnimationComplete}
          />
        </View>

        {/* Coach streaming text - appears after calendar animation */}
        {showCoachText && (
          <Animated.View
            entering={FadeIn.duration(400)}
            style={styles.coachSection}
          >
            <StreamingText
              phrases={COACH_PHRASES}
              charDelay={18}
              defaultPause={300}
              initialDelay={200}
              onComplete={handleStreamingComplete}
            />
          </Animated.View>
        )}
      </ScrollView>

      {/* Continue button */}
      {showButton && onComplete && (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.buttonContainer}
        >
          <Btn label="See projections" onPress={onComplete} />
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
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  calendarSection: {
    marginBottom: 24,
  },
  coachSection: {
    paddingHorizontal: 8,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    paddingBottom: 48,
    backgroundColor: COLORS.black,
  },
});

// =============================================================================
// Export Types
// =============================================================================

export type { SessionData } from "../viz/CalendarWidget";

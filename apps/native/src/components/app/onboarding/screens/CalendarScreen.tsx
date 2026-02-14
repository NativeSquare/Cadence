/**
 * CalendarScreen Component - Coach commentary + weekly calendar visualization.
 *
 * Displays streaming coach text with CalendarWidget below.
 * Part of the plan generation flow in onboarding.
 *
 * Source: Story 3.3 - AC#6
 * Reference: cadence-v3.jsx lines 823-858
 */

import { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
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
// Coach Phrases
// =============================================================================

const COACH_PHRASES_DATA: StreamPhrase[] = [
  {
    text: "Three key sessions anchor your week.",
    pauseAfter: 600,
    haptic: "insight",
  },
  {
    text: "The rest is recovery.",
    pauseAfter: 400,
  },
  {
    text: "And yes — two actual rest days. Non-negotiable.",
    haptic: "arrival",
  },
];

const COACH_PHRASES_NO_DATA: StreamPhrase[] = [
  {
    text: "Based on your input, here's a sustainable structure.",
    pauseAfter: 600,
    haptic: "insight",
  },
  {
    text: "Three quality sessions. Two full rest days.",
    pauseAfter: 400,
  },
  {
    text: "We'll refine this as we learn more about you.",
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
  const [showButton, setShowButton] = useState(false);
  const coachPhrases =
    mockPath === "no-data" ? COACH_PHRASES_NO_DATA : COACH_PHRASES_DATA;

  const handleStreamingComplete = useCallback(() => {
    // Show button after streaming and animation complete
    setTimeout(() => setShowButton(true), 800);
  }, []);

  return (
    <View style={styles.container}>
      {/* Coach streaming text */}
      <View style={styles.coachSection}>
        <StreamingText
          phrases={coachPhrases}
          charDelay={14}
          defaultPause={400}
          initialDelay={300}
          onComplete={handleStreamingComplete}
        />
      </View>

      {/* Calendar widget */}
      <View style={styles.calendarSection}>
        <CalendarWidget
          schedule={schedule}
          phaseLabel={phaseLabel}
          animate={true}
        />
      </View>

      {/* Continue button */}
      {showButton && onComplete && (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.buttonContainer}
        >
          <Btn label="See the projection" onPress={onComplete} />
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
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  coachSection: {
    marginBottom: 32,
  },
  calendarSection: {
    flex: 1,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 48,
    backgroundColor: COLORS.black,
  },
});

// =============================================================================
// Export Types
// =============================================================================

export type { SessionData } from "../viz/CalendarWidget";

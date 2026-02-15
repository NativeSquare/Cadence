/**
 * CalendarWidget Component - 7-day weekly training schedule visualization.
 *
 * Displays: Mon-Sun session cards with type, duration, and key/rest styling.
 * Features: Staggered scaleIn animation, lime accents for key sessions.
 *
 * Source: Story 3.3 - AC#1-#5, #7
 * Reference: cadence-v3.jsx lines 823-858
 */

import React from "react";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { useScaleIn } from "@/lib/use-animations";
import { COLORS, GRAYS, SURFACES } from "@/lib/design-tokens";

// =============================================================================
// Types
// =============================================================================

export type DayAbbrev = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export interface SessionData {
  day: DayAbbrev;
  type: "Tempo" | "Easy" | "Intervals" | "Long Run" | "Rest" | string;
  duration: number | null; // minutes, null for rest
  isKey?: boolean;
  isRest?: boolean;
}

export interface CalendarWidgetProps {
  /** Array of 7 session data points for Mon-Sun */
  schedule: SessionData[];
  /** Phase label displayed in header (e.g., "Build Phase") */
  phaseLabel?: string;
  /** Whether to animate on mount (default: true) */
  animate?: boolean;
  /** Callback when animation completes */
  onAnimationComplete?: () => void;
}

// =============================================================================
// Constants
// =============================================================================

const DAY_LABELS: DayAbbrev[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CARD_STAGGER_MS = 40;
const CARD_ANIMATION_MS = 300;

// =============================================================================
// SessionCard Component
// =============================================================================

interface SessionCardProps {
  session: SessionData;
  index: number;
  animate: boolean;
}

function SessionCard({ session, index, animate }: SessionCardProps) {
  const delay = index * CARD_STAGGER_MS;
  const animatedStyle = useScaleIn(animate, delay, CARD_ANIMATION_MS);

  const isKey = session.isKey ?? false;
  const isRest = session.isRest ?? session.type === "Rest";

  // Format duration as "50m" per prototype
  const durationLabel = session.duration !== null ? `${session.duration}m` : "—";

  return (
    <Animated.View style={[styles.cardWrapper, animatedStyle]}>
      <View
        style={[
          styles.card,
          isKey && styles.cardKey,
          isRest && styles.cardRest,
        ]}
      >
        {/* Key session indicator dot - inside content flow per prototype */}
        {isKey && <View style={styles.keyDot} />}

        {/* Session type */}
        <Text
          style={[
            styles.sessionType,
            isKey && styles.sessionTypeKey,
            isRest && styles.sessionTypeRest,
          ]}
          numberOfLines={2}
        >
          {session.type}
        </Text>

        {/* Duration (hidden for rest days) */}
        {!isRest && session.duration !== null && (
          <Text style={styles.duration}>{durationLabel}</Text>
        )}
      </View>
    </Animated.View>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function CalendarWidget({
  schedule,
  phaseLabel = "Build Phase",
  animate = true,
  onAnimationComplete,
}: CalendarWidgetProps) {
  // Trigger callback after last card animation completes
  React.useEffect(() => {
    if (animate && onAnimationComplete) {
      const totalDuration = (schedule.length - 1) * CARD_STAGGER_MS + CARD_ANIMATION_MS + 100;
      const timer = setTimeout(onAnimationComplete, totalDuration);
      return () => clearTimeout(timer);
    }
  }, [animate, onAnimationComplete, schedule.length]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.header}>Typical Week — {phaseLabel}</Text>
      </View>

      {/* Day labels row */}
      <View style={styles.dayLabelsRow}>
        {DAY_LABELS.map((day) => (
          <View key={day} style={styles.dayLabelWrapper}>
            <Text style={styles.dayLabel}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Session cards row */}
      <View style={styles.cardsRow}>
        {schedule.map((session, index) => (
          <SessionCard
            key={session.day}
            session={session}
            index={index}
            animate={animate}
          />
        ))}
      </View>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    paddingHorizontal: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  header: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 10,
    color: GRAYS.g3,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  dayLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 4,
    marginBottom: 4,
  },
  dayLabelWrapper: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
  },
  dayLabel: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 9,
    color: GRAYS.g4,
    letterSpacing: 0.6,
  },
  cardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 4,
  },
  cardWrapper: {
    flex: 1,
  },
  card: {
    minHeight: 72,
    backgroundColor: SURFACES.card,
    borderWidth: 1,
    borderColor: SURFACES.brd,
    borderRadius: 10,
    padding: 8,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  cardKey: {
    borderColor: "rgba(200,255,0,0.3)",
    backgroundColor: "rgba(200,255,0,0.06)",
  },
  cardRest: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  keyDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.lime,
    marginBottom: 1,
  },
  sessionType: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 10,
    color: GRAYS.g3,
    textAlign: "center",
    lineHeight: 13,
  },
  sessionTypeKey: {
    color: COLORS.lime,
  },
  sessionTypeRest: {
    color: GRAYS.g4,
    fontFamily: "Outfit-Regular",
  },
  duration: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 8,
    color: GRAYS.g4,
  },
});

// =============================================================================
// Mock Data Export
// =============================================================================

/** Mock weekly schedule matching prototype (cadence-v3.jsx lines 826-829) */
export const CALENDAR_MOCK_SCHEDULE: SessionData[] = [
  { day: "Mon", type: "Tempo", duration: 50, isKey: true },
  { day: "Tue", type: "Easy", duration: 40, isKey: false },
  { day: "Wed", type: "Intervals", duration: 55, isKey: true },
  { day: "Thu", type: "Rest", duration: null, isRest: true },
  { day: "Fri", type: "Easy", duration: 35, isKey: false },
  { day: "Sat", type: "Rest", duration: null, isRest: true },
  { day: "Sun", type: "Long Run", duration: 90, isKey: true },
];

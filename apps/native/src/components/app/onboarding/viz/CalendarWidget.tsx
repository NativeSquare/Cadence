/**
 * CalendarWidget Component - 7-day weekly training schedule visualization.
 *
 * Displays: Mon-Sun session cards with type, duration, and key/rest styling.
 * Features: Staggered scaleIn animation, lime accents for key sessions.
 *
 * Source: Story 3.3 - AC#1-#5, #7
 * Reference: cadence-v3.jsx lines 823-858
 */

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
}

// =============================================================================
// Constants
// =============================================================================

const DAY_ABBREVS = ["M", "T", "W", "T", "F", "S", "S"] as const;
const CARD_STAGGER_MS = 80;
const CARD_ANIMATION_MS = 300;

// =============================================================================
// SessionCard Component
// =============================================================================

interface SessionCardProps {
  session: SessionData;
  dayAbbrev: string;
  index: number;
  animate: boolean;
}

function SessionCard({ session, dayAbbrev, index, animate }: SessionCardProps) {
  const delay = index * CARD_STAGGER_MS;
  const animatedStyle = useScaleIn(animate, delay, CARD_ANIMATION_MS);

  const isKey = session.isKey ?? false;
  const isRest = session.isRest ?? session.type === "Rest";

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        animatedStyle,
      ]}
    >
      {/* Day abbreviation */}
      <Text style={styles.dayLabel}>{dayAbbrev}</Text>

      {/* Session card */}
      <View
        style={[
          styles.card,
          isKey && styles.cardKey,
          isRest && styles.cardRest,
        ]}
      >
        {/* Key session indicator dot */}
        {isKey && <View style={styles.keyDot} />}

        {/* Session type */}
        <Text
          style={[
            styles.sessionType,
            isRest && styles.sessionTypeRest,
          ]}
          numberOfLines={2}
        >
          {session.type}
        </Text>

        {/* Duration (hidden for rest days) */}
        {!isRest && session.duration !== null && (
          <Text style={styles.duration}>{session.duration} min</Text>
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
}: CalendarWidgetProps) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>Typical Week — {phaseLabel}</Text>

      {/* 7-column grid */}
      <View style={styles.grid}>
        {schedule.map((session, index) => (
          <SessionCard
            key={session.day}
            session={session}
            dayAbbrev={DAY_ABBREVS[index]}
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
    paddingHorizontal: 4,
  },
  header: {
    fontFamily: "Outfit-Medium",
    fontSize: 14,
    color: GRAYS.g2,
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  cardWrapper: {
    flex: 1,
    alignItems: "center",
  },
  dayLabel: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 10,
    color: GRAYS.g3,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  card: {
    flex: 1,
    width: "100%",
    minHeight: 72,
    backgroundColor: SURFACES.card,
    borderWidth: 1,
    borderColor: SURFACES.brd,
    borderRadius: 8,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  cardKey: {
    borderColor: COLORS.lime,
    borderWidth: 1.5,
  },
  cardRest: {
    opacity: 0.5,
    borderColor: "transparent",
  },
  keyDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.lime,
  },
  sessionType: {
    fontFamily: "Outfit-Medium",
    fontSize: 11,
    color: GRAYS.g1,
    textAlign: "center",
    lineHeight: 14,
  },
  sessionTypeRest: {
    color: GRAYS.g3,
  },
  duration: {
    fontFamily: "JetBrainsMono-Regular",
    fontSize: 9,
    color: GRAYS.g2,
    marginTop: 4,
  },
});

// =============================================================================
// Mock Data Export
// =============================================================================

/** Mock weekly schedule for balanced training week */
export const CALENDAR_MOCK_SCHEDULE: SessionData[] = [
  { day: "Mon", type: "Tempo", duration: 45, isKey: true },
  { day: "Tue", type: "Easy", duration: 35, isKey: false },
  { day: "Wed", type: "Intervals", duration: 50, isKey: true },
  { day: "Thu", type: "Rest", duration: null, isRest: true },
  { day: "Fri", type: "Easy", duration: 40, isKey: false },
  { day: "Sat", type: "Rest", duration: null, isRest: true },
  { day: "Sun", type: "Long Run", duration: 75, isKey: true },
];

/**
 * CalendarWidget Component - Vertical expandable day cards layout.
 *
 * Displays: Mon-Sun as expandable cards with session details.
 * Features: springUp entrance animation, tap-to-expand, summary strip.
 *
 * Source: cadence-calendar-v2.jsx prototype
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  Easing,
  FadeIn,
} from "react-native-reanimated";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { Text } from "@/components/ui/text";
import { COLORS, GRAYS, SURFACES } from "@/lib/design-tokens";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// =============================================================================
// Types
// =============================================================================

export type DayAbbrev = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export interface SessionData {
  day: string;
  short: DayAbbrev;
  type: "Tempo" | "Easy" | "Intervals" | "Long Run" | "Rest" | string;
  dur: string;
  effort: string;
  key: boolean;
  color: string;
  colorDim: string;
  pace?: string;
  desc?: string;
  structure?: string;
  why?: string;
  rest?: boolean;
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

const SPRING_CONFIG = {
  damping: 18,
  stiffness: 180,
  mass: 1,
};

// =============================================================================
// Icons
// =============================================================================

function ClockIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Circle cx={7} cy={7} r={6} stroke={GRAYS.g4} strokeWidth={1} />
      <Path
        d="M7 3.5V7L9.5 8.5"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function StructureIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Rect x={1} y={3} width={12} height={8} rx={2} stroke={GRAYS.g4} strokeWidth={1} />
      <Path d="M4 3V1.5M10 3V1.5" stroke={GRAYS.g4} strokeWidth={1} strokeLinecap="round" />
      <Path d="M1 6H13" stroke={GRAYS.g4} strokeWidth={1} />
    </Svg>
  );
}

function InfoIcon({ color }: { color: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
      <Circle cx={6} cy={6} r={5} stroke={color} strokeWidth={1} />
      <Path d="M6 4V6.5M6 8.5V8" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
    </Svg>
  );
}

// =============================================================================
// DayCard Component
// =============================================================================

interface DayCardProps {
  session: SessionData;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  animate: boolean;
}

function DayCard({ session, index, expanded, onToggle, animate }: DayCardProps) {
  const { short, type, dur, effort, key, color, colorDim, pace, desc, structure, why, rest } =
    session;

  const [pressed, setPressed] = useState(false);

  // Entrance animation
  const entrance = useSharedValue(animate ? 0 : 1);
  const translateY = useSharedValue(animate ? 24 : 0);

  useEffect(() => {
    if (animate) {
      const delay = index * 50;
      entrance.value = withDelay(delay, withTiming(1, { duration: 350 }));
      translateY.value = withDelay(
        delay,
        withSpring(0, SPRING_CONFIG)
      );
    }
  }, [animate, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ translateY: translateY.value }],
  }));

  const handlePress = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  }, [onToggle]);

  return (
    <Animated.View style={animatedStyle}>
      {/* Collapsed row */}
      <Pressable
        onPress={handlePress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={[
          styles.cardButton,
          expanded && (key ? styles.cardButtonExpandedKey : styles.cardButtonExpanded),
          !expanded && styles.cardButtonCollapsed,
          { transform: [{ scale: pressed ? 0.985 : 1 }] },
        ]}
      >
        {/* Day label */}
        <View
          style={[
            styles.dayBadge,
            rest ? styles.dayBadgeRest : { backgroundColor: colorDim, borderColor: `${color}20` },
          ]}
        >
          <Text
            style={[
              styles.dayBadgeText,
              { color: rest ? GRAYS.g4 : color },
            ]}
          >
            {short}
          </Text>
        </View>

        {/* Session info */}
        <View style={styles.sessionInfo}>
          <View style={styles.sessionTitleRow}>
            <Text
              style={[
                styles.sessionType,
                rest && styles.sessionTypeRest,
              ]}
            >
              {type}
            </Text>
            {key && <View style={styles.keyDot} />}
          </View>
          <Text style={styles.sessionMeta}>
            {dur}
            {!rest && ` · Effort ${effort}`}
          </Text>
        </View>

        {/* Expand arrow */}
        <View
          style={[
            styles.expandButton,
            expanded && (key ? styles.expandButtonExpandedKey : styles.expandButtonExpanded),
          ]}
        >
          <Text
            style={[
              styles.expandArrow,
              expanded && (key ? styles.expandArrowExpandedKey : styles.expandArrowExpanded),
              { transform: [{ rotate: expanded ? "180deg" : "0deg" }] },
            ]}
          >
            ▾
          </Text>
        </View>
      </Pressable>

      {/* Expanded detail */}
      {expanded && (
        <View
          style={[
            styles.expandedContent,
            key ? styles.expandedContentKey : styles.expandedContentNormal,
          ]}
        >
          {/* Divider */}
          <View style={[styles.divider, key && styles.dividerKey]} />

          {/* Description */}
          {desc && <Text style={styles.description}>{desc}</Text>}

          {/* Pace */}
          {pace && (
            <View style={styles.dataRow}>
              <View style={styles.dataIconWrapper}>
                <ClockIcon color={color} />
              </View>
              <View>
                <Text style={styles.dataLabel}>Target Pace</Text>
                <Text style={styles.dataValue}>{pace}</Text>
              </View>
            </View>
          )}

          {/* Structure */}
          {structure && (
            <View style={styles.dataRow}>
              <View style={styles.dataIconWrapper}>
                <StructureIcon />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dataLabel}>Structure</Text>
                <Text style={styles.structureValue}>{structure}</Text>
              </View>
            </View>
          )}

          {/* Why this session */}
          {why && (
            <View style={[styles.whyBox, key && styles.whyBoxKey]}>
              <View style={styles.whyHeader}>
                <InfoIcon color={key ? COLORS.lime : GRAYS.g4} />
                <Text style={[styles.whyLabel, key && styles.whyLabelKey]}>
                  Why this session
                </Text>
              </View>
              <Text style={styles.whyText}>{why}</Text>
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
}

// =============================================================================
// Summary Strip Component
// =============================================================================

interface SummaryStripProps {
  keyCount: number;
  easyCount: number;
  restCount: number;
}

function SummaryStrip({ keyCount, easyCount, restCount }: SummaryStripProps) {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.summaryStrip}>
      <View style={[styles.summaryBox, styles.summaryBoxKey]}>
        <Text style={styles.summaryNumber}>{keyCount}</Text>
        <Text style={styles.summaryLabel}>KEY SESSIONS</Text>
      </View>
      <View style={styles.summaryBox}>
        <Text style={styles.summaryNumberNormal}>{easyCount}</Text>
        <Text style={styles.summaryLabel}>EASY RUNS</Text>
      </View>
      <View style={styles.summaryBox}>
        <Text style={styles.summaryNumberNormal}>{restCount}</Text>
        <Text style={styles.summaryLabel}>REST DAYS</Text>
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
  const [expanded, setExpanded] = useState<number | null>(null);

  // Calculate counts
  const keyCount = schedule.filter((s) => s.key).length;
  const restCount = schedule.filter((s) => s.rest).length;
  const easyCount = 7 - keyCount - restCount;

  // Trigger animation complete callback
  useEffect(() => {
    if (animate) {
      // Call completion callback after cards animate in
      const completeTimer = setTimeout(() => {
        onAnimationComplete?.();
      }, schedule.length * 50 + 600);

      return () => {
        clearTimeout(completeTimer);
      };
    }
  }, [animate, onAnimationComplete, schedule.length]);

  const handleToggle = useCallback((index: number) => {
    setExpanded((prev) => (prev === index ? null : index));
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.header}>Typical Week — {phaseLabel}</Text>
      </View>

      {/* Summary strip - shown immediately before cards */}
      <SummaryStrip keyCount={keyCount} easyCount={easyCount} restCount={restCount} />

      {/* Day cards */}
      <View style={styles.cardsList}>
        {schedule.map((session, index) => (
          <DayCard
            key={session.day}
            session={session}
            index={index}
            expanded={expanded === index}
            onToggle={() => handleToggle(index)}
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
    flex: 1,
  },
  headerRow: {
    marginBottom: 6,
    paddingHorizontal: 8,
  },
  header: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 10,
    color: GRAYS.g3,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  // Summary Strip
  summaryStrip: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  summaryBox: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    backgroundColor: GRAYS.g6,
    borderWidth: 1,
    borderColor: SURFACES.brd,
    alignItems: "center",
  },
  summaryBoxKey: {
    backgroundColor: COLORS.limeDim,
    borderColor: "rgba(200,255,0,0.12)",
  },
  summaryNumber: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 18,
    color: COLORS.lime,
  },
  summaryNumberNormal: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 18,
    color: GRAYS.g2,
  },
  summaryLabel: {
    fontFamily: "JetBrainsMono-Regular",
    fontSize: 9,
    color: GRAYS.g3,
    letterSpacing: 0.4,
  },
  // Cards list
  cardsList: {
    gap: 6,
  },
  // Card button (collapsed state)
  cardButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SURFACES.brd,
    backgroundColor: SURFACES.card,
  },
  cardButtonCollapsed: {
    borderRadius: 16,
  },
  cardButtonExpanded: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
    backgroundColor: SURFACES.card,
  },
  cardButtonExpandedKey: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
    borderColor: SURFACES.sb,
    backgroundColor: SURFACES.sg,
  },
  // Day badge
  dayBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayBadgeRest: {
    backgroundColor: "transparent",
    borderColor: GRAYS.g5,
    borderStyle: "dashed",
  },
  dayBadgeText: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 10,
    letterSpacing: 0.4,
  },
  // Session info
  sessionInfo: {
    flex: 1,
  },
  sessionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sessionType: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 16,
    color: GRAYS.g1,
  },
  sessionTypeRest: {
    fontFamily: "Outfit-Regular",
    color: GRAYS.g4,
  },
  keyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.lime,
  },
  sessionMeta: {
    fontFamily: "JetBrainsMono-Regular",
    fontSize: 11,
    color: GRAYS.g4,
    letterSpacing: 0.2,
  },
  // Expand button
  expandButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: GRAYS.g6,
    alignItems: "center",
    justifyContent: "center",
  },
  expandButtonExpanded: {
    backgroundColor: GRAYS.g6,
  },
  expandButtonExpandedKey: {
    backgroundColor: COLORS.limeDim,
  },
  expandArrow: {
    fontFamily: "JetBrainsMono-Regular",
    fontSize: 13,
    color: GRAYS.g4,
    lineHeight: 16,
  },
  expandArrowExpanded: {
    color: GRAYS.g2,
  },
  expandArrowExpandedKey: {
    color: COLORS.lime,
  },
  // Expanded content
  expandedContent: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  expandedContentNormal: {
    borderColor: SURFACES.brd,
    backgroundColor: SURFACES.card,
  },
  expandedContentKey: {
    borderColor: SURFACES.sb,
    backgroundColor: SURFACES.sg,
  },
  divider: {
    height: 1,
    backgroundColor: SURFACES.brd,
    marginBottom: 16,
  },
  dividerKey: {
    backgroundColor: "rgba(200,255,0,0.1)",
  },
  description: {
    fontFamily: "Outfit-Light",
    fontSize: 14,
    color: GRAYS.g2,
    lineHeight: 22,
    marginBottom: 16,
  },
  // Data rows
  dataRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  dataIconWrapper: {
    width: 32,
    alignItems: "center",
    paddingTop: 2,
  },
  dataLabel: {
    fontFamily: "JetBrainsMono-Regular",
    fontSize: 9,
    color: GRAYS.g4,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  dataValue: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 13,
    color: GRAYS.g1,
  },
  structureValue: {
    fontFamily: "Outfit-Regular",
    fontSize: 13,
    color: GRAYS.g2,
    lineHeight: 20,
  },
  // Why box
  whyBox: {
    marginTop: 12,
    padding: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: SURFACES.brd,
  },
  whyBoxKey: {
    backgroundColor: "rgba(200,255,0,0.04)",
    borderColor: "rgba(200,255,0,0.08)",
  },
  whyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  whyLabel: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 9,
    color: GRAYS.g4,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  whyLabelKey: {
    color: COLORS.lime,
  },
  whyText: {
    fontFamily: "Outfit-Light",
    fontSize: 13,
    color: GRAYS.g3,
    lineHeight: 20,
  },
});

// =============================================================================
// Mock Data Export - Full session details per prototype
// =============================================================================

export const CALENDAR_MOCK_SCHEDULE: SessionData[] = [
  {
    day: "Monday",
    short: "Mon",
    type: "Tempo",
    dur: "50 min",
    effort: "7/10",
    key: true,
    color: COLORS.lime,
    colorDim: COLORS.limeDim,
    pace: "4:55–5:05/km",
    desc: "Sustained effort at comfortably hard pace. This builds your lactate threshold — the pace you can hold without accumulating fatigue.",
    structure: "10 min warm-up → 30 min tempo → 10 min cool-down",
    why: "Monday tempo sets the tone for the week. You're fresh from the weekend, mentally sharp. The effort is high but controlled.",
  },
  {
    day: "Tuesday",
    short: "Tue",
    type: "Easy",
    dur: "40 min",
    effort: "3/10",
    key: false,
    color: GRAYS.g3,
    colorDim: GRAYS.g6,
    pace: "5:55–6:10/km",
    desc: "Truly easy. Conversational pace. If you can't hold a full conversation, you're going too fast.",
    structure: "40 min continuous easy running",
    why: "Active recovery from yesterday's tempo. Blood flow without stress. This is where your body actually absorbs the training.",
  },
  {
    day: "Wednesday",
    short: "Wed",
    type: "Intervals",
    dur: "55 min",
    effort: "8/10",
    key: true,
    color: COLORS.lime,
    colorDim: COLORS.limeDim,
    pace: "4:30–4:45/km (work intervals)",
    desc: "Short, fast repeats with recovery jogs. This builds your VO2max — the ceiling of your aerobic engine.",
    structure: "15 min warm-up → 6 × 800m @ 4:35 (90s jog recovery) → 10 min cool-down",
    why: "Mid-week intensity spike. Far enough from Sunday's long run to recover properly, early enough to not interfere with it.",
  },
  {
    day: "Thursday",
    short: "Thu",
    type: "Rest",
    dur: "—",
    effort: "0/10",
    key: false,
    color: GRAYS.g4,
    colorDim: "transparent",
    rest: true,
    desc: "Complete rest. No cross-training, no 'just a short jog.' Your muscles rebuild when you stop asking them to work.",
    why: "After two quality days (tempo + intervals), your body needs silence. This isn't laziness — it's strategy.",
  },
  {
    day: "Friday",
    short: "Fri",
    type: "Easy",
    dur: "35 min",
    effort: "2/10",
    key: false,
    color: GRAYS.g3,
    colorDim: GRAYS.g6,
    pace: "6:00–6:15/km",
    desc: "Shorter and slower than Tuesday's easy run. Just enough to stay loose before the weekend.",
    structure: "35 min continuous easy running",
    why: "Pre-long-run shakeout. Opens up the legs without draining them.",
  },
  {
    day: "Saturday",
    short: "Sat",
    type: "Rest",
    dur: "—",
    effort: "0/10",
    key: false,
    color: GRAYS.g4,
    colorDim: "transparent",
    rest: true,
    desc: "Second rest day. Non-negotiable. You need two — not one — genuine rest days per week given your recovery profile.",
    why: "With only 3 rest days last month, you were accumulating fatigue. Two rest days isn't a luxury, it's a correction.",
  },
  {
    day: "Sunday",
    short: "Sun",
    type: "Long Run",
    dur: "90 min",
    effort: "5/10",
    key: true,
    color: COLORS.lime,
    colorDim: COLORS.limeDim,
    pace: "5:40–5:55/km",
    desc: "The cornerstone session. Builds endurance, mental toughness, and teaches your body to burn fat efficiently at pace.",
    structure: "90 min with last 20 min at half-marathon effort",
    why: "Sunday long runs are sacred in marathon/half training. The progressive finish teaches your legs to push when tired — exactly what race day demands.",
  },
];

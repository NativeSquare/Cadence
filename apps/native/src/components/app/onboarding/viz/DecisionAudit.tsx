/**
 * DecisionAudit Component - Expandable accordion for decision explanations.
 *
 * Shows: Question rows that expand to reveal justification text.
 * Features: Single-expand behavior, arrow rotation, lime accent on expand.
 *
 * Source: Story 3.4 - AC#6, #7, #8, #9
 * Reference: cadence-v3.jsx lines 864-913
 */

import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { useScaleIn, useSpringUp } from "@/lib/use-animations";
import { COLORS, GRAYS, SURFACES } from "@/lib/design-tokens";

// =============================================================================
// Types
// =============================================================================

export interface Decision {
  question: string;
  answer: string;
}

export interface DecisionAuditProps {
  /** Array of decision items */
  decisions: Decision[];
  /** Whether to show the section (can hide for NO DATA path) */
  show?: boolean;
  /** Whether to animate on mount */
  animate?: boolean;
  /** Animation delay in ms */
  delay?: number;
}

// =============================================================================
// Constants
// =============================================================================

const ROW_STAGGER_MS = 60;
const EXPAND_DURATION_MS = 200;

// =============================================================================
// DecisionRow Component
// =============================================================================

interface DecisionRowProps {
  decision: Decision;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  animate: boolean;
  baseDelay: number;
}

function DecisionRow({
  decision,
  index,
  isExpanded,
  onToggle,
  animate,
  baseDelay,
}: DecisionRowProps) {
  const delay = baseDelay + index * ROW_STAGGER_MS;
  const entranceStyle = useScaleIn(animate, delay, 300);

  // Arrow rotation animation
  const arrowStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: withTiming(isExpanded ? "90deg" : "0deg", {
            duration: EXPAND_DURATION_MS,
            easing: Easing.out(Easing.ease),
          }),
        },
      ],
    };
  }, [isExpanded]);

  // Content reveal animation
  const contentStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isExpanded ? 1 : 0, {
        duration: EXPAND_DURATION_MS,
        easing: Easing.out(Easing.ease),
      }),
      maxHeight: withTiming(isExpanded ? 200 : 0, {
        duration: EXPAND_DURATION_MS,
        easing: Easing.out(Easing.ease),
      }),
    };
  }, [isExpanded]);

  return (
    <Animated.View style={entranceStyle}>
      <Pressable
        onPress={onToggle}
        style={[
          styles.row,
          isExpanded && styles.rowExpanded,
        ]}
      >
        {/* Question row */}
        <View style={styles.questionRow}>
          <Animated.View style={arrowStyle}>
            <Text
              style={[
                styles.arrow,
                isExpanded && styles.arrowExpanded,
              ]}
            >
              ▸
            </Text>
          </Animated.View>
          <Text style={styles.question}>{decision.question}</Text>
        </View>

        {/* Answer (expandable) */}
        <Animated.View style={[styles.answerContainer, contentStyle]}>
          <Text style={styles.answer}>{decision.answer}</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function DecisionAudit({
  decisions,
  show = true,
  animate = true,
  delay = 0,
}: DecisionAuditProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const headerStyle = useSpringUp(animate && show, delay);

  if (!show) {
    return null;
  }

  const handleToggle = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <Animated.View style={headerStyle}>
        <Text style={styles.header}>DECISION AUDIT</Text>
      </Animated.View>

      {/* Decision Rows */}
      <View style={styles.rows}>
        {decisions.map((decision, index) => (
          <DecisionRow
            key={index}
            decision={decision}
            index={index}
            isExpanded={expandedIndex === index}
            onToggle={() => handleToggle(index)}
            animate={animate && show}
            baseDelay={delay + 200}
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
    marginTop: 24,
  },
  header: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 10,
    color: GRAYS.g3,
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  rows: {
    gap: 8,
  },
  row: {
    backgroundColor: SURFACES.card,
    borderWidth: 1,
    borderColor: SURFACES.brd,
    borderRadius: 10,
    padding: 14,
    overflow: "hidden",
  },
  rowExpanded: {
    borderColor: COLORS.lime,
    backgroundColor: COLORS.limeGlow,
  },
  questionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  arrow: {
    fontFamily: "JetBrainsMono-Regular",
    fontSize: 12,
    color: GRAYS.g3,
  },
  arrowExpanded: {
    color: COLORS.lime,
  },
  question: {
    fontFamily: "Outfit-Medium",
    fontSize: 14,
    color: GRAYS.g1,
    flex: 1,
  },
  answerContainer: {
    overflow: "hidden",
  },
  answer: {
    fontFamily: "Outfit-Regular",
    fontSize: 13,
    color: GRAYS.g2,
    lineHeight: 20,
    marginTop: 12,
    paddingLeft: 22,
  },
});

// =============================================================================
// Mock Data Export
// =============================================================================

/** Mock decision audit data */
export const DECISION_AUDIT_MOCK: Decision[] = [
  {
    question: "Why 8% volume cap instead of 10%?",
    answer:
      'Shin splint history + "push through" recovery = higher risk. Conservative loading now prevents breakdown later.',
  },
  {
    question: "Why two rest days?",
    answer:
      "Only 3 rest days last month = recovery debt. One isn't enough to rebuild.",
  },
  {
    question: "Why slow down easy pace?",
    answer:
      "Current 5:40 is above aerobic threshold. True recovery requires actually recovering.",
  },
];

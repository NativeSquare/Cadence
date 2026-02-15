/**
 * VerdictScreen Component - Final verdict with projection and decision audit.
 *
 * Displays: Coach intro, projection card, follow-up message, decision audit.
 * Features: Phased reveal pattern, path-dependent messaging and styling.
 *
 * Source: Story 3.4 - AC#1, #5, #10
 * Reference: cadence-v3.jsx lines 864-913
 */

import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Cursor } from "../Cursor";
import { useStream } from "@/hooks/use-stream";
import { useFadeUp } from "@/lib/use-animations";
import { GRAYS } from "@/lib/design-tokens";
import {
  ProjectionCard,
  PROJECTION_MOCK_DATA,
  PROJECTION_MOCK_NO_DATA,
} from "../viz/ProjectionCard";
import {
  DecisionAudit,
  DECISION_AUDIT_MOCK,
  type Decision,
} from "../viz/DecisionAudit";

// =============================================================================
// Types
// =============================================================================

export interface VerdictScreenProps {
  /** Mock path for path-specific messaging */
  mockPath?: "data" | "no-data";
  /** Custom projection data */
  projection?: {
    timeRange: [string, string];
    confidence: number;
    rangeLabel: string;
    explanationText?: string;
  };
  /** Custom decision audit data */
  decisions?: Decision[];
  /** Callback when user taps Continue */
  onComplete?: () => void;
}

// =============================================================================
// Phase Timing Constants
// =============================================================================

const PHASE_INTRO_START = 400;
const PHASE_CARD_START = 2200;
const PHASE_FOLLOWUP_START = 3800;
const PHASE_AUDIT_START = 5000;

// =============================================================================
// Coach Messages
// =============================================================================

const COACH_INTRO_DATA = "So here's where I think you land.";
const COACH_INTRO_NO_DATA = "Based on what you've told me, here's my best estimate.";

const COACH_FOLLOWUP_DATA = "The sub-1:45 isn't the ceiling — it's the floor.";
const COACH_FOLLOWUP_NO_DATA =
  "The first two weeks are calibration. After that, I'll know you.";

// =============================================================================
// Coach Message Component
// =============================================================================

interface CoachMessageProps {
  text: string;
  active: boolean;
  delay: number;
  /** Use intro style (larger, brighter) or follow-up style (smaller, dimmer) */
  variant?: "intro" | "followup";
}

function CoachMessage({ text, active, delay, variant = "intro" }: CoachMessageProps) {
  const { displayed, done, started } = useStream({
    text,
    speed: 28,
    delay,
    active,
  });

  if (!active && !started) {
    return null;
  }

  const textStyle = variant === "intro" ? styles.coachTextIntro : styles.coachTextFollowup;
  const cursorHeight = variant === "intro" ? 20 : 14;

  return (
    <View style={styles.coachMessage}>
      <Text style={textStyle}>{displayed}</Text>
      <Cursor visible={started && !done} height={cursorHeight} />
    </View>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function VerdictScreen({
  mockPath = "data",
  projection,
  decisions = DECISION_AUDIT_MOCK,
  onComplete,
}: VerdictScreenProps) {
  const hasData = mockPath === "data";

  // Phase state
  const [phase, setPhase] = useState(0);

  // Phase progression
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase(1), PHASE_INTRO_START));
    timers.push(setTimeout(() => setPhase(2), PHASE_CARD_START));
    timers.push(setTimeout(() => setPhase(3), PHASE_FOLLOWUP_START));
    timers.push(setTimeout(() => setPhase(4), PHASE_AUDIT_START));

    return () => timers.forEach(clearTimeout);
  }, []);

  // Get projection data based on path
  const projectionData = projection ?? (hasData ? PROJECTION_MOCK_DATA : PROJECTION_MOCK_NO_DATA);

  // Coach messages based on path
  const introText = hasData ? COACH_INTRO_DATA : COACH_INTRO_NO_DATA;
  const followupText = hasData ? COACH_FOLLOWUP_DATA : COACH_FOLLOWUP_NO_DATA;

  // Button animation
  const buttonStyle = useFadeUp(phase >= 4, 400);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Coach Intro */}
        <CoachMessage text={introText} active={phase >= 1} delay={0} variant="intro" />

        {/* Projection Card */}
        {phase >= 2 && (
          <View style={styles.cardSection}>
            <ProjectionCard
              timeRange={projectionData.timeRange}
              confidence={projectionData.confidence}
              rangeLabel={projectionData.rangeLabel}
              hasData={hasData}
              explanationText={
                "explanationText" in projectionData
                  ? (projectionData.explanationText as string)
                  : undefined
              }
              animate={true}
              delay={0}
            />
          </View>
        )}

        {/* Coach Follow-up */}
        {phase >= 3 && (
          <View style={styles.followupSection}>
            <CoachMessage text={followupText} active={phase >= 3} delay={0} variant="followup" />
          </View>
        )}

        {/* Decision Audit (DATA path only, or can show for both) */}
        {phase >= 4 && (
          <DecisionAudit
            decisions={decisions}
            show={hasData}
            animate={true}
            delay={0}
          />
        )}

        {/* Spacer for button */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Continue Button */}
      {phase >= 4 && (
        <Animated.View style={[styles.buttonContainer, buttonStyle]}>
          <Button
            onPress={onComplete}
            className="bg-lime h-14 rounded-xl"
          >
            <Text className="text-black font-semibold text-base">Continue</Text>
          </Button>
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32, // Per prototype padding: "0 32px"
    paddingTop: 70,
    paddingBottom: 100,
  },
  coachMessage: {
    flexDirection: "row",
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  // Intro style: larger, brighter (per prototype StreamBlock size={22})
  coachTextIntro: {
    fontFamily: "Outfit-Light",
    fontSize: 22,
    color: GRAYS.g1,
    lineHeight: 31, // ~1.4 ratio
    letterSpacing: -0.4, // -.02em
  },
  // Follow-up style: smaller, dimmer (per prototype StreamBlock size={16} color={T.g3})
  coachTextFollowup: {
    fontFamily: "Outfit-Light",
    fontSize: 16,
    color: GRAYS.g3,
    lineHeight: 22, // ~1.4 ratio
    letterSpacing: -0.3,
  },
  cardSection: {
    marginTop: 24,
  },
  followupSection: {
    marginTop: 24,
  },
  bottomSpacer: {
    height: 24,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 32, // Per prototype
    paddingBottom: 48, // Per prototype padding: "16px 32px 48px"
    paddingTop: 16,
    backgroundColor: "rgba(0,0,0,0.9)",
  },
});

// =============================================================================
// Re-exports
// =============================================================================

export type { Decision } from "../viz/DecisionAudit";
export {
  PROJECTION_MOCK_DATA,
  PROJECTION_MOCK_NO_DATA,
} from "../viz/ProjectionCard";
export { DECISION_AUDIT_MOCK } from "../viz/DecisionAudit";

/**
 * OpenQuestion Screen - Final freeform input.
 *
 * "Anything else you want me to know?" with pill shortcuts.
 *
 * Source: Story 2.12 - AC#17-#20
 */

import { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { StreamBlock } from "../StreamBlock";
import { FreeformInput } from "../generative/FreeformInput";
import { MiniAnalysis } from "../generative/MiniAnalysis";
import { COACH_PROMPTS, OPEN_QUESTION_PILLS, MOCK_DELAYS } from "../mocks/conversationMocks";

// =============================================================================
// Types
// =============================================================================

type Step = "intro" | "input" | "analysis" | "complete";

interface OpenQuestionScreenProps {
  onComplete: (data: { additionalInfo?: string; skipped?: boolean }) => void;
}

// =============================================================================
// Component
// =============================================================================

export function OpenQuestionScreen({ onComplete }: OpenQuestionScreenProps) {
  const [step, setStep] = useState<Step>("intro");
  const [freeformText, setFreeformText] = useState<string | null>(null);

  const handleIntroComplete = useCallback(() => {
    setTimeout(() => {
      setStep("input");
    }, MOCK_DELAYS.choicesDelay);
  }, []);

  const handlePillSelect = useCallback(
    (pill: string) => {
      if (pill === OPEN_QUESTION_PILLS[0]) {
        // "No, that covers it" - skip
        setStep("complete");
        setTimeout(() => {
          onComplete({ skipped: true });
        }, 1200);
      } else {
        // "One more thing..." - keep input open, no action needed
      }
    },
    [onComplete]
  );

  const handleSubmit = useCallback((text: string) => {
    setFreeformText(text);
    setStep("analysis");
  }, []);

  const handleAnalysisDone = useCallback(() => {
    setTimeout(() => {
      setStep("complete");
      setTimeout(() => {
        onComplete({ additionalInfo: freeformText! });
      }, 800);
    }, 600);
  }, [freeformText, onComplete]);

  return (
    <View style={styles.container}>
      {/* Intro */}
      {step === "intro" && (
        <StreamBlock
          text={COACH_PROMPTS.openQuestion.intro}
          delay={MOCK_DELAYS.coachStreamDelay}
          onDone={handleIntroComplete}
        />
      )}

      {/* Freeform Input with pills */}
      {step === "input" && (
        <Animated.View entering={FadeIn} style={styles.inputSection}>
          <FreeformInput
            placeholder="Anything else I should know..."
            pills={[...OPEN_QUESTION_PILLS]}
            onSubmit={handleSubmit}
            onPill={handlePillSelect}
          />
        </Animated.View>
      )}

      {/* MiniAnalysis */}
      {step === "analysis" && freeformText && (
        <MiniAnalysis text={freeformText} onDone={handleAnalysisDone} />
      )}

      {/* Completion */}
      {step === "complete" && (
        <StreamBlock
          text={
            freeformText
              ? COACH_PROMPTS.openQuestion.freeformAck
              : COACH_PROMPTS.openQuestion.skipAck
          }
          size={20}
          onDone={() => {}}
        />
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
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  inputSection: {
    marginTop: 16,
  },
});

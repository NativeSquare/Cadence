/**
 * Goals Screen - Goal type and race details.
 *
 * Collects user's training goal and follow-up details.
 * Supports freeform "Something else" input with MiniAnalysis.
 *
 * Source: Story 2.12 - AC#6-#9
 */

import { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { StreamBlock } from "../StreamBlock";
import { Choice } from "../generative/Choice";
import { FreeformInput } from "../generative/FreeformInput";
import { MiniAnalysis } from "../generative/MiniAnalysis";
import { COACH_PROMPTS, GOALS_OPTIONS, MOCK_DELAYS } from "../mocks/conversationMocks";
import { getStaggerDelay } from "@/lib/animations";

// =============================================================================
// Types
// =============================================================================

type Step = "intro" | "goalType" | "raceDistance" | "raceDate" | "freeform" | "analysis" | "complete";

interface GoalsScreenProps {
  onComplete: (data: {
    goalType: string;
    raceDistance?: string;
    raceDate?: string;
    freeformGoal?: string;
  }) => void;
}

// =============================================================================
// Mock date options
// =============================================================================

const DATE_OPTIONS = [
  { value: "2026-04", label: "April 2026" },
  { value: "2026-05", label: "May 2026" },
  { value: "2026-06", label: "June 2026" },
  { value: "2026-09", label: "September 2026" },
  { value: "2026-10", label: "October 2026" },
];

// =============================================================================
// Component
// =============================================================================

export function GoalsScreen({ onComplete }: GoalsScreenProps) {
  const [step, setStep] = useState<Step>("intro");
  const [showChoices, setShowChoices] = useState(false);

  // Collected data
  const [goalType, setGoalType] = useState<string | null>(null);
  const [raceDistance, setRaceDistance] = useState<string | null>(null);
  const [raceDate, setRaceDate] = useState<string | null>(null);
  const [freeformText, setFreeformText] = useState<string | null>(null);

  const handleIntroComplete = useCallback(() => {
    setTimeout(() => {
      setStep("goalType");
      setShowChoices(true);
    }, MOCK_DELAYS.choicesDelay);
  }, []);

  const handleGoalSelect = useCallback((value: string) => {
    setGoalType(value);
    setShowChoices(false);

    if (value === "race") {
      // Show race distance follow-up
      setTimeout(() => {
        setStep("raceDistance");
        setShowChoices(true);
      }, MOCK_DELAYS.transitionDelay);
    } else if (value === "other") {
      // Show freeform input
      setTimeout(() => {
        setStep("freeform");
      }, MOCK_DELAYS.transitionDelay);
    } else {
      // Direct completion
      setTimeout(() => {
        setStep("complete");
        setTimeout(() => {
          onComplete({ goalType: value });
        }, 800);
      }, MOCK_DELAYS.transitionDelay);
    }
  }, [onComplete]);

  const handleDistanceSelect = useCallback((value: string) => {
    setRaceDistance(value);
    setShowChoices(false);
    setTimeout(() => {
      setStep("raceDate");
      setShowChoices(true);
    }, MOCK_DELAYS.transitionDelay);
  }, []);

  const handleDateSelect = useCallback((value: string) => {
    setRaceDate(value);
    setShowChoices(false);
    setTimeout(() => {
      setStep("complete");
      setTimeout(() => {
        onComplete({
          goalType: goalType!,
          raceDistance: raceDistance!,
          raceDate: value,
        });
      }, 800);
    }, MOCK_DELAYS.transitionDelay);
  }, [goalType, raceDistance, onComplete]);

  const handleFreeformSubmit = useCallback((text: string) => {
    setFreeformText(text);
    setStep("analysis");
  }, []);

  const handleAnalysisDone = useCallback(() => {
    setTimeout(() => {
      setStep("complete");
      setTimeout(() => {
        onComplete({
          goalType: "other",
          freeformGoal: freeformText!,
        });
      }, 800);
    }, 600);
  }, [freeformText, onComplete]);

  return (
    <View style={styles.container}>
      {/* Intro */}
      {step === "intro" && (
        <StreamBlock
          text={COACH_PROMPTS.goals.intro}
          delay={MOCK_DELAYS.coachStreamDelay}
          onDone={handleIntroComplete}
        />
      )}

      {/* Goal Type Selection */}
      {step === "goalType" && showChoices && (
        <Animated.View entering={FadeIn} style={styles.choices}>
          {GOALS_OPTIONS.goalType.map((option, index) => (
            <Choice
              key={option.value}
              label={option.label}
              selected={goalType === option.value}
              onSelect={() => handleGoalSelect(option.value)}
              delay={getStaggerDelay(index, 50) / 1000}
            />
          ))}
        </Animated.View>
      )}

      {/* Race Distance Follow-up */}
      {step === "raceDistance" && (
        <View style={styles.questionSection}>
          <StreamBlock
            text={COACH_PROMPTS.goals.raceDistance}
            size={20}
            onDone={() => {}}
          />
          {showChoices && (
            <Animated.View entering={FadeIn.delay(200)} style={styles.choices}>
              {GOALS_OPTIONS.raceDistance.map((option, index) => (
                <Choice
                  key={option.value}
                  label={option.label}
                  selected={raceDistance === option.value}
                  onSelect={() => handleDistanceSelect(option.value)}
                  delay={getStaggerDelay(index, 50) / 1000}
                />
              ))}
            </Animated.View>
          )}
        </View>
      )}

      {/* Race Date Follow-up */}
      {step === "raceDate" && (
        <View style={styles.questionSection}>
          <StreamBlock
            text={COACH_PROMPTS.goals.raceDate}
            size={20}
            onDone={() => {}}
          />
          {showChoices && (
            <Animated.View entering={FadeIn.delay(200)} style={styles.choices}>
              {DATE_OPTIONS.map((option, index) => (
                <Choice
                  key={option.value}
                  label={option.label}
                  selected={raceDate === option.value}
                  onSelect={() => handleDateSelect(option.value)}
                  delay={getStaggerDelay(index, 50) / 1000}
                />
              ))}
            </Animated.View>
          )}
        </View>
      )}

      {/* Freeform Input */}
      {step === "freeform" && (
        <Animated.View entering={FadeIn} style={styles.freeformSection}>
          <FreeformInput
            placeholder="Tell me about your goal..."
            onSubmit={handleFreeformSubmit}
          />
        </Animated.View>
      )}

      {/* MiniAnalysis */}
      {step === "analysis" && freeformText && (
        <MiniAnalysis text={freeformText} onDone={handleAnalysisDone} />
      )}

      {/* Completion acknowledgment */}
      {step === "complete" && (
        <StreamBlock
          text={goalType === "other" ? COACH_PROMPTS.goals.freeformAck : "Perfect. I'll build your plan around that."}
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
  questionSection: {
    gap: 24,
  },
  choices: {
    gap: 12,
  },
  freeformSection: {
    marginTop: 16,
  },
});

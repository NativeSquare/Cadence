/**
 * Health Screen - Injury history and recovery style.
 *
 * Multi-select injury history with "None" exclusivity.
 * Recovery style with flagged "Push through" option.
 *
 * Source: Story 2.12 - AC#10-#13
 */

import { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { StreamBlock } from "../StreamBlock";
import { Choice } from "../generative/Choice";
import { COACH_PROMPTS, HEALTH_OPTIONS, MOCK_DELAYS } from "../mocks/conversationMocks";
import { getStaggerDelay } from "@/lib/animations";

// =============================================================================
// Types
// =============================================================================

type Step = "intro" | "injuries" | "recovery" | "pushWarning" | "complete";

interface HealthScreenProps {
  onComplete: (data: {
    injuries: string[];
    recoveryStyle?: string;
  }) => void;
}

// =============================================================================
// Component
// =============================================================================

export function HealthScreen({ onComplete }: HealthScreenProps) {
  const [step, setStep] = useState<Step>("intro");
  const [showChoices, setShowChoices] = useState(false);

  // Collected data
  const [selectedInjuries, setSelectedInjuries] = useState<string[]>([]);
  const [recoveryStyle, setRecoveryStyle] = useState<string | null>(null);

  const handleIntroComplete = useCallback(() => {
    setTimeout(() => {
      setStep("injuries");
      setShowChoices(true);
    }, MOCK_DELAYS.choicesDelay);
  }, []);

  const handleInjuryToggle = useCallback((value: string) => {
    setSelectedInjuries((prev) => {
      // "None" is mutually exclusive
      if (value === "none") {
        return prev.includes("none") ? [] : ["none"];
      }

      // If selecting an injury, remove "none"
      const withoutNone = prev.filter((v) => v !== "none");

      if (prev.includes(value)) {
        return withoutNone.filter((v) => v !== value);
      } else {
        return [...withoutNone, value];
      }
    });
  }, []);

  const handleInjuriesConfirm = useCallback(() => {
    setShowChoices(false);

    // If "None" selected or no injuries, skip recovery question
    if (selectedInjuries.includes("none") || selectedInjuries.length === 0) {
      setTimeout(() => {
        setStep("complete");
        setTimeout(() => {
          onComplete({ injuries: selectedInjuries });
        }, 800);
      }, MOCK_DELAYS.transitionDelay);
    } else {
      // Show recovery style follow-up
      setTimeout(() => {
        setStep("recovery");
        setShowChoices(true);
      }, MOCK_DELAYS.transitionDelay);
    }
  }, [selectedInjuries, onComplete]);

  const handleRecoverySelect = useCallback(
    (value: string) => {
      setRecoveryStyle(value);
      setShowChoices(false);

      if (value === "push") {
        // Show push-through warning
        setTimeout(() => {
          setStep("pushWarning");
          setTimeout(() => {
            setStep("complete");
            setTimeout(() => {
              onComplete({
                injuries: selectedInjuries,
                recoveryStyle: value,
              });
            }, 800);
          }, 2500);
        }, MOCK_DELAYS.transitionDelay);
      } else {
        // Direct completion
        setTimeout(() => {
          setStep("complete");
          setTimeout(() => {
            onComplete({
              injuries: selectedInjuries,
              recoveryStyle: value,
            });
          }, 800);
        }, MOCK_DELAYS.transitionDelay);
      }
    },
    [selectedInjuries, onComplete]
  );

  const hasInjurySelections = selectedInjuries.length > 0;

  return (
    <View style={styles.container}>
      {/* Intro */}
      {step === "intro" && (
        <StreamBlock
          text={COACH_PROMPTS.health.intro}
          delay={MOCK_DELAYS.coachStreamDelay}
          onDone={handleIntroComplete}
        />
      )}

      {/* Injury Multi-Select */}
      {step === "injuries" && (
        <View style={styles.questionSection}>
          {showChoices && (
            <Animated.View entering={FadeIn} style={styles.choices}>
              {HEALTH_OPTIONS.injuries.map((option, index) => (
                <Choice
                  key={option.value}
                  label={option.label}
                  selected={selectedInjuries.includes(option.value)}
                  onSelect={() => handleInjuryToggle(option.value)}
                  multi
                  delay={getStaggerDelay(index, 50) / 1000}
                />
              ))}

              {/* Confirm button */}
              {hasInjurySelections && (
                <Animated.View entering={FadeIn.delay(300)}>
                  <Choice
                    label="Continue"
                    selected={false}
                    onSelect={handleInjuriesConfirm}
                    delay={0.4}
                  />
                </Animated.View>
              )}
            </Animated.View>
          )}
        </View>
      )}

      {/* Recovery Style */}
      {step === "recovery" && (
        <View style={styles.questionSection}>
          <StreamBlock
            text={COACH_PROMPTS.health.recoveryStyle}
            size={20}
            onDone={() => {}}
          />
          {showChoices && (
            <Animated.View entering={FadeIn.delay(200)} style={styles.choices}>
              {HEALTH_OPTIONS.recoveryStyle.map((option, index) => (
                <Choice
                  key={option.value}
                  label={option.label}
                  desc={option.desc}
                  selected={recoveryStyle === option.value}
                  onSelect={() => handleRecoverySelect(option.value)}
                  flagged={"flagged" in option ? option.flagged : false}
                  delay={getStaggerDelay(index, 50) / 1000}
                />
              ))}
            </Animated.View>
          )}
        </View>
      )}

      {/* Push Through Warning */}
      {step === "pushWarning" && (
        <View style={styles.warningSection}>
          <StreamBlock
            text={COACH_PROMPTS.health.pushThroughWarning}
            size={20}
            onDone={() => {}}
          />
        </View>
      )}

      {/* Completion */}
      {step === "complete" && (
        <StreamBlock
          text="Got it. I'll factor that into your plan."
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
  warningSection: {
    marginTop: 16,
  },
});

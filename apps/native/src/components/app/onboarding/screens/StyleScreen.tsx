/**
 * Style Screen - Coaching preferences.
 *
 * Collects coaching style and biggest challenge.
 *
 * Source: Story 2.12 - AC#14-#16
 */

import { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { StreamBlock } from "../StreamBlock";
import { Choice } from "../generative/Choice";
import { COACH_PROMPTS, STYLE_OPTIONS, MOCK_DELAYS } from "../mocks/conversationMocks";
import { getStaggerDelay } from "@/lib/animations";

// =============================================================================
// Types
// =============================================================================

type Step = "intro" | "coachingStyle" | "challenge" | "complete";

interface StyleScreenProps {
  onComplete: (data: {
    coachingStyle: string;
    biggestChallenge: string;
  }) => void;
}

// =============================================================================
// Component
// =============================================================================

export function StyleScreen({ onComplete }: StyleScreenProps) {
  const [step, setStep] = useState<Step>("intro");
  const [showChoices, setShowChoices] = useState(false);

  // Collected data
  const [coachingStyle, setCoachingStyle] = useState<string | null>(null);
  const [biggestChallenge, setBiggestChallenge] = useState<string | null>(null);

  const handleIntroComplete = useCallback(() => {
    setTimeout(() => {
      setStep("coachingStyle");
      setShowChoices(true);
    }, MOCK_DELAYS.choicesDelay);
  }, []);

  const handleStyleSelect = useCallback((value: string) => {
    setCoachingStyle(value);
    setShowChoices(false);
    setTimeout(() => {
      setStep("challenge");
      setShowChoices(true);
    }, MOCK_DELAYS.transitionDelay);
  }, []);

  const handleChallengeSelect = useCallback(
    (value: string) => {
      setBiggestChallenge(value);
      setShowChoices(false);
      setTimeout(() => {
        setStep("complete");
        setTimeout(() => {
          onComplete({
            coachingStyle: coachingStyle!,
            biggestChallenge: value,
          });
        }, 800);
      }, MOCK_DELAYS.transitionDelay);
    },
    [coachingStyle, onComplete]
  );

  return (
    <View style={styles.container}>
      {/* Intro */}
      {step === "intro" && (
        <StreamBlock
          text={COACH_PROMPTS.style.intro}
          delay={MOCK_DELAYS.coachStreamDelay}
          onDone={handleIntroComplete}
        />
      )}

      {/* Coaching Style */}
      {step === "coachingStyle" && showChoices && (
        <Animated.View entering={FadeIn} style={styles.choices}>
          {STYLE_OPTIONS.coachingStyle.map((option, index) => (
            <Choice
              key={option.value}
              label={option.label}
              desc={option.desc}
              selected={coachingStyle === option.value}
              onSelect={() => handleStyleSelect(option.value)}
              delay={getStaggerDelay(index, 50) / 1000}
            />
          ))}
        </Animated.View>
      )}

      {/* Biggest Challenge */}
      {step === "challenge" && (
        <View style={styles.questionSection}>
          <StreamBlock
            text={COACH_PROMPTS.style.challenge}
            size={20}
            onDone={() => {}}
          />
          {showChoices && (
            <Animated.View entering={FadeIn.delay(200)} style={styles.choices}>
              {STYLE_OPTIONS.biggestChallenge.map((option, index) => (
                <Choice
                  key={option.value}
                  label={option.label}
                  desc={option.desc}
                  selected={biggestChallenge === option.value}
                  onSelect={() => handleChallengeSelect(option.value)}
                  delay={getStaggerDelay(index, 50) / 1000}
                />
              ))}
            </Animated.View>
          )}
        </View>
      )}

      {/* Completion */}
      {step === "complete" && (
        <StreamBlock
          text="Perfect. I know how to talk to you now."
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
});

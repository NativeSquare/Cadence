/**
 * SelfReport Screen - NO DATA path for volume/frequency questions.
 *
 * Renders when user skipped wearable connection.
 * Collects weekly volume, days per week, and longest run.
 *
 * Source: Story 2.12 - AC#1-#5
 */

import { useState, useCallback } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { StreamBlock } from "../StreamBlock";
import { Choice } from "../generative/Choice";
import { ConfidenceBadge } from "../generative/ConfidenceBadge";
import {
  COACH_PROMPTS,
  SELF_REPORT_OPTIONS,
  MOCK_DELAYS,
} from "../mocks/conversationMocks";
import { GRAYS, COLORS, SURFACES } from "@/lib/design-tokens";
import { getStaggerDelay } from "@/lib/animations";

// =============================================================================
// Types
// =============================================================================

type Step = "intro" | "volume" | "days" | "longest" | "complete";

interface SelfReportScreenProps {
  /** Called when screen completes with collected data */
  onComplete: (data: {
    weeklyVolume: string;
    daysPerWeek: number;
    longestRun: string;
  }) => void;
  /** Current progress percentage */
  progress?: number;
}

// =============================================================================
// Component
// =============================================================================

export function SelfReportScreen({ onComplete }: SelfReportScreenProps) {
  const [step, setStep] = useState<Step>("intro");
  const [showChoices, setShowChoices] = useState(false);

  // Collected data
  const [weeklyVolume, setWeeklyVolume] = useState<string | null>(null);
  const [daysPerWeek, setDaysPerWeek] = useState<number | null>(null);
  const [longestRun, setLongestRun] = useState<string | null>(null);

  const handleIntroComplete = useCallback(() => {
    setTimeout(() => {
      setStep("volume");
      setShowChoices(true);
    }, MOCK_DELAYS.choicesDelay);
  }, []);

  const handleVolumeSelect = useCallback((value: string) => {
    setWeeklyVolume(value);
    setShowChoices(false);
    setTimeout(() => {
      setStep("days");
      setShowChoices(true);
    }, MOCK_DELAYS.transitionDelay);
  }, []);

  const handleDaysSelect = useCallback((value: number) => {
    setDaysPerWeek(value);
    setShowChoices(false);
    setTimeout(() => {
      setStep("longest");
      setShowChoices(true);
    }, MOCK_DELAYS.transitionDelay);
  }, []);

  const handleLongestSelect = useCallback(
    (value: string) => {
      setLongestRun(value);
      setShowChoices(false);
      setTimeout(() => {
        setStep("complete");
        // Fire completion after brief delay
        setTimeout(() => {
          onComplete({
            weeklyVolume: weeklyVolume!,
            daysPerWeek: daysPerWeek!,
            longestRun: value,
          });
        }, 1500);
      }, MOCK_DELAYS.transitionDelay);
    },
    [weeklyVolume, daysPerWeek, onComplete]
  );

  return (
    <View style={styles.container}>
      {/* Intro streaming */}
      {step === "intro" && (
        <StreamBlock
          text={COACH_PROMPTS.selfReport.intro}
          delay={MOCK_DELAYS.coachStreamDelay}
          onDone={handleIntroComplete}
        />
      )}

      {/* Weekly Volume Question */}
      {step === "volume" && (
        <View style={styles.questionSection}>
          <StreamBlock
            text={COACH_PROMPTS.selfReport.weeklyVolume}
            size={20}
            onDone={() => {}}
          />
          {showChoices && (
            <Animated.View entering={FadeIn.delay(200)} style={styles.choices}>
              {SELF_REPORT_OPTIONS.weeklyVolume.map((option, index) => (
                <Choice
                  key={option.value}
                  label={option.label}
                  selected={weeklyVolume === option.value}
                  onSelect={() => handleVolumeSelect(option.value)}
                  delay={getStaggerDelay(index, 50) / 1000}
                />
              ))}
            </Animated.View>
          )}
        </View>
      )}

      {/* Days Per Week Question */}
      {step === "days" && (
        <View style={styles.questionSection}>
          <StreamBlock
            text={COACH_PROMPTS.selfReport.daysPerWeek}
            size={20}
            onDone={() => {}}
          />
          {showChoices && (
            <Animated.View entering={FadeIn.delay(200)} style={styles.pillRow}>
              {SELF_REPORT_OPTIONS.daysPerWeek.map((day, index) => (
                <Pressable
                  key={day}
                  onPress={() => handleDaysSelect(day)}
                  style={[
                    styles.dayPill,
                    daysPerWeek === day && styles.dayPillSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayPillText,
                      daysPerWeek === day && styles.dayPillTextSelected,
                    ]}
                  >
                    {day}
                  </Text>
                </Pressable>
              ))}
            </Animated.View>
          )}
        </View>
      )}

      {/* Longest Run Question */}
      {step === "longest" && (
        <View style={styles.questionSection}>
          <StreamBlock
            text={COACH_PROMPTS.selfReport.longestRun}
            size={20}
            onDone={() => {}}
          />
          {showChoices && (
            <Animated.View entering={FadeIn.delay(200)} style={styles.choices}>
              {SELF_REPORT_OPTIONS.longestRun.map((option, index) => (
                <Choice
                  key={option.value}
                  label={option.label}
                  selected={longestRun === option.value}
                  onSelect={() => handleLongestSelect(option.value)}
                  delay={getStaggerDelay(index, 50) / 1000}
                />
              ))}
            </Animated.View>
          )}
        </View>
      )}

      {/* Completion */}
      {step === "complete" && (
        <View style={styles.questionSection}>
          <StreamBlock
            text={COACH_PROMPTS.selfReport.completion}
            size={20}
            onDone={() => {}}
          />
          <Animated.View entering={FadeIn.delay(600)} style={styles.badgeRow}>
            <ConfidenceBadge level="MODERATE" hasData={false} />
          </Animated.View>
        </View>
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
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  dayPill: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: SURFACES.brd,
    backgroundColor: SURFACES.card,
    justifyContent: "center",
    alignItems: "center",
  },
  dayPillSelected: {
    borderColor: SURFACES.sb,
    backgroundColor: SURFACES.sg,
  },
  dayPillText: {
    fontFamily: "Outfit-Medium",
    fontSize: 18,
    color: GRAYS.g2,
  },
  dayPillTextSelected: {
    color: COLORS.lime,
  },
  badgeRow: {
    marginTop: 16,
  },
});

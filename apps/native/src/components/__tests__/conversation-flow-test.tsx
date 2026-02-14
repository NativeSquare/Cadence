/**
 * Visual Integration Test for Story 2.12
 *
 * Complete conversation flow test:
 * SelfReport → Goals → Health → Style → OpenQuestion
 *
 * Tests all ACs including:
 * - Screen transitions
 * - Choice interactions
 * - Multi-select behavior
 * - Flagged states
 * - FreeformInput + MiniAnalysis
 * - Progress bar updates
 *
 * Usage: Import and render this component to verify complete flow.
 */

import { useState, useCallback } from "react";
import { View, ScrollView, StyleSheet, Pressable } from "react-native";
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { ProgressBar } from "../app/onboarding/ProgressBar";
import {
  SelfReportScreen,
  GoalsScreen,
  HealthScreen,
  StyleScreen,
  OpenQuestionScreen,
} from "../app/onboarding/screens";
import { PROGRESS_MILESTONES } from "../app/onboarding/mocks/conversationMocks";
import { GRAYS, COLORS, SURFACES } from "@/lib/design-tokens";

// =============================================================================
// Types
// =============================================================================

type Screen = "selfReport" | "goals" | "health" | "style" | "openQuestion" | "complete";

interface CollectedData {
  selfReport?: {
    weeklyVolume: string;
    daysPerWeek: number;
    longestRun: string;
  };
  goals?: {
    goalType: string;
    raceDistance?: string;
    raceDate?: string;
    freeformGoal?: string;
  };
  health?: {
    injuries: string[];
    recoveryStyle?: string;
  };
  style?: {
    coachingStyle: string;
    biggestChallenge: string;
  };
  openQuestion?: {
    additionalInfo?: string;
    skipped?: boolean;
  };
}

// =============================================================================
// Component
// =============================================================================

export function ConversationFlowTest() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("selfReport");
  const [progress, setProgress] = useState(15);
  const [collectedData, setCollectedData] = useState<CollectedData>({});

  const handleSelfReportComplete = useCallback(
    (data: CollectedData["selfReport"]) => {
      setCollectedData((prev) => ({ ...prev, selfReport: data }));
      setProgress(PROGRESS_MILESTONES.afterSelfReport);
      setTimeout(() => setCurrentScreen("goals"), 500);
    },
    []
  );

  const handleGoalsComplete = useCallback(
    (data: CollectedData["goals"]) => {
      setCollectedData((prev) => ({ ...prev, goals: data }));
      setProgress(PROGRESS_MILESTONES.afterGoals);
      setTimeout(() => setCurrentScreen("health"), 500);
    },
    []
  );

  const handleHealthComplete = useCallback(
    (data: CollectedData["health"]) => {
      setCollectedData((prev) => ({ ...prev, health: data }));
      setProgress(PROGRESS_MILESTONES.afterHealth);
      setTimeout(() => setCurrentScreen("style"), 500);
    },
    []
  );

  const handleStyleComplete = useCallback(
    (data: CollectedData["style"]) => {
      setCollectedData((prev) => ({ ...prev, style: data }));
      setProgress(PROGRESS_MILESTONES.afterStyle);
      setTimeout(() => setCurrentScreen("openQuestion"), 500);
    },
    []
  );

  const handleOpenQuestionComplete = useCallback(
    (data: CollectedData["openQuestion"]) => {
      setCollectedData((prev) => ({ ...prev, openQuestion: data }));
      setProgress(PROGRESS_MILESTONES.afterOpenQuestion);
      setTimeout(() => setCurrentScreen("complete"), 500);
    },
    []
  );

  const resetFlow = useCallback(() => {
    setCurrentScreen("selfReport");
    setProgress(15);
    setCollectedData({});
  }, []);

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <ProgressBar value={progress} showLabel showMilestoneGlow />
      </View>

      {/* Screen Container */}
      <View style={styles.screenContainer}>
        {currentScreen === "selfReport" && (
          <Animated.View
            entering={FadeIn}
            exiting={SlideOutLeft.duration(300)}
            style={styles.screenWrapper}
          >
            <SelfReportScreen onComplete={handleSelfReportComplete} />
          </Animated.View>
        )}

        {currentScreen === "goals" && (
          <Animated.View
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(300)}
            style={styles.screenWrapper}
          >
            <GoalsScreen onComplete={handleGoalsComplete} />
          </Animated.View>
        )}

        {currentScreen === "health" && (
          <Animated.View
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(300)}
            style={styles.screenWrapper}
          >
            <HealthScreen onComplete={handleHealthComplete} />
          </Animated.View>
        )}

        {currentScreen === "style" && (
          <Animated.View
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(300)}
            style={styles.screenWrapper}
          >
            <StyleScreen onComplete={handleStyleComplete} />
          </Animated.View>
        )}

        {currentScreen === "openQuestion" && (
          <Animated.View
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(300)}
            style={styles.screenWrapper}
          >
            <OpenQuestionScreen onComplete={handleOpenQuestionComplete} />
          </Animated.View>
        )}

        {currentScreen === "complete" && (
          <Animated.View entering={FadeIn} style={styles.completeContainer}>
            <Text style={styles.completeTitle}>Flow Complete!</Text>
            <Text style={styles.completeSubtitle}>
              All data collected successfully
            </Text>

            {/* Collected Data Summary */}
            <ScrollView style={styles.dataSummary}>
              <Text style={styles.dataLabel}>Collected Data:</Text>
              <Text style={styles.dataJson}>
                {JSON.stringify(collectedData, null, 2)}
              </Text>
            </ScrollView>

            {/* Reset Button */}
            <Pressable onPress={resetFlow} style={styles.resetButton}>
              <Text style={styles.resetButtonText}>Restart Flow</Text>
            </Pressable>
          </Animated.View>
        )}
      </View>

      {/* Debug: Current Screen Indicator */}
      <View style={styles.debugBar}>
        <Text style={styles.debugText}>
          Screen: {currentScreen} | Progress: {progress}%
        </Text>
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
    backgroundColor: "#000",
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 8,
  },
  screenContainer: {
    flex: 1,
  },
  screenWrapper: {
    flex: 1,
  },
  completeContainer: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  completeTitle: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 28,
    color: COLORS.lime,
  },
  completeSubtitle: {
    fontFamily: "Outfit-Regular",
    fontSize: 16,
    color: GRAYS.g2,
  },
  dataSummary: {
    maxHeight: 300,
    width: "100%",
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SURFACES.brd,
    backgroundColor: SURFACES.card,
  },
  dataLabel: {
    fontFamily: "Outfit-Medium",
    fontSize: 14,
    color: GRAYS.g3,
    marginBottom: 8,
  },
  dataJson: {
    fontFamily: "JetBrainsMono-Regular",
    fontSize: 11,
    color: GRAYS.g2,
    lineHeight: 18,
  },
  resetButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: COLORS.lime,
  },
  resetButtonText: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 16,
    color: "#000",
  },
  debugBar: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderTopWidth: 1,
    borderTopColor: SURFACES.brd,
  },
  debugText: {
    fontFamily: "JetBrainsMono-Regular",
    fontSize: 11,
    color: GRAYS.g4,
  },
});

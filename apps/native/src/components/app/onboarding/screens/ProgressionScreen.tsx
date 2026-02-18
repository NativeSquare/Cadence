/**
 * ProgressionScreen - Displays training volume progression with coach commentary.
 *
 * Shows: ProgressionChart visualization, StreamBlock coach message.
 * Supports both DATA (wearable) and NO DATA (self-reported) paths.
 * Queries real plan data when available, falls back to mock data.
 *
 * Source: Story 3.2 - AC#6-#7
 * Reference: cadence-v3.jsx lines 755-818
 */

import { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { StreamBlock } from "../StreamBlock";
import {
  ProgressionChart,
  PROGRESSION_MOCK_DATA,
  type WeekData,
} from "../viz/ProgressionChart";
import { Btn } from "../generative/Choice";
import { COLORS, GRAYS } from "@/lib/design-tokens";
import { Text } from "@/components/ui/text";

// =============================================================================
// Types
// =============================================================================

export interface ProgressionScreenProps {
  /** Which mock path to use: 'data' (wearable) or 'no-data' (self-reported) */
  mockPath?: "data" | "no-data";
  /** Custom data to display (overrides mockPath) */
  data?: WeekData[];
  /** Whether data comes from wearable */
  hasData?: boolean;
  /** Called when user taps continue button */
  onComplete?: () => void;
}

// =============================================================================
// Coach Messages
// =============================================================================

const COACH_MESSAGES = {
  data: "Here's how we build \u2014 three weeks on, one recovery. Your data shows you respond well to this rhythm. The blue weeks are non-negotiable.",
  noData:
    "We're starting conservative. Weeks 1-3 establish your baseline, then we build from there. Recovery weeks are where the adaptation actually happens.",
};

// =============================================================================
// Main Component
// =============================================================================

export function ProgressionScreen({
  mockPath = "data",
  data,
  hasData,
  onComplete,
}: ProgressionScreenProps) {
  const [chartAnimationComplete, setChartAnimationComplete] = useState(false);
  const [showCoachMessage, setShowCoachMessage] = useState(false);
  const [showButton, setShowButton] = useState(false);

  // Query runner to get active plan
  const runner = useQuery(api.table.runners.getCurrentRunner);
  const planId = useQuery(
    api.training.queries.getActivePlanForRunner,
    runner?._id ? { runnerId: runner._id } : "skip"
  );

  // Query progression data from plan
  const progressionData = useQuery(
    api.training.queries.getProgressionChartData,
    planId ? { planId } : "skip"
  );

  // Determine loading and error states
  const isLoading = runner === undefined || (runner?._id && planId === undefined);
  const noPlanAvailable = runner !== undefined && planId === null;

  // Map backend data to component format
  const chartData = useMemo((): WeekData[] | null => {
    // Use provided data first
    if (data) return data;

    // Use real plan data if available
    if (progressionData?.weeks && progressionData.weeks.length > 0) {
      return progressionData.weeks.map((w) => ({
        week: w.week,
        volume: w.volume,
        intensity: w.intensity,
        recovery: w.recovery,
        label: w.label,
      }));
    }

    // No data available
    return null;
  }, [data, progressionData]);

  // Calculate plan duration for header
  const planDuration = chartData?.length ?? 0;

  // Determine data source
  const isDataPath = hasData ?? mockPath === "data";

  // Show coach message after chart animation
  const handleChartAnimationComplete = useCallback(() => {
    setChartAnimationComplete(true);
    // Delay before showing coach message
    setTimeout(() => {
      setShowCoachMessage(true);
    }, 400);
  }, []);

  // Show button after coach message streams
  const handleCoachMessageDone = useCallback(() => {
    setTimeout(() => {
      setShowButton(true);
    }, 300);
  }, []);

  const coachMessage = isDataPath ? COACH_MESSAGES.data : COACH_MESSAGES.noData;

  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading your plan...</Text>
        </View>
      </View>
    );
  }

  // Show error state when no plan is available
  if (noPlanAvailable || !chartData) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorTitle}>Plan Not Ready</Text>
          <Text style={styles.errorText}>
            Your training plan is still being generated. Please wait a moment and try again.
          </Text>
          {onComplete && (
            <View style={styles.errorButtonContainer}>
              <Btn label="Continue Anyway" onPress={onComplete} />
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with title */}
        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>YOUR VOLUME PLAN</Text>
          <Text style={styles.headerSubtitle}>{planDuration}-week build</Text>
        </Animated.View>

        {/* Progression Chart */}
        <View style={styles.chartContainer}>
          <ProgressionChart
            data={chartData}
            animate={true}
            showIntensity={true}
            size={{ width: 340, height: 200 }}
            onAnimationComplete={handleChartAnimationComplete}
          />
        </View>

        {/* Coach Commentary */}
        {showCoachMessage && (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={styles.coachSection}
          >
            <StreamBlock
              text={coachMessage}
              size={17}
              color={GRAYS.g2}
              onDone={handleCoachMessageDone}
            />
          </Animated.View>
        )}
      </ScrollView>

      {/* Continue Button */}
      {showButton && onComplete && (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.buttonContainer}
        >
          <Btn label="Continue" onPress={onComplete} />
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
    backgroundColor: COLORS.black,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loadingText: {
    fontFamily: "Outfit-Light",
    fontSize: 18,
    color: GRAYS.g3,
  },
  errorTitle: {
    fontFamily: "Outfit-Medium",
    fontSize: 24,
    color: GRAYS.g1,
    marginBottom: 12,
    textAlign: "center",
  },
  errorText: {
    fontFamily: "Outfit-Light",
    fontSize: 16,
    color: GRAYS.g3,
    textAlign: "center",
    lineHeight: 24,
  },
  errorButtonContainer: {
    marginTop: 32,
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 70, // Account for status bar
    paddingBottom: 120, // Room for button
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 10,
    fontWeight: "500",
    color: GRAYS.g3,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  headerSubtitle: {
    fontFamily: "Outfit-Light",
    fontSize: 24,
    fontWeight: "300",
    color: GRAYS.g1,
    marginTop: 4,
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  coachSection: {
    marginTop: 8,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 48,
    backgroundColor: COLORS.black,
  },
});

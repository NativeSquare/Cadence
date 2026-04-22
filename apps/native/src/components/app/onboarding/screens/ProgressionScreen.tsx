/**
 * ProgressionScreen - Displays training volume progression with coach commentary.
 *
 * Queries real plan data; renders an error state when no plan is available.
 */

import { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { StreamBlock } from "../StreamBlock";
import {
  ProgressionChart,
  type WeekData,
} from "../viz/ProgressionChart";
import { Btn } from "../generative/Choice";
import { COLORS, GRAYS } from "@/lib/design-tokens";
import { Text } from "@/components/ui/text";

export interface ProgressionScreenProps {
  /** Custom data to display */
  data?: WeekData[];
  /** Called when user taps continue button */
  onComplete?: () => void;
}

const COACH_MESSAGE =
  "Here's how we build — three weeks on, one recovery. Your data shows you respond well to this rhythm. The blue weeks are non-negotiable.";

export function ProgressionScreen({ data, onComplete }: ProgressionScreenProps) {
  const [showCoachMessage, setShowCoachMessage] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const athlete = useQuery(api.plan.reads.getAthlete);
  const planId = useQuery(
    api.plan.legacy.getActivePlanForRunner,
    athlete?._id ? {} : "skip"
  );

  const progressionData = useQuery(
    api.plan.legacy.getProgressionChartData,
    planId ? { planId } : "skip"
  );

  const isLoading = athlete === undefined || (athlete?._id && planId === undefined);
  const noPlanAvailable = athlete !== undefined && planId === null;

  const chartData = useMemo((): WeekData[] | null => {
    if (data) return data;
    if (progressionData?.weeks && progressionData.weeks.length > 0) {
      return progressionData.weeks.map((w) => ({
        week: w.week,
        volume: w.volume,
        intensity: w.intensity,
        recovery: w.recovery,
        label: w.label,
      }));
    }
    return null;
  }, [data, progressionData]);

  const planDuration = chartData?.length ?? 0;

  const handleChartAnimationComplete = useCallback(() => {
    setTimeout(() => {
      setShowCoachMessage(true);
    }, 400);
  }, []);

  const handleCoachMessageDone = useCallback(() => {
    setTimeout(() => {
      setShowButton(true);
    }, 300);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading your plan...</Text>
        </View>
      </View>
    );
  }

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
        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>YOUR VOLUME PLAN</Text>
          <Text style={styles.headerSubtitle}>{planDuration}-week build</Text>
        </Animated.View>

        <View style={styles.chartContainer}>
          <ProgressionChart
            data={chartData}
            animate={true}
            showIntensity={true}
            size={{ width: 340, height: 200 }}
            onAnimationComplete={handleChartAnimationComplete}
          />
        </View>

        {showCoachMessage && (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={styles.coachSection}
          >
            <StreamBlock
              text={COACH_MESSAGE}
              size={17}
              color={GRAYS.g2}
              onDone={handleCoachMessageDone}
            />
          </Animated.View>
        )}
      </ScrollView>

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
    paddingTop: 70,
    paddingBottom: 120,
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

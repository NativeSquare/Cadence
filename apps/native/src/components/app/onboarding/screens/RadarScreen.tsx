/**
 * RadarScreen - Displays runner profile radar chart with coach commentary.
 *
 * Shows: RadarChart visualization, ConfidenceBadge, StreamBlock coach message.
 * Supports both DATA (wearable) and NO DATA (self-reported) paths.
 *
 * Source: Story 3.1 - AC#4-#5
 * Reference: cadence-v3.jsx lines 728-750
 */

import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { StreamBlock } from "../StreamBlock";
import { ConfidenceBadge } from "../generative/ConfidenceBadge";
import {
  RadarChart,
  RADAR_MOCK_DATA_PATH,
  RADAR_MOCK_NO_DATA_PATH,
  type RadarDataPoint,
} from "../viz/RadarChart";
import { Btn } from "../generative/Choice";
import { COLORS, GRAYS } from "@/lib/design-tokens";
import { Text } from "@/components/ui/text";

// =============================================================================
// Types
// =============================================================================

export interface RadarScreenProps {
  /** Which mock path to use: 'data' (wearable) or 'no-data' (self-reported) */
  mockPath?: "data" | "no-data";
  /** Custom data to display (overrides mockPath) */
  data?: RadarDataPoint[];
  /** Whether data comes from wearable */
  hasData?: boolean;
  /** Called when user taps continue button */
  onComplete?: () => void;
}

// =============================================================================
// Coach Messages
// =============================================================================

const COACH_MESSAGES = {
  data: "Strong consistency and endurance base. Recovery discipline is where we'll focus. By race day, this chart should look different.",
  noData:
    "The orange markers are estimates \u2014 they'll sharpen after your first week of logged runs.",
};

const INFO_MESSAGE =
  "Connect a wearable anytime in Settings for GPS-accurate data.";

// =============================================================================
// Main Component
// =============================================================================

export function RadarScreen({
  mockPath = "data",
  data,
  hasData,
  onComplete,
}: RadarScreenProps) {
  const [chartAnimationComplete, setChartAnimationComplete] = useState(false);
  const [showCoachMessage, setShowCoachMessage] = useState(false);
  const [showButton, setShowButton] = useState(false);

  // Determine data source
  const isDataPath = hasData ?? mockPath === "data";
  const chartData = data ?? (isDataPath ? RADAR_MOCK_DATA_PATH : RADAR_MOCK_NO_DATA_PATH);

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

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with title and badge */}
        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>YOUR RUNNER PROFILE</Text>
          <ConfidenceBadge
            level={isDataPath ? "HIGH" : "MODERATE"}
            hasData={isDataPath}
          />
        </Animated.View>

        {/* Radar Chart */}
        <View style={styles.chartContainer}>
          <RadarChart
            data={chartData}
            size={280}
            animate={true}
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

            {/* Info box for NO DATA path */}
            {!isDataPath && chartAnimationComplete && (
              <Animated.View
                entering={FadeIn.delay(800).duration(400)}
                style={styles.infoBox}
              >
                <Text style={styles.infoText}>{INFO_MESSAGE}</Text>
              </Animated.View>
            )}
          </Animated.View>
        )}
      </ScrollView>

      {/* Continue Button */}
      {showButton && onComplete && (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.buttonContainer}
        >
          <Btn label="See the volume plan" onPress={onComplete} />
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 70, // Account for status bar
    paddingBottom: 120, // Room for button
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 40,
  },
  headerTitle: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 10,
    fontWeight: "500",
    color: GRAYS.g3,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  coachSection: {
    marginTop: 8,
  },
  infoBox: {
    marginTop: 12,
    padding: 14,
    borderRadius: 10,
    backgroundColor: COLORS.oraDim,
    borderWidth: 1,
    borderColor: "rgba(255,138,0,0.15)",
  },
  infoText: {
    fontFamily: "JetBrainsMono-Regular",
    fontSize: 11,
    color: COLORS.ora,
    letterSpacing: 0.3,
    lineHeight: 16,
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

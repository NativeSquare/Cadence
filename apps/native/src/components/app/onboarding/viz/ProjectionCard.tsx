/**
 * ProjectionCard Component - Projected finish time display with confidence metrics.
 *
 * Shows: Time range, confidence percentage, and range deviation.
 * Path-dependent styling: lime (DATA) vs orange (NO DATA).
 *
 * Source: Story 3.4 - AC#2, #3, #4
 * Reference: cadence-v3.jsx lines 864-913
 */

import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { useScaleIn } from "@/lib/use-animations";
import { COLORS, GRAYS, SURFACES } from "@/lib/design-tokens";

// =============================================================================
// Types
// =============================================================================

export interface ProjectionCardProps {
  /** Time range tuple ["1:43", "1:46"] */
  timeRange: [string, string];
  /** Confidence percentage (0-100) */
  confidence: number;
  /** Range deviation label (e.g., "±90s", "±6 min") */
  rangeLabel: string;
  /** Whether user has connected data (affects styling) */
  hasData: boolean;
  /** Explanation text (NO DATA path only) */
  explanationText?: string;
  /** Whether to animate on mount */
  animate?: boolean;
  /** Animation delay in ms */
  delay?: number;
}

// =============================================================================
// Main Component
// =============================================================================

export function ProjectionCard({
  timeRange,
  confidence,
  rangeLabel,
  hasData,
  explanationText,
  animate = true,
  delay = 0,
}: ProjectionCardProps) {
  const animatedStyle = useScaleIn(animate, delay, 500);

  const accentColor = hasData ? COLORS.lime : COLORS.ora;
  const glowColor = hasData ? COLORS.limeGlow : COLORS.oraDim;
  const borderColor = hasData ? SURFACES.sb : "rgba(255,138,0,0.3)";
  const headerText = hasData ? "Projected Finish" : "Estimated Range";

  return (
    <Animated.View
      style={[
        styles.container,
        { borderColor, backgroundColor: glowColor },
        animatedStyle,
      ]}
    >
      {/* Header */}
      <Text style={styles.header}>{headerText}</Text>

      {/* Time Range Display */}
      <View style={styles.timeRow}>
        <Text style={[styles.time, { color: accentColor }]}>
          {timeRange[0]}
        </Text>
        <Text style={styles.timeSeparator}>–</Text>
        <Text style={[styles.time, { color: accentColor }]}>
          {timeRange[1]}
        </Text>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        {/* Confidence */}
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>CONFIDENCE</Text>
          <Text style={[styles.metricValue, { color: accentColor }]}>
            {confidence}%
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Range */}
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>RANGE</Text>
          <Text style={styles.metricValueWhite}>{rangeLabel}</Text>
        </View>
      </View>

      {/* Explanation (NO DATA path only) */}
      {explanationText && (
        <Text style={styles.explanation}>{explanationText}</Text>
      )}
    </Animated.View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  header: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 10,
    color: GRAYS.g3,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 4,
    marginBottom: 20,
  },
  time: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 42,
    lineHeight: 52, // Explicit to prevent clipping
    letterSpacing: -1.2, // -.03em equivalent
  },
  timeSeparator: {
    fontFamily: "JetBrainsMono-Light",
    fontSize: 20, // Smaller per prototype
    lineHeight: 28,
    color: GRAYS.g3, // Lighter than time numbers per prototype
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  metricBlock: {
    alignItems: "center",
  },
  metricLabel: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 9,
    color: GRAYS.g4,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 14, // Per prototype
  },
  metricValueWhite: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 14, // Per prototype
    color: GRAYS.g1,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: GRAYS.g5,
  },
  explanation: {
    fontFamily: "Outfit-Regular",
    fontSize: 12,
    color: GRAYS.g4,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
});

// =============================================================================
// Mock Data Export
// =============================================================================

/** Mock projection data for DATA path */
export const PROJECTION_MOCK_DATA = {
  timeRange: ["1:43", "1:46"] as [string, string],
  confidence: 75,
  rangeLabel: "±90s",
};

/** Mock projection data for NO DATA path */
export const PROJECTION_MOCK_NO_DATA = {
  timeRange: ["1:40", "1:52"] as [string, string],
  confidence: 50,
  rangeLabel: "±6 min",
  explanationText:
    "This range is wide on purpose — it'll narrow after your first training week.",
};

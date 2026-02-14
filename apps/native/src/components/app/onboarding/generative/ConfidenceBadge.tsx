/**
 * ConfidenceBadge Component - Data confidence indicator.
 *
 * Displays the confidence level of profile data:
 * - HIGH (lime): Data from wearable devices
 * - MODERATE (orange): Self-reported data
 * - LOW (red): Insufficient data
 *
 * Source: Story 2.11 - AC#7-#10
 */

import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { SPRING_CONFIG } from "@/lib/animations";
import { COLORS } from "@/lib/design-tokens";

// =============================================================================
// Types
// =============================================================================

type ConfidenceLevel = "HIGH" | "MODERATE" | "LOW";

interface ConfidenceBadgeProps {
  /** Confidence level: HIGH, MODERATE, or LOW */
  level: ConfidenceLevel;
  /** Whether data comes from wearable (DATA) or user input (SELF-REPORTED) */
  hasData?: boolean;
}

// =============================================================================
// Color Mappings
// =============================================================================

const LEVEL_COLORS: Record<ConfidenceLevel, string> = {
  HIGH: COLORS.lime,
  MODERATE: COLORS.ora,
  LOW: COLORS.red,
};

// Background at 15% opacity
const getBackgroundColor = (level: ConfidenceLevel): string => {
  switch (level) {
    case "HIGH":
      return "rgba(200,255,0,0.15)";
    case "MODERATE":
      return "rgba(255,138,0,0.15)";
    case "LOW":
      return "rgba(255,90,90,0.15)";
  }
};

// Border at 30% opacity
const getBorderColor = (level: ConfidenceLevel): string => {
  switch (level) {
    case "HIGH":
      return "rgba(200,255,0,0.3)";
    case "MODERATE":
      return "rgba(255,138,0,0.3)";
    case "LOW":
      return "rgba(255,90,90,0.3)";
  }
};

// =============================================================================
// ConfidenceBadge Component
// =============================================================================

export function ConfidenceBadge({
  level,
  hasData = true,
}: ConfidenceBadgeProps) {
  const entrance = useSharedValue(0);

  // springUp entrance animation
  useEffect(() => {
    entrance.value = withSpring(1, SPRING_CONFIG);
  }, [entrance]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [
      { translateY: (1 - entrance.value) * 12 },
      { scale: 0.98 + entrance.value * 0.02 },
    ],
  }));

  const color = LEVEL_COLORS[level];
  const backgroundColor = getBackgroundColor(level);
  const borderColor = getBorderColor(level);
  const label = hasData ? "DATA" : "SELF-REPORTED";

  return (
    <Animated.View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingVertical: 5,
          paddingHorizontal: 12,
          borderRadius: 8,
          backgroundColor,
          borderWidth: 1,
          borderColor,
          alignSelf: "flex-start",
        },
        animatedStyle,
      ]}
    >
      {/* Dot indicator */}
      <View
        style={{
          width: 5,
          height: 5,
          borderRadius: 3,
          backgroundColor: color,
        }}
      />

      {/* Label text */}
      <Text
        className="font-mono"
        style={{
          fontSize: 10,
          fontWeight: "500",
          color,
          letterSpacing: 0.6,
          textTransform: "uppercase",
        }}
      >
        {label} {level}
      </Text>
    </Animated.View>
  );
}

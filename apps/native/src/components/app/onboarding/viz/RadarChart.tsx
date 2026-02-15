/**
 * RadarChart Component - 6-axis spider chart for runner profile visualization.
 *
 * Displays: Endurance, Speed, Recovery, Consistency, Injury Risk, Race Ready
 * with animated polygon fill and count-up value labels.
 *
 * Source: Story 3.1 - AC#1-#3
 * Reference: cadence-v3.jsx lines 704-726
 */

import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import Svg, {
  Circle,
  G,
  Line,
  Path,
} from "react-native-svg";
import { Text } from "@/components/ui/text";
import { PROGRESS_BAR_MS } from "@/lib/animations";
import { COLORS, GRAYS } from "@/lib/design-tokens";

// =============================================================================
// Types
// =============================================================================

export interface RadarDataPoint {
  label: string;
  value: number; // 0-100
  uncertain?: boolean; // Shows orange color and "?" suffix
}

export interface RadarChartProps {
  /** Array of 6 data points for each axis */
  data: RadarDataPoint[];
  /** Chart diameter in pixels (default: 250) */
  size?: number;
  /** Whether to animate on mount (default: true) */
  animate?: boolean;
  /** Callback when animation completes */
  onAnimationComplete?: () => void;
}

// =============================================================================
// Animated SVG Components
// =============================================================================

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Calculate point position on the radar chart.
 */
function getPoint(
  index: number,
  value: number,
  radius: number,
  center: number,
  progress: number = 1
): { x: number; y: number } {
  "worklet";
  const n = 6; // Always 6 axes
  const angle = (Math.PI * 2 * index) / n - Math.PI / 2; // Start from top
  const r = (value / 100) * radius * progress;
  return {
    x: center + r * Math.cos(angle),
    y: center + r * Math.sin(angle),
  };
}

/**
 * Generate SVG path d string for grid hexagons.
 */
function getGridPathD(
  level: number,
  radius: number,
  center: number
): string {
  const n = 6;
  const commands: string[] = [];
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = (level / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    commands.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
  }
  commands.push("Z"); // Close the path
  return commands.join(" ");
}

/**
 * Get color based on value and uncertainty.
 */
function getValueColor(value: number, uncertain?: boolean): string {
  if (value < 50) return COLORS.red;
  if (uncertain) return COLORS.ora;
  return COLORS.lime;
}

/**
 * Get label color (slightly dimmer than value color).
 */
function getLabelColor(value: number, uncertain?: boolean): string {
  if (value < 50) return COLORS.red;
  if (uncertain) return COLORS.ora;
  return GRAYS.g3;
}

// =============================================================================
// Value Label Component
// =============================================================================

interface ValueLabelProps {
  data: RadarDataPoint;
  index: number;
  radius: number;
  center: number;
  size: number;
  progress: SharedValue<number>;
}

function ValueLabel({
  data,
  index,
  radius,
  center,
  size,
  progress,
}: ValueLabelProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const n = 6;
  const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
  const labelRadius = radius + 36; // Position labels well outside the chart
  const x = center + labelRadius * Math.cos(angle);
  const y = center + labelRadius * Math.sin(angle);

  // Update display value when progress changes
  useAnimatedReaction(
    () => Math.round(data.value * progress.value),
    (result) => {
      runOnJS(setDisplayValue)(result);
    },
    [data.value]
  );

  // Entrance animation
  const animatedStyle = useAnimatedStyle(() => {
    const opacity = withDelay(
      800 + index * 80,
      withTiming(progress.value, { duration: 400, easing: Easing.out(Easing.ease) })
    );
    return { opacity };
  });

  const valueColor = getValueColor(data.value, data.uncertain);
  const labelColor = getLabelColor(data.value, data.uncertain);

  return (
    <Animated.View
      style={[
        styles.labelContainer,
        {
          left: x,
          top: y,
        },
        animatedStyle,
      ]}
    >
      <Text
        style={[
          styles.labelText,
          { color: labelColor },
        ]}
        numberOfLines={1}
      >
        {data.label.toUpperCase()}
      </Text>
      <Text style={[styles.valueText, { color: valueColor }]}>
        {displayValue}{data.uncertain ? "?" : ""}
      </Text>
    </Animated.View>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function RadarChart({
  data,
  size = 250,
  animate = true,
  onAnimationComplete,
}: RadarChartProps) {
  const center = size / 2;
  const radius = size / 2 - 50; // Leave ample room for labels outside
  const gridLevels = [25, 50, 75, 100];

  // Animation progress (0 to 1)
  const progress = useSharedValue(animate ? 0 : 1);

  // Start animation on mount
  useEffect(() => {
    if (animate) {
      // Delay before starting animation
      const timer = setTimeout(() => {
        progress.value = withTiming(
          1,
          {
            duration: PROGRESS_BAR_MS, // 1400ms from design tokens
            easing: Easing.out(Easing.cubic),
          },
          (finished) => {
            if (finished && onAnimationComplete) {
              runOnJS(onAnimationComplete)();
            }
          }
        );
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [animate, progress, onAnimationComplete]);

  // Animated path d string for data polygon
  const animatedPathProps = useAnimatedProps(() => {
    const commands: string[] = [];
    data.forEach((d, i) => {
      const point = getPoint(i, d.value, radius, center, progress.value);
      commands.push(i === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`);
    });
    commands.push("Z"); // Close the path
    return {
      d: commands.join(" "),
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid hexagons at 25%, 50%, 75%, 100% */}
        <G>
          {gridLevels.map((level) => (
            <Path
              key={level}
              d={getGridPathD(level, radius, center)}
              fill="none"
              stroke={GRAYS.g5}
              strokeWidth={1}
            />
          ))}
        </G>

        {/* Axis lines from center to each vertex */}
        <G>
          {data.map((_, i) => {
            const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
            const x2 = center + radius * Math.cos(angle);
            const y2 = center + radius * Math.sin(angle);
            return (
              <Line
                key={i}
                x1={center}
                y1={center}
                x2={x2}
                y2={y2}
                stroke={GRAYS.g5}
                strokeWidth={1}
              />
            );
          })}
        </G>

        {/* Data polygon with fill - connects all points with lime outline */}
        <AnimatedPath
          animatedProps={animatedPathProps}
          fill="rgba(200,255,0,0.07)"
          stroke={COLORS.lime}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />

        {/* Data point circles */}
        <G>
          {data.map((d, i) => (
            <DataPointCircle
              key={i}
              index={i}
              data={data}
              radius={radius}
              center={center}
              progress={progress}
            />
          ))}
        </G>
      </Svg>

      {/* Value labels positioned outside the chart */}
      {data.map((d, i) => (
        <ValueLabel
          key={i}
          data={d}
          index={i}
          radius={radius}
          center={center}
          size={size}
          progress={progress}
        />
      ))}
    </View>
  );
}

// Separate component for animated circle to use hooks properly
function DataPointCircle({
  index,
  data,
  radius,
  center,
  progress,
}: {
  index: number;
  data: RadarDataPoint[];
  radius: number;
  center: number;
  progress: SharedValue<number>;
}) {
  const d = data[index];
  const fillColor = getValueColor(d.value, d.uncertain);

  const animatedProps = useAnimatedProps(() => {
    const point = getPoint(index, d.value, radius, center, progress.value);
    return {
      cx: point.x,
      cy: point.y,
    };
  });

  return (
    <AnimatedCircle
      animatedProps={animatedProps}
      r={3.5}
      fill={fillColor}
      stroke={COLORS.black}
      strokeWidth={1.5}
    />
  );
}

// =============================================================================
// Styles
// =============================================================================

const LABEL_WIDTH = 90; // Fixed width to allow centering

const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignSelf: "center",
  },
  labelContainer: {
    position: "absolute",
    width: LABEL_WIDTH,
    marginLeft: -LABEL_WIDTH / 2,
    marginTop: -18, // Approximate half-height of label+value
    alignItems: "center",
  },
  labelText: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 9,
    fontWeight: "500",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    textAlign: "center",
  },
  valueText: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
});

// =============================================================================
// Mock Data Export
// =============================================================================

/** Mock data for DATA path (wearable connected) */
export const RADAR_MOCK_DATA_PATH: RadarDataPoint[] = [
  { label: "Endurance", value: 75 },
  { label: "Speed", value: 65 },
  { label: "Recovery", value: 40 },
  { label: "Consistency", value: 85 },
  { label: "Injury Risk", value: 55 },
  { label: "Race Ready", value: 50 },
];

/** Mock data for NO DATA path (self-reported) */
export const RADAR_MOCK_NO_DATA_PATH: RadarDataPoint[] = [
  { label: "Endurance", value: 70, uncertain: true },
  { label: "Speed", value: 55, uncertain: true },
  { label: "Recovery", value: 50, uncertain: true },
  { label: "Consistency", value: 75 },
  { label: "Injury Risk", value: 50, uncertain: true },
  { label: "Race Ready", value: 45 },
];

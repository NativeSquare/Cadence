/**
 * RadarChart Component - 6-axis spider chart for runner profile visualization.
 *
 * Displays: Endurance, Speed, Recovery, Consistency, Injury Risk, Race Ready
 * with animated polygon fill, count-up value labels, and touch-to-select.
 *
 * Source: Story 3.1 - AC#1-#3
 * Reference: cadence-v3.jsx lines 704-726
 */

import { useEffect, useState, useCallback } from "react";
import { StyleSheet, View, Pressable } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";
import { Text } from "@/components/ui/text";
import { PROGRESS_BAR_MS, SPRING_SNAPPY } from "@/lib/animations";
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
  /** Optional target/ideal profile to show as a ghost overlay */
  targetData?: RadarDataPoint[];
  /** Chart diameter in pixels (default: 250) */
  size?: number;
  /** Whether to animate on mount (default: true) */
  animate?: boolean;
  /** Callback when animation completes */
  onAnimationComplete?: () => void;
  /** Callback when a data point is selected */
  onPointSelect?: (index: number | null) => void;
}

// =============================================================================
// Animated SVG Components
// =============================================================================

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// =============================================================================
// Helper Functions
// =============================================================================

function getPoint(
  index: number,
  value: number,
  radius: number,
  center: number,
  progress: number = 1
): { x: number; y: number } {
  "worklet";
  const n = 6;
  const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
  const r = (value / 100) * radius * progress;
  return {
    x: center + r * Math.cos(angle),
    y: center + r * Math.sin(angle),
  };
}

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
  commands.push("Z");
  return commands.join(" ");
}

function getValueColor(_value: number, _uncertain?: boolean): string {
  return "#6BBF00";
}

function getLabelColor(
  _value: number,
  _uncertain?: boolean,
  isSelected?: boolean
): string {
  if (isSelected) return GRAYS.g1;
  return GRAYS.g3;
}

// =============================================================================
// Value Label Component
// =============================================================================

const LABEL_HEIGHT = 26;

interface ValueLabelProps {
  data: RadarDataPoint;
  index: number;
  radius: number;
  center: number;
  size: number;
  progress: SharedValue<number>;
  isSelected: boolean;
  onPress: () => void;
}

function ValueLabel({
  data,
  index,
  radius,
  center,
  size,
  progress,
  isSelected,
  onPress,
}: ValueLabelProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const n = 6;
  const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
  const labelRadius = radius + 14;
  const x = center + labelRadius * Math.cos(angle);
  const y = center + labelRadius * Math.sin(angle);

  const sinA = Math.sin(angle);
  const dynamicMarginTop = -(LABEL_HEIGHT / 2) * (1 - sinA);

  useAnimatedReaction(
    () => Math.round(data.value * progress.value),
    (result) => {
      runOnJS(setDisplayValue)(result);
    },
    [data.value]
  );

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = withDelay(
      800 + index * 80,
      withTiming(progress.value, { duration: 400, easing: Easing.out(Easing.ease) })
    );
    return { opacity };
  });

  const valueColor = getValueColor(data.value, data.uncertain);
  const labelColor = getLabelColor(data.value, data.uncertain, isSelected);

  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      style={[
        styles.labelContainer,
        { left: x, top: y, marginTop: dynamicMarginTop },
      ]}
    >
      <Animated.View style={animatedStyle}>
        <Text
          style={[
            styles.labelText,
            {
              color: labelColor,
              fontFamily: isSelected ? "Outfit-Bold" : "Outfit-SemiBold",
            },
          ]}
          numberOfLines={1}
        >
          {data.label.toUpperCase()}
        </Text>
        <Text
          style={[
            styles.valueText,
            {
              color: valueColor,
              fontSize: isSelected ? 16 : 13,
            },
          ]}
        >
          {displayValue}{data.uncertain ? "?" : ""}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// =============================================================================
// Data Point Circle
// =============================================================================

function DataPointCircle({
  index,
  data,
  radius,
  center,
  progress,
  isSelected,
}: {
  index: number;
  data: RadarDataPoint[];
  radius: number;
  center: number;
  progress: SharedValue<number>;
  isSelected: boolean;
}) {
  const d = data[index];
  const fillColor = getValueColor(d.value, d.uncertain);

  const targetR = isSelected ? 7 : 4;
  const animR = useSharedValue(isSelected ? 4 : 4);

  useEffect(() => {
    animR.value = withSpring(targetR, SPRING_SNAPPY);
  }, [isSelected, targetR]);

  const animatedProps = useAnimatedProps(() => {
    const point = getPoint(index, d.value, radius, center, progress.value);
    return {
      cx: point.x,
      cy: point.y,
      r: animR.value,
    };
  });

  return (
    <AnimatedCircle
      animatedProps={animatedProps}
      fill={fillColor}
      stroke={isSelected ? fillColor : "#1A1A1A"}
      strokeWidth={isSelected ? 3 : 2}
    />
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function RadarChart({
  data,
  targetData,
  size = 250,
  animate = true,
  onAnimationComplete,
  onPointSelect,
}: RadarChartProps) {
  const center = size / 2;
  const radius = size / 2 - 40;
  const gridLevels = [100];
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const progress = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => {
        progress.value = withTiming(
          1,
          {
            duration: PROGRESS_BAR_MS,
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

  const handlePointPress = useCallback((index: number) => {
    setSelectedIndex((prev) => {
      const next = prev === index ? null : index;
      onPointSelect?.(next);
      return next;
    });
  }, [onPointSelect]);

  const animatedPathProps = useAnimatedProps(() => {
    const commands: string[] = [];
    data.forEach((d, i) => {
      const point = getPoint(i, d.value, radius, center, progress.value);
      commands.push(i === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`);
    });
    commands.push("Z");
    return {
      d: commands.join(" "),
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <LinearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={COLORS.lime} stopOpacity="0.28" />
            <Stop offset="1" stopColor={COLORS.lime} stopOpacity="0.06" />
          </LinearGradient>
          <LinearGradient id="targetFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={COLORS.lime} stopOpacity="0.10" />
            <Stop offset="1" stopColor={COLORS.lime} stopOpacity="0.03" />
          </LinearGradient>
        </Defs>

        {/* Outer boundary ring */}
        <G>
          {gridLevels.map((level) => (
            <Path
              key={level}
              d={getGridPathD(level, radius, center)}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={1}
            />
          ))}
        </G>

        {/* Axis spokes */}
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
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
            );
          })}
        </G>

        {/* Target/ideal polygon (ghost overlay) */}
        {targetData && targetData.length === data.length && (
          <G>
            <Path
              d={targetData
                .map((d, i) => {
                  const pt = getPoint(i, d.value, radius, center, 1);
                  return i === 0 ? `M ${pt.x} ${pt.y}` : `L ${pt.x} ${pt.y}`;
                })
                .join(" ") + " Z"}
              fill="url(#targetFill)"
              stroke="rgba(200,255,0,0.30)"
              strokeWidth={1.5}
              strokeLinejoin="round"
              strokeDasharray={undefined}
            />
            {targetData.map((d, i) => {
              const pt = getPoint(i, d.value, radius, center, 1);
              return (
                <Circle
                  key={`target-${i}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={2.5}
                  fill="rgba(200,255,0,0.30)"
                />
              );
            })}
          </G>
        )}

        {/* Current data polygon with gradient fill */}
        <AnimatedPath
          animatedProps={animatedPathProps}
          fill="url(#radarFill)"
          stroke={COLORS.lime}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Data point circles */}
        <G>
          {data.map((_, i) => (
            <DataPointCircle
              key={i}
              index={i}
              data={data}
              radius={radius}
              center={center}
              progress={progress}
              isSelected={i === selectedIndex}
            />
          ))}
        </G>

        {/* Center dot */}
        <Circle
          cx={center}
          cy={center}
          r={2}
          fill={GRAYS.g3}
          opacity={0.3}
        />
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
          isSelected={i === selectedIndex}
          onPress={() => handlePointPress(i)}
        />
      ))}
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const LABEL_WIDTH = 90;

const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignSelf: "center",
  },
  labelContainer: {
    position: "absolute",
    width: LABEL_WIDTH,
    marginLeft: -LABEL_WIDTH / 2,
    marginTop: -18,
    alignItems: "center",
  },
  labelText: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 0.45,
    textTransform: "uppercase",
    textAlign: "center",
  },
  valueText: {
    fontFamily: "Outfit-ExtraBold",
    fontSize: 13,
    lineHeight: 15,
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

/**
 * ProgressionChart Component - 10-week bar chart for training volume visualization.
 *
 * Displays: Weekly volume bars with intensity line overlay.
 * Features: Hatched fill pattern, recovery week markers, staggered animation.
 *
 * Source: Story 3.2 - AC#1-#7
 * Reference: cadence-v3.jsx lines 755-818
 */

import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
  interpolate,
} from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  Path,
  Pattern,
  Polyline,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import { Text } from "@/components/ui/text";
import { COLORS, GRAYS } from "@/lib/design-tokens";

// =============================================================================
// Types
// =============================================================================

export interface WeekData {
  week: number;
  volume: number; // km, 0-80 scale typically
  intensity: number; // 0-100 scale
  recovery?: boolean;
  label?: string; // "Recovery" or "Race"
}

export interface ProgressionChartProps {
  /** Array of 10 weeks of data */
  data: WeekData[];
  /** Whether to animate on mount (default: true) */
  animate?: boolean;
  /** Whether to show intensity line (default: true) */
  showIntensity?: boolean;
  /** Chart dimensions */
  size?: { width: number; height: number };
  /** Callback when animation completes */
  onAnimationComplete?: () => void;
}

// =============================================================================
// Animation Constants
// =============================================================================

const BAR_ANIMATION_MS = 600;
const BAR_STAGGER_MS = 80;
const LINE_ANIMATION_MS = 1200;
const LINE_START_DELAY_MS = 800;

// =============================================================================
// Animated SVG Components
// =============================================================================

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// =============================================================================
// Chart Layout Constants
// =============================================================================

const CHART_PADDING = { top: 20, right: 10, bottom: 40, left: 35 };
const BAR_GAP = 6;
const MAX_VOLUME = 60; // Maximum volume for Y scale

// =============================================================================
// Helper Functions
// =============================================================================

function calculateBarWidth(chartWidth: number, numBars: number): number {
  const availableWidth =
    chartWidth - CHART_PADDING.left - CHART_PADDING.right - (numBars - 1) * BAR_GAP;
  return availableWidth / numBars;
}

function calculateBarX(
  index: number,
  barWidth: number,
  chartWidth: number
): number {
  return CHART_PADDING.left + index * (barWidth + BAR_GAP);
}

function calculateBarHeight(volume: number, chartHeight: number): number {
  const availableHeight = chartHeight - CHART_PADDING.top - CHART_PADDING.bottom;
  return (volume / MAX_VOLUME) * availableHeight;
}

function calculateBarY(
  volume: number,
  chartHeight: number
): number {
  const barHeight = calculateBarHeight(volume, chartHeight);
  return chartHeight - CHART_PADDING.bottom - barHeight;
}

function calculateIntensityY(
  intensity: number,
  chartHeight: number
): number {
  const availableHeight = chartHeight - CHART_PADDING.top - CHART_PADDING.bottom;
  const y = CHART_PADDING.top + (1 - intensity / 100) * availableHeight;
  return y;
}

function calculatePolylinePoints(
  data: WeekData[],
  barWidth: number,
  chartWidth: number,
  chartHeight: number
): string {
  return data
    .map((week, i) => {
      const x = calculateBarX(i, barWidth, chartWidth) + barWidth / 2;
      const y = calculateIntensityY(week.intensity, chartHeight);
      return `${x},${y}`;
    })
    .join(" ");
}

function calculatePolylineLength(
  data: WeekData[],
  barWidth: number,
  chartWidth: number,
  chartHeight: number
): number {
  let length = 0;
  for (let i = 1; i < data.length; i++) {
    const x1 = calculateBarX(i - 1, barWidth, chartWidth) + barWidth / 2;
    const y1 = calculateIntensityY(data[i - 1].intensity, chartHeight);
    const x2 = calculateBarX(i, barWidth, chartWidth) + barWidth / 2;
    const y2 = calculateIntensityY(data[i].intensity, chartHeight);
    length += Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }
  return length;
}

// =============================================================================
// Animated Bar Component
// =============================================================================

interface AnimatedBarProps {
  index: number;
  week: WeekData;
  barWidth: number;
  chartWidth: number;
  chartHeight: number;
  progress: SharedValue<number>;
  animate: boolean;
}

function AnimatedBar({
  index,
  week,
  barWidth,
  chartWidth,
  chartHeight,
  progress,
  animate,
}: AnimatedBarProps) {
  const x = calculateBarX(index, barWidth, chartWidth);
  const fullHeight = calculateBarHeight(week.volume, chartHeight);
  const bottomY = chartHeight - CHART_PADDING.bottom;

  const isRecovery = week.recovery;
  const fillColor = isRecovery ? COLORS.blu : COLORS.lime;
  const patternId = isRecovery ? "hatchBlue" : "hatchLime";

  const animatedProps = useAnimatedProps(() => {
    const animProgress = animate
      ? interpolate(
          progress.value,
          [index * BAR_STAGGER_MS / 1000, (index * BAR_STAGGER_MS + BAR_ANIMATION_MS) / 1000],
          [0, 1],
          "clamp"
        )
      : 1;

    const currentHeight = fullHeight * animProgress;
    const y = bottomY - currentHeight;

    return {
      y,
      height: currentHeight,
    };
  });

  return (
    <G>
      {/* Base bar with solid color at lower opacity */}
      <AnimatedRect
        x={x}
        width={barWidth}
        rx={3}
        fill={fillColor}
        opacity={0.15}
        animatedProps={animatedProps}
      />
      {/* Hatched overlay */}
      <AnimatedRect
        x={x}
        width={barWidth}
        rx={3}
        fill={`url(#${patternId})`}
        animatedProps={animatedProps}
      />
      {/* Border */}
      <AnimatedRect
        x={x}
        width={barWidth}
        rx={3}
        fill="none"
        stroke={fillColor}
        strokeWidth={1}
        opacity={0.5}
        animatedProps={animatedProps}
      />
    </G>
  );
}

// =============================================================================
// Animated Intensity Dot Component
// =============================================================================

interface AnimatedDotProps {
  index: number;
  week: WeekData;
  barWidth: number;
  chartWidth: number;
  chartHeight: number;
  lineProgress: SharedValue<number>;
  totalPoints: number;
}

function AnimatedDot({
  index,
  week,
  barWidth,
  chartWidth,
  chartHeight,
  lineProgress,
  totalPoints,
}: AnimatedDotProps) {
  const x = calculateBarX(index, barWidth, chartWidth) + barWidth / 2;
  const y = calculateIntensityY(week.intensity, chartHeight);

  const animatedStyle = useAnimatedStyle(() => {
    // Dot appears when line reaches it
    const dotThreshold = (index + 0.5) / totalPoints;
    const opacity = lineProgress.value >= dotThreshold ? 1 : 0;
    const scale = lineProgress.value >= dotThreshold ? 1 : 0.5;

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.dotContainer,
        { left: x - 4, top: y - 4 },
        animatedStyle,
      ]}
    >
      <View style={styles.dot} />
    </Animated.View>
  );
}

// =============================================================================
// Legend Component
// =============================================================================

function Legend() {
  return (
    <View style={styles.legend}>
      <View style={styles.legendItem}>
        <View style={[styles.legendIcon, styles.legendVolume]} />
        <Text style={styles.legendText}>VOLUME</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={styles.legendLineIcon}>
          <View style={styles.legendLine} />
          <View style={styles.legendDot} />
        </View>
        <Text style={styles.legendText}>INTENSITY</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendIcon, styles.legendRecovery]} />
        <Text style={styles.legendText}>RECOVERY</Text>
      </View>
    </View>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function ProgressionChart({
  data,
  animate = true,
  showIntensity = true,
  size = { width: 340, height: 200 },
  onAnimationComplete,
}: ProgressionChartProps) {
  const { width: chartWidth, height: chartHeight } = size;
  const barWidth = calculateBarWidth(chartWidth, data.length);

  // Animation progress (in seconds for easier calculation)
  const progress = useSharedValue(animate ? 0 : 2);
  const lineProgress = useSharedValue(0);

  // Calculate polyline data
  const polylinePoints = calculatePolylinePoints(data, barWidth, chartWidth, chartHeight);
  const polylineLength = calculatePolylineLength(data, barWidth, chartWidth, chartHeight);

  // Start animations on mount
  useEffect(() => {
    if (animate) {
      // Animate bars (progress 0 to ~1.5 seconds covers all bars)
      const totalBarTime = (data.length - 1) * BAR_STAGGER_MS + BAR_ANIMATION_MS;

      progress.value = withTiming(
        totalBarTime / 1000 + 0.1,
        {
          duration: totalBarTime,
          easing: Easing.out(Easing.cubic),
        }
      );

      // Animate intensity line after delay
      const lineStartDelay = LINE_START_DELAY_MS;
      setTimeout(() => {
        lineProgress.value = withTiming(
          1,
          {
            duration: LINE_ANIMATION_MS,
            easing: Easing.out(Easing.ease),
          },
          (finished) => {
            if (finished && onAnimationComplete) {
              onAnimationComplete();
            }
          }
        );
      }, lineStartDelay);
    } else {
      progress.value = 2;
      lineProgress.value = 1;
    }
  }, [animate, data.length, onAnimationComplete]);

  // Animated polyline props for stroke-dashoffset animation
  const animatedPolylineProps = useAnimatedProps(() => {
    const dashOffset = polylineLength * (1 - lineProgress.value);
    return {
      strokeDashoffset: dashOffset,
    };
  });

  // Y-axis labels
  const yAxisLabels = [0, 20, 40, 60];

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        {/* Definitions for hatched patterns */}
        <Defs>
          <Pattern id="hatchLime" patternUnits="userSpaceOnUse" width="6" height="6">
            <Path d="M0,6 L6,0" stroke={COLORS.lime} strokeWidth="1" opacity="0.4" />
          </Pattern>
          <Pattern id="hatchBlue" patternUnits="userSpaceOnUse" width="6" height="6">
            <Path d="M0,6 L6,0" stroke={COLORS.blu} strokeWidth="1" opacity="0.4" />
          </Pattern>
        </Defs>

        {/* Grid lines */}
        <G>
          {yAxisLabels.map((value) => {
            const y = chartHeight - CHART_PADDING.bottom -
              ((value / MAX_VOLUME) * (chartHeight - CHART_PADDING.top - CHART_PADDING.bottom));
            return (
              <Line
                key={value}
                x1={CHART_PADDING.left}
                y1={y}
                x2={chartWidth - CHART_PADDING.right}
                y2={y}
                stroke={GRAYS.g6}
                strokeWidth={0.5}
              />
            );
          })}
        </G>

        {/* Y-axis labels */}
        <G>
          {yAxisLabels.map((value) => {
            const y = chartHeight - CHART_PADDING.bottom -
              ((value / MAX_VOLUME) * (chartHeight - CHART_PADDING.top - CHART_PADDING.bottom));
            return (
              <SvgText
                key={value}
                x={CHART_PADDING.left - 8}
                y={y + 3}
                fill={GRAYS.g3}
                fontSize={9}
                fontFamily="JetBrainsMono-Regular"
                textAnchor="end"
              >
                {value}
              </SvgText>
            );
          })}
        </G>

        {/* Bars */}
        <G>
          {data.map((week, i) => (
            <AnimatedBar
              key={week.week}
              index={i}
              week={week}
              barWidth={barWidth}
              chartWidth={chartWidth}
              chartHeight={chartHeight}
              progress={progress}
              animate={animate}
            />
          ))}
        </G>

        {/* X-axis labels */}
        <G>
          {data.map((week, i) => {
            const x = calculateBarX(i, barWidth, chartWidth) + barWidth / 2;
            return (
              <SvgText
                key={week.week}
                x={x}
                y={chartHeight - CHART_PADDING.bottom + 14}
                fill={week.recovery ? COLORS.blu : GRAYS.g3}
                fontSize={9}
                fontFamily="JetBrainsMono-Regular"
                textAnchor="middle"
              >
                W{week.week}
              </SvgText>
            );
          })}
        </G>

        {/* Recovery/Race labels */}
        <G>
          {data.map((week, i) => {
            if (!week.label) return null;
            const x = calculateBarX(i, barWidth, chartWidth) + barWidth / 2;
            return (
              <SvgText
                key={`label-${week.week}`}
                x={x}
                y={chartHeight - CHART_PADDING.bottom + 26}
                fill={COLORS.blu}
                fontSize={7}
                fontFamily="JetBrainsMono-Medium"
                textAnchor="middle"
              >
                {week.label.toUpperCase()}
              </SvgText>
            );
          })}
        </G>

        {/* Intensity line */}
        {showIntensity && (
          <AnimatedPolyline
            points={polylinePoints}
            fill="none"
            stroke={COLORS.ora}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={polylineLength}
            animatedProps={animatedPolylineProps}
          />
        )}
      </Svg>

      {/* Intensity dots (rendered outside SVG for better animation) */}
      {showIntensity && data.map((week, i) => (
        <AnimatedDot
          key={`dot-${week.week}`}
          index={i}
          week={week}
          barWidth={barWidth}
          chartWidth={chartWidth}
          chartHeight={chartHeight}
          lineProgress={lineProgress}
          totalPoints={data.length}
        />
      ))}

      {/* Legend */}
      <Legend />
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignSelf: "center",
  },
  dotContainer: {
    position: "absolute",
    width: 8,
    height: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.ora,
    borderWidth: 1.5,
    borderColor: COLORS.black,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    gap: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendIcon: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendVolume: {
    backgroundColor: COLORS.lime,
    opacity: 0.6,
  },
  legendRecovery: {
    backgroundColor: COLORS.blu,
    opacity: 0.6,
  },
  legendLineIcon: {
    flexDirection: "row",
    alignItems: "center",
    width: 16,
  },
  legendLine: {
    width: 10,
    height: 2,
    backgroundColor: COLORS.ora,
  },
  legendDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.ora,
    marginLeft: -2,
  },
  legendText: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 8,
    fontWeight: "500",
    color: GRAYS.g3,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});

// =============================================================================
// Mock Data Export
// =============================================================================

/** Mock 10-week progression data */
export const PROGRESSION_MOCK_DATA: WeekData[] = [
  { week: 1, volume: 32, intensity: 45 },
  { week: 2, volume: 38, intensity: 50 },
  { week: 3, volume: 42, intensity: 55 },
  { week: 4, volume: 28, intensity: 35, recovery: true, label: "Recovery" },
  { week: 5, volume: 45, intensity: 60 },
  { week: 6, volume: 50, intensity: 65 },
  { week: 7, volume: 35, intensity: 40, recovery: true, label: "Recovery" },
  { week: 8, volume: 52, intensity: 70 },
  { week: 9, volume: 48, intensity: 65 },
  { week: 10, volume: 25, intensity: 30, recovery: true, label: "Race" },
];

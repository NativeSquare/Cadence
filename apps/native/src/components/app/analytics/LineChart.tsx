/**
 * LineChart Component - SVG-based line chart with animations
 * Reference: cadence-full-v9.jsx lines 455-484 (VolChart, PaceChart)
 *
 * Features:
 * - SVG-based with animated stroke-dashoffset
 * - Area fill gradient below line
 * - Grid lines (horizontal)
 * - Week labels (W1-W10) on X-axis
 * - Current week dot marker
 * - Stroke animation duration: 1.5s with cubic easing
 */

import { useEffect, useMemo } from "react";
import { View } from "react-native";
import Svg, {
  Path,
  Line,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  G,
  Text as SvgText,
} from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { COLORS, LIGHT_THEME, ACTIVITY_COLORS } from "@/lib/design-tokens";

// Create animated SVG components
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface LineChartProps {
  /** Data values for each point */
  data: number[];
  /** Chart width (default: 326) */
  width?: number;
  /** Chart height (default: 120) */
  height?: number;
  /** Line color */
  lineColor?: string;
  /** Gradient start color (for area fill) */
  gradientStartColor?: string;
  /** Gradient start opacity (default: 0.25) */
  gradientStartOpacity?: number;
  /** Whether to animate on mount */
  animate?: boolean;
  /** Whether to invert Y-axis (for pace where lower is better) */
  invertY?: boolean;
  /** Number of grid lines (default: 5 for volume, 3 for pace) */
  gridLines?: number;
}

/**
 * LineChart main component
 */
export function LineChart({
  data,
  width = 326,
  height = 120,
  lineColor = COLORS.lime,
  gradientStartColor = COLORS.lime,
  gradientStartOpacity = 0.25,
  animate = true,
  invertY = false,
  gridLines = 5,
}: LineChartProps) {
  // Chart layout constants
  const paddingTop = 8;
  const paddingBottom = 20;
  const chartHeight = height - paddingTop - paddingBottom;

  // Calculate min/max for scaling
  const minVal = useMemo(() => {
    return invertY ? Math.min(...data) - 0.1 : 0;
  }, [data, invertY]);

  const maxVal = useMemo(() => {
    return invertY ? Math.max(...data) + 0.1 : Math.max(...data) * 1.15;
  }, [data, invertY]);

  // Calculate points
  const points = useMemo(() => {
    return data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const normalizedValue = (value - minVal) / (maxVal - minVal);
      // For inverted Y (pace), higher values go down
      const y = invertY
        ? paddingTop + normalizedValue * chartHeight
        : paddingTop + chartHeight - normalizedValue * chartHeight;
      return { x, y };
    });
  }, [data, width, chartHeight, minVal, maxVal, invertY]);

  // Generate line path
  const linePath = useMemo(() => {
    return points
      .map((point, index) => (index === 0 ? "M" : "L") + `${point.x},${point.y}`)
      .join(" ");
  }, [points]);

  // Generate area path (for gradient fill)
  const areaPath = useMemo(() => {
    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    return (
      linePath +
      ` L${lastPoint.x},${height - paddingBottom}` +
      ` L${firstPoint.x},${height - paddingBottom} Z`
    );
  }, [linePath, points, height, paddingBottom]);

  // Estimate path length (approximate)
  const pathLength = useMemo(() => {
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return Math.ceil(length) + 10; // Add buffer
  }, [points]);

  // Animation values
  const strokeDashoffset = useSharedValue(animate ? pathLength : 0);
  const areaOpacity = useSharedValue(animate ? 0 : 1);
  const dotOpacity = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (animate) {
      // Line stroke animation
      strokeDashoffset.value = withTiming(0, {
        duration: 1500,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
      // Area fade in
      areaOpacity.value = withTiming(1, {
        duration: 800,
        easing: Easing.ease,
      });
      // Dot appears after line
      dotOpacity.value = withDelay(
        1200,
        withTiming(1, {
          duration: 500,
          easing: Easing.ease,
        })
      );
    }
  }, [animate, pathLength]);

  // Animated props for line
  const animatedLineProps = useAnimatedProps(() => ({
    strokeDashoffset: strokeDashoffset.value,
  }));

  // Animated props for area
  const animatedAreaProps = useAnimatedProps(() => ({
    opacity: areaOpacity.value,
  }));

  // Animated props for end dot
  const animatedDotProps = useAnimatedProps(() => ({
    opacity: dotOpacity.value,
  }));

  // Grid line positions
  const gridLinePositions = useMemo(() => {
    const positions: number[] = [];
    for (let i = 0; i < gridLines; i++) {
      const ratio = i / (gridLines - 1);
      positions.push(paddingTop + chartHeight * (1 - ratio));
    }
    return positions;
  }, [gridLines, chartHeight]);

  // Last point for dot
  const lastPoint = points[points.length - 1];

  return (
    <View>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Gradient definition */}
        <Defs>
          <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop
              offset="0%"
              stopColor={gradientStartColor}
              stopOpacity={gradientStartOpacity}
            />
            <Stop
              offset="100%"
              stopColor={gradientStartColor}
              stopOpacity={0.02}
            />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        <G>
          {gridLinePositions.map((y, index) => (
            <Line
              key={index}
              x1={0}
              y1={y}
              x2={width}
              y2={y}
              stroke={LIGHT_THEME.wBrd}
              strokeWidth={1}
            />
          ))}
        </G>

        {/* Area fill with gradient */}
        <AnimatedPath
          d={areaPath}
          fill="url(#areaGradient)"
          animatedProps={animatedAreaProps}
        />

        {/* Line path */}
        <AnimatedPath
          d={linePath}
          fill="none"
          stroke={lineColor}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={pathLength}
          animatedProps={animatedLineProps}
        />

        {/* Current week dot */}
        <AnimatedCircle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={5}
          fill={lineColor}
          animatedProps={animatedDotProps}
        />

        {/* Week labels */}
        {data.map((_, index) => {
          const x = (index / (data.length - 1)) * width;
          const isLast = index === data.length - 1;
          return (
            <SvgText
              key={index}
              x={x}
              y={height - 4}
              textAnchor="middle"
              fontSize={9}
              fontFamily="Outfit-Regular"
              fontWeight={isLast ? "700" : "400"}
              fill={isLast ? LIGHT_THEME.wText : LIGHT_THEME.wMute}
            >
              W{index + 1}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

/**
 * VolumeChart - Pre-configured LineChart for volume over time
 * Reference: cadence-full-v9.jsx lines 455-470
 */
export function VolumeChart({
  data,
  animate = true,
}: {
  data: number[];
  animate?: boolean;
}) {
  return (
    <LineChart
      data={data}
      lineColor={COLORS.lime}
      gradientStartColor={COLORS.lime}
      gradientStartOpacity={0.25}
      animate={animate}
      invertY={false}
      gridLines={5}
    />
  );
}

/**
 * PaceChart - Pre-configured LineChart for pace trend
 * Reference: cadence-full-v9.jsx lines 472-484
 * Note: Pace is inverted (lower is better)
 */
export function PaceChart({
  data,
  animate = true,
}: {
  data: number[];
  animate?: boolean;
}) {
  return (
    <LineChart
      data={data}
      width={326}
      height={100}
      lineColor={ACTIVITY_COLORS.barRest}
      gradientStartColor={ACTIVITY_COLORS.barRest}
      gradientStartOpacity={0}
      animate={animate}
      invertY={true}
      gridLines={3}
    />
  );
}

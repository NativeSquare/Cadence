/**
 * IntensityProfileChart - SVG-based intensity visualization
 * Reference: cadence-full-v10.jsx IntensityProfile (lines 163-246)
 *
 * Features:
 * - SVG chart using react-native-svg with reanimated
 * - Zone height mapping
 * - Animated bars with staggered entrance (0.6s duration, 0.08s stagger)
 * - Gradient fills for bars (50% opacity top to 8% bottom)
 * - Grid lines at 25%, 50%, 75%, 100%
 * - Segment km labels below bars
 * - Legend row with zone colors
 */

import React, { useMemo, useEffect } from "react";
import { View } from "react-native";
import Svg, {
  Rect,
  Line,
  Path,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withDelay,
  withTiming,
  Easing,
  interpolate,
  type SharedValue,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME, ACTIVITY_COLORS } from "@/lib/design-tokens";
import type { SessionSegment } from "./types";
import { ZONE_HEIGHT, getZoneColor } from "./types";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const CHART_WIDTH = 326;
const CHART_HEIGHT = 110;
const PAD_TOP = 10;
const PAD_BOTTOM = 28;

export interface IntensityProfileChartProps {
  /** Session segments to visualize */
  segments: SessionSegment[];
}

interface SegmentRect {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  zone: string;
  km: number;
}

/**
 * Calculate segment rectangles for the chart
 */
function calculateRects(segments: SessionSegment[]): SegmentRect[] {
  const barHeight = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;
  const totalKm = segments.reduce((acc, seg) => acc + (parseFloat(seg.km) || 0), 0);

  if (totalKm <= 0) return [];

  let currentX = 0;
  return segments.map((seg) => {
    const km = parseFloat(seg.km) || 0;
    const width = (km / totalKm) * CHART_WIDTH;
    const heightPercent = ZONE_HEIGHT[seg.zone] ?? 0.4;
    const height = heightPercent * barHeight;
    const y = PAD_TOP + barHeight - height;
    const isRest = seg.zone === "Z1";
    const color = isRest ? ACTIVITY_COLORS.barRest : getZoneColor(seg.zone);

    const rect: SegmentRect = {
      x: currentX,
      y,
      width,
      height,
      color,
      zone: seg.zone,
      km,
    };

    currentX += width;
    return rect;
  });
}

/**
 * Build Catmull-Rom spline path from points
 */
function buildCurvePath(rects: SegmentRect[]): string {
  if (rects.length === 0) return "";

  // Build points from rect top edges
  const points: { x: number; y: number }[] = [];
  rects.forEach((rect) => {
    points.push({ x: rect.x, y: rect.y });
    points.push({ x: rect.x + rect.width, y: rect.y });
  });

  if (points.length < 2) return "";

  // Catmull-Rom spline
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }

  return d;
}

/**
 * Animated bar component
 */
function AnimatedBar({
  rect,
  index,
  progress,
}: {
  rect: SegmentRect;
  index: number;
  progress: SharedValue<number>;
}) {
  const barHeight = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

  const animatedProps = useAnimatedProps(() => {
    const adjustedProgress = interpolate(
      progress.value,
      [0, 1],
      [0, 1],
      "clamp"
    );
    const animatedHeight = adjustedProgress * rect.height;
    const animatedY = PAD_TOP + barHeight - animatedHeight;

    return {
      y: animatedY,
      height: animatedHeight,
    };
  });

  return (
    <AnimatedRect
      x={rect.x + 0.5}
      width={Math.max(0, rect.width - 1)}
      rx={4}
      fill={`url(#gradient-${index})`}
      animatedProps={animatedProps}
    />
  );
}

/**
 * Animated zone indicator on top of bar
 */
function AnimatedZoneIndicator({
  rect,
  progress,
}: {
  rect: SegmentRect;
  progress: SharedValue<number>;
}) {
  const barHeight = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

  const animatedProps = useAnimatedProps(() => {
    const animatedHeight = progress.value * rect.height;
    const animatedY = PAD_TOP + barHeight - animatedHeight;

    return {
      y: animatedY,
      opacity: progress.value * 0.9,
    };
  });

  return (
    <AnimatedRect
      x={rect.x + 1}
      width={Math.max(0, rect.width - 2)}
      height={3}
      rx={1.5}
      fill={rect.color}
      animatedProps={animatedProps}
    />
  );
}

/**
 * Zone legend item
 */
function LegendItem({ label, color }: { label: string; color: string }) {
  return (
    <View className="flex-row items-center gap-[3px]">
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 2,
          backgroundColor: color,
        }}
      />
      <Text style={{ fontSize: 9, color: LIGHT_THEME.wMute }}>{label}</Text>
    </View>
  );
}

export function IntensityProfileChart({ segments }: IntensityProfileChartProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      400,
      withTiming(1, {
        duration: 600,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      })
    );
  }, []);

  const rects = useMemo(() => calculateRects(segments), [segments]);
  const curvePath = useMemo(() => buildCurvePath(rects), [rects]);

  if (rects.length === 0) return null;

  const barHeight = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;
  const gridLines = [0.25, 0.5, 0.75, 1];

  return (
    <View
      className="mb-4 p-[18px] rounded-[20px] bg-w1 border border-wBrd"
    >
      {/* Header with title and legend */}
      <View className="flex-row items-center justify-between mb-3.5">
        <Text
          className="text-[11px] font-coach-semibold text-wMute uppercase"
          style={{ letterSpacing: 0.05 * 11 }}
        >
          Intensity Profile
        </Text>
        <View className="flex-row gap-2">
          <LegendItem label="Z4-5" color={ACTIVITY_COLORS.barHigh} />
          <LegendItem label="Z3" color="#9ACD32" />
          <LegendItem label="Z2" color={ACTIVITY_COLORS.barEasy} />
          <LegendItem label="Rest" color={ACTIVITY_COLORS.barRest} />
        </View>
      </View>

      {/* SVG Chart */}
      <Svg
        width={CHART_WIDTH}
        height={CHART_HEIGHT}
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      >
        <Defs>
          {rects.map((rect, i) => (
            <LinearGradient
              key={`gradient-${i}`}
              id={`gradient-${i}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <Stop offset="0%" stopColor={rect.color} stopOpacity={0.5} />
              <Stop offset="100%" stopColor={rect.color} stopOpacity={0.08} />
            </LinearGradient>
          ))}
        </Defs>

        {/* Grid lines at 25%, 50%, 75%, 100% */}
        {gridLines.map((ratio) => (
          <Line
            key={ratio}
            x1={0}
            x2={CHART_WIDTH}
            y1={PAD_TOP + barHeight * (1 - ratio)}
            y2={PAD_TOP + barHeight * (1 - ratio)}
            stroke={LIGHT_THEME.wBrd}
            strokeWidth={1}
            strokeDasharray="3,3"
          />
        ))}

        {/* Animated bars with gradient fill */}
        {rects.map((rect, i) => (
          <AnimatedBar
            key={`bar-${i}`}
            rect={rect}
            index={i}
            progress={progress}
          />
        ))}

        {/* Top curve line (optional polish) */}
        {curvePath && (
          <Path
            d={curvePath}
            fill="none"
            stroke={LIGHT_THEME.wText}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.2}
          />
        )}

        {/* Zone indicators on top edge */}
        {rects.map((rect, i) => (
          <AnimatedZoneIndicator
            key={`zone-${i}`}
            rect={rect}
            progress={progress}
          />
        ))}

        {/* Segment km labels */}
        {rects.map((rect, i) => {
          if (rect.width < 25) return null;
          return (
            <SvgText
              key={`label-${i}`}
              x={rect.x + rect.width / 2}
              y={CHART_HEIGHT - 6}
              textAnchor="middle"
              fontSize={rect.width > 50 ? 10 : 8}
              fill={LIGHT_THEME.wMute}
              fontWeight="400"
            >
              {rect.km} km
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

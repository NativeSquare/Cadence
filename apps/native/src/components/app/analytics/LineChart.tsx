/**
 * LineChart Components - GPU-rendered line/area charts with faithful prototype animations
 * Reference: cadence-full-v9.jsx lines 455-484 (VolChart, PaceChart)
 *
 * VolumeChart enhanced with Strava-style bar + line overlay and target comparison.
 * PaceChart retains original line-only approach.
 */

import React, { useEffect } from "react";
import { Pressable, View } from "react-native";
import { CartesianChart, Line, Area, type PointsArray } from "victory-native";
import {
  Circle,
  Group,
  RoundedRect,
  type SkFont,
} from "@shopify/react-native-skia";
import {
  useSharedValue,
  useDerivedValue,
  withDelay,
  withTiming,
  cancelAnimation,
  Easing,
} from "react-native-reanimated";
import { COLORS, LIGHT_THEME, ACTIVITY_COLORS } from "@/lib/design-tokens";
import type {
  VolumeChartDatum,
  PaceChartDatum,
} from "@/hooks/use-analytics-data";

export interface LineChartProps {
  data: VolumeChartDatum[] | PaceChartDatum[];
  font?: SkFont | null;
}

// Animated bar for the Strava-style volume chart
function VolumeBar({
  x,
  width,
  bottom,
  targetHeight,
  color,
  delayMs,
}: {
  x: number;
  width: number;
  bottom: number;
  targetHeight: number;
  color: string;
  delayMs: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delayMs,
      withTiming(1, {
        duration: 600,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      })
    );
    return () => cancelAnimation(progress);
  }, []);

  const animHeight = useDerivedValue(() => progress.value * targetHeight);
  const animY = useDerivedValue(() => bottom - animHeight.value);

  return (
    <RoundedRect
      x={x}
      y={animY}
      width={width}
      height={animHeight}
      r={4}
      color={color}
      opacity={0.3}
    />
  );
}

function VolumeBars({
  points,
  chartBounds,
  currentWeek,
}: {
  points: PointsArray;
  chartBounds: { bottom: number; left: number; right: number };
  currentWeek: number;
}) {
  const totalWidth = chartBounds.right - chartBounds.left;
  const barWidth = (totalWidth / points.length) * 0.5;

  return (
    <>
      {points.map((point, i) => {
        if (point.y == null) return null;
        const targetHeight = chartBounds.bottom - point.y;
        const isCurrent = i === currentWeek - 1;
        return (
          <VolumeBar
            key={i}
            x={point.x - barWidth / 2}
            width={barWidth}
            bottom={chartBounds.bottom}
            targetHeight={targetHeight}
            color={isCurrent ? COLORS.lime : LIGHT_THEME.w3}
            delayMs={i * 40}
          />
        );
      })}
    </>
  );
}

/**
 * VolumeChart - Strava-style volume evolution with bar overlay + trend line
 */
export function VolumeChart({
  data,
  font,
  currentWeek = data.length,
  onWeekPress,
}: {
  data: VolumeChartDatum[];
  font?: SkFont | null;
  currentWeek?: number;
  onWeekPress?: (week: number) => void;
}) {
  const areaOpacity = useSharedValue(0);
  const lineOpacity = useSharedValue(0);
  const dotOpacity = useSharedValue(0);

  useEffect(() => {
    areaOpacity.value = withTiming(1, { duration: 800 });
    lineOpacity.value = withTiming(1, {
      duration: 1500,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
    dotOpacity.value = withDelay(1200, withTiming(1, { duration: 500 }));
    return () => {
      cancelAnimation(areaOpacity);
      cancelAnimation(lineOpacity);
      cancelAnimation(dotOpacity);
    };
  }, []);

  return (
    <Pressable
      onPress={() => onWeekPress?.(currentWeek)}
      style={{ height: 140 }}
    >
      <CartesianChart
        data={data}
        xKey="week"
        yKeys={["volume"]}
        axisOptions={{
          font,
          formatXLabel: (v) => `W${v}`,
          tickCount: { x: Math.min(data.length, 10), y: 0 },
          lineColor: LIGHT_THEME.wBrd,
          labelColor: LIGHT_THEME.wMute,
        }}
      >
        {({ points, chartBounds }) => {
          const lastPoint = points.volume[points.volume.length - 1];
          return (
            <>
              <VolumeBars
                points={points.volume}
                chartBounds={chartBounds}
                currentWeek={currentWeek}
              />
              <Group opacity={areaOpacity}>
                <Area
                  points={points.volume}
                  y0={chartBounds.bottom}
                  color={COLORS.lime}
                  opacity={0.1}
                />
              </Group>
              <Group opacity={lineOpacity}>
                <Line
                  points={points.volume}
                  color={COLORS.lime}
                  strokeWidth={2.5}
                  curveType="natural"
                />
              </Group>
              {lastPoint && lastPoint.y != null && (
                <Circle
                  cx={lastPoint.x}
                  cy={lastPoint.y as number}
                  r={5}
                  color={COLORS.lime}
                  opacity={dotOpacity}
                />
              )}
            </>
          );
        }}
      </CartesianChart>
    </Pressable>
  );
}

/**
 * PaceChart - Weekly pace trend with line drawing and delayed dot
 */
export function PaceChart({
  data,
  font,
}: {
  data: PaceChartDatum[];
  font?: SkFont | null;
}) {
  const lineOpacity = useSharedValue(0);
  const dotOpacity = useSharedValue(0);

  useEffect(() => {
    lineOpacity.value = withDelay(
      200,
      withTiming(1, {
        duration: 1500,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      })
    );
    dotOpacity.value = withDelay(1400, withTiming(1, { duration: 500 }));
    return () => {
      cancelAnimation(lineOpacity);
      cancelAnimation(dotOpacity);
    };
  }, []);

  return (
    <View style={{ height: 100 }}>
      <CartesianChart
        data={data}
        xKey="week"
        yKeys={["pace"]}
        axisOptions={{
          font,
          formatXLabel: (v) => `W${v}`,
          tickCount: { x: Math.min(data.length, 10), y: 0 },
          lineColor: LIGHT_THEME.wBrd,
          labelColor: LIGHT_THEME.wMute,
        }}
      >
        {({ points }) => {
          const lastPoint = points.pace[points.pace.length - 1];
          return (
            <>
              <Group opacity={lineOpacity}>
                <Line
                  points={points.pace}
                  color={ACTIVITY_COLORS.barRest}
                  strokeWidth={2.5}
                  curveType="natural"
                />
              </Group>
              {lastPoint && lastPoint.y != null && (
                <Circle
                  cx={lastPoint.x}
                  cy={lastPoint.y as number}
                  r={5}
                  color={ACTIVITY_COLORS.barRest}
                  opacity={dotOpacity}
                />
              )}
            </>
          );
        }}
      </CartesianChart>
    </View>
  );
}

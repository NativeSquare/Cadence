/**
 * LineChart Components - GPU-rendered line/area charts with faithful prototype animations
 * Reference: cadence-full-v9.jsx lines 455-484 (VolChart, PaceChart)
 *
 * Prototype animation spec:
 * - Volume line: opacity 0→1 over 1.5s cubic-bezier(.4,0,.2,1)
 * - Volume area: opacity 0→1 over 0.8s ease
 * - Volume dot: opacity 0→1, 0.5s ease, 1.2s delay
 * - Pace line: opacity 0→1 over 1.5s cubic-bezier(.4,0,.2,1), 0.2s delay
 * - Pace dot: opacity 0→1, 0.5s ease, 1.4s delay
 *
 * All animations use Reanimated shared values with explicit cancelAnimation
 * cleanup on unmount, ensuring proper resource release when navigating away.
 * Font is received as a prop from AnalyticsScreen to avoid duplicate loading.
 */

import React, { useEffect } from "react";
import { View } from "react-native";
import { CartesianChart, Line, Area } from "victory-native";
import { Circle, Group, type SkFont } from "@shopify/react-native-skia";
import {
  useSharedValue,
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

/**
 * VolumeChart - Weekly volume trend with area fade-in, line drawing, and delayed dot
 */
export function VolumeChart({
  data,
  font,
}: {
  data: VolumeChartDatum[];
  font?: SkFont | null;
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
    <View style={{ height: 120 }}>
      <CartesianChart
        data={data}
        xKey="week"
        yKeys={["volume"]}
        axisOptions={{
          font,
          formatXLabel: (v) => `W${v}`,
          tickCount: { x: 10, y: 0 },
          lineColor: LIGHT_THEME.wBrd,
          labelColor: LIGHT_THEME.wMute,
        }}
      >
        {({ points, chartBounds }) => {
          const lastPoint = points.volume[points.volume.length - 1];
          return (
            <>
              <Group opacity={areaOpacity}>
                <Area
                  points={points.volume}
                  y0={chartBounds.bottom}
                  color={COLORS.lime}
                  opacity={0.15}
                />
              </Group>
              <Group opacity={lineOpacity}>
                <Line
                  points={points.volume}
                  color={COLORS.lime}
                  strokeWidth={2.5}
                  curveType="linear"
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
    </View>
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
          tickCount: { x: 10, y: 0 },
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
                  curveType="linear"
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

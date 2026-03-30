"use no memo";
/**
 * LineChart Components - GPU-rendered interactive line/area charts
 *
 * PaceChart: Pace trend line with touch-to-inspect tooltip.
 * PredictionTrendChart: Race prediction evolution over time.
 *
 * Touch interaction powered by victory-native's useChartPressState.
 */

import React, { useEffect } from "react";
import { View } from "react-native";
import {
  CartesianChart,
  Line,
  Area,
  useChartPressState,
} from "victory-native";
import {
  Circle,
  Group,
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
import { COLORS, ACTIVITY_COLORS } from "@/lib/design-tokens";
import { ActiveValueIndicator } from "./ActiveValueIndicator";
import type {
  PaceChartDatum,
  PredictionTrendDatum,
} from "@/hooks/use-analytics-data";

export interface LineChartProps {
  data: PaceChartDatum[];
  font?: SkFont | null;
}

/**
 * PaceChart - Weekly pace trend with touch-to-inspect
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

  const { state, isActive } = useChartPressState({
    x: 0,
    y: { pace: 0 },
  });

  const paceLabel = useDerivedValue(() => {
    "worklet";
    const seconds = state.y.pace.value.value;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    const pad = secs < 10 ? "0" : "";
    return `${mins}:${pad}${secs} /km`;
  });

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
    <View style={{ height: 110 }}>
      <CartesianChart
        data={data}
        xKey="week"
        yKeys={["pace"]}
        chartPressState={state}
        axisOptions={{
          font,
          formatXLabel: (v) => `W${v}`,
          formatYLabel: (v) => {
            const mins = Math.floor(v / 60);
            const secs = Math.round(v % 60);
            return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
          },
          tickCount: { x: Math.min(data.length, 10), y: 3 },
          lineColor: "rgba(0,0,0,0.08)",
          labelColor: "rgba(0,0,0,0.35)",
        }}
      >
        {({ points, chartBounds }) => {
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
              {!isActive && lastPoint && lastPoint.y != null && (
                <Circle
                  cx={lastPoint.x}
                  cy={lastPoint.y as number}
                  r={5}
                  color={ACTIVITY_COLORS.barRest}
                  opacity={dotOpacity}
                />
              )}
              {isActive && (
                <ActiveValueIndicator
                  xPosition={state.x.position}
                  yPosition={state.y.pace.position}
                  top={chartBounds.top}
                  bottom={chartBounds.bottom}
                  label={paceLabel}
                  font={font ?? null}
                  color={ACTIVITY_COLORS.barRest}
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
 * PredictionTrendChart - Race prediction evolution over time.
 * Y-axis is inverted (lower time = better = higher on chart).
 */
export function PredictionTrendChart({
  data,
  font,
  color = COLORS.ora,
}: {
  data: PredictionTrendDatum[];
  font?: SkFont | null;
  color?: string;
}) {
  const lineOpacity = useSharedValue(0);
  const dotOpacity = useSharedValue(0);

  const { state, isActive } = useChartPressState({
    x: 0,
    y: { timeSeconds: 0 },
  });

  const timeLabel = useDerivedValue(() => {
    "worklet";
    const totalSec = state.y.timeSeconds.value.value;
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = Math.round(totalSec % 60);
    const pad = secs < 10 ? "0" : "";
    if (hrs > 0) {
      const mPad = mins < 10 ? "0" : "";
      return `${hrs}:${mPad}${mins}:${pad}${secs}`;
    }
    return `${mins}:${pad}${secs}`;
  });

  useEffect(() => {
    lineOpacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
    dotOpacity.value = withDelay(350, withTiming(1, { duration: 300 }));
    return () => {
      cancelAnimation(lineOpacity);
      cancelAnimation(dotOpacity);
    };
  }, []);

  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = Math.round(totalSec % 60);
    if (hrs > 0) return `${hrs}:${mins < 10 ? "0" : ""}${mins}`;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <View style={{ height: 180 }}>
      <CartesianChart
        data={data}
        xKey="week"
        yKeys={["timeSeconds"]}
        chartPressState={state}
        axisOptions={{
          font,
          formatXLabel: (v) => `W${v}`,
          formatYLabel: (v) => formatTime(v),
          tickCount: { x: Math.min(data.length, 8), y: 3 },
          lineColor: "rgba(0,0,0,0.08)",
          labelColor: "rgba(0,0,0,0.35)",
        }}
      >
        {({ points, chartBounds }) => (
          <>
            <Group opacity={lineOpacity}>
              <Area
                points={points.timeSeconds}
                y0={chartBounds.bottom}
                color={color}
                opacity={0.1}
              />
              <Line
                points={points.timeSeconds}
                color={color}
                strokeWidth={2.5}
                curveType="natural"
              />
            </Group>
            <Group opacity={dotOpacity}>
              {points.timeSeconds.map((point, i) =>
                point.y != null ? (
                  <Circle
                    key={i}
                    cx={point.x}
                    cy={point.y as number}
                    r={3}
                    color={color}
                  />
                ) : null
              )}
            </Group>
            {isActive && (
              <ActiveValueIndicator
                xPosition={state.x.position}
                yPosition={state.y.timeSeconds.position}
                top={chartBounds.top}
                bottom={chartBounds.bottom}
                label={timeLabel}
                font={font ?? null}
                color={color}
              />
            )}
          </>
        )}
      </CartesianChart>
    </View>
  );
}

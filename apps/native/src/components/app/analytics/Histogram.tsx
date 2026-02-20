/**
 * Histogram Component - Daily KM bar chart with staggered grow animation
 * Reference: cadence-full-v9.jsx lines 407-428
 *
 * Each bar grows from bottom with a per-bar staggered delay (i * 60ms),
 * matching the prototype's CSS transition. Uses Reanimated shared values
 * driving Skia RoundedRect elements — all on the GPU thread.
 */

import React, { useEffect } from "react";
import { View } from "react-native";
import { CartesianChart, type PointsArray } from "victory-native";
import { RoundedRect, useFont } from "@shopify/react-native-skia";
import {
  useSharedValue,
  useDerivedValue,
  withDelay,
  withTiming,
  cancelAnimation,
  Easing,
} from "react-native-reanimated";
import { Outfit_400Regular } from "@expo-google-fonts/outfit";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { DAY_LABELS } from "./mock-data";
import type { HistogramDatum } from "@/hooks/use-analytics-data";

const BAR_EASING = Easing.bezier(0.4, 0, 0.2, 1);

export interface HistogramProps {
  data: HistogramDatum[];
  accentIdx?: number;
  chartHeight?: number;
}

function AnimatedBar({
  targetHeight,
  x,
  width,
  bottom,
  color,
  delayMs,
}: {
  targetHeight: number;
  x: number;
  width: number;
  bottom: number;
  color: string;
  delayMs: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delayMs,
      withTiming(1, { duration: 600, easing: BAR_EASING })
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
      r={6}
      color={color}
    />
  );
}

function HistogramBars({
  points,
  chartBounds,
  accentIdx,
}: {
  points: PointsArray;
  chartBounds: { bottom: number; left: number; right: number };
  accentIdx?: number;
}) {
  const barCount = points.length;
  const totalWidth = chartBounds.right - chartBounds.left;
  const barWidth = (totalWidth / barCount) * 0.6;

  return (
    <>
      {points.map((point, i) => {
        if (point.y == null) return null;
        const targetHeight = chartBounds.bottom - point.y;
        const color = i === accentIdx ? COLORS.lime : LIGHT_THEME.w3;
        return (
          <AnimatedBar
            key={i}
            targetHeight={targetHeight}
            x={point.x - barWidth / 2}
            width={barWidth}
            bottom={chartBounds.bottom}
            color={color}
            delayMs={i * 60}
          />
        );
      })}
    </>
  );
}

export function Histogram({
  data,
  accentIdx,
  chartHeight = 124,
}: HistogramProps) {
  const font = useFont(Outfit_400Regular, 10);

  return (
    <View style={{ height: chartHeight }}>
      <CartesianChart
        data={data}
        xKey="day"
        yKeys={["km"]}
        domainPadding={{ left: 20, right: 20, top: 20 }}
        axisOptions={{
          font,
          formatXLabel: (v) => DAY_LABELS[v] ?? "",
          tickCount: { x: 7, y: 0 },
          lineColor: "transparent",
          labelColor: LIGHT_THEME.wMute,
        }}
      >
        {({ points, chartBounds }) => (
          <HistogramBars
            points={points.km}
            chartBounds={chartBounds}
            accentIdx={accentIdx}
          />
        )}
      </CartesianChart>
    </View>
  );
}

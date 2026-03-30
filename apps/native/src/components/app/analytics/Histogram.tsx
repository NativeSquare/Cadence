"use no memo";
/**
 * Histogram Component - Interactive daily KM bar chart
 *
 * Each bar grows from bottom with staggered delay.
 * Touch-to-inspect shows the km value for each day.
 */

import React, { useEffect } from "react";
import { View } from "react-native";
import {
  CartesianChart,
  useChartPressState,
  type PointsArray,
} from "victory-native";
import { RoundedRect, type SkFont } from "@shopify/react-native-skia";
import {
  useSharedValue,
  useDerivedValue,
  withDelay,
  withTiming,
  cancelAnimation,
  Easing,
} from "react-native-reanimated";
import { COLORS } from "@/lib/design-tokens";
import { DAY_LABELS } from "./mock-data";
import { ActiveValueIndicator } from "./ActiveValueIndicator";
import type { HistogramDatum } from "@/hooks/use-analytics-data";

const BAR_EASING = Easing.bezier(0.4, 0, 0.2, 1);

export interface HistogramProps {
  data: HistogramDatum[];
  accentIdx?: number;
  chartHeight?: number;
  font?: SkFont | null;
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
        const color = i === accentIdx ? COLORS.lime : "rgba(255,255,255,0.10)";

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
  font,
}: HistogramProps) {
  const { state, isActive } = useChartPressState({
    x: 0,
    y: { km: 0 },
  });

  const kmLabel = useDerivedValue(() => {
    "worklet";
    const v = state.y.km.value.value;
    const rounded = Math.round(v * 10) / 10;
    return `${rounded} km`;
  });

  return (
    <View style={{ height: chartHeight }}>
      <CartesianChart
        data={data}
        xKey="day"
        yKeys={["km"]}
        chartPressState={state}
        domainPadding={{ left: 20, right: 20, top: 20 }}
        axisOptions={{
          font,
          formatXLabel: (v) => DAY_LABELS[v] ?? "",
          tickCount: { x: 7, y: 0 },
          lineColor: "transparent",
          labelColor: "rgba(255,255,255,0.45)",
        }}
      >
        {({ points, chartBounds }) => (
          <>
            <HistogramBars
              points={points.km}
              chartBounds={chartBounds}
              accentIdx={accentIdx}
            />
            {isActive && (
              <ActiveValueIndicator
                xPosition={state.x.position}
                yPosition={state.y.km.position}
                top={chartBounds.top}
                bottom={chartBounds.bottom}
                label={kmLabel}
                font={font ?? null}
                color={COLORS.lime}
              />
            )}
          </>
        )}
      </CartesianChart>
    </View>
  );
}

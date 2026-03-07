/**
 * VolumeBarChart - Strava-style animated bar chart for volume over time
 *
 * Bars grow from bottom with staggered entrance animation.
 * Touch-to-inspect shows value pill via ActiveValueIndicator.
 * Light-theme variant designed for white card backgrounds.
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
import { ActiveValueIndicator } from "./ActiveValueIndicator";

const BAR_EASING = Easing.bezier(0.4, 0, 0.2, 1);
const BAR_COLOR = COLORS.lime;
const BAR_OPACITY = 0.55;
const BAR_HIGHLIGHT = COLORS.lime;

export interface VolumeBarDatum {
  index: number;
  volume: number;
  [key: string]: unknown;
}

function AnimatedBar({
  targetHeight,
  x,
  width,
  bottom,
  color,
  opacity = 1,
  delayMs,
}: {
  targetHeight: number;
  x: number;
  width: number;
  bottom: number;
  color: string;
  opacity?: number;
  delayMs: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delayMs,
      withTiming(1, { duration: 500, easing: BAR_EASING })
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
      opacity={opacity}
    />
  );
}

function VolumeBars({
  points,
  chartBounds,
}: {
  points: PointsArray;
  chartBounds: { bottom: number; left: number; right: number };
}) {
  const barCount = points.length;
  const totalWidth = chartBounds.right - chartBounds.left;
  const gapRatio = barCount <= 7 ? 0.55 : barCount <= 14 ? 0.60 : 0.65;
  const barWidth = Math.max((totalWidth / barCount) * gapRatio, 4);
  const lastIdx = barCount - 1;

  return (
    <>
      {points.map((point, i) => {
        if (point.y == null) return null;
        const targetHeight = Math.max(chartBounds.bottom - point.y, 0);
        if (targetHeight < 1) return null;

        const isLast = i === lastIdx;
        return (
          <AnimatedBar
            key={i}
            targetHeight={targetHeight}
            x={point.x - barWidth / 2}
            width={barWidth}
            bottom={chartBounds.bottom}
            color={isLast ? BAR_HIGHLIGHT : BAR_COLOR}
            opacity={isLast ? 1 : BAR_OPACITY}
            delayMs={i * 35}
          />
        );
      })}
    </>
  );
}

interface VolumeBarChartProps {
  data: VolumeBarDatum[];
  labels: string[];
  font?: SkFont | null;
  chartHeight?: number;
}

export function VolumeBarChart({
  data,
  labels,
  font,
  chartHeight = 180,
}: VolumeBarChartProps) {
  const { state, isActive } = useChartPressState({
    x: 0,
    y: { volume: 0 },
  });

  const volumeLabel = useDerivedValue(() => {
    "worklet";
    const v = Math.round(state.y.volume.value.value * 10) / 10;
    const idx = Math.round(state.x.value.value);
    const periodLabel = labels[idx] ?? "";
    if (periodLabel) return `${periodLabel} · ${v} km`;
    return `${v} km`;
  });

  const tickCount = Math.min(data.length, data.length <= 7 ? 7 : 12);

  return (
    <View style={{ height: chartHeight }}>
      <CartesianChart
        data={data}
        xKey="index"
        yKeys={["volume"]}
        chartPressState={state}
        domainPadding={{ left: 16, right: 16, top: 24 }}
        axisOptions={{
          font,
          formatXLabel: (v) => labels[v] ?? "",
          tickCount: { x: tickCount, y: 0 },
          lineColor: "transparent",
          labelColor: "rgba(0,0,0,0.35)",
        }}
      >
        {({ points, chartBounds }) => (
          <>
            <VolumeBars points={points.volume} chartBounds={chartBounds} />
            {isActive && (
              <ActiveValueIndicator
                xPosition={state.x.position}
                yPosition={state.y.volume.position}
                top={chartBounds.top}
                bottom={chartBounds.bottom}
                label={volumeLabel}
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

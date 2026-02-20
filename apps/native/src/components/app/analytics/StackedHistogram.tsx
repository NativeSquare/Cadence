/**
 * StackedHistogram Component - Zone split stacked bar chart with clip-reveal animation
 * Reference: cadence-full-v9.jsx lines 430-452
 *
 * Each bar uses a Skia Group with an animated clip rect that reveals
 * statically-positioned zone segments from bottom to top.
 * Per-bar staggered delay (i * 60ms) matches the prototype.
 */

import React, { useEffect, useMemo } from "react";
import { View } from "react-native";
import { CartesianChart, type PointsArray } from "victory-native";
import { RoundedRect, Rect, Group, useFont } from "@shopify/react-native-skia";
import {
  useSharedValue,
  useDerivedValue,
  withDelay,
  withTiming,
  cancelAnimation,
  Easing,
} from "react-native-reanimated";
import { Outfit_400Regular } from "@expo-google-fonts/outfit";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME, ACTIVITY_COLORS } from "@/lib/design-tokens";
import { DAY_LABELS } from "./mock-data";
import type { ZoneChartDatum } from "@/hooks/use-analytics-data";

const BAR_EASING = Easing.bezier(0.4, 0, 0.2, 1);

export interface StackedHistogramProps {
  data: ZoneChartDatum[];
  accentIdx?: number;
  chartHeight?: number;
}

function AnimatedStackedBar({
  z2,
  z3,
  z4,
  x,
  width,
  bottom,
  barTop,
  delayMs,
  isAccent,
}: {
  z2: number;
  z3: number;
  z4: number;
  x: number;
  width: number;
  bottom: number;
  barTop: number;
  delayMs: number;
  isAccent: boolean;
}) {
  const total = z2 + z3 + z4;
  const progress = useSharedValue(0);

  useEffect(() => {
    if (total > 0) {
      progress.value = withDelay(
        delayMs,
        withTiming(1, { duration: 600, easing: BAR_EASING })
      );
    }
    return () => cancelAnimation(progress);
  }, []);

  if (total === 0) {
    return (
      <RoundedRect
        x={x}
        y={bottom - 4}
        width={width}
        height={4}
        r={2}
        color={LIGHT_THEME.w3}
      />
    );
  }

  const totalH = bottom - barTop;
  const z2H = totalH * (z2 / total);
  const z3H = totalH * (z3 / total);
  const z4H = totalH * (z4 / total);

  const z2Y = bottom - z2H;
  const z3Y = z2Y - z3H;
  const z4Y = z3Y - z4H;

  const clip = useDerivedValue(() => ({
    x: x - 1,
    y: bottom - totalH * progress.value,
    width: width + 2,
    height: totalH * progress.value + 1,
  }));

  const z4Color = isAccent ? COLORS.lime : ACTIVITY_COLORS.barHigh;
  const z3Color = isAccent ? "rgba(200,255,0,0.5)" : ACTIVITY_COLORS.barEasy;
  const z2Color = isAccent ? "rgba(200,255,0,0.25)" : ACTIVITY_COLORS.barRest;

  return (
    <Group clip={clip}>
      {z4 > 0 && (
        <RoundedRect
          x={x}
          y={z4Y}
          width={width}
          height={z4H}
          r={6}
          color={z4Color}
          opacity={isAccent ? 1 : 0.6}
        />
      )}
      {z3 > 0 && (
        <Rect
          x={x}
          y={z3Y}
          width={width}
          height={z3H}
          color={z3Color}
          opacity={isAccent ? 1 : 0.5}
        />
      )}
      {z2 > 0 && (
        <RoundedRect
          x={x}
          y={z2Y}
          width={width}
          height={z2H}
          r={6}
          color={z2Color}
          opacity={isAccent ? 1 : 0.4}
        />
      )}
    </Group>
  );
}

function StackedBars({
  data,
  xPoints,
  chartBounds,
  accentIdx,
}: {
  data: ZoneChartDatum[];
  xPoints: PointsArray;
  chartBounds: { top: number; bottom: number; left: number; right: number };
  accentIdx?: number;
}) {
  const totalWidth = chartBounds.right - chartBounds.left;
  const barWidth = (totalWidth / xPoints.length) * 0.6;

  return (
    <>
      {data.map((datum, i) => (
        <AnimatedStackedBar
          key={i}
          z2={datum.z2}
          z3={datum.z3}
          z4={datum.z4}
          x={xPoints[i].x - barWidth / 2}
          width={barWidth}
          bottom={chartBounds.bottom}
          barTop={xPoints[i].y ?? chartBounds.bottom}
          delayMs={i * 60}
          isAccent={i === accentIdx}
        />
      ))}
    </>
  );
}

export function StackedHistogram({
  data,
  accentIdx,
  chartHeight = 114,
}: StackedHistogramProps) {
  const font = useFont(Outfit_400Regular, 10);

  const chartData = useMemo(
    () => data.map((d) => ({ ...d, total: d.z2 + d.z3 + d.z4 })),
    [data]
  );

  return (
    <View style={{ height: chartHeight }}>
      <CartesianChart
        data={chartData}
        xKey="day"
        yKeys={["total"]}
        domain={{ y: [0, 100] }}
        domainPadding={{ left: 20, right: 20, top: 10 }}
        axisOptions={{
          font,
          formatXLabel: (v) => DAY_LABELS[v] ?? "",
          tickCount: { x: 7, y: 0 },
          lineColor: "transparent",
          labelColor: LIGHT_THEME.wMute,
        }}
      >
        {({ points, chartBounds }) => (
          <StackedBars
            data={data}
            xPoints={points.total}
            chartBounds={chartBounds}
            accentIdx={accentIdx}
          />
        )}
      </CartesianChart>
    </View>
  );
}

function ZoneLegendItem({ label, color }: { label: string; color: string }) {
  return (
    <View className="flex-row items-center gap-[3px]">
      <View
        className="w-[6px] h-[6px] rounded-sm"
        style={{ backgroundColor: color }}
      />
      <Text className="text-[9px] font-coach text-wMute">{label}</Text>
    </View>
  );
}

export function ZoneLegend() {
  return (
    <View className="flex-row gap-2">
      <ZoneLegendItem label="Z4-5" color={ACTIVITY_COLORS.barHigh} />
      <ZoneLegendItem label="Z3" color={ACTIVITY_COLORS.barEasy} />
      <ZoneLegendItem label="Z2" color={ACTIVITY_COLORS.barRest} />
    </View>
  );
}

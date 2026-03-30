"use no memo";
/**
 * StackedHistogram Component - Interactive zone split stacked bar charts
 *
 * Supports two modes:
 * - Daily: 7-day zone split
 * - Weekly: Multi-week zone evolution (COROS-style)
 *
 * Touch-to-inspect shows zone breakdown per bar.
 */

import React, { useEffect, useMemo } from "react";
import { View } from "react-native";
import {
  CartesianChart,
  useChartPressState,
  type PointsArray,
} from "victory-native";
import {
  RoundedRect,
  Rect,
  Group,
  Line as SkiaLine,
  Text as SkiaText,
  type SkFont,
} from "@shopify/react-native-skia";
import {
  useSharedValue,
  useDerivedValue,
  withDelay,
  withTiming,
  cancelAnimation,
  Easing,
  type SharedValue,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { COLORS, GRAYS, ACTIVITY_COLORS } from "@/lib/design-tokens";
import { DAY_LABELS, WEEK_LABELS } from "./mock-data";
import type { ZoneChartDatum } from "@/hooks/use-analytics-data";
import type { WeekZoneData } from "./mock-data";

const BAR_EASING = Easing.bezier(0.4, 0, 0.2, 1);

export interface StackedHistogramProps {
  data: ZoneChartDatum[];
  accentIdx?: number;
  chartHeight?: number;
  font?: SkFont | null;
}

export interface WeeklyZoneChartProps {
  data: WeekZoneData[];
  currentWeek?: number;
  chartHeight?: number;
  font?: SkFont | null;
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
        color="rgba(255,255,255,0.10)"
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
  data: Array<{ z2: number; z3: number; z4: number }>;
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

/**
 * Zone tooltip showing Z2/Z3/Z4 breakdown when touching a bar
 */
function ZoneTooltip({
  xPosition,
  top,
  bottom,
  font,
  activeValue,
}: {
  xPosition: SharedValue<number>;
  top: number;
  bottom: number;
  font: SkFont | null;
  activeValue: SharedValue<number>;
}) {
  const lineP1 = useDerivedValue(() => ({ x: xPosition.value, y: top }));
  const lineP2 = useDerivedValue(() => ({ x: xPosition.value, y: bottom }));

  const labelText = useDerivedValue(() => {
    const val = Math.round(activeValue.value);
    return `${val}%`;
  });

  const labelWidth = useDerivedValue(() => {
    if (!font) return 36;
    return Math.max(font.measureText(labelText.value).width + 18, 36);
  });

  const pillX = useDerivedValue(() => xPosition.value - labelWidth.value / 2);

  const textX = useDerivedValue(() => {
    if (!font) return xPosition.value;
    const tw = font.measureText(labelText.value).width;
    return xPosition.value - tw / 2;
  });

  const PILL_Y = top - 6;

  return (
    <>
      <SkiaLine
        p1={lineP1}
        p2={lineP2}
        color="rgba(255,255,255,0.08)"
        strokeWidth={1}
        style="stroke"
      />
      {font && (
        <>
          <RoundedRect
            x={pillX}
            y={PILL_Y}
            width={labelWidth}
            height={22}
            r={7}
            color={GRAYS.g1}
          />
          <SkiaText
            x={textX}
            y={PILL_Y + 15}
            text={labelText}
            font={font}
            color="#1A1A1A"
          />
        </>
      )}
    </>
  );
}

/** Daily zone split (original component) */
export function StackedHistogram({
  data,
  accentIdx,
  chartHeight = 114,
  font,
}: StackedHistogramProps) {
  const chartData = useMemo(
    () => data.map((d) => ({ ...d, total: d.z2 + d.z3 + d.z4 })),
    [data]
  );

  const { state, isActive } = useChartPressState({
    x: 0,
    y: { total: 0 },
  });

  return (
    <View style={{ height: chartHeight }}>
      <CartesianChart
        data={chartData}
        xKey="day"
        yKeys={["total"]}
        domain={{ y: [0, 100] }}
        chartPressState={state}
        domainPadding={{ left: 20, right: 20, top: 10 }}
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
            <StackedBars
              data={data}
              xPoints={points.total}
              chartBounds={chartBounds}
              accentIdx={isActive ? undefined : accentIdx}
            />
            {isActive && (
              <ZoneTooltip
                xPosition={state.x.position}
                top={chartBounds.top}
                bottom={chartBounds.bottom}
                font={font ?? null}
                activeValue={state.y.total.value}
              />
            )}
          </>
        )}
      </CartesianChart>
    </View>
  );
}

/** COROS-style multi-week zone evolution chart */
export function WeeklyZoneChart({
  data,
  currentWeek,
  chartHeight = 130,
  font,
}: WeeklyZoneChartProps) {
  const chartData = useMemo(
    () => data.map((d) => ({ ...d, total: d.z2 + d.z3 + d.z4 })),
    [data]
  );

  const { state, isActive } = useChartPressState({
    x: 0,
    y: { total: 0 },
  });

  return (
    <View style={{ height: chartHeight }}>
      <CartesianChart
        data={chartData}
        xKey="week"
        yKeys={["total"]}
        domain={{ y: [0, 100] }}
        chartPressState={state}
        domainPadding={{ left: 20, right: 20, top: 10 }}
        axisOptions={{
          font,
          formatXLabel: (v) => WEEK_LABELS[v - 1] ?? `W${v}`,
          tickCount: { x: Math.min(data.length, 10), y: 0 },
          lineColor: "transparent",
          labelColor: "rgba(255,255,255,0.45)",
        }}
      >
        {({ points, chartBounds }) => (
          <>
            <StackedBars
              data={data}
              xPoints={points.total}
              chartBounds={chartBounds}
              accentIdx={isActive ? undefined : (currentWeek ? currentWeek - 1 : undefined)}
            />
            {isActive && (
              <ZoneTooltip
                xPosition={state.x.position}
                top={chartBounds.top}
                bottom={chartBounds.bottom}
                font={font ?? null}
                activeValue={state.y.total.value}
              />
            )}
          </>
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
      <Text className="text-[9px] font-coach text-g3">{label}</Text>
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

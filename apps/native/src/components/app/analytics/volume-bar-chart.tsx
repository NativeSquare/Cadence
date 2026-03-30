"use no memo";
/**
 * VolumeLineChart - Strava-style line chart for volume over time
 *
 * - Line with visible data points (dots) at each value
 * - On touch: vertical line + highlighted dot; no floating tooltip
 * - Selected period and value are shown in a flat summary above the chart
 *   (parent controls that display via onSelectionChange)
 */

import React, { useRef } from "react";
import { View } from "react-native";
import {
  CartesianChart,
  Line,
  useChartPressState,
  type PointsArray,
} from "victory-native";
import { Circle, Line as SkiaLine } from "@shopify/react-native-skia";
import {
  useDerivedValue,
  useAnimatedReaction,
  runOnJS,
  type SharedValue,
} from "react-native-reanimated";
import { COLORS } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";

const LINE_COLOR = COLORS.lime;
const DOT_R = 4;
const DOT_HIGHLIGHT_R = 6;
const VERTICAL_LINE_COLOR = "rgba(0,0,0,0.12)";

export interface VolumeBarDatum {
  index: number;
  volume: number;
  [key: string]: unknown;
}

export type VolumeSelection = {
  index: number;
  volume: number;
  label: string;
} | null;

function reportSelection(
  active: boolean,
  xValue: number,
  data: VolumeBarDatum[],
  labels: string[],
  onSelectionChange: (s: VolumeSelection) => void,
  lastIndexRef: React.MutableRefObject<number | null>
) {
  if (!active) {
    lastIndexRef.current = null;
    onSelectionChange(null);
    return;
  }
  const idx = Math.round(xValue);
  const clamped = Math.max(0, Math.min(idx, data.length - 1));
  if (lastIndexRef.current !== clamped) {
    lastIndexRef.current = clamped;
    selectionFeedback();
  }
  const datum = data[clamped];
  const label = labels[clamped] ?? "";
  const volume = datum ? datum.volume : 0;
  onSelectionChange({ index: clamped, volume, label });
}

interface VolumeLineChartProps {
  data: VolumeBarDatum[];
  labels: string[];
  font?: import("@shopify/react-native-skia").SkFont | null;
  chartHeight?: number;
  /** Called when user selects a point or releases (null). Use to show flat summary. */
  onSelectionChange?: (selection: VolumeSelection) => void;
}

export function VolumeBarChart({
  data,
  labels,
  font,
  chartHeight = 180,
  onSelectionChange,
}: VolumeLineChartProps) {
  const { state, isActive } = useChartPressState({
    x: 0,
    y: { volume: 0 },
  });

  const lastIndexRef = useRef<number | null>(null);

  // Sync selection to parent for flat summary and haptic when crossing points
  useAnimatedReaction(
    () => ({ active: (isActive as unknown as { value: boolean }).value, x: state.x.value.value }),
    ({ active, x }) => {
      if (onSelectionChange) {
        runOnJS(reportSelection)(
          active,
          x,
          data,
          labels,
          onSelectionChange,
          lastIndexRef
        );
      }
    },
    [data, labels, onSelectionChange]
  );

  const tickCount = Math.min(data.length, data.length <= 7 ? 7 : 12);

  const maxVolume = data.length
    ? Math.max(...data.map((d) => d.volume), 0)
    : 0;
  const yDomain: [number, number] =
    maxVolume === 0 ? [0, 1] : [0, Math.max(maxVolume * 1.05, 1)];

  return (
    <View style={{ height: chartHeight }}>
      <CartesianChart
        data={data}
        xKey="index"
        yKeys={["volume"]}
        chartPressState={state}
        domain={{ y: yDomain }}
        domainPadding={{ left: 16, right: 16, top: 24, bottom: 16 }}
        axisOptions={{
          font,
          formatXLabel: (v) => labels[v] ?? "",
          formatYLabel: (v) => `${v} km`,
          tickCount: { x: tickCount, y: 4 },
          lineColor: "rgba(0,0,0,0.08)",
          labelColor: "rgba(0,0,0,0.35)",
        }}
      >
        {({ points, chartBounds }) => (
          <>
            <VolumeLine points={points.volume} color={LINE_COLOR} />
            <VolumeDots
              points={points.volume}
              isActive={isActive as unknown as SharedValue<boolean>}
              stateXPosition={state.x.position}
              stateYPosition={state.y.volume.position}
            />
            <VerticalLine
              xPosition={state.x.position}
              top={chartBounds.top}
              bottom={chartBounds.bottom}
              isActive={isActive as unknown as SharedValue<boolean>}
            />
          </>
        )}
      </CartesianChart>
    </View>
  );
}

function VerticalLine({
  xPosition,
  top,
  bottom,
  isActive,
}: {
  xPosition: SharedValue<number>;
  top: number;
  bottom: number;
  isActive: SharedValue<boolean>;
}) {
  const p1 = useDerivedValue(() => ({ x: xPosition.value, y: top }));
  const p2 = useDerivedValue(() => ({ x: xPosition.value, y: bottom }));
  const opacity = useDerivedValue(() => (isActive.value ? 1 : 0));
  return (
    <SkiaLine
      p1={p1}
      p2={p2}
      color={VERTICAL_LINE_COLOR}
      strokeWidth={1}
      style="stroke"
      opacity={opacity}
    />
  );
}

function VolumeLine({
  points,
  color,
}: {
  points: PointsArray;
  color: string;
}) {
  return (
    <Line
      points={points}
      color={color}
      strokeWidth={2}
      curveType="linear"
    />
  );
}

function VolumeDots({
  points,
  isActive,
  stateXPosition,
  stateYPosition,
}: {
  points: PointsArray;
  isActive: SharedValue<boolean>;
  stateXPosition: SharedValue<number>;
  stateYPosition: SharedValue<number>;
}) {
  const highlightOpacity = useDerivedValue(() => (isActive.value ? 1 : 0));
  return (
    <>
      {points.map((point, i) => {
        if (point.y == null) return null;
        const y = point.y as number;
        return (
          <Circle
            key={i}
            cx={point.x}
            cy={y}
            r={DOT_R}
            color={LINE_COLOR}
            opacity={0.7}
          />
        );
      })}
      <Circle
        cx={stateXPosition}
        cy={stateYPosition}
        r={DOT_HIGHLIGHT_R}
        color={LINE_COLOR}
        opacity={highlightOpacity}
      />
    </>
  );
}

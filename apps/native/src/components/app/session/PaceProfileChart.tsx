import React, { useEffect, useMemo } from "react";
import { View } from "react-native";
import {
  CartesianChart,
  Line,
  Area,
  useChartPressState,
} from "victory-native";
import { Circle, Group, type SkFont } from "@shopify/react-native-skia";
import {
  useSharedValue,
  useDerivedValue,
  withDelay,
  withTiming,
  cancelAnimation,
  Easing,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { ACTIVITY_COLORS, LIGHT_THEME, FONT_WEIGHTS } from "@/lib/design-tokens";
import { ActiveValueIndicator } from "@/components/app/analytics/ActiveValueIndicator";
import type { SessionSegment } from "./types";

const CARD_SHADOW = {
  borderWidth: 1,
  borderColor: "rgba(0,0,0,0.08)",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 16,
  elevation: 4,
} as const;

interface PaceDatum {
  cumulativeKm: number;
  paceSeconds: number;
  [key: string]: unknown;
}

function parsePaceToSeconds(pace: string): number {
  const parts = pace.split(":");
  if (parts.length !== 2) return 360;
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

function formatPace(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.round(totalSeconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function buildPaceData(segments: SessionSegment[]): PaceDatum[] {
  const points: PaceDatum[] = [];
  let cumKm = 0;

  for (const seg of segments) {
    const km = parseFloat(seg.km);
    const paceSec = parsePaceToSeconds(seg.pace);
    if (isNaN(km) || km <= 0) continue;

    points.push({ cumulativeKm: Math.round(cumKm * 10) / 10, paceSeconds: paceSec });
    cumKm += km;
    points.push({ cumulativeKm: Math.round(cumKm * 10) / 10, paceSeconds: paceSec });
  }

  return points;
}

export interface PaceProfileChartProps {
  segments: SessionSegment[];
  font?: SkFont | null;
  chartHeight?: number;
}

export function PaceProfileChart({
  segments,
  font,
  chartHeight = 140,
}: PaceProfileChartProps) {
  const data = useMemo(() => buildPaceData(segments), [segments]);

  const lineOpacity = useSharedValue(0);
  const dotOpacity = useSharedValue(0);

  const { state, isActive } = useChartPressState({
    x: 0,
    y: { paceSeconds: 0 },
  });

  const paceLabel = useDerivedValue(() => {
    "worklet";
    const seconds = state.y.paceSeconds.value.value;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    const pad = secs < 10 ? "0" : "";
    return `${mins}:${pad}${secs} /km`;
  });

  useEffect(() => {
    lineOpacity.value = withDelay(
      200,
      withTiming(1, {
        duration: 1200,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      })
    );
    dotOpacity.value = withDelay(1200, withTiming(1, { duration: 400 }));
    return () => {
      cancelAnimation(lineOpacity);
      cancelAnimation(dotOpacity);
    };
  }, []);

  if (data.length < 2) return null;

  const allPaces = data.map((d) => d.paceSeconds);
  const minPace = Math.min(...allPaces);
  const maxPace = Math.max(...allPaces);
  const paceRange = maxPace - minPace;
  const yPadding = Math.max(paceRange * 0.15, 10);

  return (
    <View
      className="p-5 rounded-[20px] mb-3"
      style={{ backgroundColor: LIGHT_THEME.w1, ...CARD_SHADOW }}
    >
      <Text
        style={{
          fontSize: 12,
          fontFamily: FONT_WEIGHTS.semibold,
          color: LIGHT_THEME.wSub,
          textTransform: "uppercase",
          letterSpacing: 0.05 * 12,
          marginBottom: 12,
        }}
      >
        Pace Profile
      </Text>

      <View style={{ height: chartHeight }}>
        <CartesianChart
          data={data}
          xKey="cumulativeKm"
          yKeys={["paceSeconds"]}
          chartPressState={state}
          domain={{ y: [maxPace + yPadding, minPace - yPadding] }}
          axisOptions={{
            font,
            formatXLabel: (v) => `${v}km`,
            formatYLabel: (v) => formatPace(v),
            tickCount: { x: Math.min(data.length, 6), y: 3 },
            lineColor: "rgba(0,0,0,0.08)",
            labelColor: "rgba(0,0,0,0.35)",
          }}
        >
          {({ points, chartBounds }) => {
            const lastPoint = points.paceSeconds[points.paceSeconds.length - 1];
            return (
              <>
                <Group opacity={lineOpacity}>
                  <Area
                    points={points.paceSeconds}
                    y0={chartBounds.bottom}
                    color={ACTIVITY_COLORS.barRest}
                    opacity={0.1}
                  />
                  <Line
                    points={points.paceSeconds}
                    color={ACTIVITY_COLORS.barRest}
                    strokeWidth={2.5}
                    curveType="linear"
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
                    yPosition={state.y.paceSeconds.position}
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
    </View>
  );
}

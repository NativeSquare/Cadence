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
import { Text } from "@/components/ui/text";
import { LIGHT_THEME, FONT_WEIGHTS } from "@/lib/design-tokens";
import { ActiveValueIndicator } from "@/components/app/analytics/ActiveValueIndicator";
import type { SessionSegment } from "./types";
import { ZONE_HEIGHT, getZoneColor } from "./types";

const BAR_EASING = Easing.bezier(0.4, 0, 0.2, 1);

const CARD_SHADOW = {
  borderWidth: 1,
  borderColor: "rgba(0,0,0,0.08)",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 16,
  elevation: 4,
} as const;

interface SegmentDatum {
  index: number;
  zoneHeight: number;
}

function abbreviateSegmentName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("warm")) return "WU";
  if (lower.includes("cool")) return "CD";
  if (lower.includes("recovery") || lower.includes("jog")) return "Rec";
  if (lower.includes("easy")) return "Easy";
  if (lower.includes("rest")) return "Rest";
  if (lower.includes("interval") || lower.includes("800")) return "Int";
  if (lower.includes("tempo")) {
    const match = name.match(/\d+/);
    return match ? `T${match[0]}` : "Tmp";
  }
  if (lower.includes("moderate") || lower.includes("build")) return "Bld";
  if (lower.includes("hm") || lower.includes("finish")) return "Fin";
  if (lower.includes("progressive")) return "Prog";
  if (name.length <= 4) return name;
  return name.slice(0, 3);
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
    />
  );
}

function SegmentBars({
  points,
  chartBounds,
  segments,
}: {
  points: PointsArray;
  chartBounds: { bottom: number; left: number; right: number };
  segments: SessionSegment[];
}) {
  const barCount = points.length;
  const totalWidth = chartBounds.right - chartBounds.left;
  const gapRatio = barCount <= 4 ? 0.5 : barCount <= 6 ? 0.55 : 0.6;
  const barWidth = Math.max((totalWidth / barCount) * gapRatio, 8);

  return (
    <>
      {points.map((point, i) => {
        if (point.y == null) return null;
        const targetHeight = Math.max(chartBounds.bottom - point.y, 0);
        if (targetHeight < 1) return null;

        const seg = segments[i];
        const color = seg ? getZoneColor(seg.zone) : "#A8D900";

        return (
          <AnimatedBar
            key={i}
            targetHeight={targetHeight}
            x={point.x - barWidth / 2}
            width={barWidth}
            bottom={chartBounds.bottom}
            color={color}
            delayMs={i * 35}
          />
        );
      })}
    </>
  );
}

export interface SegmentBarChartProps {
  segments: SessionSegment[];
  font?: SkFont | null;
  chartHeight?: number;
}

export function SegmentBarChart({
  segments,
  font,
  chartHeight = 140,
}: SegmentBarChartProps) {
  const data: SegmentDatum[] = segments.map((seg, i) => ({
    index: i,
    zoneHeight: ZONE_HEIGHT[seg.zone] ?? 0.4,
  }));

  const labels = segments.map((s) => abbreviateSegmentName(s.name));

  const { state, isActive } = useChartPressState({
    x: 0,
    y: { zoneHeight: 0 },
  });

  const segmentLabel = useDerivedValue(() => {
    "worklet";
    const idx = Math.round(state.x.value.value);
    const seg = segments[idx];
    if (!seg) return "";
    return `${seg.name} · ${seg.km}km`;
  });

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
        Segments
      </Text>

      <View style={{ height: chartHeight }}>
        <CartesianChart
          data={data}
          xKey="index"
          yKeys={["zoneHeight"]}
          chartPressState={state}
          domainPadding={{ left: 16, right: 16, top: 24 }}
          domain={{ y: [0, 1.05] }}
          axisOptions={{
            font,
            formatXLabel: (v) => labels[v] ?? "",
            tickCount: { x: segments.length, y: 0 },
            lineColor: "transparent",
            labelColor: "rgba(0,0,0,0.35)",
          }}
        >
          {({ points, chartBounds }) => (
            <>
              <SegmentBars
                points={points.zoneHeight}
                chartBounds={chartBounds}
                segments={segments}
              />
              {isActive && (
                <ActiveValueIndicator
                  xPosition={state.x.position}
                  yPosition={state.y.zoneHeight.position}
                  top={chartBounds.top}
                  bottom={chartBounds.bottom}
                  label={segmentLabel}
                  font={font ?? null}
                  color={getZoneColor(
                    segments[Math.round(state.x.value.value)]?.zone ?? "Z2"
                  )}
                />
              )}
            </>
          )}
        </CartesianChart>
      </View>
    </View>
  );
}

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Svg, { G, Line, Rect, Text as SvgText } from "react-native-svg";
import { Footprints } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { CardShell } from "../parts/CardShell";
import { ChartEmpty } from "../parts/ChartEmpty";
import { WEEK_COUNTS, type WeekWindow } from "../lib/window";
import type { DataTypeKey } from "@/lib/providers/capabilities";

type Day = { date: string; steps: number; restingHr?: number };
type Props = {
  days: Day[];
  width: number;
  lockedDataType?: DataTypeKey;
};

const WINDOWS: WeekWindow[] = ["4w", "12w"];
const CHART_HEIGHT = 180;
const BAR_COLOR = "#3F8F6A";
const MEAN_COLOR = "#1F2937";

export function DailyStepsCard({ days, width, lockedDataType }: Props) {
  const { t } = useTranslation();
  const [window, setWindow] = useState<WeekWindow>("4w");

  const series = useMemo(() => buildSeries(days, window), [days, window]);

  return (
    <CardShell
      title={t("analytics.cards.dailySteps.title")}
      subtitle={t("analytics.cards.dailySteps.subtitle")}
      Icon={Footprints}
      window={window}
      windows={WINDOWS}
      onWindowChange={setWindow}
      lockedDataType={lockedDataType}
    >
      {series.bars.every((b) => b.steps === 0) ? (
        <ChartEmpty
          height={CHART_HEIGHT}
          message={t("analytics.empty.noDaily")}
        />
      ) : (
        <>
          <View className="flex-row items-baseline justify-between mb-2">
            <Text className="text-[12px] font-coach text-wMute">
              {t("analytics.cards.dailySteps.avgLabel")}
            </Text>
            <Text className="text-[14px] font-coach-semibold text-wText tabular-nums">
              {Math.round(series.avgSteps).toLocaleString()}{" "}
              <Text className="text-[11px] font-coach text-wMute">
                {t("analytics.cards.dailySteps.stepsSuffix")}
              </Text>
            </Text>
          </View>
          <StepBars width={width} series={series} />
        </>
      )}
    </CardShell>
  );
}

type Series = {
  bars: { key: string; label: string; steps: number }[];
  avgSteps: number;
  peakSteps: number;
};

function buildSeries(days: Day[], window: WeekWindow): Series {
  const count = WEEK_COUNTS[window] * 7;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const startMs = today.getTime() - (count - 1) * 24 * 60 * 60 * 1000;

  const byDate = new Map(days.map((d) => [d.date, d.steps]));
  const bars: { key: string; label: string; steps: number }[] = [];
  let stepsSum = 0;
  let stepsN = 0;
  let peak = 0;
  for (let i = 0; i < count; i++) {
    const d = new Date(startMs + i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    const steps = byDate.get(key) ?? 0;
    bars.push({ key, label: dayLabel(d, i), steps });
    if (steps > 0) {
      stepsSum += steps;
      stepsN += 1;
    }
    if (steps > peak) peak = steps;
  }
  return {
    bars,
    avgSteps: stepsN > 0 ? stepsSum / stepsN : 0,
    peakSteps: peak,
  };
}

function dayLabel(d: Date, i: number): string {
  if (i % 7 !== 0) return "";
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
}

function StepBars({ width, series }: { width: number; series: Series }) {
  const padL = 36;
  const padR = 8;
  const padT = 4;
  const padB = 22;
  const innerW = Math.max(0, width - padL - padR);
  const innerH = CHART_HEIGHT - padT - padB;

  const yMax = niceMax(Math.max(series.peakSteps, 10000));
  const ticks = [0, yMax / 2, yMax];

  const n = series.bars.length;
  const slotW = innerW / Math.max(1, n);
  const barW = Math.max(1, slotW * 0.7);

  const meanY = padT + innerH * (1 - series.avgSteps / yMax);

  return (
    <Svg width={width} height={CHART_HEIGHT}>
      <G>
        {ticks.map((tk) => {
          const y = padT + innerH * (1 - tk / yMax);
          return (
            <G key={tk}>
              <Line
                x1={padL}
                x2={padL + innerW}
                y1={y}
                y2={y}
                stroke={LIGHT_THEME.wBrd}
                strokeWidth={1}
              />
              <SvgText
                x={padL - 6}
                y={y + 3}
                fontSize={9}
                fill={LIGHT_THEME.wMute}
                textAnchor="end"
              >
                {formatStepsTick(tk)}
              </SvgText>
            </G>
          );
        })}
      </G>
      <G>
        {series.bars.map((b, i) => {
          if (b.steps <= 0) return null;
          const h = (Math.min(b.steps, yMax) / yMax) * innerH;
          const x = padL + i * slotW + (slotW - barW) / 2;
          const y = padT + innerH - h;
          return (
            <Rect
              key={b.key}
              x={x}
              y={y}
              width={barW}
              height={Math.max(0.5, h)}
              fill={BAR_COLOR}
              rx={1}
            />
          );
        })}
      </G>
      {series.avgSteps > 0 ? (
        <Line
          x1={padL}
          x2={padL + innerW}
          y1={meanY}
          y2={meanY}
          stroke={MEAN_COLOR}
          strokeWidth={1.2}
          strokeDasharray="4 4"
        />
      ) : null}
      <G>
        {series.bars.map((b, i) => {
          if (!b.label) return null;
          const x = padL + i * slotW + slotW / 2;
          return (
            <SvgText
              key={`l-${b.key}`}
              x={x}
              y={CHART_HEIGHT - 6}
              fontSize={9}
              fill={LIGHT_THEME.wMute}
              textAnchor="middle"
            >
              {b.label}
            </SvgText>
          );
        })}
      </G>
    </Svg>
  );
}

function formatStepsTick(v: number): string {
  if (v >= 1000) return `${Math.round(v / 1000)}k`;
  return String(Math.round(v));
}

function niceMax(v: number): number {
  const pow = 10 ** Math.floor(Math.log10(v));
  const norm = v / pow;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return step * pow;
}

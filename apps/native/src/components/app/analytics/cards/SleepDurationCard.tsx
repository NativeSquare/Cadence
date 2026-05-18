import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Svg, { G, Line, Rect, Text as SvgText } from "react-native-svg";
import { Moon } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { CardShell } from "../parts/CardShell";
import { ChartEmpty } from "../parts/ChartEmpty";
import { isoWeekKey, lastNWeekStarts } from "../lib/iso-week";
import { WEEK_COUNTS, type WeekWindow } from "../lib/window";
import type { DataTypeKey } from "@/lib/providers/capabilities";

type Night = { night: string; durationHours: number };
type Props = {
  nights: Night[];
  width: number;
  lockedDataType?: DataTypeKey;
};

const WINDOWS: WeekWindow[] = ["4w", "12w"];
const CHART_HEIGHT = 180;
const BAR_COLOR = "#5B7DB1";
const MEAN_COLOR = "#1F2937";

export function SleepDurationCard({ nights, width, lockedDataType }: Props) {
  const { t } = useTranslation();
  const [window, setWindow] = useState<WeekWindow>("4w");

  const series = useMemo(() => buildSeries(nights, window), [nights, window]);

  return (
    <CardShell
      title={t("analytics.cards.sleepDuration.title")}
      subtitle={t("analytics.cards.sleepDuration.subtitle")}
      Icon={Moon}
      window={window}
      windows={WINDOWS}
      onWindowChange={setWindow}
      lockedDataType={lockedDataType}
    >
      {series.weeks.every((w) => w.avgHours === 0) ? (
        <ChartEmpty
          height={CHART_HEIGHT}
          message={t("analytics.empty.noSleep")}
        />
      ) : (
        <>
          <View className="flex-row items-baseline justify-between mb-2">
            <Text className="text-[12px] font-coach text-wMute">
              {t("analytics.cards.sleepDuration.avgLabel")}
            </Text>
            <Text className="text-[14px] font-coach-semibold text-wText tabular-nums">
              {series.overallAvg.toFixed(1)} h
            </Text>
          </View>
          <SleepBars width={width} series={series} />
        </>
      )}
    </CardShell>
  );
}

type Series = {
  weeks: { key: string; label: string; avgHours: number }[];
  overallAvg: number;
};

function buildSeries(nights: Night[], window: WeekWindow): Series {
  const count = WEEK_COUNTS[window];
  const weekStarts = lastNWeekStarts(new Date(), count);
  const keys = weekStarts.map((d) => d.toISOString().slice(0, 10));
  const buckets: Record<string, { sum: number; n: number }> = Object.fromEntries(
    keys.map((k) => [k, { sum: 0, n: 0 }]),
  );

  for (const r of nights) {
    if (r.durationHours <= 0) continue;
    const k = isoWeekKey(new Date(`${r.night}T12:00:00Z`));
    if (!buckets[k]) continue;
    buckets[k].sum += r.durationHours;
    buckets[k].n += 1;
  }

  const weeks = weekStarts.map((d, i) => {
    const b = buckets[keys[i]];
    return {
      key: keys[i],
      label: weekLabel(d, count),
      avgHours: b.n > 0 ? b.sum / b.n : 0,
    };
  });

  const allSums = Object.values(buckets);
  const totalSum = allSums.reduce((a, b) => a + b.sum, 0);
  const totalN = allSums.reduce((a, b) => a + b.n, 0);
  return {
    weeks,
    overallAvg: totalN > 0 ? totalSum / totalN : 0,
  };
}

function weekLabel(d: Date, weekCount: number): string {
  const month = d.toLocaleString("en", { month: "short" });
  const day = d.getUTCDate();
  if (weekCount <= 12) return `${day}/${d.getUTCMonth() + 1}`;
  if (day <= 7) return month;
  return "";
}

function SleepBars({ width, series }: { width: number; series: Series }) {
  const padL = 28;
  const padR = 8;
  const padT = 4;
  const padB = 22;
  const innerW = Math.max(0, width - padL - padR);
  const innerH = CHART_HEIGHT - padT - padB;

  const yMax = 10; // 10h ceiling reads naturally for sleep
  const ticks = [0, 4, 6, 8, 10];

  const n = series.weeks.length;
  const gapRatio = n <= 12 ? 0.3 : 0.2;
  const slotW = innerW / Math.max(1, n);
  const barW = slotW * (1 - gapRatio);

  const meanY = padT + innerH * (1 - series.overallAvg / yMax);

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
                {tk}h
              </SvgText>
            </G>
          );
        })}
      </G>
      <G>
        {series.weeks.map((wk, i) => {
          const v = wk.avgHours;
          if (v <= 0) return null;
          const h = (Math.min(v, yMax) / yMax) * innerH;
          const x = padL + i * slotW + (slotW - barW) / 2;
          const y = padT + innerH - h;
          return (
            <Rect
              key={wk.key}
              x={x}
              y={y}
              width={barW}
              height={Math.max(0.5, h)}
              fill={BAR_COLOR}
              rx={1.5}
            />
          );
        })}
      </G>
      {series.overallAvg > 0 ? (
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
        {series.weeks.map((wk, i) => {
          if (!wk.label) return null;
          const x = padL + i * slotW + slotW / 2;
          return (
            <SvgText
              key={`l-${wk.key}`}
              x={x}
              y={CHART_HEIGHT - 6}
              fontSize={9}
              fill={LIGHT_THEME.wMute}
              textAnchor="middle"
            >
              {wk.label}
            </SvgText>
          );
        })}
      </G>
    </Svg>
  );
}

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Svg, { Circle, G, Line, Path, Text as SvgText } from "react-native-svg";
import { Scale } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { CardShell } from "../parts/CardShell";
import { ChartEmpty } from "../parts/ChartEmpty";
import { WEEK_COUNTS, type WeekWindow } from "../lib/window";
import type { DataTypeKey } from "@/lib/providers/capabilities";

type Measure = { date: string; weightKg?: number; bodyFatPct?: number };
type Props = {
  measures: Measure[];
  width: number;
  lockedDataType?: DataTypeKey;
};

const WINDOWS: WeekWindow[] = ["12w", "26w", "52w"];
const CHART_HEIGHT = 180;
const LINE_COLOR = "#1F2937";
const DOT_COLOR = "#7B61FF";

export function BodyWeightCard({ measures, width, lockedDataType }: Props) {
  const { t } = useTranslation();
  const [window, setWindow] = useState<WeekWindow>("12w");

  const series = useMemo(() => buildSeries(measures, window), [measures, window]);

  return (
    <CardShell
      title={t("analytics.cards.bodyWeight.title")}
      subtitle={t("analytics.cards.bodyWeight.subtitle")}
      Icon={Scale}
      window={window}
      windows={WINDOWS}
      onWindowChange={setWindow}
      lockedDataType={lockedDataType}
    >
      {series.dots.length < 2 ? (
        <ChartEmpty
          height={CHART_HEIGHT}
          message={t("analytics.empty.noBody")}
        />
      ) : (
        <>
          <View className="flex-row items-baseline justify-between mb-2">
            <Text className="text-[12px] font-coach text-wMute">
              {t("analytics.cards.bodyWeight.latestLabel")}
            </Text>
            <Text className="text-[14px] font-coach-semibold text-wText tabular-nums">
              {series.latestKg.toFixed(1)}{" "}
              <Text className="text-[11px] font-coach text-wMute">kg</Text>
            </Text>
          </View>
          <Chart width={width} series={series} />
        </>
      )}
    </CardShell>
  );
}

type Series = {
  dots: { t: number; kg: number }[];
  range: { tMin: number; tMax: number; yLo: number; yHi: number };
  latestKg: number;
};

function buildSeries(measures: Measure[], window: WeekWindow): Series {
  const count = WEEK_COUNTS[window];
  const tMax = Date.now();
  const tMin = tMax - count * 7 * 24 * 60 * 60 * 1000;

  const dots: { t: number; kg: number }[] = [];
  for (const m of measures) {
    if (typeof m.weightKg !== "number" || m.weightKg <= 0) continue;
    // Noon-anchored to avoid timezone edge cases.
    const t = Date.parse(`${m.date}T12:00:00Z`);
    if (!Number.isFinite(t) || t < tMin || t > tMax) continue;
    dots.push({ t, kg: m.weightKg });
  }
  dots.sort((a, b) => a.t - b.t);

  const kgs = dots.map((d) => d.kg);
  const minKg = kgs.length ? Math.min(...kgs) : 0;
  const maxKg = kgs.length ? Math.max(...kgs) : 0;
  // Pad ±1kg so dots never sit on the chart edges.
  const yLo = Math.floor(minKg) - 1;
  const yHi = Math.ceil(maxKg) + 1;

  return {
    dots,
    range: { tMin, tMax, yLo, yHi },
    latestKg: kgs.length ? kgs[kgs.length - 1] : 0,
  };
}

function Chart({ width, series }: { width: number; series: Series }) {
  const padL = 36;
  const padR = 8;
  const padT = 8;
  const padB = 22;
  const innerW = Math.max(0, width - padL - padR);
  const innerH = CHART_HEIGHT - padT - padB;

  const { tMin, tMax, yLo, yHi } = series.range;
  const span = Math.max(1, tMax - tMin);
  const yRange = Math.max(0.5, yHi - yLo);

  const xOf = (t: number) => padL + ((t - tMin) / span) * innerW;
  const yOf = (kg: number) => padT + ((yHi - kg) / yRange) * innerH;

  const ticks = niceYticks(yLo, yHi, 3);
  const linePath = series.dots
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xOf(p.t)} ${yOf(p.kg)}`)
    .join(" ");

  return (
    <Svg width={width} height={CHART_HEIGHT}>
      <G>
        {ticks.map((kg) => {
          const y = yOf(kg);
          return (
            <G key={kg}>
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
                {kg}
              </SvgText>
            </G>
          );
        })}
      </G>
      {linePath ? (
        <Path d={linePath} stroke={LINE_COLOR} strokeWidth={2} fill="none" />
      ) : null}
      <G>
        {series.dots.map((d, i) => (
          <Circle
            key={i}
            cx={xOf(d.t)}
            cy={yOf(d.kg)}
            r={3}
            fill={DOT_COLOR}
          />
        ))}
      </G>
      <G>
        {axisXLabels(tMin, tMax).map((lab) => (
          <SvgText
            key={lab.t}
            x={xOf(lab.t)}
            y={CHART_HEIGHT - 6}
            fontSize={9}
            fill={LIGHT_THEME.wMute}
            textAnchor="middle"
          >
            {lab.text}
          </SvgText>
        ))}
      </G>
    </Svg>
  );
}

function niceYticks(lo: number, hi: number, count: number): number[] {
  const step = Math.max(1, Math.round((hi - lo) / count));
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) out.push(v);
  return out;
}

function axisXLabels(tMin: number, tMax: number): { t: number; text: string }[] {
  const span = tMax - tMin;
  const ticks = 4;
  const out: { t: number; text: string }[] = [];
  for (let i = 0; i <= ticks; i++) {
    const t = tMin + (span * i) / ticks;
    const d = new Date(t);
    out.push({ t, text: d.toLocaleString("en", { month: "short" }) });
  }
  return out;
}

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Svg, { Circle, G, Line, Path, Text as SvgText } from "react-native-svg";
import { Waves } from "lucide-react-native";
import type { WorkoutDoc } from "@nativesquare/agoge/schema";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { paceMpsToMinPerKm } from "@/lib/format-pace";
import { CardShell } from "../parts/CardShell";
import { ChartEmpty } from "../parts/ChartEmpty";
import { isoWeekKey, lastNWeekStarts } from "../lib/iso-week";
import { WEEK_COUNTS, type WeekWindow } from "../lib/window";

type Props = { workouts: WorkoutDoc[]; width: number };

const WINDOWS: WeekWindow[] = ["12w", "26w", "52w"];
const CHART_HEIGHT = 180;

export function EasyPaceDriftCard({ workouts, width }: Props) {
  const { t } = useTranslation();
  const [window, setWindow] = useState<WeekWindow>("12w");

  const data = useMemo(() => buildSeries(workouts, window), [workouts, window]);

  return (
    <CardShell
      title={t("analytics.cards.easyPaceDrift.title")}
      subtitle={t("analytics.cards.easyPaceDrift.subtitle")}
      Icon={Waves}
      window={window}
      windows={WINDOWS}
      onWindowChange={setWindow}
    >
      {data.dots.length < 2 ? (
        <ChartEmpty
          height={CHART_HEIGHT}
          message={t("analytics.empty.noEasy")}
        />
      ) : (
        <>
          <View className="flex-row items-baseline justify-between mb-2">
            <Text className="text-[12px] font-coach text-wMute">
              {t("analytics.cards.easyPaceDrift.medianLabel")}
            </Text>
            <Text className="text-[14px] font-coach-semibold text-wText tabular-nums">
              {paceMpsToMinPerKm(data.medianMps)}{" "}
              <Text className="text-[11px] font-coach text-wMute">/km</Text>
            </Text>
          </View>
          <Chart width={width} data={data} />
        </>
      )}
    </CardShell>
  );
}

type Series = {
  dots: { t: number; secPerKm: number }[];
  line: { t: number; secPerKm: number }[];
  range: { min: number; max: number; tMin: number; tMax: number };
  medianMps: number;
};

function buildSeries(workouts: WorkoutDoc[], window: WeekWindow): Series {
  const count = WEEK_COUNTS[window];
  const weekStarts = lastNWeekStarts(new Date(), count);
  const tMin = weekStarts[0].getTime();
  const tMax = Date.now();

  const dots: { t: number; secPerKm: number }[] = [];
  const weekly: Record<string, { sum: number; n: number; t: number }> = {};

  for (const w of workouts) {
    if (w.type !== "easy" || w.status !== "completed") continue;
    const date = w.actual?.date;
    const distance = w.actual?.distanceMeters;
    const duration = w.actual?.durationSeconds;
    if (!date || !distance || !duration || distance <= 0 || duration <= 0) {
      continue;
    }
    const mps = distance / duration;
    const ts = new Date(date).getTime();
    if (ts < tMin || ts > tMax) continue;
    const secPerKm = 1000 / mps;
    dots.push({ t: ts, secPerKm });
    const wk = isoWeekKey(new Date(date));
    if (!weekly[wk]) weekly[wk] = { sum: 0, n: 0, t: 0 };
    weekly[wk].sum += secPerKm;
    weekly[wk].n += 1;
    weekly[wk].t = ts;
  }

  dots.sort((a, b) => a.t - b.t);
  const line = Object.entries(weekly)
    .map(([k, v]) => ({ t: midweekMs(k, v.t), secPerKm: v.sum / v.n }))
    .sort((a, b) => a.t - b.t);

  const allSec = dots.map((d) => d.secPerKm);
  const min = allSec.length ? Math.min(...allSec) : 0;
  const max = allSec.length ? Math.max(...allSec) : 0;
  const sorted = [...allSec].sort((a, b) => a - b);
  const medianSecPerKm = sorted.length
    ? sorted[Math.floor(sorted.length / 2)]
    : 0;
  const medianMps = medianSecPerKm > 0 ? 1000 / medianSecPerKm : 0;
  return { dots, line, range: { min, max, tMin, tMax }, medianMps };
}

function midweekMs(weekKey: string, sampleMs: number): number {
  // weekKey is "YYYY-MM-DD" of Monday UTC. Center the marker on Thursday.
  const t = new Date(`${weekKey}T00:00:00.000Z`).getTime();
  return Number.isFinite(t) ? t + 3 * 86400000 : sampleMs;
}

function Chart({ width, data }: { width: number; data: Series }) {
  const padL = 36;
  const padR = 8;
  const padT = 8;
  const padB = 22;
  const innerW = Math.max(0, width - padL - padR);
  const innerH = CHART_HEIGHT - padT - padB;

  const { tMin, tMax } = data.range;
  const span = Math.max(1, tMax - tMin);

  // Pad y range so dots aren't on the edges.
  const yLo = Math.floor(data.range.min / 10) * 10 - 10;
  const yHi = Math.ceil(data.range.max / 10) * 10 + 10;
  const yRange = Math.max(1, yHi - yLo);

  const xOf = (t: number) =>
    padL + ((t - tMin) / span) * innerW;
  // Inverted: faster pace (lower secPerKm) sits higher.
  const yOf = (sec: number) => padT + ((sec - yLo) / yRange) * innerH;

  const ticks = niceYticks(yLo, yHi, 3);
  const linePath = buildLinePath(data.line, xOf, yOf);

  return (
    <Svg width={width} height={CHART_HEIGHT}>
      <G>
        {ticks.map((sec) => {
          const y = yOf(sec);
          return (
            <G key={sec}>
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
                {formatPace(sec)}
              </SvgText>
            </G>
          );
        })}
      </G>
      <G>
        {data.dots.map((d, i) => (
          <Circle
            key={i}
            cx={xOf(d.t)}
            cy={yOf(d.secPerKm)}
            r={2.5}
            fill={LIGHT_THEME.wMute}
            opacity={0.55}
          />
        ))}
      </G>
      {linePath ? (
        <Path
          d={linePath}
          stroke={LIGHT_THEME.wText}
          strokeWidth={2}
          fill="none"
        />
      ) : null}
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

function buildLinePath(
  pts: { t: number; secPerKm: number }[],
  xOf: (t: number) => number,
  yOf: (s: number) => number,
): string | null {
  if (pts.length < 2) return null;
  return pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xOf(p.t)} ${yOf(p.secPerKm)}`)
    .join(" ");
}

function niceYticks(lo: number, hi: number, count: number): number[] {
  const step = Math.max(10, Math.round((hi - lo) / count / 10) * 10);
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) out.push(v);
  return out;
}

function formatPace(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm - m * 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function axisXLabels(tMin: number, tMax: number): { t: number; text: string }[] {
  const span = tMax - tMin;
  const ticks = 4;
  const out: { t: number; text: string }[] = [];
  for (let i = 0; i <= ticks; i++) {
    const t = tMin + (span * i) / ticks;
    const d = new Date(t);
    out.push({
      t,
      text: d.toLocaleString("en", { month: "short" }),
    });
  }
  return out;
}

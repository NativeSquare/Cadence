import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Svg, { Circle, G, Line, Path, Text as SvgText } from "react-native-svg";
import { Target } from "lucide-react-native";
import type { WorkoutDoc } from "@nativesquare/agoge/schema";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { CardShell } from "../parts/CardShell";
import { ChartEmpty } from "../parts/ChartEmpty";
import { isoWeekKey, lastNWeekStarts } from "../lib/iso-week";
import { WEEK_COUNTS, type WeekWindow } from "../lib/window";

type Props = { workouts: WorkoutDoc[]; width: number };

const WINDOWS: WeekWindow[] = ["4w", "12w", "26w", "52w"];
const CHART_HEIGHT = 180;

const PLANNED_COLOR = LIGHT_THEME.wMute;
const ACTUAL_COLOR = LIGHT_THEME.wText;

export function PlannedVsActualCard({ workouts, width }: Props) {
  const { t } = useTranslation();
  const [window, setWindow] = useState<WeekWindow>("12w");

  const data = useMemo(() => buildSeries(workouts, window), [workouts, window]);

  return (
    <CardShell
      title={t("analytics.cards.plannedVsActual.title")}
      subtitle={t("analytics.cards.plannedVsActual.subtitle")}
      Icon={Target}
      window={window}
      windows={WINDOWS}
      onWindowChange={setWindow}
    >
      {data.totalPlanned + data.totalActual === 0 ? (
        <ChartEmpty
          height={CHART_HEIGHT}
          message={t("analytics.empty.noPlanned")}
        />
      ) : (
        <>
          <View className="flex-row items-baseline justify-between mb-2">
            <View className="flex-row items-center gap-3">
              <LegendDot color={PLANNED_COLOR} dashed />
              <Text className="text-[11px] font-coach text-wSub">
                {t("analytics.cards.plannedVsActual.legendPlanned")}
              </Text>
              <LegendDot color={ACTUAL_COLOR} />
              <Text className="text-[11px] font-coach text-wSub">
                {t("analytics.cards.plannedVsActual.legendActual")}
              </Text>
            </View>
            <Text className="text-[12px] font-coach-semibold text-wText tabular-nums">
              {Math.round(data.compliancePct)}%
            </Text>
          </View>
          <DualLines width={width} data={data} />
        </>
      )}
    </CardShell>
  );
}

type Series = {
  weeks: {
    key: string;
    label: string;
    planned: number;
    actual: number;
  }[];
  peakKm: number;
  totalPlanned: number;
  totalActual: number;
  compliancePct: number;
};

function buildSeries(workouts: WorkoutDoc[], window: WeekWindow): Series {
  const count = WEEK_COUNTS[window];
  const weekStarts = lastNWeekStarts(new Date(), count);
  const keys = weekStarts.map((d) => d.toISOString().slice(0, 10));
  const planned: Record<string, number> = Object.fromEntries(keys.map((k) => [k, 0]));
  const actual: Record<string, number> = Object.fromEntries(keys.map((k) => [k, 0]));

  for (const w of workouts) {
    const pDate = w.planned?.date;
    const pMeters = w.planned?.distanceMeters;
    if (pDate && pMeters && pMeters > 0) {
      const k = isoWeekKey(new Date(pDate));
      if (k in planned) planned[k] += pMeters / 1000;
    }
    if (w.status === "completed") {
      const aDate = w.actual?.date;
      const aMeters = w.actual?.distanceMeters;
      if (aDate && aMeters && aMeters > 0) {
        const k = isoWeekKey(new Date(aDate));
        if (k in actual) actual[k] += aMeters / 1000;
      }
    }
  }

  const weeks = weekStarts.map((d, i) => ({
    key: keys[i],
    label: weekLabel(d, count),
    planned: planned[keys[i]],
    actual: actual[keys[i]],
  }));
  const peakKm = Math.max(
    1,
    ...weeks.map((w) => Math.max(w.planned, w.actual)),
  );
  const totalPlanned = weeks.reduce((s, w) => s + w.planned, 0);
  const totalActual = weeks.reduce((s, w) => s + w.actual, 0);
  const compliancePct =
    totalPlanned > 0 ? Math.min(200, (totalActual / totalPlanned) * 100) : 0;
  return { weeks, peakKm, totalPlanned, totalActual, compliancePct };
}

function weekLabel(d: Date, weekCount: number): string {
  const month = d.toLocaleString("en", { month: "short" });
  const day = d.getUTCDate();
  if (weekCount <= 12) return `${day}/${d.getUTCMonth() + 1}`;
  if (day <= 7) return month;
  return "";
}

function LegendDot({ color, dashed }: { color: string; dashed?: boolean }) {
  return (
    <View
      style={{
        width: 14,
        height: 2.5,
        backgroundColor: dashed ? "transparent" : color,
        borderTopWidth: dashed ? 2 : 0,
        borderColor: color,
        borderStyle: dashed ? "dashed" : "solid",
      }}
    />
  );
}

function DualLines({ width, data }: { width: number; data: Series }) {
  const padL = 28;
  const padR = 8;
  const padT = 8;
  const padB = 22;
  const innerW = Math.max(0, width - padL - padR);
  const innerH = CHART_HEIGHT - padT - padB;
  const yMax = niceMax(data.peakKm);
  const ticks = niceTicks(yMax, 3);
  const n = data.weeks.length;
  const stepX = n > 1 ? innerW / (n - 1) : 0;

  const xOf = (i: number) => padL + i * stepX;
  const yOf = (v: number) => padT + innerH * (1 - v / yMax);

  const plannedPath = buildPath(data.weeks.map((w) => w.planned), xOf, yOf);
  const actualPath = buildPath(data.weeks.map((w) => w.actual), xOf, yOf);

  return (
    <Svg width={width} height={CHART_HEIGHT}>
      <G>
        {ticks.map((tk) => {
          const y = yOf(tk);
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
                {tk}
              </SvgText>
            </G>
          );
        })}
      </G>
      {plannedPath ? (
        <Path
          d={plannedPath}
          stroke={PLANNED_COLOR}
          strokeWidth={1.5}
          strokeDasharray="4 3"
          fill="none"
        />
      ) : null}
      {actualPath ? (
        <Path d={actualPath} stroke={ACTUAL_COLOR} strokeWidth={2} fill="none" />
      ) : null}
      <G>
        {data.weeks.map((w, i) =>
          w.actual > 0 ? (
            <Circle
              key={`a-${w.key}`}
              cx={xOf(i)}
              cy={yOf(w.actual)}
              r={2.5}
              fill={ACTUAL_COLOR}
            />
          ) : null,
        )}
      </G>
      <G>
        {data.weeks.map((w, i) => {
          if (!w.label) return null;
          return (
            <SvgText
              key={`l-${w.key}`}
              x={xOf(i)}
              y={CHART_HEIGHT - 6}
              fontSize={9}
              fill={LIGHT_THEME.wMute}
              textAnchor="middle"
            >
              {w.label}
            </SvgText>
          );
        })}
      </G>
    </Svg>
  );
}

function buildPath(
  values: number[],
  xOf: (i: number) => number,
  yOf: (v: number) => number,
): string | null {
  if (values.length < 2) return null;
  return values
    .map((v, i) => `${i === 0 ? "M" : "L"} ${xOf(i)} ${yOf(v)}`)
    .join(" ");
}

function niceMax(v: number): number {
  if (v <= 0) return 10;
  const pow = 10 ** Math.floor(Math.log10(v));
  const norm = v / pow;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return step * pow;
}

function niceTicks(yMax: number, count: number): number[] {
  const step = yMax / count;
  return Array.from({ length: count + 1 }, (_, i) =>
    Math.round((i * step + Number.EPSILON) * 10) / 10,
  );
}

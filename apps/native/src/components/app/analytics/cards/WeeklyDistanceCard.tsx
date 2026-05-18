import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Svg, { G, Line, Rect, Text as SvgText } from "react-native-svg";
import { TrendingUp } from "lucide-react-native";
import type { WorkoutDoc } from "@nativesquare/agoge/schema";
import { WORKOUT_TYPES_COLORS } from "@packages/shared/colors";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { CardShell } from "../parts/CardShell";
import { ChartEmpty } from "../parts/ChartEmpty";
import { isoWeekKey, lastNWeekStarts } from "../lib/iso-week";
import { WEEK_COUNTS, type WeekWindow } from "../lib/window";

type Props = { workouts: WorkoutDoc[]; width: number };

const WINDOWS: WeekWindow[] = ["4w", "12w", "26w", "52w"];
const TYPE_ORDER: (keyof typeof WORKOUT_TYPES_COLORS)[] = [
  "recovery",
  "easy",
  "long",
  "threshold",
  "intervals",
  "race_pace",
  "race",
  "test",
];

const CHART_HEIGHT = 180;

export function WeeklyDistanceCard({ workouts, width }: Props) {
  const { t } = useTranslation();
  const [window, setWindow] = useState<WeekWindow>("12w");

  const data = useMemo(() => buildSeries(workouts, window), [workouts, window]);

  return (
    <CardShell
      title={t("analytics.cards.weeklyDistance.title")}
      subtitle={t("analytics.cards.weeklyDistance.subtitle")}
      Icon={TrendingUp}
      window={window}
      windows={WINDOWS}
      onWindowChange={setWindow}
    >
      {data.totalKm === 0 ? (
        <ChartEmpty
          height={CHART_HEIGHT}
          message={t("analytics.empty.noCompleted")}
        />
      ) : (
        <>
          <View className="flex-row items-baseline justify-between mb-2">
            <Text className="text-[12px] font-coach text-wMute">
              {t("analytics.cards.weeklyDistance.peakLabel")}
            </Text>
            <Text className="text-[14px] font-coach-semibold text-wText tabular-nums">
              {data.peakKm.toFixed(1)} km
            </Text>
          </View>
          <StackedBars width={width} data={data} />
          <Legend types={data.activeTypes} />
        </>
      )}
    </CardShell>
  );
}

type Series = {
  weeks: { key: string; label: string; segments: Record<string, number> }[];
  activeTypes: (keyof typeof WORKOUT_TYPES_COLORS)[];
  peakKm: number;
  totalKm: number;
};

function buildSeries(workouts: WorkoutDoc[], window: WeekWindow): Series {
  const count = WEEK_COUNTS[window];
  const weekStarts = lastNWeekStarts(new Date(), count);
  const keys = weekStarts.map((d) => d.toISOString().slice(0, 10));
  const bucket: Record<string, Record<string, number>> = Object.fromEntries(
    keys.map((k) => [k, {}]),
  );

  for (const w of workouts) {
    if (w.status !== "completed") continue;
    const date = w.actual?.date ?? w.planned?.date;
    // Manual mark-done doesn't capture distance — fall back to planned so
    // the workout still contributes weekly volume.
    const meters = w.actual?.distanceMeters ?? w.planned?.distanceMeters;
    if (!date || !meters || meters <= 0) continue;
    const k = isoWeekKey(new Date(date));
    if (!bucket[k]) continue;
    bucket[k][w.type] = (bucket[k][w.type] ?? 0) + meters / 1000;
  }

  const activeTypes = TYPE_ORDER.filter((t) =>
    keys.some((k) => (bucket[k][t] ?? 0) > 0.05),
  );
  const weeks = weekStarts.map((d, i) => ({
    key: keys[i],
    label: weekLabel(d, count),
    segments: bucket[keys[i]],
  }));
  const peakKm = Math.max(
    0,
    ...weeks.map((w) => Object.values(w.segments).reduce((s, v) => s + v, 0)),
  );
  const totalKm = weeks.reduce(
    (s, w) => s + Object.values(w.segments).reduce((a, b) => a + b, 0),
    0,
  );
  return { weeks, activeTypes, peakKm, totalKm };
}

function weekLabel(d: Date, weekCount: number): string {
  // Sparse labels: only show month for first week of month or first overall.
  const month = d.toLocaleString("en", { month: "short" });
  const day = d.getUTCDate();
  if (weekCount <= 12) return `${day}/${d.getUTCMonth() + 1}`;
  if (day <= 7) return month;
  return "";
}

function StackedBars({ width, data }: { width: number; data: Series }) {
  const padL = 28;
  const padR = 8;
  const padT = 4;
  const padB = 22;
  const innerW = Math.max(0, width - padL - padR);
  const innerH = CHART_HEIGHT - padT - padB;
  const yMax = niceMax(data.peakKm);
  const ticks = niceTicks(yMax, 3);

  const n = data.weeks.length;
  const gapRatio = n <= 12 ? 0.3 : 0.2;
  const slotW = innerW / Math.max(1, n);
  const barW = slotW * (1 - gapRatio);

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
                {tk}
              </SvgText>
            </G>
          );
        })}
      </G>
      <G>
        {data.weeks.map((wk, i) => {
          let yCursor = padT + innerH;
          const x = padL + i * slotW + (slotW - barW) / 2;
          const total = Object.values(wk.segments).reduce((s, v) => s + v, 0);
          if (total === 0) return null;
          return (
            <G key={wk.key}>
              {data.activeTypes.map((type) => {
                const v = wk.segments[type] ?? 0;
                if (v <= 0) return null;
                const h = (v / yMax) * innerH;
                yCursor -= h;
                return (
                  <Rect
                    key={type}
                    x={x}
                    y={yCursor}
                    width={barW}
                    height={Math.max(0.5, h)}
                    fill={WORKOUT_TYPES_COLORS[type]}
                    rx={1.5}
                  />
                );
              })}
            </G>
          );
        })}
      </G>
      <G>
        {data.weeks.map((wk, i) => {
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

function Legend({
  types,
}: {
  types: (keyof typeof WORKOUT_TYPES_COLORS)[];
}) {
  const { t } = useTranslation();
  return (
    <View className="flex-row flex-wrap gap-x-3 gap-y-1 mt-3">
      {types.map((type) => (
        <View key={type} className="flex-row items-center gap-1.5">
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              backgroundColor: WORKOUT_TYPES_COLORS[type],
            }}
          />
          <Text className="text-[11px] font-coach text-wSub">
            {t(`workout.types.${type}`)}
          </Text>
        </View>
      ))}
    </View>
  );
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

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Svg, { Circle, G, Path, Text as SvgText } from "react-native-svg";
import { PieChart } from "lucide-react-native";
import type { WorkoutDoc } from "@nativesquare/agoge/schema";
import { WORKOUT_TYPES_COLORS } from "@packages/shared/colors";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { CardShell } from "../parts/CardShell";
import { ChartEmpty } from "../parts/ChartEmpty";
import { lastNWeekStarts } from "../lib/iso-week";
import { WEEK_COUNTS, type WeekWindow } from "../lib/window";

type Props = { workouts: WorkoutDoc[]; width: number };

const WINDOWS: WeekWindow[] = ["4w", "12w", "26w", "52w"];
const TYPE_ORDER: (keyof typeof WORKOUT_TYPES_COLORS)[] = [
  "easy",
  "long",
  "threshold",
  "intervals",
  "race_pace",
  "recovery",
  "race",
  "test",
];

const SIZE = 168;
const STROKE = 26;

export function TypeMixCard({ workouts, width }: Props) {
  const { t } = useTranslation();
  const [window, setWindow] = useState<WeekWindow>("12w");

  const stats = useMemo(() => buildStats(workouts, window), [workouts, window]);

  return (
    <CardShell
      title={t("analytics.cards.typeMix.title")}
      subtitle={t("analytics.cards.typeMix.subtitle")}
      Icon={PieChart}
      window={window}
      windows={WINDOWS}
      onWindowChange={setWindow}
    >
      {stats.total === 0 ? (
        <ChartEmpty
          height={SIZE}
          message={t("analytics.empty.noCompleted")}
        />
      ) : (
        <View className="flex-row items-center" style={{ gap: 16 }}>
          <Donut total={stats.total} slices={stats.slices} />
          <View className="flex-1 gap-2">
            {stats.slices.map((s) => (
              <View
                key={s.type}
                className="flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-2 flex-1 min-w-0">
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 3,
                      backgroundColor: WORKOUT_TYPES_COLORS[s.type],
                    }}
                  />
                  <Text
                    className="text-[13px] font-coach text-wText"
                    numberOfLines={1}
                  >
                    {t(`workout.types.${s.type}`)}
                  </Text>
                </View>
                <Text className="text-[13px] font-coach-semibold text-wText tabular-nums">
                  {Math.round((s.count / stats.total) * 100)}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </CardShell>
  );
}

type Stats = {
  total: number;
  slices: {
    type: keyof typeof WORKOUT_TYPES_COLORS;
    count: number;
  }[];
};

function buildStats(workouts: WorkoutDoc[], window: WeekWindow): Stats {
  const count = WEEK_COUNTS[window];
  const cutoff = lastNWeekStarts(new Date(), count)[0];
  const cutoffMs = cutoff.getTime();
  const counts: Record<string, number> = {};
  for (const w of workouts) {
    if (w.status !== "completed") continue;
    const date = w.actual?.date;
    if (!date) continue;
    if (new Date(date).getTime() < cutoffMs) continue;
    counts[w.type] = (counts[w.type] ?? 0) + 1;
  }
  const total = Object.values(counts).reduce((s, v) => s + v, 0);
  const slices = TYPE_ORDER.filter((t) => (counts[t] ?? 0) > 0).map((t) => ({
    type: t,
    count: counts[t],
  }));
  return { total, slices };
}

function Donut({ total, slices }: Stats) {
  const r = (SIZE - STROKE) / 2;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const singleSlice = slices.length === 1 ? slices[0] : null;
  let acc = 0;
  return (
    <Svg width={SIZE} height={SIZE}>
      <G>
        {singleSlice ? (
          // SVG arcs can't draw a true 360° path; render a circle instead
          // so the stroke doesn't double up at the seam.
          <Circle
            cx={cx}
            cy={cy}
            r={r}
            stroke={WORKOUT_TYPES_COLORS[singleSlice.type]}
            strokeWidth={STROKE}
            fill="none"
          />
        ) : (
          slices.map((s) => {
            const frac = s.count / total;
            const start = acc;
            const end = acc + frac;
            acc = end;
            return (
              <Path
                key={s.type}
                d={arcPath(cx, cy, r, start * Math.PI * 2, end * Math.PI * 2)}
                stroke={WORKOUT_TYPES_COLORS[s.type]}
                strokeWidth={STROKE}
                fill="none"
                strokeLinecap="butt"
              />
            );
          })
        )}
      </G>
      <SvgText
        x={cx}
        y={cy + 4}
        fontSize={28}
        fontWeight="600"
        fill={LIGHT_THEME.wText}
        textAnchor="middle"
      >
        {total}
      </SvgText>
      <SvgText
        x={cx}
        y={cy + 22}
        fontSize={10}
        fill={LIGHT_THEME.wMute}
        textAnchor="middle"
      >
        sessions
      </SvgText>
    </Svg>
  );
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  // SVG arc starts at angle 0 = 3 o'clock. Shift -90deg so we start at 12.
  const a0 = startAngle - Math.PI / 2;
  const a1 = endAngle - Math.PI / 2;
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const large = endAngle - startAngle > Math.PI ? 1 : 0;
  // Single-slice 100% case: SVG can't draw a 360° arc; nudge end angle.
  if (endAngle - startAngle >= Math.PI * 2 - 0.0001) {
    const ax = cx + r * Math.cos(a1 - 0.001);
    const ay = cy + r * Math.sin(a1 - 0.001);
    return `M ${x0} ${y0} A ${r} ${r} 0 1 1 ${ax} ${ay} A ${r} ${r} 0 1 1 ${x0} ${y0}`;
  }
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}

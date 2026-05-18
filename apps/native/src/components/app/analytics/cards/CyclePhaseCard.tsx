/**
 * CyclePhaseCard - Current cycle position + phase. Renders nothing complex:
 * the latest cycle record's "day in cycle" / "current phase" / cycle length,
 * with a horizontal segmented bar showing the four phases and a marker on
 * the user's current day.
 */

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Svg, { Circle, Line, Rect } from "react-native-svg";
import { Droplet } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { CardShell } from "../parts/CardShell";
import { ChartEmpty } from "../parts/ChartEmpty";
import type { DataTypeKey } from "@/lib/providers/capabilities";

type Cycle = {
  startTime: string;
  endTime: string;
  dayInCycle?: number;
  currentPhase?: string;
  cycleLengthDays?: number;
  periodLengthDays?: number;
  daysUntilNextPhase?: number;
};

type Props = {
  cycles: Cycle[];
  width: number;
  lockedDataType?: DataTypeKey;
};

const CHART_HEIGHT = 180;
const PHASE_COLORS: Record<string, string> = {
  menstrual: "#C44A4A",
  follicular: "#E2A24C",
  ovulatory: "#7AAD63",
  luteal: "#8C6BBA",
};

export function CyclePhaseCard({ cycles, width, lockedDataType }: Props) {
  const { t } = useTranslation();

  const latest = useMemo(() => {
    if (cycles.length === 0) return null;
    return [...cycles].sort((a, b) =>
      a.startTime < b.startTime ? 1 : -1,
    )[0];
  }, [cycles]);

  const day = latest?.dayInCycle;
  const cycleLen = latest?.cycleLengthDays ?? 28;
  const phaseKey = (latest?.currentPhase ?? "").toLowerCase();
  const phaseLabelKey = PHASE_COLORS[phaseKey] ? phaseKey : null;

  return (
    <CardShell
      title={t("analytics.cards.cyclePhase.title")}
      subtitle={t("analytics.cards.cyclePhase.subtitle")}
      Icon={Droplet}
      lockedDataType={lockedDataType}
    >
      {!latest || day === undefined ? (
        <ChartEmpty
          height={CHART_HEIGHT}
          message={t("analytics.empty.noCycle")}
        />
      ) : (
        <View style={{ height: CHART_HEIGHT }} className="justify-between">
          <View>
            <View className="flex-row items-baseline gap-2">
              <Text className="text-[40px] font-coach-bold text-wText leading-[44px]">
                {day}
              </Text>
              <Text className="text-[14px] font-coach text-wMute">
                {t("analytics.cards.cyclePhase.dayOf", { total: cycleLen })}
              </Text>
            </View>
            {phaseLabelKey ? (
              <View
                className="self-start mt-2 px-3 py-1 rounded-full"
                style={{ backgroundColor: `${PHASE_COLORS[phaseLabelKey]}26` }}
              >
                <Text
                  className="text-[12px] font-coach-semibold"
                  style={{ color: PHASE_COLORS[phaseLabelKey] }}
                >
                  {t(`analytics.cards.cyclePhase.phases.${phaseLabelKey}`)}
                </Text>
              </View>
            ) : null}
            {latest.daysUntilNextPhase !== undefined ? (
              <Text className="text-[12px] font-coach text-wMute mt-2">
                {t("analytics.cards.cyclePhase.untilNext", {
                  count: latest.daysUntilNextPhase,
                })}
              </Text>
            ) : null}
          </View>

          <PhaseBar
            width={Math.max(0, width)}
            day={day}
            totalDays={cycleLen}
            periodLength={latest.periodLengthDays ?? 5}
          />
        </View>
      )}
    </CardShell>
  );
}

function PhaseBar({
  width,
  day,
  totalDays,
  periodLength,
}: {
  width: number;
  day: number;
  totalDays: number;
  periodLength: number;
}) {
  // Rough textbook segmentation: menstrual [1, period], follicular until
  // ovulation (~ totalDays - 14), ovulatory ~1 day, luteal until end.
  // Provider data may disagree — this is just a visual sketch.
  const h = 14;
  const radius = 7;
  const innerW = Math.max(0, width - 4);

  const ovulationDay = Math.max(periodLength + 1, totalDays - 14);
  const segs: { from: number; to: number; color: string }[] = [
    { from: 1, to: periodLength, color: PHASE_COLORS.menstrual },
    {
      from: periodLength + 1,
      to: ovulationDay - 1,
      color: PHASE_COLORS.follicular,
    },
    { from: ovulationDay, to: ovulationDay, color: PHASE_COLORS.ovulatory },
    {
      from: ovulationDay + 1,
      to: totalDays,
      color: PHASE_COLORS.luteal,
    },
  ];

  const xFor = (d: number) => ((d - 1) / Math.max(1, totalDays - 1)) * innerW;

  return (
    <Svg width={width} height={h + 20}>
      <Rect
        x={0}
        y={0}
        width={innerW}
        height={h}
        rx={radius}
        fill={LIGHT_THEME.w3}
      />
      {segs.map((s, i) => {
        const x1 = xFor(s.from);
        const x2 = xFor(Math.max(s.to, s.from));
        const w = Math.max(2, x2 - x1);
        return (
          <Rect
            key={i}
            x={x1}
            y={0}
            width={w}
            height={h}
            rx={radius}
            fill={s.color}
            opacity={0.85}
          />
        );
      })}
      <Line
        x1={xFor(day)}
        x2={xFor(day)}
        y1={-2}
        y2={h + 2}
        stroke={LIGHT_THEME.wText}
        strokeWidth={2}
      />
      <Circle
        cx={xFor(day)}
        cy={h / 2}
        r={4}
        fill="#FFFFFF"
        stroke={LIGHT_THEME.wText}
        strokeWidth={1.5}
      />
    </Svg>
  );
}

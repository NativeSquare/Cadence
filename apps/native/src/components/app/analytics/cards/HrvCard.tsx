/**
 * HRV daily chart with coach-intervention markers.
 *
 * Reads daily RMSSD values and renders a per-day bar across a 4-week or
 * 12-week window. A dashed line marks the window mean (the trigger compares
 * each day against a 14-day rolling baseline; the chart shows the simpler
 * window average so the runner has a single reference line to read against).
 *
 * Each row from `analytics.interventions.list` becomes a pinging lime dot
 * over the day the rule fired. Tapping a dot opens the intervention detail
 * sheet (one sentence + original→new diff + optional signal details).
 */

import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Svg, { G, Line, Rect, Text as SvgText } from "react-native-svg";
import { Activity } from "lucide-react-native";
import type { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { CardShell } from "../parts/CardShell";
import { ChartEmpty } from "../parts/ChartEmpty";
import { WEEK_COUNTS, type WeekWindow } from "../lib/window";
import {
  InterventionMarkers,
  InterventionVerticals,
  type ChartIntervention,
  type ChartMarker,
} from "../parts/InterventionMarkers";
import { InterventionDetailSheet } from "../parts/InterventionDetailSheet";
import type { DataTypeKey } from "@/lib/providers/capabilities";

type HrvDay = { date: string; hrvRmssd: number };
type Props = {
  days: HrvDay[];
  interventions: ChartIntervention[];
  width: number;
  lockedDataType?: DataTypeKey;
};

const WINDOWS: WeekWindow[] = ["4w", "12w"];
const CHART_HEIGHT = 180;
const BAR_COLOR = "#9B6FBF";
const MEAN_COLOR = "#1F2937";

const PAD_L = 32;
const PAD_R = 8;
const PAD_T = 18;
const PAD_B = 22;

export function HrvCard({ days, interventions, width, lockedDataType }: Props) {
  const { t } = useTranslation();
  const [window, setWindow] = useState<WeekWindow>("4w");
  const [active, setActive] = useState<ChartIntervention | null>(null);
  const sheetRef = useRef<GorhomBottomSheetModal | null>(null);

  const series = useMemo(() => buildSeries(days, window), [days, window]);

  const innerW = Math.max(0, width - PAD_L - PAD_R);
  const slotW = innerW / Math.max(1, series.bars.length);

  const markers = useMemo<ChartMarker[]>(() => {
    if (series.bars.length === 0) return [];
    const byDate = new Map(series.bars.map((b, i) => [b.key, i]));
    const out: ChartMarker[] = [];
    for (const itv of interventions) {
      const dateKey = new Date(itv.firedAt).toISOString().slice(0, 10);
      const idx = byDate.get(dateKey);
      if (idx === undefined) continue;
      out.push({
        intervention: itv,
        leftPx: PAD_L + idx * slotW + slotW / 2,
      });
    }
    return out;
  }, [interventions, series.bars, slotW]);

  const handleMarkerPress = (intervention: ChartIntervention) => {
    setActive(intervention);
    sheetRef.current?.present();
  };

  return (
    <CardShell
      title={t("analytics.cards.hrv.title")}
      subtitle={t("analytics.cards.hrv.subtitle")}
      Icon={Activity}
      window={window}
      windows={WINDOWS}
      onWindowChange={setWindow}
      lockedDataType={lockedDataType}
    >
      {series.bars.every((b) => b.value === 0) ? (
        <ChartEmpty
          height={CHART_HEIGHT}
          message={t("analytics.empty.noHrv")}
        />
      ) : (
        <>
          <View className="flex-row items-baseline justify-between mb-2">
            <Text className="text-[12px] font-coach text-wMute">
              {t("analytics.cards.hrv.avgLabel")}
            </Text>
            <Text className="text-[14px] font-coach-semibold text-wText tabular-nums">
              {Math.round(series.avgValue)}{" "}
              <Text className="text-[11px] font-coach text-wMute">ms</Text>
            </Text>
          </View>
          <View style={{ position: "relative" }}>
            <HrvBars width={width} series={series} markers={markers} />
            <InterventionMarkers
              markers={markers}
              topPx={PAD_T - 6}
              onPress={handleMarkerPress}
            />
          </View>
          <InterventionDetailSheet sheetRef={sheetRef} intervention={active} />
        </>
      )}
    </CardShell>
  );
}

type Series = {
  bars: { key: string; label: string; value: number }[];
  avgValue: number;
  peak: number;
};

function buildSeries(days: HrvDay[], window: WeekWindow): Series {
  const count = WEEK_COUNTS[window] * 7;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const startMs = today.getTime() - (count - 1) * 24 * 60 * 60 * 1000;

  const byDate = new Map(days.map((d) => [d.date, d.hrvRmssd]));
  const bars: { key: string; label: string; value: number }[] = [];
  let sum = 0;
  let n = 0;
  let peak = 0;
  for (let i = 0; i < count; i++) {
    const d = new Date(startMs + i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    const value = byDate.get(key) ?? 0;
    bars.push({ key, label: dayLabel(d, i), value });
    if (value > 0) {
      sum += value;
      n += 1;
    }
    if (value > peak) peak = value;
  }
  return {
    bars,
    avgValue: n > 0 ? sum / n : 0,
    peak,
  };
}

function dayLabel(d: Date, i: number): string {
  if (i % 7 !== 0) return "";
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
}

function niceMax(v: number): number {
  if (v <= 0) return 100;
  const pow = 10 ** Math.floor(Math.log10(v));
  const norm = v / pow;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return step * pow;
}

function HrvBars({
  width,
  series,
  markers,
}: {
  width: number;
  series: Series;
  markers: ChartMarker[];
}) {
  const innerW = Math.max(0, width - PAD_L - PAD_R);
  const innerH = CHART_HEIGHT - PAD_T - PAD_B;

  const yMax = niceMax(Math.max(series.peak, series.avgValue * 1.4, 50));
  const ticks = [0, yMax / 2, yMax];

  const n = series.bars.length;
  const slotW = innerW / Math.max(1, n);
  const barW = Math.max(1, slotW * 0.7);

  const meanY = PAD_T + innerH * (1 - series.avgValue / yMax);

  return (
    <Svg width={width} height={CHART_HEIGHT}>
      <G>
        {ticks.map((tk) => {
          const y = PAD_T + innerH * (1 - tk / yMax);
          return (
            <G key={tk}>
              <Line
                x1={PAD_L}
                x2={PAD_L + innerW}
                y1={y}
                y2={y}
                stroke={LIGHT_THEME.wBrd}
                strokeWidth={1}
              />
              <SvgText
                x={PAD_L - 6}
                y={y + 3}
                fontSize={9}
                fill={LIGHT_THEME.wMute}
                textAnchor="end"
              >
                {Math.round(tk)}
              </SvgText>
            </G>
          );
        })}
      </G>
      <InterventionVerticals
        markers={markers}
        topY={PAD_T - 4}
        bottomY={PAD_T + innerH}
      />
      <G>
        {series.bars.map((b, i) => {
          if (b.value <= 0) return null;
          const h = (Math.min(b.value, yMax) / yMax) * innerH;
          const x = PAD_L + i * slotW + (slotW - barW) / 2;
          const y = PAD_T + innerH - h;
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
      {series.avgValue > 0 ? (
        <Line
          x1={PAD_L}
          x2={PAD_L + innerW}
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
          const x = PAD_L + i * slotW + slotW / 2;
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

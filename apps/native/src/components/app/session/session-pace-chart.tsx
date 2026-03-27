import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME, FONT_WEIGHTS, CARD_SHADOW } from "@/lib/design-tokens";

export interface LapData {
  avgSpeedMps?: number;
  distanceMeters?: number;
}

export interface SessionPaceChartProps {
  laps: LapData[];
  targetPaceMin?: string; // "4:55/km"
  targetPaceMax?: string; // "5:05/km"
}

/** Parse "M:SS" pace to seconds per km */
function parsePaceToSec(pace: string): number | null {
  const clean = pace.replace(/\/km/i, "").trim();
  const parts = clean.split(":");
  if (parts.length !== 2) return null;
  const min = parseInt(parts[0]);
  const sec = parseInt(parts[1]);
  if (isNaN(min) || isNaN(sec)) return null;
  return min * 60 + sec;
}

/** Convert m/s to seconds per km */
function speedToSecPerKm(mps: number): number {
  return mps > 0 ? 1000 / mps : 0;
}

/** Format seconds-per-km as "M:SS" */
function formatPace(secPerKm: number): string {
  if (secPerKm <= 0) return "-";
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

/** Classify the consistency of reps */
function getConsistencyLabel(spreadSec: number): {
  label: string;
  color: string;
} {
  if (spreadSec <= 5)
    return { label: "Pace on Point", color: COLORS.grn };
  if (spreadSec <= 12)
    return { label: "Consistent", color: COLORS.ylw };
  if (spreadSec <= 20)
    return { label: "Some Variation", color: COLORS.ora };
  return { label: "Faded Late", color: COLORS.red };
}

export function SessionPaceChart({
  laps,
  targetPaceMin,
  targetPaceMax,
}: SessionPaceChartProps) {
  // Need at least 3 laps for a meaningful chart (interval work typically has many)
  const validLaps = laps.filter((l) => l.avgSpeedMps && l.avgSpeedMps > 0);
  if (validLaps.length < 3) return null;

  const paces = validLaps.map((l) => speedToSecPerKm(l.avgSpeedMps!));
  const targetMinSec = targetPaceMin ? parsePaceToSec(targetPaceMin) : null;
  const targetMaxSec = targetPaceMax ? parsePaceToSec(targetPaceMax) : null;

  const fastest = Math.min(...paces);
  const slowest = Math.max(...paces);
  const spread = slowest - fastest;
  const avgPace = paces.reduce((s, p) => s + p, 0) / paces.length;
  const consistency = getConsistencyLabel(spread);

  // Chart range — add padding
  const chartMin = Math.min(fastest, targetMinSec ?? fastest) - 10;
  const chartMax = Math.max(slowest, targetMaxSec ?? slowest) + 10;
  const chartRange = chartMax - chartMin;

  /** Position as percentage (inverted: faster pace = higher = more %) */
  function paceToY(secPerKm: number): number {
    return ((chartMax - secPerKm) / chartRange) * 100;
  }

  return (
    <View className="mb-4">
      <Text
        className="text-[11px] font-coach-semibold text-wSub uppercase px-1 mb-2.5"
        style={{ letterSpacing: 0.55 }}
      >
        Pace Consistency
      </Text>
      <View className="rounded-2xl bg-w1 p-4" style={CARD_SHADOW}>
        {/* Consistency badge */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 14,
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: consistency.color,
            }}
          />
          <Text
            style={{
              fontSize: 14,
              fontFamily: FONT_WEIGHTS.bold,
              color: LIGHT_THEME.wText,
            }}
          >
            {consistency.label}
          </Text>
          <Text
            style={{
              fontSize: 12,
              fontFamily: FONT_WEIGHTS.medium,
              color: LIGHT_THEME.wMute,
            }}
          >
            {spread.toFixed(0)}s spread
          </Text>
        </View>

        {/* Dot chart area */}
        <View style={{ height: 120, position: "relative", marginBottom: 8 }}>
          {/* Target zone band */}
          {targetMinSec && targetMaxSec && (
            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: `${paceToY(targetMaxSec)}%`,
                height: `${paceToY(targetMinSec) - paceToY(targetMaxSec)}%`,
                backgroundColor: COLORS.limeDim,
                borderRadius: 4,
              }}
            />
          )}

          {/* Average line */}
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: `${paceToY(avgPace)}%`,
              height: 1,
              backgroundColor: LIGHT_THEME.wMute,
              opacity: 0.4,
            }}
          />

          {/* Pace dots */}
          {paces.map((pace, i) => {
            const x = (i / (paces.length - 1)) * 100;
            const y = paceToY(pace);
            const inTarget =
              targetMinSec &&
              targetMaxSec &&
              pace >= targetMinSec &&
              pace <= targetMaxSec;

            return (
              <View
                key={i}
                style={{
                  position: "absolute",
                  left: `${x}%`,
                  bottom: `${y}%`,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: inTarget ? COLORS.grn : COLORS.ora,
                  marginLeft: -5,
                  marginBottom: -5,
                }}
              />
            );
          })}
        </View>

        {/* Rep labels */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              fontSize: 10,
              color: LIGHT_THEME.wMute,
              fontFamily: FONT_WEIGHTS.medium,
            }}
          >
            Rep 1
          </Text>
          <Text
            style={{
              fontSize: 10,
              color: LIGHT_THEME.wMute,
              fontFamily: FONT_WEIGHTS.medium,
            }}
          >
            Rep {paces.length}
          </Text>
        </View>

        {/* Stats row */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: LIGHT_THEME.wBrd,
          }}
        >
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 10, color: LIGHT_THEME.wMute, fontFamily: FONT_WEIGHTS.medium, textTransform: "uppercase", marginBottom: 2 }}>
              Fastest
            </Text>
            <Text style={{ fontSize: 14, fontFamily: FONT_WEIGHTS.bold, color: LIGHT_THEME.wText }}>
              {formatPace(fastest)}
            </Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 10, color: LIGHT_THEME.wMute, fontFamily: FONT_WEIGHTS.medium, textTransform: "uppercase", marginBottom: 2 }}>
              Average
            </Text>
            <Text style={{ fontSize: 14, fontFamily: FONT_WEIGHTS.bold, color: LIGHT_THEME.wText }}>
              {formatPace(avgPace)}
            </Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 10, color: LIGHT_THEME.wMute, fontFamily: FONT_WEIGHTS.medium, textTransform: "uppercase", marginBottom: 2 }}>
              Slowest
            </Text>
            <Text style={{ fontSize: 14, fontFamily: FONT_WEIGHTS.bold, color: LIGHT_THEME.wText }}>
              {formatPace(slowest)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

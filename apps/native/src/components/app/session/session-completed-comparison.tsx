import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { COLORS, GRAYS, FONT_WEIGHTS } from "@/lib/design-tokens";

export interface SessionCompletedComparisonProps {
  plannedDistanceKm: string;
  plannedDuration: string;
  actualDistanceKm?: string;
  actualDuration?: string;
  adherenceScore?: number;
}

function getComplianceStyle(deviation: number): { color: string; bg: string } {
  const abs = Math.abs(deviation);
  if (abs <= 0.05) return { color: COLORS.grn, bg: COLORS.grnDim };
  if (abs <= 0.15) return { color: COLORS.ylw, bg: COLORS.ylwDim };
  if (abs <= 0.25) return { color: COLORS.ora, bg: COLORS.oraDim };
  return { color: COLORS.red, bg: COLORS.redDim };
}

function getAdherenceStyle(score: number): { color: string; bg: string } {
  if (score >= 0.9) return { color: COLORS.grn, bg: COLORS.grnDim };
  if (score >= 0.75) return { color: COLORS.ylw, bg: COLORS.ylwDim };
  if (score >= 0.6) return { color: COLORS.ora, bg: COLORS.oraDim };
  return { color: COLORS.red, bg: COLORS.redDim };
}

function parseNumeric(value: string): number | null {
  const n = parseFloat(value.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? null : n;
}

function parseDurationMinutes(value: string): number | null {
  const hMatch = value.match(/(\d+)\s*h/);
  const mMatch = value.match(/(\d+)\s*m/);
  if (!hMatch && !mMatch) return null;
  return (hMatch ? parseInt(hMatch[1]) * 60 : 0) + (mMatch ? parseInt(mMatch[1]) : 0);
}

function formatDeviation(deviation: number): string {
  const sign = deviation > 0 ? "+" : "";
  return `${sign}${Math.round(deviation * 100)}%`;
}

export function SessionCompletedComparison({
  plannedDistanceKm,
  plannedDuration,
  actualDistanceKm,
  actualDuration,
  adherenceScore,
}: SessionCompletedComparisonProps) {
  const plannedDist = parseNumeric(plannedDistanceKm);
  const actualDist = actualDistanceKm ? parseNumeric(actualDistanceKm) : null;
  const distDeviation =
    plannedDist && actualDist ? (actualDist - plannedDist) / plannedDist : null;

  const plannedMins = parseDurationMinutes(plannedDuration);
  const actualMins = actualDuration ? parseDurationMinutes(actualDuration) : null;
  const durDeviation =
    plannedMins && actualMins ? (actualMins - plannedMins) / plannedMins : null;

  const adherenceStyle = adherenceScore !== undefined
    ? getAdherenceStyle(adherenceScore)
    : null;

  // Only show deviation badges when notable (>5%)
  const showDistDev = distDeviation !== null && Math.abs(distDeviation) > 0.05;
  const showDurDev = durDeviation !== null && Math.abs(durDeviation) > 0.05;
  const distStyle = showDistDev ? getComplianceStyle(distDeviation!) : null;
  const durStyle = showDurDev ? getComplianceStyle(durDeviation!) : null;

  return (
    <View
      className="mb-4"
      style={{
        backgroundColor: "#1A1A1A",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
        elevation: 12,
      }}
    >
      {/* Hero: actual values */}
      <View style={{ alignItems: "center", paddingTop: 28, paddingBottom: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10 }}>
          <Text style={{ fontSize: 28, lineHeight: 36, fontFamily: FONT_WEIGHTS.bold, color: GRAYS.g1 }}>
            {actualDistanceKm ?? plannedDistanceKm} km
          </Text>
          <Text style={{ fontSize: 16, lineHeight: 36, fontFamily: FONT_WEIGHTS.medium, color: GRAYS.g4 }}>
            ·
          </Text>
          <Text style={{ fontSize: 28, lineHeight: 36, fontFamily: FONT_WEIGHTS.bold, color: GRAYS.g1 }}>
            {actualDuration ?? plannedDuration}
          </Text>
        </View>
      </View>

      {/* Plan reference line */}
      <View style={{ alignItems: "center", paddingBottom: showDistDev || showDurDev ? 6 : 12 }}>
        <Text style={{ fontSize: 12, fontFamily: FONT_WEIGHTS.medium, color: GRAYS.g3 }}>
          plan {plannedDistanceKm} km · {plannedDuration}
        </Text>
      </View>

      {/* Deviation badges — only when notable */}
      {(showDistDev || showDurDev) && (
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, paddingBottom: 12 }}>
          {showDistDev && distStyle && (
            <View
              style={{
                backgroundColor: distStyle.bg,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 11, fontFamily: FONT_WEIGHTS.bold, color: distStyle.color }}>
                dist {formatDeviation(distDeviation!)}
              </Text>
            </View>
          )}
          {showDurDev && durStyle && (
            <View
              style={{
                backgroundColor: durStyle.bg,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 11, fontFamily: FONT_WEIGHTS.bold, color: durStyle.color }}>
                time {formatDeviation(durDeviation!)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Adherence badge */}
      {adherenceScore !== undefined && adherenceStyle && (
        <View
          style={{
            alignItems: "center",
            paddingBottom: 18,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: adherenceStyle.bg,
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 14,
              gap: 6,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: adherenceStyle.color,
              }}
            />
            <Text style={{ fontSize: 14, fontFamily: FONT_WEIGHTS.bold, color: adherenceStyle.color }}>
              {Math.round(adherenceScore * 100)}% adherence
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

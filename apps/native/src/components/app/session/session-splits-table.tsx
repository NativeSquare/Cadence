import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME, FONT_WEIGHTS, CARD_SHADOW, ZONE_COLORS } from "@/lib/design-tokens";

export interface LapData {
  avgHrBpm?: number;
  avgSpeedMps?: number;
  distanceMeters?: number;
  startTime?: string;
  endTime?: string;
}

export interface SessionSplitsTableProps {
  laps: LapData[];
}

/** Convert m/s to min:sec/km pace string */
function speedToPace(mps: number): string {
  if (mps <= 0) return "-";
  const secPerKm = 1000 / mps;
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

/** Get pace bar width relative to fastest pace */
function getPaceBarWidth(mps: number, fastestMps: number): number {
  if (fastestMps <= 0 || mps <= 0) return 0;
  return Math.min(1, mps / fastestMps);
}

/** Map HR to approximate zone color */
function getHrZoneColor(hr: number): string {
  if (hr >= 175) return ZONE_COLORS.Z5;
  if (hr >= 160) return ZONE_COLORS.Z4;
  if (hr >= 145) return ZONE_COLORS.Z3;
  if (hr >= 130) return ZONE_COLORS.Z2;
  return ZONE_COLORS.Z1;
}

/** Calculate lap duration from start/end times in seconds */
function getLapDuration(lap: LapData): number | null {
  if (!lap.startTime || !lap.endTime) return null;
  const start = new Date(lap.startTime).getTime();
  const end = new Date(lap.endTime).getTime();
  const sec = Math.round((end - start) / 1000);
  return sec > 0 ? sec : null;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function SessionSplitsTable({ laps }: SessionSplitsTableProps) {
  if (laps.length === 0) return null;

  const fastestMps = Math.max(
    ...laps.map((l) => l.avgSpeedMps ?? 0).filter((v) => v > 0)
  );

  return (
    <View className="mb-4">
      <Text
        className="text-[11px] font-coach-semibold text-wSub uppercase px-1 mb-2.5"
        style={{ letterSpacing: 0.55 }}
      >
        Splits
      </Text>
      <View className="rounded-2xl bg-w1 overflow-hidden" style={CARD_SHADOW}>
        {/* Column headers */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: LIGHT_THEME.wBrd,
          }}
        >
          <Text style={{ width: 36, fontSize: 10, fontFamily: FONT_WEIGHTS.semibold, color: LIGHT_THEME.wMute, textTransform: "uppercase" }}>
            #
          </Text>
          <Text style={{ flex: 1, fontSize: 10, fontFamily: FONT_WEIGHTS.semibold, color: LIGHT_THEME.wMute, textTransform: "uppercase" }}>
            Pace
          </Text>
          <Text style={{ width: 48, fontSize: 10, fontFamily: FONT_WEIGHTS.semibold, color: LIGHT_THEME.wMute, textTransform: "uppercase", textAlign: "right" }}>
            Time
          </Text>
          <Text style={{ width: 44, fontSize: 10, fontFamily: FONT_WEIGHTS.semibold, color: LIGHT_THEME.wMute, textTransform: "uppercase", textAlign: "right" }}>
            HR
          </Text>
        </View>

        {/* Lap rows */}
        {laps.map((lap, i) => {
          const pace = lap.avgSpeedMps ? speedToPace(lap.avgSpeedMps) : "-";
          const barWidth = lap.avgSpeedMps
            ? getPaceBarWidth(lap.avgSpeedMps, fastestMps)
            : 0;
          const duration = getLapDuration(lap);
          const distKm = lap.distanceMeters
            ? (lap.distanceMeters / 1000).toFixed(2)
            : null;

          return (
            <View
              key={i}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderBottomWidth: i < laps.length - 1 ? 1 : 0,
                borderBottomColor: LIGHT_THEME.wBrd,
              }}
            >
              {/* Lap number */}
              <Text
                style={{
                  width: 36,
                  fontSize: 13,
                  fontFamily: FONT_WEIGHTS.medium,
                  color: LIGHT_THEME.wSub,
                }}
              >
                {distKm ? `${distKm}` : `${i + 1}`}
              </Text>

              {/* Pace + bar */}
              <View style={{ flex: 1, gap: 4 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: FONT_WEIGHTS.bold,
                    color: LIGHT_THEME.wText,
                  }}
                >
                  {pace}
                </Text>
                {barWidth > 0 && (
                  <View
                    style={{
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: LIGHT_THEME.w3,
                    }}
                  >
                    <View
                      style={{
                        height: 4,
                        borderRadius: 2,
                        width: `${Math.round(barWidth * 100)}%`,
                        backgroundColor: lap.avgHrBpm
                          ? getHrZoneColor(lap.avgHrBpm)
                          : ZONE_COLORS.Z3,
                        opacity: 0.7,
                      }}
                    />
                  </View>
                )}
              </View>

              {/* Duration */}
              <Text
                style={{
                  width: 48,
                  fontSize: 13,
                  fontFamily: FONT_WEIGHTS.medium,
                  color: LIGHT_THEME.wSub,
                  textAlign: "right",
                }}
              >
                {duration ? formatDuration(duration) : "-"}
              </Text>

              {/* HR */}
              <Text
                style={{
                  width: 44,
                  fontSize: 13,
                  fontFamily: FONT_WEIGHTS.medium,
                  color: lap.avgHrBpm
                    ? getHrZoneColor(lap.avgHrBpm)
                    : LIGHT_THEME.wMute,
                  textAlign: "right",
                }}
              >
                {lap.avgHrBpm ?? "-"}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

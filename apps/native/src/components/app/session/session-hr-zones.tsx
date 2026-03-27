import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME, FONT_WEIGHTS, CARD_SHADOW, ZONE_COLORS } from "@/lib/design-tokens";

export interface HrZoneData {
  zone?: number;
  durationSeconds?: number;
  name?: string;
}

export interface SessionHrZonesProps {
  hrZones: HrZoneData[];
  targetZone?: number;
}

function formatZoneDuration(seconds: number): string {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s > 0 ? `${s}s` : ""}`.trim();
}

const ZONE_LABELS: Record<number, string> = {
  1: "Z1 Recovery",
  2: "Z2 Aerobic",
  3: "Z3 Tempo",
  4: "Z4 Threshold",
  5: "Z5 VO2max",
};

function getZoneBarColor(zone: number): string {
  return ZONE_COLORS[`Z${zone}`] ?? ZONE_COLORS.Z3;
}

export function SessionHrZones({ hrZones, targetZone }: SessionHrZonesProps) {
  if (hrZones.length === 0) return null;

  // Sort by zone number and calculate totals
  const sorted = [...hrZones]
    .filter((z) => z.zone != null && z.durationSeconds != null && z.durationSeconds > 0)
    .sort((a, b) => (a.zone ?? 0) - (b.zone ?? 0));

  const totalSeconds = sorted.reduce(
    (sum, z) => sum + (z.durationSeconds ?? 0),
    0
  );

  if (totalSeconds === 0) return null;

  // Find the zone with the most time
  const dominantZone = sorted.reduce(
    (max, z) =>
      (z.durationSeconds ?? 0) > (max.durationSeconds ?? 0) ? z : max,
    sorted[0]
  );

  return (
    <View className="mb-4">
      <Text
        className="text-[11px] font-coach-semibold text-wSub uppercase px-1 mb-2.5"
        style={{ letterSpacing: 0.55 }}
      >
        Heart Rate Zones
      </Text>
      <View className="rounded-2xl bg-w1 p-4" style={CARD_SHADOW}>
        {/* Stacked bar */}
        <View
          style={{
            flexDirection: "row",
            height: 14,
            borderRadius: 7,
            overflow: "hidden",
            marginBottom: 16,
          }}
        >
          {sorted.map((z) => {
            const pct = ((z.durationSeconds ?? 0) / totalSeconds) * 100;
            if (pct < 1) return null;
            return (
              <View
                key={z.zone}
                style={{
                  width: `${pct}%`,
                  backgroundColor: getZoneBarColor(z.zone ?? 3),
                  opacity: 0.85,
                }}
              />
            );
          })}
        </View>

        {/* Zone breakdown rows */}
        {sorted.map((z) => {
          const zone = z.zone ?? 0;
          const pct = Math.round(
            ((z.durationSeconds ?? 0) / totalSeconds) * 100
          );
          const isTarget = targetZone != null && zone === targetZone;
          const isDominant = z === dominantZone;

          return (
            <View
              key={zone}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 7,
                gap: 10,
              }}
            >
              {/* Zone color dot */}
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: getZoneBarColor(zone),
                }}
              />

              {/* Zone label */}
              <Text
                style={{
                  flex: 1,
                  fontSize: 13,
                  fontFamily:
                    isDominant || isTarget
                      ? FONT_WEIGHTS.bold
                      : FONT_WEIGHTS.medium,
                  color:
                    isDominant || isTarget
                      ? LIGHT_THEME.wText
                      : LIGHT_THEME.wSub,
                }}
              >
                {ZONE_LABELS[zone] ?? `Zone ${zone}`}
                {isTarget ? " (target)" : ""}
              </Text>

              {/* Duration */}
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: FONT_WEIGHTS.medium,
                  color: LIGHT_THEME.wSub,
                  marginRight: 8,
                }}
              >
                {formatZoneDuration(z.durationSeconds ?? 0)}
              </Text>

              {/* Percentage */}
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: FONT_WEIGHTS.bold,
                  color: isDominant ? LIGHT_THEME.wText : LIGHT_THEME.wMute,
                  width: 36,
                  textAlign: "right",
                }}
              >
                {pct}%
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

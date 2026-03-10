import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { FONT_WEIGHTS } from "@/lib/design-tokens";

export interface SessionStatsRowProps {
  distanceKm: string;
  duration: string;
  effort: string;
  hrZone?: number;
  isCompleted: boolean;
  actualDistanceKm?: string;
  actualDuration?: string;
}

function StatDivider() {
  return <View style={{ width: 1, height: 36, backgroundColor: "rgba(255,255,255,0.1)" }} />;
}

function Stat({
  label,
  value,
  unit,
  subValue,
}: {
  label: string;
  value: string;
  unit?: string;
  subValue?: string;
}) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text
        style={{
          fontSize: 10,
          fontFamily: FONT_WEIGHTS.medium,
          color: "rgba(255,255,255,0.4)",
          textTransform: "uppercase",
          letterSpacing: 0.4,
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <View className="flex-row items-baseline">
        <Text style={{ fontSize: 24, fontFamily: FONT_WEIGHTS.extrabold, color: "#FFFFFF" }}>
          {value}
        </Text>
        {unit && (
          <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginLeft: 2 }}>{unit}</Text>
        )}
      </View>
      {subValue && (
        <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>
          planned {subValue}
        </Text>
      )}
    </View>
  );
}

export function SessionStatsRow({
  distanceKm,
  duration,
  effort,
  hrZone,
  isCompleted,
  actualDistanceKm,
  actualDuration,
}: SessionStatsRowProps) {
  const showActual = isCompleted && (actualDistanceKm || actualDuration);

  return (
    <View
      className="mb-4 rounded-[20px] overflow-hidden"
      style={{
        backgroundColor: "#1A1A1A",
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
        elevation: 10,
      }}
    >
      <View className="flex-row items-center">
        <Stat
          label="Distance"
          value={showActual && actualDistanceKm ? actualDistanceKm : distanceKm}
          unit="km"
          subValue={showActual && actualDistanceKm ? `${distanceKm} km` : undefined}
        />
        <StatDivider />
        <Stat
          label="Duration"
          value={showActual && actualDuration ? actualDuration : duration}
          subValue={showActual && actualDuration ? duration : undefined}
        />
        <StatDivider />
        <Stat
          label={hrZone ? "HR Zone" : "Effort"}
          value={hrZone ? `Z${hrZone}` : effort}
        />
      </View>
    </View>
  );
}

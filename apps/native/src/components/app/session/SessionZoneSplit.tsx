import { useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME, FONT_WEIGHTS } from "@/lib/design-tokens";
import type { SessionSegment } from "./types";
import { getZoneColor } from "./types";

const CARD_SHADOW = {
  borderWidth: 1,
  borderColor: "rgba(0,0,0,0.08)",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 16,
  elevation: 4,
} as const;

interface ZoneEntry {
  zone: string;
  km: number;
  percentage: number;
  color: string;
}

function computeZoneSplit(segments: SessionSegment[]): ZoneEntry[] {
  const zoneKm: Record<string, number> = {};

  for (const seg of segments) {
    const km = parseFloat(seg.km);
    if (isNaN(km) || km <= 0) continue;
    zoneKm[seg.zone] = (zoneKm[seg.zone] ?? 0) + km;
  }

  const totalKm = Object.values(zoneKm).reduce((a, b) => a + b, 0);
  if (totalKm <= 0) return [];

  const zoneOrder = ["Z5", "Z4-5", "Z4", "Z3-4", "Z3", "Z2-3", "Z2", "Z1"];

  return zoneOrder
    .filter((z) => zoneKm[z] != null && zoneKm[z] > 0)
    .map((zone) => ({
      zone,
      km: Math.round(zoneKm[zone] * 10) / 10,
      percentage: Math.round((zoneKm[zone] / totalKm) * 100),
      color: getZoneColor(zone),
    }));
}

function ZoneBar({
  entry,
  maxPercentage,
  index,
  isSelected,
  onPress,
}: {
  entry: ZoneEntry;
  maxPercentage: number;
  index: number;
  isSelected: boolean;
  onPress: () => void;
}) {
  const barProgress = useSharedValue(0);

  useEffect(() => {
    barProgress.value = withDelay(
      index * 80,
      withTiming(1, {
        duration: 700,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      })
    );
  }, []);

  const barWidthPercent =
    maxPercentage > 0 ? (entry.percentage / maxPercentage) * 100 : 0;

  const animatedBarStyle = useAnimatedStyle(() => ({
    width: `${barWidthPercent * barProgress.value}%`,
  }));

  return (
    <Pressable onPress={onPress}>
      <View
        className="flex-row items-center py-[8px]"
        style={{
          backgroundColor: isSelected ? "rgba(0,0,0,0.04)" : "transparent",
          borderRadius: isSelected ? 8 : 0,
          paddingHorizontal: isSelected ? 4 : 0,
          marginHorizontal: isSelected ? -4 : 0,
        }}
      >
        <View style={{ width: 36 }}>
          <Text
            style={{
              fontSize: 13,
              fontFamily: FONT_WEIGHTS.semibold,
              color: LIGHT_THEME.wText,
            }}
          >
            {entry.zone}
          </Text>
        </View>

        <View className="flex-1 mx-2" style={{ height: 20 }}>
          <Animated.View
            style={[
              {
                height: 20,
                borderRadius: 4,
                backgroundColor: entry.color,
                opacity: isSelected ? 1 : 0.7,
                minWidth: entry.percentage > 0 ? 4 : 0,
              },
              animatedBarStyle,
            ]}
          />
        </View>

        <View style={{ width: 36, alignItems: "flex-end" }}>
          <Text
            style={{
              fontSize: 13,
              fontFamily: FONT_WEIGHTS.semibold,
              color: LIGHT_THEME.wText,
            }}
          >
            {entry.percentage}%
          </Text>
        </View>

        <View style={{ width: 48, alignItems: "flex-end" }}>
          <Text
            style={{
              fontSize: 12,
              fontFamily: FONT_WEIGHTS.regular,
              color: LIGHT_THEME.wSub,
            }}
          >
            {entry.km}km
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export interface SessionZoneSplitProps {
  segments: SessionSegment[];
}

export function SessionZoneSplit({ segments }: SessionZoneSplitProps) {
  const entries = useMemo(() => computeZoneSplit(segments), [segments]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  if (entries.length === 0) return null;

  const maxPercentage = Math.max(...entries.map((e) => e.percentage), 1);
  const dominant = entries.reduce((a, b) =>
    b.percentage > a.percentage ? b : a
  );

  return (
    <View
      className="p-5 rounded-[20px] mb-3"
      style={{ backgroundColor: LIGHT_THEME.w1, ...CARD_SHADOW }}
    >
      <Text
        style={{
          fontSize: 12,
          fontFamily: FONT_WEIGHTS.semibold,
          color: LIGHT_THEME.wSub,
          textTransform: "uppercase",
          letterSpacing: 0.05 * 12,
          marginBottom: 4,
        }}
      >
        Zone Split
      </Text>

      <Text
        style={{
          fontSize: 22,
          fontFamily: FONT_WEIGHTS.extrabold,
          color: LIGHT_THEME.wText,
          marginBottom: 12,
        }}
      >
        {dominant.percentage}% in {dominant.zone}
      </Text>

      <View>
        {entries.map((entry, i) => (
          <ZoneBar
            key={entry.zone}
            entry={entry}
            maxPercentage={maxPercentage}
            index={i}
            isSelected={selectedIdx === i}
            onPress={() => setSelectedIdx(selectedIdx === i ? null : i)}
          />
        ))}
      </View>
    </View>
  );
}

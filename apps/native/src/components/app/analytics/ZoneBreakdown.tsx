/**
 * ZoneBreakdown - Strava-style horizontal zone distribution bars
 *
 * Shows heart rate zones as horizontal bars with:
 * - Zone label (Z1-Z5) on the left
 * - Proportional colored bar
 * - Percentage at the end of the bar
 * - BPM range on the right
 * - Period selector (7d, 1mo, 3mo, etc.)
 * - Summary text highlighting the dominant zone
 */

import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { GRAYS } from "@/lib/design-tokens";
import type { ZoneBreakdownData, ZonePeriod } from "./mock-data";

interface ZoneBreakdownProps {
  data: ZoneBreakdownData[];
  dominantZone?: string;
  dominantPercentage?: number;
  period?: ZonePeriod;
  onPeriodChange?: (period: ZonePeriod) => void;
}

const PERIODS: { value: ZonePeriod; label: string }[] = [
  { value: "7d", label: "7d" },
  { value: "1mo", label: "1 mo" },
  { value: "3mo", label: "3 mo" },
  { value: "6mo", label: "6 mo" },
  { value: "all", label: "All" },
];

function ZoneBar({
  zone,
  data,
  maxPercentage,
  index,
  isSelected,
  onPress,
}: {
  zone: ZoneBreakdownData;
  data: ZoneBreakdownData[];
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

  const barWidthPercent = maxPercentage > 0
    ? (zone.percentage / maxPercentage) * 100
    : 0;

  const animatedBarStyle = useAnimatedStyle(() => ({
    width: `${barWidthPercent * barProgress.value}%`,
  }));

  return (
    <Pressable onPress={onPress}>
      <View
        className="flex-row items-center py-[10px]"
        style={{
          backgroundColor: isSelected ? "rgba(255,255,255,0.06)" : "transparent",
          borderRadius: isSelected ? 8 : 0,
          paddingHorizontal: isSelected ? 4 : 0,
          marginHorizontal: isSelected ? -4 : 0,
        }}
      >
        {/* Zone label */}
        <View style={{ width: 30 }}>
          <Text
            className="text-[13px] font-coach-semibold"
            style={{ color: GRAYS.g1 }}
          >
            {zone.zone}
          </Text>
        </View>

        {/* Bar container */}
        <View className="flex-1 mx-2" style={{ height: 22 }}>
          <Animated.View
            style={[
              {
                height: 22,
                borderRadius: 4,
                backgroundColor: zone.color,
                opacity: isSelected ? 1 : 0.7,
                minWidth: zone.percentage > 0 ? 4 : 0,
              },
              animatedBarStyle,
            ]}
          />
        </View>

        {/* Percentage */}
        <View style={{ width: 38, alignItems: "flex-end" }}>
          <Text
            className="text-[13px] font-coach-semibold"
            style={{ color: GRAYS.g1 }}
          >
            {zone.percentage}%
          </Text>
        </View>

        {/* BPM range */}
        <View style={{ width: 84, alignItems: "flex-end" }}>
          <Text
            className="text-[11px] font-coach"
            style={{ color: GRAYS.g3 }}
          >
            {zone.bpmRange}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function PeriodSelector({
  active,
  onSelect,
}: {
  active: ZonePeriod;
  onSelect: (period: ZonePeriod) => void;
}) {
  return (
    <View className="flex-row items-center gap-1">
      {PERIODS.map((p) => {
        const isActive = p.value === active;
        return (
          <Pressable
            key={p.value}
            onPress={() => onSelect(p.value)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 6,
              backgroundColor: isActive ? GRAYS.g1 : "rgba(255,255,255,0.10)",
            }}
          >
            <Text
              className="text-[11px] font-coach-medium"
              style={{
                color: isActive ? "#1A1A1A" : GRAYS.g3,
              }}
            >
              {p.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ZoneBreakdown({
  data,
  dominantZone,
  dominantPercentage,
  period: controlledPeriod,
  onPeriodChange,
}: ZoneBreakdownProps) {
  const [internalPeriod, setInternalPeriod] = useState<ZonePeriod>("3mo");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const period = controlledPeriod ?? internalPeriod;
  const handlePeriodChange = (p: ZonePeriod) => {
    onPeriodChange?.(p);
    setInternalPeriod(p);
    setSelectedIdx(null);
  };

  const maxPercentage = Math.max(...data.map((d) => d.percentage), 1);

  const dominant = dominantZone
    ?? data.reduce((a, b) => (b.percentage > a.percentage ? b : a), data[0]);
  const domPercent = dominantPercentage
    ?? (typeof dominant === "object" ? dominant.percentage : 0);
  const domZone = typeof dominant === "string" ? dominant : dominant.zone;

  const selectedZone = selectedIdx !== null ? data[selectedIdx] : null;

  return (
    <View className="p-[18px] rounded-[20px]" style={{ backgroundColor: "#1A1A1A" }}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-1">
        <Text
          className="text-[11px] font-coach-semibold text-g3 uppercase"
          style={{ letterSpacing: 0.05 * 11 }}
        >
          Training Zones
        </Text>
      </View>

      {/* Dominant zone headline */}
      <View className="flex-row items-baseline justify-between mb-4">
        <Text className="text-[22px] font-coach-extrabold text-g1">
          {domPercent}% in {domZone}
        </Text>
        <Text className="text-[11px] font-coach text-g3">
          Last {period === "7d" ? "7 days" : period === "1mo" ? "month" : period === "3mo" ? "3 months" : period === "6mo" ? "6 months" : "time"}
        </Text>
      </View>

      {/* Zone bars */}
      <View className="mb-4">
        {data.map((zone, i) => (
          <ZoneBar
            key={zone.zone}
            zone={zone}
            data={data}
            maxPercentage={maxPercentage}
            index={i}
            isSelected={selectedIdx === i}
            onPress={() => setSelectedIdx(selectedIdx === i ? null : i)}
          />
        ))}
      </View>

      {/* Period selector */}
      <View className="items-center mb-3">
        <PeriodSelector active={period} onSelect={handlePeriodChange} />
      </View>

      {/* Selected zone detail or summary */}
      {selectedZone ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          className="px-3 py-3 rounded-xl"
          style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
        >
          <View className="flex-row items-center gap-2">
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                backgroundColor: selectedZone.color,
              }}
            />
            <Text className="text-[12px] font-coach-semibold text-g1">
              {selectedZone.zone} · {selectedZone.label}
            </Text>
          </View>
          <Text className="text-[12px] font-coach text-g2 mt-1">
            {selectedZone.percentage}% of training time · {selectedZone.bpmRange}
          </Text>
        </Animated.View>
      ) : (
        <View
          className="px-3 py-3 rounded-xl"
          style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
        >
          <Text className="text-[12px] font-coach text-g2">
            You spent most of your time in {domZone}. Tap a zone to see details.
          </Text>
        </View>
      )}
    </View>
  );
}

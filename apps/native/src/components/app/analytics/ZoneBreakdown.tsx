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
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";

const CARD_SHADOW = {
  borderWidth: 1,
  borderColor: "rgba(0,0,0,0.08)",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.10,
  shadowRadius: 16,
  elevation: 4,
} as const;
import {
  TimeFrameSelector,
  type TimeFrame,
} from "@/components/shared/time-frame-selector";
import type { ZoneBreakdownData } from "./mock-data";

interface ZoneBreakdownProps {
  data: ZoneBreakdownData[];
  dominantZone?: string;
  dominantPercentage?: number;
  period?: TimeFrame;
  onPeriodChange?: (period: TimeFrame) => void;
}

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
          backgroundColor: isSelected ? "rgba(0,0,0,0.04)" : "transparent",
          borderRadius: isSelected ? 8 : 0,
          paddingHorizontal: isSelected ? 4 : 0,
          marginHorizontal: isSelected ? -4 : 0,
        }}
      >
        {/* Zone label */}
        <View style={{ width: 30 }}>
          <Text
            className="text-[14px] font-coach-semibold"
            style={{ color: LIGHT_THEME.wText }}
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
            className="text-[14px] font-coach-semibold"
            style={{ color: LIGHT_THEME.wText }}
          >
            {zone.percentage}%
          </Text>
        </View>

        {/* BPM range */}
        <View style={{ width: 84, alignItems: "flex-end" }}>
          <Text
            className="text-[12px] font-coach"
            style={{ color: LIGHT_THEME.wSub }}
          >
            {zone.bpmRange}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}


export function ZoneBreakdown({
  data,
  dominantZone,
  dominantPercentage,
  period: controlledPeriod,
  onPeriodChange,
}: ZoneBreakdownProps) {
  const [internalPeriod, setInternalPeriod] = useState<TimeFrame>("3mo");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const period = controlledPeriod ?? internalPeriod;
  const handlePeriodChange = (p: TimeFrame) => {
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

  return (
    <View className="p-5 rounded-[20px]" style={{ backgroundColor: LIGHT_THEME.w1, ...CARD_SHADOW }}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-1">
        <Text
          className="text-[12px] font-coach-semibold text-wSub uppercase"
          style={{ letterSpacing: 0.05 * 12 }}
        >
          Training Zones
        </Text>
      </View>

      {/* Dominant zone headline */}
      <View className="flex-row items-baseline justify-between mb-4">
        <Text className="text-[24px] font-coach-extrabold text-wText">
          {domPercent}% in {domZone}
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
      <View className="mb-3">
        <TimeFrameSelector selected={period} onSelect={handlePeriodChange} variant="light" />
      </View>

    </View>
  );
}

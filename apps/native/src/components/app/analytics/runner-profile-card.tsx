import { useState, useCallback } from "react";
import { View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { COLORS, GRAYS } from "@/lib/design-tokens";
import {
  RadarChart,
  RADAR_MOCK_DATA_PATH,
  type RadarDataPoint,
} from "@/components/app/onboarding/viz/RadarChart";

function getScoreDescription(
  label: string,
  value: number,
  targetValue?: number
): string {
  const level = value >= 75 ? "strong" : value >= 50 ? "moderate" : "needs work";
  if (targetValue != null) {
    const diff = value - targetValue;
    if (diff >= 5) return `${diff} points above your goal target`;
    if (diff <= -5) return `${Math.abs(diff)} points below your goal target`;
    return `Right on track with your goal target`;
  }
  return `Your ${label.toLowerCase()} is ${level} at ${value}/100`;
}

interface RunnerProfileCardProps {
  data?: RadarDataPoint[];
  targetData?: RadarDataPoint[];
  objectiveLabel?: string;
}

export function RunnerProfileCard({
  data = RADAR_MOCK_DATA_PATH,
  targetData,
  objectiveLabel,
}: RunnerProfileCardProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const handlePointSelect = useCallback((index: number | null) => {
    setSelectedIdx(index);
  }, []);

  const selectedPoint = selectedIdx !== null ? data[selectedIdx] : null;
  const selectedTarget = selectedIdx !== null && targetData
    ? targetData[selectedIdx]
    : null;

  return (
    <View className="p-[18px] rounded-[20px]" style={{ backgroundColor: "#1A1A1A" }}>
      <View className="flex-row items-center justify-between mb-2">
        <Text
          className="text-[11px] font-coach-semibold text-g3 uppercase"
          style={{ letterSpacing: 0.05 * 11 }}
        >
          Runner Profile
        </Text>
        {selectedPoint == null && (
          <Text className="text-[9px] font-coach text-g3">
            Tap a point to explore
          </Text>
        )}
      </View>

      <View className="items-center py-2">
        <RadarChart
          data={data}
          targetData={targetData}
          size={300}
          animate
          onPointSelect={handlePointSelect}
        />
      </View>

      {/* Selected point detail */}
      {selectedPoint != null && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          className="mt-1 px-3 py-3 rounded-xl"
          style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-[10px] font-coach-semibold text-g3 uppercase">
              {selectedPoint.label}
            </Text>
            <View className="flex-row items-baseline gap-2">
              {selectedTarget && (
                <Text className="text-[13px] font-coach text-g3">
                  /{selectedTarget.value}
                </Text>
              )}
              <Text
                className="text-[22px] font-coach-extrabold"
                style={{
                  color:
                    selectedPoint.value >= 50
                      ? selectedPoint.value >= 75
                        ? "#6BBF00"
                        : GRAYS.g1
                      : COLORS.red,
                }}
              >
                {selectedPoint.value}
              </Text>
            </View>
          </View>
          <Text className="text-[12px] font-coach text-g2 mt-1">
            {getScoreDescription(
              selectedPoint.label,
              selectedPoint.value,
              selectedTarget?.value
            )}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

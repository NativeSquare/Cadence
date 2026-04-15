"use no memo";
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

function getScoreDescription(label: string, value: number): string {
  const level = value >= 75 ? "strong" : value >= 50 ? "moderate" : "needs work";
  return `Your ${label.toLowerCase()} is ${level} at ${value}/100`;
}

interface RunnerProfileCardProps {
  data?: RadarDataPoint[];
}

export function RunnerProfileCard({
  data = RADAR_MOCK_DATA_PATH,
}: RunnerProfileCardProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const handlePointSelect = useCallback((index: number | null) => {
    setSelectedIdx(index);
  }, []);

  const selectedPoint = selectedIdx !== null ? data[selectedIdx] : null;

  return (
    <View
      className="p-5 rounded-[20px]"
      style={{
        backgroundColor: "#1A1A1A",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 6,
      }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text
          className="text-[12px] font-coach-semibold text-g3 uppercase"
          style={{ letterSpacing: 0.05 * 12 }}
        >
          Runner Profile
        </Text>
        {selectedPoint == null && (
          <Text className="text-[10px] font-coach text-g3">
            Tap a point to explore
          </Text>
        )}
      </View>

      <View className="items-center py-2">
        <RadarChart
          data={data}
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
            <Text className="text-[11px] font-coach-semibold text-g3 uppercase">
              {selectedPoint.label}
            </Text>
            <Text
              className="text-[24px] font-coach-extrabold"
              style={{
                color:
                  selectedPoint.value >= 50
                    ? selectedPoint.value >= 75
                      ? COLORS.lime
                      : GRAYS.g1
                    : COLORS.red,
              }}
            >
              {selectedPoint.value}
            </Text>
          </View>
          <Text className="text-[13px] font-coach text-g2 mt-1">
            {getScoreDescription(selectedPoint.label, selectedPoint.value)}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

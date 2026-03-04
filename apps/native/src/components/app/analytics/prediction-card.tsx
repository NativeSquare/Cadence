/**
 * PredictionCard - Race prediction tiles with tap-to-expand trend chart
 *
 * Single dark card containing a 2x2 grid of predicted race times.
 * Tapping a tile reveals the prediction trend chart inside the same card.
 * Tapping again collapses it; tapping a different tile swaps the chart.
 */

import { useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { useFont } from "@shopify/react-native-skia";
import { Outfit_400Regular } from "@expo-google-fonts/outfit";
import { Text } from "@/components/ui/text";
import { COLORS, GRAYS } from "@/lib/design-tokens";
import {
  TimeFrameSelector,
  type TimeFrame,
} from "@/components/shared/time-frame-selector";
import { PredictionTrendChart } from "./LineChart";
import {
  MOCK_PREDICTIONS,
  MOCK_PREDICTION_TRENDS,
  type RacePrediction,
  type RaceObjective,
} from "./mock-data";

const DISTANCE_TO_OBJECTIVE: Record<string, RaceObjective> = {
  "5K": "5k",
  "10K": "10k",
  "Half Marathon": "half",
  Marathon: "marathon",
};

interface PredictionCardProps {
  predictions?: RacePrediction[];
  objective?: RaceObjective;
}

function PredictionTile({
  prediction,
  isActive,
  onPress,
}: {
  prediction: RacePrediction;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 items-center rounded-xl py-3 px-2"
      style={{
        backgroundColor: isActive
          ? "rgba(200,255,0,0.06)"
          : "rgba(255,255,255,0.04)",
      }}
    >
      <Text
        className="text-[11px] font-coach-semibold"
        style={{ color: isActive ? COLORS.lime : GRAYS.g3 }}
      >
        {prediction.distance}
      </Text>
      <Text
        className="text-[20px] font-coach-extrabold mt-1"
        style={{ color: isActive ? COLORS.lime : GRAYS.g1 }}
      >
        {prediction.timeFormatted}
      </Text>
      <Text
        className="text-[10px] font-coach mt-[2px]"
        style={{ color: isActive ? "rgba(200,255,0,0.5)" : GRAYS.g3 }}
      >
        {prediction.pacePerKm}
      </Text>
    </Pressable>
  );
}

export function PredictionCard({
  predictions = MOCK_PREDICTIONS,
  objective = "half",
}: PredictionCardProps) {
  const chartFont = useFont(Outfit_400Regular, 9);
  const [expandedDistance, setExpandedDistance] = useState<string | null>(null);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("3mo");

  const handleTilePress = (distance: string) => {
    setExpandedDistance((prev) => (prev === distance ? null : distance));
  };

  const expandedObjective = expandedDistance
    ? DISTANCE_TO_OBJECTIVE[expandedDistance]
    : null;

  const trendData = expandedObjective
    ? MOCK_PREDICTION_TRENDS[expandedObjective].map((t) => ({
        week: t.week,
        timeSeconds: t.timeSeconds,
      }))
    : [];

  return (
    <Animated.View
      layout={LinearTransition.duration(300)}
      className="p-[18px] rounded-[20px]"
      style={{ backgroundColor: "#1A1A1A" }}
    >
      {/* Header */}
      <View className="mb-3">
        <Text
          className="text-[11px] font-coach-semibold text-g3 uppercase"
          style={{ letterSpacing: 0.05 * 11 }}
        >
          Race Predictions
        </Text>
      </View>

      {/* 2x2 grid */}
      <View className="gap-2">
        <View className="flex-row gap-2">
          {predictions.slice(0, 2).map((pred) => (
            <PredictionTile
              key={pred.distance}
              prediction={pred}
              isActive={expandedDistance === pred.distance}
              onPress={() => handleTilePress(pred.distance)}
            />
          ))}
        </View>
        <View className="flex-row gap-2">
          {predictions.slice(2, 4).map((pred) => (
            <PredictionTile
              key={pred.distance}
              prediction={pred}
              isActive={expandedDistance === pred.distance}
              onPress={() => handleTilePress(pred.distance)}
            />
          ))}
        </View>
      </View>

      {/* Trend chart (inside the same card) */}
      {expandedDistance && expandedObjective && (
        <Animated.View
          key={expandedDistance}
          entering={FadeIn.duration(250)}
          exiting={FadeOut.duration(150)}
          className="mt-4 pt-4"
          style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" }}
        >
          <Text
            className="text-[11px] font-coach-semibold text-g3 uppercase mb-3"
            style={{ letterSpacing: 0.05 * 11 }}
          >
            {expandedDistance} Trend
          </Text>
          <PredictionTrendChart
            data={trendData}
            font={chartFont}
            color={COLORS.ora}
          />
        </Animated.View>
      )}

      {/* Time frame selector */}
      <View className="mt-4">
        <TimeFrameSelector selected={timeFrame} onSelect={setTimeFrame} />
      </View>
    </Animated.View>
  );
}

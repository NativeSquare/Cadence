/**
 * PredictionCard - Unified race prediction view
 *
 * Combines:
 * 1. Hero metric: current predicted time for the selected objective
 * 2. All distances: compact row of all predicted times
 * 3. Prediction trend: line chart showing how the prediction has evolved
 */

import { View } from "react-native";
import Animated, {
  Easing,
  FadeInUp,
} from "react-native-reanimated";
import { useFont } from "@shopify/react-native-skia";
import { Outfit_400Regular } from "@expo-google-fonts/outfit";
import { Text } from "@/components/ui/text";
import { COLORS, GRAYS } from "@/lib/design-tokens";
import { PredictionTrendChart } from "./LineChart";
import {
  MOCK_PREDICTIONS,
  MOCK_PREDICTION_TRENDS,
  type RacePrediction,
  type RaceObjective,
  type PredictionTrendPoint,
} from "./mock-data";

interface PredictionCardProps {
  vdot?: number;
  predictions?: RacePrediction[];
  objective?: RaceObjective;
  trendData?: PredictionTrendPoint[];
}

const OBJECTIVE_TO_DISTANCE: Record<RaceObjective, string> = {
  "5k": "5K",
  "10k": "10K",
  half: "Half Marathon",
  marathon: "Marathon",
};

function formatImprovement(data: PredictionTrendPoint[]): string | null {
  if (data.length < 2) return null;
  const diff = data[0].timeSeconds - data[data.length - 1].timeSeconds;
  if (diff <= 0) return null;
  const mins = Math.floor(diff / 60);
  const secs = diff % 60;
  if (mins > 0) return `-${mins}m ${secs}s`;
  return `-${secs}s`;
}

function CompactPredictionRow({
  prediction,
  isActive,
}: {
  prediction: RacePrediction;
  isActive: boolean;
}) {
  return (
    <View
      className="items-center py-2 px-1"
      style={{
        flex: 1,
        backgroundColor: isActive ? "rgba(200,255,0,0.06)" : "transparent",
        borderRadius: 8,
      }}
    >
      <Text
        className="text-[10px] font-coach-semibold"
        style={{
          color: isActive ? COLORS.lime : GRAYS.g3,
        }}
      >
        {prediction.distance}
      </Text>
      <Text
        className="text-[14px] font-coach-extrabold mt-[2px]"
        style={{ color: GRAYS.g1 }}
      >
        {prediction.timeFormatted}
      </Text>
      <Text className="text-[9px] font-coach text-g3">
        {prediction.pacePerKm}
      </Text>
    </View>
  );
}

export function PredictionCard({
  vdot = 45,
  predictions = MOCK_PREDICTIONS,
  objective = "half",
  trendData,
}: PredictionCardProps) {
  const chartFont = useFont(Outfit_400Regular, 9);

  const activeDist = OBJECTIVE_TO_DISTANCE[objective];
  const heroPrediction = predictions.find((p) => p.distance === activeDist);
  const trend = trendData ?? MOCK_PREDICTION_TRENDS[objective];
  const improvementText = formatImprovement(trend);

  const trendChartData = trend.map((t) => ({
    week: t.week,
    timeSeconds: t.timeSeconds,
  }));

  return (
    <View className="p-[18px] rounded-[20px]" style={{ backgroundColor: "#1A1A1A" }}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <Text
          className="text-[11px] font-coach-semibold text-g3 uppercase"
          style={{ letterSpacing: 0.05 * 11 }}
        >
          Race Predictions
        </Text>
        <View
          className="px-[10px] py-[5px] rounded-lg"
          style={{ backgroundColor: "rgba(255,255,255,0.10)" }}
        >
          <Text className="text-xs font-coach-medium text-g2">
            VDOT {vdot}
          </Text>
        </View>
      </View>

      {/* Hero prediction for selected objective */}
      {heroPrediction && (
        <Animated.View
          entering={FadeInUp.duration(400).easing(Easing.out(Easing.cubic))}
          className="mb-4"
        >
          <View className="flex-row items-baseline gap-2">
            <Text
              className="text-[32px] font-coach-extrabold"
              style={{ color: GRAYS.g1, letterSpacing: -1 }}
            >
              {heroPrediction.timeFormatted}
            </Text>
            <Text className="text-[13px] font-coach text-g3">
              {heroPrediction.pacePerKm}
            </Text>
          </View>
          <Text className="text-[11px] font-coach text-g3 mt-1">
            Predicted {heroPrediction.distance} time
          </Text>
        </Animated.View>
      )}

      {/* All distances compact row */}
      <View
        className="flex-row rounded-xl mb-4"
        style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
      >
        {predictions.map((pred) => (
          <CompactPredictionRow
            key={pred.distance}
            prediction={pred}
            isActive={pred.distance === activeDist}
          />
        ))}
      </View>

      {/* Prediction trend chart */}
      <View>
        <View className="flex-row items-center justify-between mb-2">
          <Text
            className="text-[10px] font-coach-semibold text-g3 uppercase"
            style={{ letterSpacing: 0.04 * 10 }}
          >
            {activeDist} Trend
          </Text>
          {improvementText && (
            <View
              className="px-[8px] py-[3px] rounded-md"
              style={{ backgroundColor: "rgba(168,217,0,0.1)" }}
            >
              <Text
                className="text-[10px] font-coach-semibold"
                style={{ color: "#6BBF00" }}
              >
                {improvementText}
              </Text>
            </View>
          )}
        </View>
        <PredictionTrendChart
          data={trendChartData}
          font={chartFont}
          color={COLORS.ora}
        />
      </View>
    </View>
  );
}

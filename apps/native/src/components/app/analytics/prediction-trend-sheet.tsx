/**
 * PredictionTrendSheet - Bottom sheet showing the race prediction trend chart
 *
 * Opened when tapping a prediction tile on the analytics screen.
 * Contains the trend line chart + time frame selector for the selected distance.
 */

import React, { useState } from "react";
import { View } from "react-native";
import { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";
import { useFont } from "@shopify/react-native-skia";
import { Outfit_400Regular } from "@expo-google-fonts/outfit";

import { BottomSheetModal } from "@/components/custom/bottom-sheet";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import {
  TimeFrameSelector,
  type TimeFrame,
} from "@/components/shared/time-frame-selector";
import { PredictionTrendChart } from "./LineChart";
import {
  MOCK_PREDICTION_TRENDS,
  type RaceObjective,
} from "./mock-data";

const DISTANCE_TO_OBJECTIVE: Record<string, RaceObjective> = {
  "5K": "5k",
  "10K": "10k",
  "Half Marathon": "half",
  Marathon: "marathon",
};

export interface PredictionTrendSheetProps {
  sheetRef: React.RefObject<GorhomBottomSheetModal | null>;
  distance: string | null;
}

export function PredictionTrendSheet({
  sheetRef,
  distance,
}: PredictionTrendSheetProps) {
  const chartFont = useFont(Outfit_400Regular, 9);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("3mo");

  const objective = distance ? DISTANCE_TO_OBJECTIVE[distance] : null;
  const trendData = objective
    ? MOCK_PREDICTION_TRENDS[objective].map((t) => ({
        week: t.week,
        timeSeconds: t.timeSeconds,
      }))
    : [];

  if (!distance || !objective) return null;

  return (
    <BottomSheetModal ref={sheetRef} backgroundColor={LIGHT_THEME.w1}>
      <View className="pt-2 pb-4">
        <Text
          className="text-[12px] font-coach-semibold text-wSub uppercase px-6"
          style={{ letterSpacing: 0.05 * 12 }}
        >
          {distance} Prediction Trend
        </Text>

        <View className="mt-4 pl-2 pr-4">
          <PredictionTrendChart
            data={trendData}
            font={chartFont}
            color={COLORS.ora}
          />
        </View>

        <View className="mt-4 px-6">
          <TimeFrameSelector
            selected={timeFrame}
            onSelect={setTimeFrame}
            variant="light"
          />
        </View>
      </View>
    </BottomSheetModal>
  );
}

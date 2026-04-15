"use no memo";
/**
 * PredictionCard - Race prediction tiles as individual cards
 *
 * Each distance gets its own card in a 2x2 grid, styled like health metrics.
 * Tapping a card opens a bottom sheet with the prediction trend chart.
 */

import { useWindowDimensions, Pressable, View } from "react-native";
import Animated, { Easing, FadeInUp } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import {
  MOCK_PREDICTIONS,
  type RacePrediction,
} from "./mock-data";

const CARD_SHADOW = {
  borderWidth: 1,
  borderColor: "rgba(0,0,0,0.08)",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 16,
  elevation: 4,
} as const;

const PARENT_PX = 20;
const COLUMN_GAP = 8;

interface PredictionCardProps {
  predictions?: RacePrediction[];
  onTileTap?: (distance: string) => void;
}

function PredictionTile({
  prediction,
  index,
  cardWidth,
  onPress,
}: {
  prediction: RacePrediction;
  index: number;
  cardWidth: number;
  onPress: () => void;
}) {
  return (
    <Animated.View
      entering={FadeInUp.delay(200 + index * 80)
        .duration(400)
        .easing(Easing.out(Easing.cubic))}
      className="rounded-2xl"
      style={{
        width: cardWidth,
        backgroundColor: LIGHT_THEME.w1,
        ...CARD_SHADOW,
      }}
    >
      <Pressable
        onPress={onPress}
        className="items-center rounded-2xl pt-3 px-4 pb-4"
        style={({ pressed }) => ({
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text
          className="text-[12px] font-coach-semibold"
          style={{ color: LIGHT_THEME.wSub }}
        >
          {prediction.distance}
        </Text>
        <Text
          className="text-[22px] font-coach-extrabold mt-1"
          style={{ color: LIGHT_THEME.wText }}
        >
          {prediction.timeFormatted}
        </Text>
        <Text
          className="text-[11px] font-coach mt-[2px]"
          style={{ color: LIGHT_THEME.wSub }}
        >
          {prediction.pacePerKm}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function PredictionCard({
  predictions = MOCK_PREDICTIONS,
  onTileTap,
}: PredictionCardProps) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.floor(
    (screenWidth - PARENT_PX * 2 - COLUMN_GAP) / 2
  );

  return (
    <View>
      <Text
        className="text-[12px] font-coach-semibold text-wSub uppercase mb-3"
        style={{ letterSpacing: 0.05 * 12 }}
      >
        Race Predictions
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {predictions.map((pred, index) => (
          <PredictionTile
            key={pred.distance}
            prediction={pred}
            index={index}
            cardWidth={cardWidth}
            onPress={() => onTileTap?.(pred.distance)}
          />
        ))}
      </View>
      <Text
        className="text-[11px] font-coach text-center mt-3"
        style={{ color: LIGHT_THEME.wSub }}
      >
        Tap a distance to view trend
      </Text>
    </View>
  );
}

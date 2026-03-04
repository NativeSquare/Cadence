import { View } from "react-native";
import Animated, {
  Easing,
  FadeInUp,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { MOCK_PREDICTIONS, type RacePrediction } from "./mock-data";

interface PredictionCardProps {
  vdot?: number;
  predictions?: RacePrediction[];
}

function PredictionRow({
  prediction,
  index,
  isTarget,
}: {
  prediction: RacePrediction;
  index: number;
  isTarget?: boolean;
}) {
  return (
    <Animated.View
      entering={FadeInUp.delay(200 + index * 100)
        .duration(400)
        .easing(Easing.out(Easing.cubic))}
      className="flex-row items-center py-3"
      style={{
        borderBottomWidth: index < 3 ? 1 : 0,
        borderBottomColor: LIGHT_THEME.wBrd,
      }}
    >
      <View className="flex-1">
        <Text
          className="text-sm font-coach-semibold"
          style={{
            color: isTarget ? COLORS.lime : LIGHT_THEME.wText,
          }}
        >
          {prediction.distance}
        </Text>
      </View>

      <View className="items-end">
        <Text
          className="text-lg font-coach-extrabold"
          style={{ color: LIGHT_THEME.wText }}
        >
          {prediction.timeFormatted}
        </Text>
        <Text className="text-[11px] font-coach text-wMute">
          {prediction.pacePerKm}
        </Text>
      </View>
    </Animated.View>
  );
}

export function PredictionCard({
  vdot = 45,
  predictions = MOCK_PREDICTIONS,
}: PredictionCardProps) {
  return (
    <View className="p-[18px] rounded-[20px] bg-w1 border border-wBrd">
      <View className="flex-row items-center justify-between mb-2">
        <Text
          className="text-[11px] font-coach-semibold text-wMute uppercase"
          style={{ letterSpacing: 0.05 * 11 }}
        >
          Race Predictions
        </Text>
        <View
          className="px-[10px] py-[5px] rounded-lg"
          style={{ backgroundColor: LIGHT_THEME.w3 }}
        >
          <Text className="text-xs font-coach-medium text-wSub">
            VDOT {vdot}
          </Text>
        </View>
      </View>

      {predictions.map((pred, i) => (
        <PredictionRow key={pred.distance} prediction={pred} index={i} />
      ))}
    </View>
  );
}

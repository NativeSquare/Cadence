import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import {
  RadarChart,
  RADAR_MOCK_DATA_PATH,
  type RadarDataPoint,
} from "@/components/app/onboarding/viz/RadarChart";

interface RunnerProfileCardProps {
  data?: RadarDataPoint[];
}

export function RunnerProfileCard({
  data = RADAR_MOCK_DATA_PATH,
}: RunnerProfileCardProps) {
  return (
    <View className="p-[18px] rounded-[20px] bg-w1 border border-wBrd">
      <Text
        className="text-[11px] font-coach-semibold text-wMute uppercase mb-2"
        style={{ letterSpacing: 0.05 * 11 }}
      >
        Runner Profile
      </Text>

      <View className="items-center py-2">
        <RadarChart data={data} size={260} animate />
      </View>

      <View className="flex-row justify-between mt-2">
        {data.slice(0, 3).map((point) => (
          <View key={point.label} className="items-center">
            <Text
              className="text-[20px] font-coach-extrabold"
              style={{
                color:
                  point.value >= 50
                    ? LIGHT_THEME.wText
                    : "#FF5A5A",
              }}
            >
              {point.value}
            </Text>
            <Text className="text-[9px] font-coach text-wMute uppercase">
              {point.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

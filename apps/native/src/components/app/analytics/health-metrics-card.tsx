"use no memo";
import { useWindowDimensions, View } from "react-native";
import Animated, { Easing, FadeInUp } from "react-native-reanimated";
import {
  HeartPulse,
  Activity,
  Moon,
  Scale,
  Flame,
  Droplets,
} from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import {
  MOCK_HEALTH_METRICS,
  HEALTH_METRIC_STYLES,
  type HealthMetric,
  type HealthMetricKey,
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

const METRIC_ICONS: Record<
  HealthMetricKey,
  React.ComponentType<{ size: number; color: string; strokeWidth?: number }>
> = {
  restingHr: HeartPulse,
  hrv: Activity,
  sleepScore: Moon,
  weight: Scale,
  calories: Flame,
  spo2: Droplets,
};

const PARENT_PX = 20;
const COLUMN_GAP = 8;

interface HealthMetricsCardProps {
  metrics?: HealthMetric[];
}

function MetricItem({
  metric,
  index,
  cardWidth,
}: {
  metric: HealthMetric;
  index: number;
  cardWidth: number;
}) {
  const metricStyle = HEALTH_METRIC_STYLES[metric.metricKey];
  const Icon = METRIC_ICONS[metric.metricKey];

  return (
    <Animated.View
      entering={FadeInUp.delay(200 + index * 80)
        .duration(400)
        .easing(Easing.out(Easing.cubic))}
      className="items-center pt-3 px-4 pb-4 rounded-2xl"
      style={{
        width: cardWidth,
        backgroundColor: LIGHT_THEME.w1,
        ...CARD_SHADOW,
      }}
    >
      <View className="flex-row items-center gap-2 mb-1.5">
        <View
          className="w-6 h-6 rounded-full items-center justify-center"
          style={{ backgroundColor: metricStyle.colorDim }}
        >
          <Icon size={13} color={metricStyle.color} strokeWidth={2.2} />
        </View>
        <Text
          className="text-[12px] font-coach-semibold"
          style={{ color: LIGHT_THEME.wSub }}
        >
          {metric.label}
        </Text>
      </View>

      <Text
        className="text-[22px] font-coach-extrabold mt-1"
        style={{ color: LIGHT_THEME.wText }}
      >
        {metric.value}
        {metric.unit ? ` ${metric.unit}` : ""}
      </Text>
    </Animated.View>
  );
}

export function HealthMetricsCard({
  metrics = MOCK_HEALTH_METRICS,
}: HealthMetricsCardProps) {
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
        Health Metrics
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {metrics.map((metric, index) => (
          <MetricItem
            key={metric.metricKey}
            metric={metric}
            index={index}
            cardWidth={cardWidth}
          />
        ))}
      </View>
    </View>
  );
}

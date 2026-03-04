import { View } from "react-native";
import Animated, { Easing, FadeInUp } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { COLORS, ACTIVITY_COLORS } from "@/lib/design-tokens";
import { MOCK_HEALTH_METRICS, type HealthMetric } from "./mock-data";

interface HealthMetricsCardProps {
  metrics?: HealthMetric[];
}

function MetricItem({
  metric,
  index,
}: {
  metric: HealthMetric;
  index: number;
}) {
  const trendColor =
    metric.trend === "improving"
      ? ACTIVITY_COLORS.barHigh
      : metric.trend === "declining"
        ? "#FF5A5A"
        : "rgba(255,255,255,0.4)";

  const trendIcon =
    metric.trend === "improving"
      ? "↓"
      : metric.trend === "declining"
        ? "↑"
        : "→";

  return (
    <Animated.View
      entering={FadeInUp.delay(200 + index * 80)
        .duration(400)
        .easing(Easing.out(Easing.cubic))}
      className="flex-1 p-3 rounded-2xl"
      style={{
        minWidth: "45%",
        backgroundColor: "#1A1A1A",
      }}
    >
      <Text
        className="text-[10px] font-coach-medium mb-1"
        style={{ color: "rgba(255,255,255,0.4)" }}
      >
        {metric.label}
      </Text>

      <View className="flex-row items-baseline gap-[2px]">
        <Text
          className="text-[24px] font-coach-extrabold"
          style={{ color: metric.dark ? COLORS.lime : "rgba(255,255,255,0.92)" }}
        >
          {metric.value}
        </Text>
        {metric.unit && (
          <Text
            className="text-[11px] font-coach"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            {metric.unit}
          </Text>
        )}
      </View>

      {metric.trend && (
        <Text
          className="text-[10px] font-coach mt-1"
          style={{ color: trendColor }}
        >
          {trendIcon} {metric.subtitle}
        </Text>
      )}
    </Animated.View>
  );
}

export function HealthMetricsCard({
  metrics = MOCK_HEALTH_METRICS,
}: HealthMetricsCardProps) {
  return (
    <View>
      <Text
        className="text-[11px] font-coach-semibold text-g3 uppercase mb-3"
        style={{ letterSpacing: 0.05 * 11 }}
      >
        Health Metrics
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {metrics.map((metric, index) => (
          <MetricItem key={metric.label} metric={metric} index={index} />
        ))}
      </View>
    </View>
  );
}

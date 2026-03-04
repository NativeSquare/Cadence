import { View } from "react-native";
import Animated, { Easing, FadeInUp } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME, ACTIVITY_COLORS } from "@/lib/design-tokens";
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
        : LIGHT_THEME.wMute;

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
        backgroundColor: metric.dark ? "#1A1A1A" : LIGHT_THEME.w1,
        borderWidth: metric.dark ? 0 : 1,
        borderColor: metric.dark ? "transparent" : LIGHT_THEME.wBrd,
      }}
    >
      <Text
        className="text-[10px] font-coach-medium mb-1"
        style={{
          color: metric.dark ? "rgba(255,255,255,0.4)" : LIGHT_THEME.wMute,
        }}
      >
        {metric.label}
      </Text>

      <View className="flex-row items-baseline gap-[2px]">
        <Text
          className="text-[24px] font-coach-extrabold"
          style={{
            color: metric.dark ? COLORS.lime : LIGHT_THEME.wText,
          }}
        >
          {metric.value}
        </Text>
        {metric.unit && (
          <Text
            className="text-[11px] font-coach"
            style={{
              color: metric.dark
                ? "rgba(255,255,255,0.35)"
                : LIGHT_THEME.wMute,
            }}
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
        className="text-[11px] font-coach-semibold text-wMute uppercase mb-3"
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

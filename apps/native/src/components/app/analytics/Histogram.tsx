/**
 * Histogram Component - Reusable bar chart with animations
 * Reference: cadence-full-v9.jsx lines 407-428
 *
 * Features:
 * - Takes data[], labels[], maxVal, accentIdx props
 * - Bar animation from 0 to value using reanimated
 * - Staggered delay per bar (60ms each)
 * - Accent bar styling for highlighted day
 * - Value labels above bars
 */

import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useEffect, useMemo } from "react";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";

export interface HistogramProps {
  /** Data values for each bar */
  data: number[];
  /** Labels for each bar (e.g., ["M", "T", "W", "T", "F", "S", "S"]) */
  labels: string[];
  /** Maximum value for scale (if not provided, uses max(data) * 1.2) */
  maxVal?: number;
  /** Index of the accent/highlighted bar (usually current day) */
  accentIdx?: number;
  /** Whether to animate on mount */
  animate?: boolean;
  /** Chart height (default: 100) */
  chartHeight?: number;
}

/** Individual bar component */
function HistogramBar({
  value,
  label,
  maxVal,
  isAccent,
  index,
  animate,
  chartHeight,
}: {
  value: number;
  label: string;
  maxVal: number;
  isAccent: boolean;
  index: number;
  animate: boolean;
  chartHeight: number;
}) {
  // Calculate bar height percentage
  const targetHeight = value > 0 ? Math.max(6, (value / maxVal) * 100) : 4;
  const barHeight = useSharedValue(animate ? 0 : targetHeight);

  useEffect(() => {
    if (animate) {
      barHeight.value = withDelay(
        500 + index * 60, // 500ms initial delay + 60ms per bar
        withTiming(targetHeight, {
          duration: 600,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        })
      );
    }
  }, [animate, index, targetHeight]);

  const barAnimatedStyle = useAnimatedStyle(() => ({
    height: (barHeight.value / 100) * chartHeight,
  }));

  const labelOpacity = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (animate && value > 0) {
      labelOpacity.value = withDelay(
        700 + index * 60, // Slightly after bar animation
        withTiming(1, { duration: 200 })
      );
    }
  }, [animate, index, value]);

  const labelAnimatedStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  // Determine bar color
  const barColor =
    value === 0
      ? LIGHT_THEME.w3
      : isAccent
        ? COLORS.lime
        : LIGHT_THEME.w3;

  return (
    <View className="flex-1 items-center gap-[6px]">
      {/* Bar container */}
      <View
        className="w-full items-center justify-end relative"
        style={{ height: chartHeight }}
      >
        {/* The bar */}
        <Animated.View
          className="w-full rounded-[6px]"
          style={[{ backgroundColor: barColor }, barAnimatedStyle]}
        />
        {/* Value label above bar (only if value > 0) */}
        {value > 0 && (
          <Animated.View
            className="absolute left-0 right-0 items-center"
            style={[{ bottom: chartHeight + 6 }, labelAnimatedStyle]}
          >
            <Text
              className="text-[10px] font-coach text-center"
              style={{
                fontWeight: isAccent ? "700" : "400",
                color: isAccent ? LIGHT_THEME.wText : LIGHT_THEME.wMute,
              }}
            >
              {value}
            </Text>
          </Animated.View>
        )}
      </View>
      {/* Day label */}
      <Text
        className="text-[10px] font-coach"
        style={{
          fontWeight: isAccent ? "700" : "400",
          color: isAccent ? LIGHT_THEME.wText : LIGHT_THEME.wMute,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

/**
 * Histogram main component
 */
export function Histogram({
  data,
  labels,
  maxVal,
  accentIdx,
  animate = true,
  chartHeight = 100,
}: HistogramProps) {
  // Calculate max value for scale
  const maxValue = useMemo(() => {
    return maxVal || Math.max(...data) * 1.2;
  }, [data, maxVal]);

  return (
    <View
      className="flex-row items-end gap-[6px] px-[2px]"
      style={{ height: chartHeight + 24 }} // Extra height for labels
    >
      {data.map((value, index) => (
        <HistogramBar
          key={index}
          value={value}
          label={labels[index]}
          maxVal={maxValue}
          isAccent={index === accentIdx}
          index={index}
          animate={animate}
          chartHeight={chartHeight}
        />
      ))}
    </View>
  );
}

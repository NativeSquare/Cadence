/**
 * StackedHistogram Component - Zone split stacked bar chart
 * Reference: cadence-full-v9.jsx lines 430-452
 *
 * Features:
 * - Takes data[] with z2/z3/z4 percentages
 * - Stacked bar segments with zone colors
 * - Legend integration (Z4-5, Z3, Z2)
 * - Zone colors: Z4-5=#A8D900, Z3=#7CB342, Z2=#5B9EFF
 */

import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useEffect } from "react";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME, ACTIVITY_COLORS } from "@/lib/design-tokens";

export interface ZoneData {
  z2: number; // Zone 2 percentage (0-100)
  z3: number; // Zone 3 percentage (0-100)
  z4: number; // Zone 4-5 percentage (0-100)
}

export interface StackedHistogramProps {
  /** Zone split data for each day */
  data: ZoneData[];
  /** Labels for each bar (e.g., ["M", "T", "W", "T", "F", "S", "S"]) */
  labels: string[];
  /** Index of the accent/highlighted bar (usually current day) */
  accentIdx?: number;
  /** Whether to animate on mount */
  animate?: boolean;
  /** Chart height (default: 90) */
  chartHeight?: number;
}

/** Individual stacked bar component */
function StackedBar({
  zoneData,
  label,
  isAccent,
  index,
  animate,
  chartHeight,
}: {
  zoneData: ZoneData;
  label: string;
  isAccent: boolean;
  index: number;
  animate: boolean;
  chartHeight: number;
}) {
  const total = zoneData.z2 + zoneData.z3 + zoneData.z4;
  const isEmpty = total === 0;

  // Animation values for each zone segment
  const z4Height = useSharedValue(animate ? 0 : (zoneData.z4 / 100) * chartHeight);
  const z3Height = useSharedValue(animate ? 0 : (zoneData.z3 / 100) * chartHeight);
  const z2Height = useSharedValue(animate ? 0 : (zoneData.z2 / 100) * chartHeight);

  useEffect(() => {
    if (animate && !isEmpty) {
      const baseDelay = 600 + index * 60;
      z4Height.value = withDelay(
        baseDelay,
        withTiming((zoneData.z4 / 100) * chartHeight, {
          duration: 600,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        })
      );
      z3Height.value = withDelay(
        baseDelay + 50,
        withTiming((zoneData.z3 / 100) * chartHeight, {
          duration: 600,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        })
      );
      z2Height.value = withDelay(
        baseDelay + 100,
        withTiming((zoneData.z2 / 100) * chartHeight, {
          duration: 600,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        })
      );
    }
  }, [animate, index, zoneData, chartHeight, isEmpty]);

  const z4Style = useAnimatedStyle(() => ({ height: z4Height.value }));
  const z3Style = useAnimatedStyle(() => ({ height: z3Height.value }));
  const z2Style = useAnimatedStyle(() => ({ height: z2Height.value }));

  // Colors based on accent state
  const z4Color = isAccent ? COLORS.lime : ACTIVITY_COLORS.barHigh;
  const z3Color = isAccent ? "rgba(200,255,0,0.5)" : ACTIVITY_COLORS.barEasy;
  const z2Color = isAccent ? "rgba(200,255,0,0.25)" : ACTIVITY_COLORS.barRest;

  return (
    <View className="flex-1 items-center gap-[6px]">
      {/* Stacked bar container */}
      <View
        className="w-full justify-end gap-[1.5px]"
        style={{ height: chartHeight }}
      >
        {isEmpty ? (
          // Empty/rest day indicator
          <View
            className="w-full h-1 rounded-[6px]"
            style={{ backgroundColor: LIGHT_THEME.w3 }}
          />
        ) : (
          <>
            {/* Z4-5 segment (top) */}
            <Animated.View
              className="w-full"
              style={[
                {
                  backgroundColor: z4Color,
                  opacity: isAccent ? 1 : 0.6,
                  borderTopLeftRadius: 6,
                  borderTopRightRadius: 6,
                },
                z4Style,
              ]}
            />
            {/* Z3 segment (middle) */}
            <Animated.View
              className="w-full"
              style={[
                {
                  backgroundColor: z3Color,
                  opacity: isAccent ? 1 : 0.5,
                },
                z3Style,
              ]}
            />
            {/* Z2 segment (bottom) */}
            <Animated.View
              className="w-full"
              style={[
                {
                  backgroundColor: z2Color,
                  opacity: isAccent ? 1 : 0.4,
                  borderBottomLeftRadius: 6,
                  borderBottomRightRadius: 6,
                },
                z2Style,
              ]}
            />
          </>
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

/** Zone legend item */
function ZoneLegendItem({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
  return (
    <View className="flex-row items-center gap-[3px]">
      <View
        className="w-[6px] h-[6px] rounded-sm"
        style={{ backgroundColor: color }}
      />
      <Text className="text-[9px] font-coach text-wMute">{label}</Text>
    </View>
  );
}

/**
 * StackedHistogram main component
 */
export function StackedHistogram({
  data,
  labels,
  accentIdx,
  animate = true,
  chartHeight = 90,
}: StackedHistogramProps) {
  return (
    <View>
      {/* Bars */}
      <View
        className="flex-row items-end gap-[6px] px-[2px]"
        style={{ height: chartHeight + 24 }}
      >
        {data.map((zoneData, index) => (
          <StackedBar
            key={index}
            zoneData={zoneData}
            label={labels[index]}
            isAccent={index === accentIdx}
            index={index}
            animate={animate}
            chartHeight={chartHeight}
          />
        ))}
      </View>
    </View>
  );
}

/** Zone legend row - exported separately for flexible placement */
export function ZoneLegend() {
  return (
    <View className="flex-row gap-2">
      <ZoneLegendItem label="Z4-5" color={ACTIVITY_COLORS.barHigh} />
      <ZoneLegendItem label="Z3" color={ACTIVITY_COLORS.barEasy} />
      <ZoneLegendItem label="Z2" color={ACTIVITY_COLORS.barRest} />
    </View>
  );
}

/**
 * PlanProgress Component - 10-week plan progress visualization
 * Reference: cadence-full-v9.jsx lines 497-518
 *
 * Features:
 * - 10 progress segments with phase colors (Build/Peak/Taper/Race)
 * - Current week indicator with dot marker
 * - Week numbers below each segment
 * - Phase legend row
 */

import { memo, useEffect } from "react";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME, COLORS } from "@/lib/design-tokens";
import { PLAN_PROGRESS, PHASE_COLORS, type PlanWeek } from "./mock-data";

interface PlanProgressProps {
  data?: PlanWeek[];
}

const PHASE_LEGEND = [
  { label: "Build", color: PHASE_COLORS.build },
  { label: "Peak", color: PHASE_COLORS.peak },
  { label: "Taper", color: PHASE_COLORS.taper },
  { label: "Race", color: PHASE_COLORS.race },
] as const;

const ProgressSegment = memo(function ProgressSegment({
  week,
  index,
}: {
  week: PlanWeek;
  index: number;
}) {
  const progress = useSharedValue(0);
  const phaseColor = PHASE_COLORS[week.phase];

  useEffect(() => {
    progress.value = withDelay(
      index * 60,
      withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      })
    );

    return () => {
      cancelAnimation(progress);
    };
  }, []);

  const barAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
    opacity: week.completed ? 1 : 0.4,
  }));

  return (
    <View className="flex-1 items-center gap-1">
      <View className="w-full h-[6px] relative">
        <View
          className="absolute inset-0 rounded-[3px]"
          style={{ backgroundColor: LIGHT_THEME.w3 }}
        />
        {week.completed && (
          <Animated.View
            className="absolute inset-0 rounded-[3px]"
            style={[
              { backgroundColor: phaseColor, transformOrigin: "left" },
              barAnimatedStyle,
            ]}
          />
        )}
        {week.current && (
          <View
            className="absolute -top-[3px] -right-[1px] w-3 h-3 rounded-full"
            style={{
              backgroundColor: COLORS.lime,
              borderWidth: 3,
              borderColor: LIGHT_THEME.w1,
            }}
          />
        )}
      </View>
      <Text
        className="text-[9px] font-coach"
        style={{
          fontWeight: week.current ? "700" : "400",
          color: week.current ? LIGHT_THEME.wText : LIGHT_THEME.wMute,
        }}
      >
        {week.week}
      </Text>
    </View>
  );
});

function LegendItem({ label, color }: { label: string; color: string }) {
  return (
    <View className="flex-row items-center gap-1">
      <View
        className="w-2 h-1 rounded-sm"
        style={{ backgroundColor: color }}
      />
      <Text className="text-[10px] font-coach text-wMute">{label}</Text>
    </View>
  );
}

export function PlanProgress({ data = PLAN_PROGRESS }: PlanProgressProps) {
  return (
    <View className="p-[18px] rounded-[20px] bg-w1 border border-wBrd">
      <Text
        className="text-[11px] font-coach-semibold text-wMute uppercase mb-3"
        style={{ letterSpacing: 0.05 * 11 }}
      >
        Plan Progress
      </Text>

      <View className="flex-row gap-[3px] mb-3">
        {data.map((week, index) => (
          <ProgressSegment
            key={week.week}
            week={week}
            index={index}
          />
        ))}
      </View>

      <View className="flex-row gap-3">
        {PHASE_LEGEND.map((phase) => (
          <LegendItem key={phase.label} label={phase.label} color={phase.color} />
        ))}
      </View>
    </View>
  );
}

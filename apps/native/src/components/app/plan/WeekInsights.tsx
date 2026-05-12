/**
 * WeekInsights - "This Week" section for the Plan tab
 *
 * Two stacked insight cards:
 * - Volume: weekly km + time progress with animated bar
 * - Workouts: completed vs total training workouts with check indicators
 */

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { Check } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { COLORS } from "@/lib/design-tokens";
import type { WorkoutData } from "./types";

const CARD_SHADOW = {
  borderWidth: 1,
  borderColor: "rgba(0,0,0,0.12)",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 16,
  elevation: 4,
} as const;

// ─── Volume Card ──────────────────────────────────────────────────────────────

function VolumeInsight({
  completed,
  planned,
  timeCompleted,
}: {
  completed: number;
  planned: number;
  timeCompleted: string;
}) {
  const { t } = useTranslation();
  const targetPercent = planned > 0 ? Math.min((completed / planned) * 100, 100) : 0;
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withDelay(
      200,
      withTiming(targetPercent, {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      })
    );
    return () => cancelAnimation(progressWidth);
  }, []);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <View
      className="px-5 py-4 rounded-2xl bg-w1"
      style={CARD_SHADOW}
    >
      <Text
        className="text-[11px] font-coach-semibold text-wSub mb-1.5 uppercase"
        style={{ letterSpacing: 0.05 * 11 }}
      >
        {t("plan.weekInsights.volume")}
      </Text>

      <View className="flex-row items-baseline gap-1">
        <Text className="text-[28px] font-coach-extrabold text-wText">
          {completed}
        </Text>
        <Text className="text-[12px] font-coach text-wSub">
          {t("plan.weekInsights.kmSuffix", { planned })}
        </Text>
      </View>

      <View className="h-1.5 rounded-sm mt-2.5 overflow-hidden bg-w3">
        <Animated.View
          className="h-full rounded-sm"
          style={[{ backgroundColor: COLORS.lime }, progressBarStyle]}
        />
      </View>

      <Text className="text-[13px] font-coach-medium text-wSub mt-2">
        {t("plan.weekInsights.ranSuffix", { time: timeCompleted })}
      </Text>
    </View>
  );
}

// ─── Workouts Card ────────────────────────────────────────────────────────────

function WorkoutCheckDot({ done }: { done: boolean }) {
  return (
    <View
      className="w-[18px] h-[18px] rounded-full items-center justify-center"
      style={{
        backgroundColor: done ? COLORS.lime : "transparent",
        borderWidth: done ? 0 : 1.5,
        borderColor: done ? undefined : "rgba(0,0,0,0.12)",
      }}
    >
      {done && <Check size={11} strokeWidth={3} color="#1A1A1A" />}
    </View>
  );
}

function WorkoutsInsight({ workouts }: { workouts: WorkoutData[] }) {
  const { t } = useTranslation();
  const trainingWorkouts = workouts.filter((w) => w.intensity !== "rest");
  const completed = trainingWorkouts.filter((w) => w.done).length;

  return (
    <View
      className="px-5 py-4 rounded-2xl bg-w1"
      style={CARD_SHADOW}
    >
      <Text
        className="text-[11px] font-coach-semibold text-wSub mb-1.5 uppercase"
        style={{ letterSpacing: 0.05 * 11 }}
      >
        {t("plan.weekInsights.workouts")}
      </Text>

      <View className="flex-row items-baseline gap-1">
        <Text className="text-[28px] font-coach-extrabold text-wText">
          {completed}
        </Text>
        <Text className="text-[14px] font-coach-medium text-wMute">
          /{trainingWorkouts.length} {t("plan.weekInsights.done")}
        </Text>
      </View>

      <View className="flex-row gap-1.5 mt-2.5">
        {trainingWorkouts.map((workout, i) => (
          <WorkoutCheckDot key={i} done={workout.done} />
        ))}
      </View>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface WeekInsightsProps {
  volumeCompleted: number;
  volumePlanned: number;
  timeCompleted: string;
  workouts: WorkoutData[];
}

export function WeekInsights({
  volumeCompleted,
  volumePlanned,
  timeCompleted,
  workouts,
}: WeekInsightsProps) {
  const { t } = useTranslation();
  return (
    <View>
      <Text
        className="text-[11px] font-coach-semibold text-wSub px-1 mb-2 uppercase"
        style={{ letterSpacing: 0.05 * 11 }}
      >
        {t("plan.weekInsights.thisWeek")}
      </Text>

      <VolumeInsight
        completed={volumeCompleted}
        planned={volumePlanned}
        timeCompleted={timeCompleted}
      />

      <View className="mt-2.5">
        <WorkoutsInsight workouts={workouts} />
      </View>
    </View>
  );
}

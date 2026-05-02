/**
 * WeekInsights - "This Week" section for the Plan tab
 *
 * Three side-by-side insight cards:
 * - Volume: weekly km + time progress with animated bar
 * - Sessions: completed vs total training sessions with check indicators
 * - Streak: consecutive training days with flame icon
 */

import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { Gauge, Check } from "lucide-react-native";
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
        Volume
      </Text>

      <View className="flex-row items-baseline gap-1">
        <Text className="text-[28px] font-coach-extrabold text-wText">
          {completed}
        </Text>
        <Text className="text-[12px] font-coach text-wSub">
          / {planned} km
        </Text>
      </View>

      <View className="h-1.5 rounded-sm mt-2.5 overflow-hidden bg-w3">
        <Animated.View
          className="h-full rounded-sm"
          style={[{ backgroundColor: COLORS.lime }, progressBarStyle]}
        />
      </View>

      <Text className="text-[13px] font-coach-medium text-wSub mt-2">
        {timeCompleted} ran
      </Text>
    </View>
  );
}

// ─── Sessions Card ────────────────────────────────────────────────────────────

function SessionCheckDot({ done }: { done: boolean }) {
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

function SessionsInsight({ sessions }: { sessions: WorkoutData[] }) {
  const trainingSessions = sessions.filter((s) => s.intensity !== "rest");
  const completed = trainingSessions.filter((s) => s.done).length;

  return (
    <View
      className="flex-1 py-4 rounded-2xl items-center justify-between bg-w1"
      style={CARD_SHADOW}
    >
      <Text
        className="text-[11px] font-coach-semibold text-wSub uppercase"
        style={{ letterSpacing: 0.05 * 11 }}
      >
        Sessions
      </Text>

      <View className="items-center mt-2">
        <View className="flex-row items-baseline">
          <Text className="text-[28px] font-coach-extrabold leading-none text-wText">
            {completed}
          </Text>
          <Text className="text-[14px] font-coach-medium text-wMute">
            /{trainingSessions.length}
          </Text>
        </View>
        <Text className="text-[11px] font-coach-medium text-wSub mt-0.5">
          done
        </Text>
      </View>

      <View className="flex-row gap-1.5 mt-2.5">
        {trainingSessions.map((session, i) => (
          <SessionCheckDot key={i} done={session.done} />
        ))}
      </View>
    </View>
  );
}

// ─── Avg Pace Card ────────────────────────────────────────────────────────────

function AvgPaceInsight({ avgPace }: { avgPace: string }) {
  const numberOpacity = useSharedValue(0);
  const numberTranslateY = useSharedValue(8);

  useEffect(() => {
    numberOpacity.value = withDelay(
      200,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) })
    );
    numberTranslateY.value = withDelay(
      200,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) })
    );
    return () => {
      cancelAnimation(numberOpacity);
      cancelAnimation(numberTranslateY);
    };
  }, []);

  const numberStyle = useAnimatedStyle(() => ({
    opacity: numberOpacity.value,
    transform: [{ translateY: numberTranslateY.value }],
  }));

  return (
    <View
      className="flex-1 py-4 rounded-2xl items-center justify-center bg-wText"
      style={CARD_SHADOW}
    >
      <Gauge size={16} color={COLORS.lime} />

      <Animated.View style={numberStyle} className="mt-1">
        <Text
          className="text-[28px] font-coach-extrabold leading-none"
          style={{ color: COLORS.lime }}
        >
          {avgPace}
        </Text>
      </Animated.View>

      <Text
        className="text-[10px] font-coach-medium mt-1 uppercase"
        style={{ color: "rgba(255,255,255,0.5)", letterSpacing: 0.05 * 10 }}
      >
        /km avg
      </Text>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface WeekInsightsProps {
  volumeCompleted: number;
  volumePlanned: number;
  timeCompleted: string;
  avgPace: string;
  sessions: WorkoutData[];
}

export function WeekInsights({
  volumeCompleted,
  volumePlanned,
  timeCompleted,
  avgPace,
  sessions,
}: WeekInsightsProps) {
  return (
    <View>
      <Text
        className="text-[11px] font-coach-semibold text-wSub px-1 mb-2 uppercase"
        style={{ letterSpacing: 0.05 * 11 }}
      >
        This Week
      </Text>

      <VolumeInsight
        completed={volumeCompleted}
        planned={volumePlanned}
        timeCompleted={timeCompleted}
      />

      <View className="flex-row gap-2.5 mt-2.5">
        <SessionsInsight sessions={sessions} />
        <AvgPaceInsight avgPace={avgPace} />
      </View>
    </View>
  );
}

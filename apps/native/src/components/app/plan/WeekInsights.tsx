/**
 * WeekInsights - "This Week" section for the Plan tab
 *
 * Two side-by-side insight cards:
 * - Volume: weekly km + time progress with animated bar
 * - Streak & Sessions: consecutive training days with session-type-colored dots
 */

import { memo, useEffect } from "react";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import {
  COLORS,
  LIGHT_THEME,
  SESSION_TYPE_COLORS,
  SESSION_TYPE_COLORS_DIM,
  getSessionCategory,
} from "@/lib/design-tokens";
import type { SessionData } from "./types";

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
  const targetPercent = Math.min((completed / planned) * 100, 100);
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
      className="flex-1 px-5 py-4 rounded-2xl bg-w1"
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

// ─── Streak & Sessions Card ──────────────────────────────────────────────────

const ActivityDot = memo(function ActivityDot({
  active,
  index,
}: {
  active: boolean;
  index: number;
}) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      400 + index * 50,
      withSequence(
        withTiming(1.3, { duration: 100 }),
        withTiming(1, { duration: 150 })
      )
    );
    return () => cancelAnimation(scale);
  }, []);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      className="w-[5px] h-[5px] rounded-full"
      style={[
        {
          backgroundColor: active
            ? LIGHT_THEME.wText
            : LIGHT_THEME.wBrd,
        },
        dotStyle,
      ]}
    />
  );
});

function SessionDot({
  session,
  index,
}: {
  session: SessionData;
  index: number;
}) {
  const scale = useSharedValue(0);
  const category = getSessionCategory(session.type);
  const color = session.done
    ? SESSION_TYPE_COLORS[category]
    : SESSION_TYPE_COLORS_DIM[category];

  useEffect(() => {
    scale.value = withDelay(
      500 + index * 60,
      withSequence(
        withTiming(1.2, { duration: 100 }),
        withTiming(1, { duration: 150 })
      )
    );
    return () => cancelAnimation(scale);
  }, []);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      className="w-[10px] h-[10px] rounded-full"
      style={[{ backgroundColor: color }, dotStyle]}
    />
  );
}

function StreakSessionsInsight({
  streak,
  streakDays,
  sessions,
}: {
  streak: number;
  streakDays: boolean[];
  sessions: SessionData[];
}) {
  const numberOpacity = useSharedValue(0);
  const numberTranslateY = useSharedValue(8);

  const trainingSessions = sessions.filter((s) => s.intensity !== "rest");
  const completed = trainingSessions.filter((s) => s.done).length;

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
      className="w-[110px] py-4 rounded-2xl items-center justify-between bg-w1"
      style={CARD_SHADOW}
    >
      {/* Streak */}
      <View className="items-center">
        <Animated.View style={numberStyle}>
          <Text className="text-[32px] font-coach-extrabold leading-none text-wText">
            {streak}
          </Text>
        </Animated.View>
        <Text
          className="text-[10px] font-coach-medium mt-1 text-wSub uppercase"
          style={{ letterSpacing: 0.05 * 10 }}
        >
          day streak
        </Text>
        <View className="flex-row gap-[3px] mt-1.5">
          {streakDays.map((active, index) => (
            <ActivityDot key={index} active={active} index={index} />
          ))}
        </View>
      </View>

      {/* Divider */}
      <View className="w-10 h-px bg-wBrd my-2.5" />

      {/* Sessions */}
      <View className="items-center">
        <View className="flex-row gap-2 mb-1.5">
          {trainingSessions.map((session, i) => (
            <SessionDot key={i} session={session} index={i} />
          ))}
        </View>
        <Text className="text-[11px] font-coach-medium text-wSub">
          {completed}/{trainingSessions.length} sessions
        </Text>
      </View>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface WeekInsightsProps {
  volumeCompleted: number;
  volumePlanned: number;
  timeCompleted: string;
  streak: number;
  streakDays: boolean[];
  sessions: SessionData[];
}

export function WeekInsights({
  volumeCompleted,
  volumePlanned,
  timeCompleted,
  streak,
  streakDays,
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

      <View className="flex-row gap-2.5">
        <VolumeInsight
          completed={volumeCompleted}
          planned={volumePlanned}
          timeCompleted={timeCompleted}
        />
        <StreakSessionsInsight
          streak={streak}
          streakDays={streakDays}
          sessions={sessions}
        />
      </View>
    </View>
  );
}

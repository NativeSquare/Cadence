/**
 * RaceCountdown - Primary race progression card for the Plan tab.
 *
 * Shows at-a-glance info about the user's primary race:
 * - Race name and date
 * - Days remaining countdown
 * - Training plan progress (week X of Y) with animated bar
 * - Current phase badge
 * - Optional target time
 */

import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { Text } from "@/components/ui/text";
import { WORKOUT_CATEGORY_COLORS } from "@/lib/design-tokens";
import type { RaceGoalData } from "./types";

interface RaceCountdownProps {
  race: RaceGoalData;
}

const RACE_ACCENT = WORKOUT_CATEGORY_COLORS.race;

function daysUntil(timestamp: number): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(timestamp);
  target.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

function formatRaceDate(timestamp: number): string {
  const d = new Date(timestamp);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

function FlagIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"
        stroke={RACE_ACCENT}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 22V15"
        stroke={RACE_ACCENT}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const targetPercent = Math.min((current / total) * 100, 100);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withDelay(
      300,
      withTiming(targetPercent, {
        duration: 900,
        easing: Easing.out(Easing.cubic),
      })
    );
    return () => cancelAnimation(progressWidth);
  }, []);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <View className="h-[5px] rounded-full mt-3 overflow-hidden bg-w3">
      <Animated.View
        className="h-full rounded-full"
        style={[{ backgroundColor: RACE_ACCENT }, barStyle]}
      />
    </View>
  );
}

export function RaceCountdown({ race }: RaceCountdownProps) {
  const days = daysUntil(race.raceDate);
  const dateLabel = formatRaceDate(race.raceDate);
  const progressPercent = Math.round((race.currentWeek / race.totalWeeks) * 100);

  return (
    <View>
      <Text
        className="text-[11px] font-coach-semibold text-wSub px-1 mb-2 uppercase"
        style={{ letterSpacing: 0.05 * 11 }}
      >
        Your Race
      </Text>

      <View
        className="rounded-2xl overflow-hidden bg-w1"
        style={{
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.10)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 3,
        }}
      >
        {/* Header row: flag + race name + date */}
        <View className="px-4 pt-4 pb-3">
          <View className="flex-row items-center gap-2 mb-1">
            <FlagIcon />
            <Text
              className="text-[10px] font-coach-semibold uppercase"
              style={{ color: RACE_ACCENT, letterSpacing: 0.05 * 10 }}
            >
              {race.raceDistance}
            </Text>
          </View>
          <Text
            className="text-[22px] font-coach-bold text-wText"
            style={{ letterSpacing: -0.02 * 22, lineHeight: 26 }}
          >
            {race.raceName}
          </Text>
          <Text className="text-[13px] font-coach-medium text-wSub mt-0.5">
            {dateLabel}
          </Text>
        </View>

        {/* Stats row: days left + week / phase */}
        <View className="flex-row px-4 pb-3 gap-6">
          {/* Days countdown */}
          <View>
            <View className="flex-row items-baseline gap-1">
              <Text
                className="text-[34px] font-coach-extrabold text-wText"
                style={{ lineHeight: 38 }}
              >
                {days}
              </Text>
              <Text className="text-[12px] font-coach-medium text-wSub">
                days
              </Text>
            </View>
          </View>

          {/* Separator */}
          <View
            className="w-px self-stretch my-1"
            style={{ backgroundColor: "rgba(0,0,0,0.10)" }}
          />

          {/* Week progress + phase */}
          <View className="flex-1 justify-center">
            <View className="flex-row items-baseline gap-1">
              <Text className="text-[16px] font-coach-bold text-wText">
                Week {race.currentWeek}
              </Text>
              <Text className="text-[12px] font-coach text-wSub">
                of {race.totalWeeks}
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5 mt-0.5">
              <View
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: RACE_ACCENT }}
              />
              <Text className="text-[12px] font-coach-medium text-wText">
                {race.phase} phase
              </Text>
            </View>
          </View>
        </View>

        {/* Progress bar + target */}
        <View className="px-4 pb-4">
          <ProgressBar current={race.currentWeek} total={race.totalWeeks} />

          <View className="flex-row items-center justify-between mt-2">
            <Text className="text-[10px] font-coach-medium text-wSub">
              {progressPercent}% complete
            </Text>
            {race.targetTime && (
              <Text className="text-[10px] font-coach-medium text-wSub">
                Goal{" "}
                <Text className="text-[10px] font-coach-semibold text-wText">
                  {race.targetTime}
                </Text>
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

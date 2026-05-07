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
import { useTranslation } from "react-i18next";
import { View, Pressable } from "react-native";
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
import { LIGHT_THEME, WORKOUT_CATEGORY_COLORS } from "@/lib/design-tokens";
import { formatShortDate } from "@/lib/format";
import { useLanguage } from "@/lib/i18n";
import type { RaceGoalData } from "./types";

interface RaceCountdownProps {
  race: RaceGoalData;
}

interface EmptyRaceCardProps {
  onAddPress: () => void;
}

const RACE_ACCENT = WORKOUT_CATEGORY_COLORS.race;

function daysUntil(timestamp: number): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(timestamp);
  target.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

function FlagIcon({ size = 14, color = RACE_ACCENT }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 22V15"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlusIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5V19M5 12H19"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
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

export function EmptyRaceCard({ onAddPress }: EmptyRaceCardProps) {
  const { t } = useTranslation();
  return (
    <View>
      <Text
        className="text-[11px] font-coach-semibold text-wSub px-1 mb-2 uppercase"
        style={{ letterSpacing: 0.05 * 11 }}
      >
        {t("plan.yourRace")}
      </Text>

      <Pressable
        onPress={onAddPress}
        className="rounded-2xl overflow-hidden bg-w1 active:opacity-90"
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
        <View className="px-4 pt-4 pb-4">
          <View className="flex-row items-center gap-2 mb-1.5">
            <FlagIcon />
            <Text
              className="text-[10px] font-coach-semibold uppercase"
              style={{ color: RACE_ACCENT, letterSpacing: 0.05 * 10 }}
            >
              {t("plan.noGoalYet")}
            </Text>
          </View>
          <Text
            className="text-[18px] font-coach-bold text-wText"
            style={{ letterSpacing: -0.02 * 18, lineHeight: 24 }}
          >
            {t("plan.setYourARace")}
          </Text>
          <Text
            className="text-[13px] font-coach-medium text-wSub mt-1"
            style={{ lineHeight: 18 }}
          >
            {t("plan.setYourARaceHelper")}
          </Text>

          <View
            className="mt-3 flex-row items-center gap-2 self-start rounded-full px-4 py-2.5"
            style={{ backgroundColor: LIGHT_THEME.wText }}
          >
            <PlusIcon color="#FFFFFF" />
            <Text
              className="font-coach-bold text-[13px]"
              style={{ color: "#FFFFFF" }}
            >
              {t("plan.addRace")}
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

export function RaceCountdown({ race }: RaceCountdownProps) {
  const { t } = useTranslation();
  const locale = useLanguage();
  const days = daysUntil(race.raceDate);
  const dateLabel = formatShortDate(locale, new Date(race.raceDate));
  const hasPlanProgress =
    race.currentWeek != null && race.totalWeeks != null && race.totalWeeks > 0;
  const progressPercent = hasPlanProgress
    ? Math.round((race.currentWeek! / race.totalWeeks!) * 100)
    : 0;

  return (
    <View>
      <Text
        className="text-[11px] font-coach-semibold text-wSub px-1 mb-2 uppercase"
        style={{ letterSpacing: 0.05 * 11 }}
      >
        {t("plan.yourRace")}
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

        {/* Stats row: days left + (optional) week / phase */}
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
                {t("plan.days")}
              </Text>
            </View>
          </View>

          {hasPlanProgress && (
            <>
              {/* Separator */}
              <View
                className="w-px self-stretch my-1"
                style={{ backgroundColor: "rgba(0,0,0,0.10)" }}
              />

              {/* Week progress + phase */}
              <View className="flex-1 justify-center">
                <View className="flex-row items-baseline gap-1">
                  <Text className="text-[16px] font-coach-bold text-wText">
                    {t("plan.weekOfCurrent", { current: race.currentWeek })}
                  </Text>
                  <Text className="text-[12px] font-coach text-wSub">
                    {t("plan.weekOfTotal", { total: race.totalWeeks })}
                  </Text>
                </View>
                {race.phase && (
                  <View className="flex-row items-center gap-1.5 mt-0.5">
                    <View
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: RACE_ACCENT }}
                    />
                    <Text className="text-[12px] font-coach-medium text-wText">
                      {t("plan.phaseSuffix", { phase: race.phase })}
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>

        {/* Progress bar + target (hidden when neither is available) */}
        {(hasPlanProgress || race.targetTime) && (
          <View className="px-4 pb-4">
            {hasPlanProgress && (
              <ProgressBar current={race.currentWeek!} total={race.totalWeeks!} />
            )}

            <View
              className={`flex-row items-center justify-between ${hasPlanProgress ? "mt-2" : ""}`}
            >
              {hasPlanProgress ? (
                <Text className="text-[10px] font-coach-medium text-wSub">
                  {t("plan.percentComplete", { percent: progressPercent })}
                </Text>
              ) : (
                <View />
              )}
              {race.targetTime && (
                <Text className="text-[10px] font-coach-medium text-wSub">
                  {t("plan.goalLabel")}{" "}
                  <Text className="text-[10px] font-coach-semibold text-wText">
                    {race.targetTime}
                  </Text>
                </Text>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

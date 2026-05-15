import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

// 0=Mon … 6=Sun (ISO 8601). Mirrors Agoge's `availableDays` convention.
export const DAY_KEYS = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;

export type ScheduleValue = {
  availableDays: number[];
  sessionsPerWeek: number;
};

export const EMPTY_SCHEDULE: ScheduleValue = {
  availableDays: [1, 2, 3, 5],
  sessionsPerWeek: 4,
};

export function isScheduleValid(s: ScheduleValue): boolean {
  return (
    s.availableDays.length >= 2 &&
    s.sessionsPerWeek >= 1 &&
    s.sessionsPerWeek <= s.availableDays.length
  );
}

/**
 * Reusable day-chips + sessions-per-week stepper. Used in onboarding
 * and in the Account → Profile edit screen.
 */
export function ScheduleFields({
  value,
  onChange,
}: {
  value: ScheduleValue;
  onChange: (next: ScheduleValue) => void;
}) {
  const { t } = useTranslation();

  const toggleDay = (day: number) => {
    selectionFeedback();
    const isSelected = value.availableDays.includes(day);
    const nextDays = isSelected
      ? value.availableDays.filter((d) => d !== day)
      : [...value.availableDays, day].sort((a, b) => a - b);
    // Cap sessions at the new available count so the user can't strand themselves.
    const nextSessions = Math.min(value.sessionsPerWeek, nextDays.length || 1);
    onChange({ availableDays: nextDays, sessionsPerWeek: nextSessions });
  };

  const setSessions = (n: number) => {
    selectionFeedback();
    const capped = Math.max(1, Math.min(n, value.availableDays.length || 7));
    onChange({ ...value, sessionsPerWeek: capped });
  };

  const dayCount = value.availableDays.length;
  const canIncrement = value.sessionsPerWeek < dayCount;
  const canDecrement = value.sessionsPerWeek > 1;

  return (
    <View className="gap-6">
      <View className="gap-3">
        <Text
          className="font-coach-bold text-[13px]"
          style={{ color: LIGHT_THEME.wSub }}
        >
          {t("onboarding.schedule.daysLabel")}
        </Text>
        <View className="flex-row gap-2">
          {DAY_KEYS.map((key, idx) => {
            const selected = value.availableDays.includes(idx);
            return (
              <Pressable
                key={key}
                onPress={() => toggleDay(idx)}
                className="flex-1 items-center rounded-2xl py-3 active:opacity-80"
                style={{
                  backgroundColor: selected ? COLORS.lime : LIGHT_THEME.w1,
                  borderWidth: 1,
                  borderColor: selected ? COLORS.lime : LIGHT_THEME.wBrd,
                }}
              >
                <Text
                  className="font-coach-extrabold text-[12px]"
                  style={{
                    color: selected ? COLORS.black : LIGHT_THEME.wText,
                  }}
                >
                  {t(`onboarding.schedule.days.${key}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="gap-3">
        <Text
          className="font-coach-bold text-[13px]"
          style={{ color: LIGHT_THEME.wSub }}
        >
          {t("onboarding.schedule.sessionsLabel")}
        </Text>
        <View
          className="flex-row items-center justify-between rounded-2xl px-4 py-3"
          style={{
            backgroundColor: LIGHT_THEME.w1,
            borderWidth: 1,
            borderColor: LIGHT_THEME.wBrd,
          }}
        >
          <Pressable
            onPress={() => setSessions(value.sessionsPerWeek - 1)}
            disabled={!canDecrement}
            className="h-9 w-9 items-center justify-center rounded-full active:opacity-70"
            style={{
              backgroundColor: LIGHT_THEME.w2,
              opacity: canDecrement ? 1 : 0.4,
            }}
          >
            <Text
              className="font-coach-bold text-[18px]"
              style={{ color: LIGHT_THEME.wText }}
            >
              −
            </Text>
          </Pressable>
          <View className="items-center gap-0.5">
            <Text
              className="font-coach-extrabold text-[24px]"
              style={{ color: LIGHT_THEME.wText }}
            >
              {value.sessionsPerWeek}
            </Text>
            <Text
              className="font-coach-medium text-[12px]"
              style={{ color: LIGHT_THEME.wSub }}
            >
              {t("onboarding.schedule.perWeek")}
            </Text>
          </View>
          <Pressable
            onPress={() => setSessions(value.sessionsPerWeek + 1)}
            disabled={!canIncrement}
            className="h-9 w-9 items-center justify-center rounded-full active:opacity-70"
            style={{
              backgroundColor: LIGHT_THEME.w2,
              opacity: canIncrement ? 1 : 0.4,
            }}
          >
            <Text
              className="font-coach-bold text-[18px]"
              style={{ color: LIGHT_THEME.wText }}
            >
              +
            </Text>
          </Pressable>
        </View>
        {dayCount > 0 && value.sessionsPerWeek === dayCount && (
          <Text
            className="font-coach-medium text-[12px]"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {t("onboarding.schedule.allDaysUsed")}
          </Text>
        )}
      </View>
    </View>
  );
}

export function StepSchedule({
  value,
  onChange,
}: {
  value: ScheduleValue;
  onChange: (next: ScheduleValue) => void;
}) {
  const { t } = useTranslation();
  return (
    <View className="gap-6">
      <View className="gap-2">
        <Text
          className="font-coach-extrabold text-[24px]"
          style={{ color: LIGHT_THEME.wText, letterSpacing: -0.02 * 24 }}
        >
          {t("onboarding.schedule.heading")}
        </Text>
        <Text
          className="font-coach-medium text-[14px]"
          style={{ color: LIGHT_THEME.wSub, lineHeight: 20 }}
        >
          {t("onboarding.schedule.helper")}
        </Text>
      </View>
      <ScheduleFields value={value} onChange={onChange} />
    </View>
  );
}

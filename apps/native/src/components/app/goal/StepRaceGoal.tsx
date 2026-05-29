import type { GoalType } from "@/components/app/account/race-form";
import { TimeField } from "@/components/app/form";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import type { RaceGoalValue } from "./types";

const GOAL_TYPES: readonly GoalType[] = [
  "completion",
  "performance",
] as const;

export function StepRaceGoal({
  value,
  onChange,
}: {
  value: RaceGoalValue;
  onChange: (next: RaceGoalValue) => void;
}) {
  const { t } = useTranslation();

  return (
    <View className="gap-5">
      <Text
        className="font-coach-extrabold text-[24px]"
        style={{ color: LIGHT_THEME.wText, letterSpacing: -0.02 * 24 }}
      >
        {t("goal.raceGoal.heading")}
      </Text>

      <View className="gap-3">
        {GOAL_TYPES.map((type) => {
          const selected = value.type === type;
          return (
            <Pressable
              key={type}
              onPress={() => {
                selectionFeedback();
                onChange({ ...value, type });
              }}
              className="rounded-2xl border p-4 active:opacity-90"
              style={{
                backgroundColor: LIGHT_THEME.w1,
                borderColor: selected ? LIGHT_THEME.wText : LIGHT_THEME.wBrd,
                borderWidth: selected ? 2 : 1,
              }}
            >
              <View className="gap-1">
                <Text
                  className="font-coach-bold text-[16px]"
                  style={{
                    color: LIGHT_THEME.wText,
                    letterSpacing: -0.01 * 16,
                  }}
                >
                  {t(`goal.raceGoal.${type}`)}
                </Text>
                <Text
                  className="font-coach-medium text-[13px]"
                  style={{ color: LIGHT_THEME.wSub, lineHeight: 18 }}
                >
                  {t(`goal.raceGoal.${type}Desc`)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {value.type === "performance" && (
        <TimeField
          label={t("goal.raceGoal.targetTime")}
          hours={Number.parseInt(value.targetHours || "0", 10) || 0}
          minutes={Number.parseInt(value.targetMinutes || "0", 10) || 0}
          seconds={Number.parseInt(value.targetSeconds || "0", 10) || 0}
          onChange={({ hours, minutes, seconds }) =>
            onChange({
              ...value,
              targetHours: String(hours),
              targetMinutes: String(minutes),
              targetSeconds: String(seconds),
            })
          }
          labels={{
            hours: t("goal.raceGoal.unitHours"),
            minutes: t("goal.raceGoal.unitMinutes"),
            seconds: t("goal.raceGoal.unitSeconds"),
          }}
        />
      )}
    </View>
  );
}

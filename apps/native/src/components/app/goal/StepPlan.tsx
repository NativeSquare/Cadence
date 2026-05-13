import { DateField } from "@/components/app/form";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { GoalBranch, PlanValue } from "./types";

export function StepPlan({
  value,
  onChange,
  branch,
  minDate,
  maxDate,
}: {
  value: PlanValue;
  onChange: (next: PlanValue) => void;
  branch: GoalBranch;
  minDate?: string;
  maxDate?: string;
}) {
  const { t } = useTranslation();

  return (
    <View className="gap-5">
      <Text
        className="font-coach-extrabold text-[24px]"
        style={{ color: LIGHT_THEME.wText, letterSpacing: -0.02 * 24 }}
      >
        {t("goal.plan.heading")}
      </Text>

      <Text
        className="font-coach-medium text-[14px]"
        style={{ color: LIGHT_THEME.wSub, lineHeight: 20 }}
      >
        {t(branch === "fitness" ? "goal.plan.helperFitness" : "goal.plan.helper")}
      </Text>

      <DateField
        label={t("goal.plan.startDate")}
        value={value.startDate || undefined}
        onChange={(v) => onChange({ ...value, startDate: v })}
        minDate={minDate}
        maxDate={maxDate}
      />
    </View>
  );
}

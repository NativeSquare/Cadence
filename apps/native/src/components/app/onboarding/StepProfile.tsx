import { DateField, FormField } from "@/components/app/form";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import type { Sex } from "@nativesquare/agoge/schema";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

const SEX_OPTIONS = ["male", "female", "other"] as const satisfies readonly Sex[];

export type ProfileValue = {
  sex: Sex | null;
  dateOfBirth: string;
};

export function StepProfile({
  value,
  onChange,
}: {
  value: ProfileValue;
  onChange: (next: ProfileValue) => void;
}) {
  const { t } = useTranslation();

  return (
    <View className="gap-5">
      <View className="gap-2">
        <Text
          className="font-coach-extrabold text-[24px]"
          style={{ color: LIGHT_THEME.wText, letterSpacing: -0.02 * 24 }}
        >
          {t("onboarding.profile.heading")}
        </Text>
        <Text
          className="font-coach-medium text-[14px]"
          style={{ color: LIGHT_THEME.wSub, lineHeight: 20 }}
        >
          {t("onboarding.profile.helper")}
        </Text>
      </View>

      <FormField label={t("onboarding.profile.sexLabel")}>
        <View className="flex-row gap-2">
          {SEX_OPTIONS.map((opt) => {
            const selected = value.sex === opt;
            return (
              <Pressable
                key={opt}
                onPress={() => {
                  selectionFeedback();
                  onChange({ ...value, sex: opt });
                }}
                className="flex-1 items-center rounded-2xl py-3.5 active:opacity-80"
                style={{
                  backgroundColor: selected ? COLORS.lime : LIGHT_THEME.w1,
                  borderWidth: 1,
                  borderColor: selected ? COLORS.lime : LIGHT_THEME.wBrd,
                }}
              >
                <Text
                  className="font-coach-extrabold text-[14px]"
                  style={{
                    color: selected ? COLORS.black : LIGHT_THEME.wText,
                  }}
                >
                  {t(`onboarding.profile.sexOptions.${opt}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </FormField>

      <DateField
        label={t("onboarding.profile.dobLabel")}
        value={value.dateOfBirth || undefined}
        onChange={(v) => onChange({ ...value, dateOfBirth: v })}
        maxDate={todayDateString()}
      />
    </View>
  );
}

function todayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

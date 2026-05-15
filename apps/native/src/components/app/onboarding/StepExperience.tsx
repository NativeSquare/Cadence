import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import { Ionicons } from "@expo/vector-icons";
import type { ExperienceLevel } from "@nativesquare/agoge/schema";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

const ICONS: Record<ExperienceLevel, keyof typeof Ionicons.glyphMap> = {
  beginner: "leaf-outline",
  intermediate: "trending-up-outline",
  advanced: "flame-outline",
};

const OPTIONS = [
  "beginner",
  "intermediate",
  "advanced",
] as const satisfies readonly ExperienceLevel[];

export function StepExperience({
  value,
  onChange,
}: {
  value: ExperienceLevel | null;
  onChange: (next: ExperienceLevel) => void;
}) {
  const { t } = useTranslation();

  return (
    <View className="gap-5">
      <View className="gap-2">
        <Text
          className="font-coach-extrabold text-[24px]"
          style={{ color: LIGHT_THEME.wText, letterSpacing: -0.02 * 24 }}
        >
          {t("onboarding.experience.heading")}
        </Text>
        <Text
          className="font-coach-medium text-[14px]"
          style={{ color: LIGHT_THEME.wSub, lineHeight: 20 }}
        >
          {t("onboarding.experience.helper")}
        </Text>
      </View>

      <View className="gap-3">
        {OPTIONS.map((option) => {
          const selected = value === option;
          return (
            <Pressable
              key={option}
              onPress={() => {
                selectionFeedback();
                onChange(option);
              }}
              className="rounded-2xl border p-4 active:opacity-90"
              style={{
                backgroundColor: LIGHT_THEME.w1,
                borderColor: selected ? LIGHT_THEME.wText : LIGHT_THEME.wBrd,
                borderWidth: selected ? 2 : 1,
              }}
            >
              <View className="flex-row items-center gap-3">
                <View
                  className="rounded-full p-2.5"
                  style={{
                    backgroundColor: selected
                      ? LIGHT_THEME.wText
                      : LIGHT_THEME.w2,
                  }}
                >
                  <Ionicons
                    name={ICONS[option]}
                    size={20}
                    color={selected ? LIGHT_THEME.w1 : LIGHT_THEME.wText}
                  />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text
                    className="font-coach-bold text-[15px]"
                    style={{ color: LIGHT_THEME.wText }}
                  >
                    {t(`onboarding.experience.options.${option}.label`)}
                  </Text>
                  <Text
                    className="font-coach-medium text-[12px]"
                    style={{ color: LIGHT_THEME.wSub, lineHeight: 17 }}
                  >
                    {t(`onboarding.experience.options.${option}.desc`)}
                  </Text>
                </View>
                {selected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={LIGHT_THEME.wText}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

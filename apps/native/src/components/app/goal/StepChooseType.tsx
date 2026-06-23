import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import type { GoalCategory } from "./types";

// The goal-category chooser. Race is the only selectable card; General Fitness
// is an inert "coming soon" teaser that preserves the two-pillar mental model
// and tells runners fitness goals are on the way. It sets no flow and creates
// no Goal — advancing always means a race Goal (ADR-0008). Mirrors the
// select-then-Next interaction of StepExperience.
export function StepChooseType({
  value,
  onChange,
}: {
  value: GoalCategory | null;
  onChange: (next: GoalCategory) => void;
}) {
  const { t } = useTranslation();

  const raceSelected = value === "race";

  return (
    <View className="gap-5">
      <View className="gap-2">
        <Text
          className="font-coach-extrabold text-[24px]"
          style={{ color: LIGHT_THEME.wText, letterSpacing: -0.02 * 24 }}
        >
          {t("goal.chooseType.heading")}
        </Text>
        <Text
          className="font-coach-medium text-[14px]"
          style={{ color: LIGHT_THEME.wSub, lineHeight: 20 }}
        >
          {t("goal.chooseType.helper")}
        </Text>
      </View>

      <View className="gap-3">
        <Pressable
          onPress={() => {
            selectionFeedback();
            onChange("race");
          }}
          className="rounded-2xl border p-4 active:opacity-90"
          style={{
            backgroundColor: LIGHT_THEME.w1,
            borderColor: raceSelected ? LIGHT_THEME.wText : LIGHT_THEME.wBrd,
            borderWidth: raceSelected ? 2 : 1,
          }}
        >
          <View className="flex-row items-center gap-3">
            <View
              className="rounded-full p-2.5"
              style={{
                backgroundColor: raceSelected
                  ? LIGHT_THEME.wText
                  : LIGHT_THEME.w2,
              }}
            >
              <Ionicons
                name="flag-outline"
                size={20}
                color={raceSelected ? LIGHT_THEME.w1 : LIGHT_THEME.wText}
              />
            </View>
            <View className="flex-1 gap-0.5">
              <Text
                className="font-coach-bold text-[15px]"
                style={{ color: LIGHT_THEME.wText }}
              >
                {t("goal.chooseType.race.title")}
              </Text>
              <Text
                className="font-coach-medium text-[12px]"
                style={{ color: LIGHT_THEME.wSub, lineHeight: 17 }}
              >
                {t("goal.chooseType.race.desc")}
              </Text>
            </View>
            {raceSelected && (
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={LIGHT_THEME.wText}
              />
            )}
          </View>
        </Pressable>

        {/* General fitness — inert teaser. No onPress, reduced opacity, and a
            "coming soon" pill. Selecting it is impossible by design (ADR-0008). */}
        <View
          className="rounded-2xl border p-4"
          style={{
            backgroundColor: LIGHT_THEME.w1,
            borderColor: LIGHT_THEME.wBrd,
            borderWidth: 1,
            opacity: 0.55,
          }}
        >
          <View className="flex-row items-center gap-3">
            <View
              className="rounded-full p-2.5"
              style={{ backgroundColor: LIGHT_THEME.w2 }}
            >
              <Ionicons
                name="fitness-outline"
                size={20}
                color={LIGHT_THEME.wText}
              />
            </View>
            <View className="flex-1 gap-0.5">
              <Text
                className="font-coach-bold text-[15px]"
                style={{ color: LIGHT_THEME.wText }}
              >
                {t("goal.chooseType.fitness.title")}
              </Text>
              <Text
                className="font-coach-medium text-[12px]"
                style={{ color: LIGHT_THEME.wSub, lineHeight: 17 }}
              >
                {t("goal.chooseType.fitness.desc")}
              </Text>
            </View>
            <View
              className="rounded-full px-2.5 py-1"
              style={{ backgroundColor: LIGHT_THEME.w3 }}
            >
              <Text
                className="font-coach-semibold text-[11px]"
                style={{ color: LIGHT_THEME.wSub }}
              >
                {t("goal.chooseType.comingSoon")}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

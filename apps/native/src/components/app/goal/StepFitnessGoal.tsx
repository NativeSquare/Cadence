import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { FITNESS_GOALS, type FitnessGoal } from "./types";

const ICONS: Record<FitnessGoal, keyof typeof Ionicons.glyphMap> = {
  start_running: "play-outline",
  build_base: "trending-up-outline",
  maintain_fitness: "fitness-outline",
  restart_running: "medkit-outline",
};

export function StepFitnessGoal({
  value,
  onChange,
}: {
  value: FitnessGoal | null;
  onChange: (next: FitnessGoal) => void;
}) {
  const { t } = useTranslation();

  return (
    <View className="gap-5">
      <View className="gap-2">
        <Text
          className="font-coach-extrabold text-[24px]"
          style={{ color: LIGHT_THEME.wText, letterSpacing: -0.02 * 24 }}
        >
          {t("goal.fitness.heading")}
        </Text>
        <Text
          className="font-coach-medium text-[14px]"
          style={{ color: LIGHT_THEME.wSub, lineHeight: 20 }}
        >
          {t("goal.fitness.helper")}
        </Text>
      </View>

      <View className="gap-3">
        {FITNESS_GOALS.map((goal) => {
          const selected = value === goal;
          return (
            <Pressable
              key={goal}
              onPress={() => {
                selectionFeedback();
                onChange(goal);
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
                    name={ICONS[goal]}
                    size={20}
                    color={selected ? LIGHT_THEME.w1 : LIGHT_THEME.wText}
                  />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text
                    className="font-coach-bold text-[15px]"
                    style={{ color: LIGHT_THEME.wText }}
                  >
                    {t(`goal.fitness.options.${goal}.label`)}
                  </Text>
                  <Text
                    className="font-coach-medium text-[12px]"
                    style={{ color: LIGHT_THEME.wSub, lineHeight: 17 }}
                  >
                    {t(`goal.fitness.options.${goal}.desc`)}
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

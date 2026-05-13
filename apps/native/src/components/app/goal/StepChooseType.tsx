import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import type { GoalBranch } from "./types";

export function StepChooseType({
  onSelect,
}: {
  onSelect: (branch: GoalBranch) => void;
}) {
  const { t } = useTranslation();

  const handleSelect = (branch: GoalBranch) => {
    selectionFeedback();
    onSelect(branch);
  };

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
        <BranchCard
          icon="flag-outline"
          title={t("goal.chooseType.race.title")}
          desc={t("goal.chooseType.race.desc")}
          onPress={() => handleSelect("race")}
        />
        <BranchCard
          icon="fitness-outline"
          title={t("goal.chooseType.fitness.title")}
          desc={t("goal.chooseType.fitness.desc")}
          onPress={() => handleSelect("fitness")}
        />
      </View>
    </View>
  );
}

function BranchCard({
  icon,
  title,
  desc,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl border p-4 active:opacity-90"
      style={{
        backgroundColor: LIGHT_THEME.w1,
        borderColor: LIGHT_THEME.wBrd,
        borderWidth: 1,
      }}
    >
      <View className="flex-row items-center gap-3">
        <View
          className="size-[34px] items-center justify-center rounded-[10px]"
          style={{ backgroundColor: LIGHT_THEME.w3 }}
        >
          <Ionicons name={icon} size={16} color={LIGHT_THEME.wSub} />
        </View>
        <View className="flex-1 gap-1">
          <Text
            className="font-coach-bold text-[16px]"
            style={{ color: LIGHT_THEME.wText, letterSpacing: -0.01 * 16 }}
          >
            {title}
          </Text>
          <Text
            className="font-coach-medium text-[13px]"
            style={{ color: LIGHT_THEME.wSub, lineHeight: 18 }}
          >
            {desc}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={LIGHT_THEME.wSub}
        />
      </View>
    </Pressable>
  );
}

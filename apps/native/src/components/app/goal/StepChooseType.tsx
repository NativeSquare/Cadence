import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import type { GoalBranch } from "./types";

export function StepChooseType({
  value,
  onChange,
}: {
  value: GoalBranch | null;
  onChange: (branch: GoalBranch) => void;
}) {
  const { t } = useTranslation();

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
          branch="race"
          icon="flag-outline"
          accent={COLORS.lime}
          title={t("goal.chooseType.race.title")}
          desc={t("goal.chooseType.race.desc")}
          selected={value === "race"}
          onPress={() => {
            selectionFeedback();
            onChange("race");
          }}
        />
        <BranchCard
          branch="fitness"
          icon="fitness-outline"
          accent={LIGHT_THEME.wText}
          title={t("goal.chooseType.fitness.title")}
          desc={t("goal.chooseType.fitness.desc")}
          selected={value === "fitness"}
          onPress={() => {
            selectionFeedback();
            onChange("fitness");
          }}
        />
      </View>
    </View>
  );
}

function BranchCard({
  icon,
  accent,
  title,
  desc,
  selected,
  onPress,
}: {
  branch: GoalBranch;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  title: string;
  desc: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl border p-4 active:opacity-90"
      style={{
        backgroundColor: LIGHT_THEME.w1,
        borderColor: selected ? accent : LIGHT_THEME.wBrd,
        borderWidth: selected ? 2 : 1,
      }}
    >
      <View className="flex-row items-start gap-3">
        <View
          className="rounded-full p-2.5"
          style={{ backgroundColor: `${accent}1A` }}
        >
          <Ionicons name={icon} size={20} color={accent} />
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
        {selected && (
          <Ionicons name="checkmark-circle" size={22} color={accent} />
        )}
      </View>
    </Pressable>
  );
}

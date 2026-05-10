import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { getCadenceWorkoutType } from "@packages/shared/utils";
import {
  WORKOUT_TYPES_COLORS,
  WORKOUT_TYPES_COLORS_DIM,
} from "@packages/shared/colors";
import type { WorkoutTemplateDoc } from "@nativesquare/agoge/schema";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import { useWorkoutCategoryLabels } from "../workout/workout-helpers";

export function WorkoutTemplateRow({
  template,
  onPress,
}: {
  template: Pick<WorkoutTemplateDoc, "name" | "type">;
  onPress: () => void;
}) {
  const categoryLabels = useWorkoutCategoryLabels();
  const category = getCadenceWorkoutType(template.type);
  const typeLabel = categoryLabels[category];
  const typeColor = WORKOUT_TYPES_COLORS[category];
  const typeColorDim = WORKOUT_TYPES_COLORS_DIM[category];

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border px-4 py-3.5 active:opacity-80"
      style={{
        backgroundColor: LIGHT_THEME.w1,
        borderColor: LIGHT_THEME.wBrd,
      }}
    >
      <View
        className="size-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: typeColorDim }}
      >
        <Ionicons name="barbell-outline" size={18} color={typeColor} />
      </View>
      <View className="flex-1">
        <Text
          numberOfLines={1}
          className="font-coach-semibold text-[15px]"
          style={{ color: LIGHT_THEME.wText }}
        >
          {template.name}
        </Text>
        <Text
          numberOfLines={1}
          className="mt-0.5 font-coach text-[12px]"
          style={{ color: LIGHT_THEME.wSub }}
        >
          {typeLabel}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={LIGHT_THEME.wMute} />
    </Pressable>
  );
}

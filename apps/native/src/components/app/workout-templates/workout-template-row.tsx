import { Text } from "@/components/ui/text";
import {
  LIGHT_THEME,
  SESSION_TYPE_COLORS,
  SESSION_TYPE_COLORS_DIM,
  getSessionCategory,
} from "@/lib/design-tokens";
import type { WorkoutTemplateDoc } from "@nativesquare/agoge/schema";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import { WORKOUT_TYPE_LABELS } from "../workout/workout-helpers";

export function WorkoutTemplateRow({
  template,
  onPress,
}: {
  template: Pick<WorkoutTemplateDoc, "name" | "type">;
  onPress: () => void;
}) {
  const typeLabel = WORKOUT_TYPE_LABELS[template.type] ?? template.type;
  const category = getSessionCategory(template.type);
  const typeColor = SESSION_TYPE_COLORS[category];
  const typeColorDim = SESSION_TYPE_COLORS_DIM[category];

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

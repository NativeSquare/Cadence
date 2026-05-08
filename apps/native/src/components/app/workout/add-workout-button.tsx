/**
 * AddWorkoutButton - Dashed-border button for adding a new workout.
 *
 * Sits at the end of a workout list as an inviting "tap here to add" affordance.
 */

import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";

interface AddWorkoutButtonProps {
  label: string;
  onPress: () => void;
}

export function AddWorkoutButton({ label, onPress }: AddWorkoutButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-center gap-2 rounded-2xl py-3 active:opacity-70"
      style={{
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: LIGHT_THEME.wBrd,
      }}
    >
      <Ionicons name="add" size={14} color={LIGHT_THEME.wMute} />
      <Text
        className="font-coach-semibold text-[12px]"
        style={{ color: LIGHT_THEME.wMute }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

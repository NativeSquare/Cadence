import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { Pressable, View } from "react-native";

export type FeedbackTypeFieldProps = {
  label?: string;
  onSelect: (option: string) => void;
  isSelected: (option: string) => boolean;
  error?: string;
};

const FEEDBACK_TYPES = ["Bug Report", "Feature Request", "General Feedback"];

export function FeedbackTypeField({
  label = "Feedback Type",
  onSelect,
  isSelected,
  error,
}: FeedbackTypeFieldProps) {
  return (
    <View className="gap-2">
      <Text
        className="font-coach-semibold text-[11px] uppercase tracking-wider"
        style={{ color: LIGHT_THEME.wMute }}
      >
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {FEEDBACK_TYPES.map((option) => {
          const active = isSelected(option);
          return (
            <Pressable
              key={option}
              onPress={() => onSelect(option)}
              className="rounded-xl px-4 py-2.5 active:opacity-80"
              style={{
                backgroundColor: active
                  ? LIGHT_THEME.wText
                  : LIGHT_THEME.w1,
                borderWidth: 1,
                borderColor: active
                  ? LIGHT_THEME.wText
                  : LIGHT_THEME.wBrd,
              }}
            >
              <Text
                className="font-coach-medium text-[13px]"
                style={{
                  color: active ? "#FFFFFF" : LIGHT_THEME.wText,
                }}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error && (
        <Text
          className="mt-1 font-coach text-xs"
          style={{ color: COLORS.red }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

export type FeedbackTypeFieldProps = {
  label?: string;
  onSelect: (option: string) => void;
  isSelected: (option: string) => boolean;
  error?: string;
};

// The values are persisted in Convex as the `type` field; keep them stable
// English keys and translate only the displayed label.
const FEEDBACK_TYPES = ["Bug Report", "Feature Request", "General Feedback"];

export function FeedbackTypeField({
  label,
  onSelect,
  isSelected,
  error,
}: FeedbackTypeFieldProps) {
  const { t } = useTranslation();
  const resolvedLabel = label ?? t("feedback.typeLabel");
  return (
    <View className="gap-2">
      <Text
        className="font-coach-semibold text-[11px] uppercase tracking-wider"
        style={{ color: LIGHT_THEME.wMute }}
      >
        {resolvedLabel}
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
                {t(`feedback.types.${option}` as const)}
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

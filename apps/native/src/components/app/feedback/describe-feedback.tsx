import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { useTranslation } from "react-i18next";
import { TextInput, View } from "react-native";

export type DescribeFeedbackFieldProps = {
  label?: string;
  maxLength?: number;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
};

export function DescribeFeedbackField({
  label,
  value,
  onChange,
  maxLength = 500,
  error,
}: DescribeFeedbackFieldProps) {
  const { t } = useTranslation();
  const resolvedLabel = label ?? t("feedback.describeLabel");
  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text
          className="font-coach-semibold text-[11px] uppercase tracking-wider"
          style={{ color: LIGHT_THEME.wMute }}
        >
          {resolvedLabel}
        </Text>
        <Text
          className="font-coach text-[11px]"
          style={{ color: LIGHT_THEME.wMute }}
        >
          {value?.length || 0}/{maxLength}
        </Text>
      </View>
      <TextInput
        placeholder={t("feedback.describePlaceholder")}
        placeholderTextColor={LIGHT_THEME.wMute}
        value={value}
        onChangeText={onChange}
        maxLength={maxLength}
        multiline
        textAlignVertical="top"
        style={{
          minHeight: 128,
          backgroundColor: LIGHT_THEME.w1,
          borderWidth: 1,
          borderColor: LIGHT_THEME.wBrd,
          borderRadius: 12,
          padding: 16,
          fontFamily: "Outfit-Medium",
          fontSize: 15,
          color: LIGHT_THEME.wText,
        }}
      />
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

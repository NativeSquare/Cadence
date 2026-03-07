import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { View } from "react-native";

export type NameFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
};

export function NameField({
  label = "Name",
  value,
  onChange,
  placeholder = "John Smith",
  error,
}: NameFieldProps) {
  return (
    <View className="gap-2">
      <Text
        className="font-coach-semibold text-[11px] uppercase tracking-wider"
        style={{ color: LIGHT_THEME.wMute }}
      >
        {label}
      </Text>
      <Input
        className="h-12 rounded-xl border px-4 font-coach-medium text-[15px]"
        style={{
          backgroundColor: LIGHT_THEME.w1,
          borderColor: LIGHT_THEME.wBrd,
          color: LIGHT_THEME.wText,
          textAlignVertical: "center",
        }}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={LIGHT_THEME.wMute}
        autoCapitalize="words"
        returnKeyType="done"
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

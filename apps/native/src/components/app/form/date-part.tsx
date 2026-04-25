import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import React from "react";
import { TextInput } from "react-native";

const inputStyle = {
  backgroundColor: LIGHT_THEME.w1,
  borderColor: LIGHT_THEME.wBrd,
  color: LIGHT_THEME.wText,
};

export function DatePart({
  placeholder,
  value,
  maxLength,
  onChange,
  widthClassName,
}: {
  placeholder: string;
  value: string;
  maxLength: number;
  onChange: (v: string) => void;
  widthClassName: string;
}) {
  return (
    <TextInput
      className={`h-12 rounded-xl border px-4 font-coach-medium text-[15px] ${widthClassName}`}
      style={{
        ...inputStyle,
        textAlign: "center",
      }}
      placeholder={placeholder}
      placeholderTextColor={LIGHT_THEME.wMute}
      keyboardType="number-pad"
      maxLength={maxLength}
      value={value}
      onChangeText={(v) => onChange(v.replace(/[^0-9]/g, ""))}
      selectionColor={COLORS.lime}
      cursorColor={COLORS.lime}
    />
  );
}

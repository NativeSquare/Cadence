import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import React from "react";
import { Pressable, View } from "react-native";

export function PillSelect<T extends string>({
  options,
  labels,
  value,
  onChange,
  allowClear = false,
  colorByValue,
}: {
  options: readonly T[];
  labels: Record<T, string>;
  value: string | undefined;
  onChange: (v: T) => void;
  allowClear?: boolean;
  colorByValue?: Partial<Record<T, string>>;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value === opt;
        const accent = colorByValue?.[opt];
        const selectedBg = accent ?? LIGHT_THEME.wText;
        return (
          <Pressable
            key={opt}
            onPress={() => {
              selectionFeedback();
              onChange(opt);
            }}
            className="rounded-full border px-[14px] py-2 active:opacity-80"
            style={{
              backgroundColor: selected ? selectedBg : LIGHT_THEME.w1,
              borderColor: selected ? selectedBg : LIGHT_THEME.wBrd,
            }}
          >
            <Text
              className="font-coach-semibold text-[13px]"
              style={{ color: selected ? "#FFFFFF" : LIGHT_THEME.wText }}
            >
              {labels[opt]}
            </Text>
          </Pressable>
        );
      })}
      {allowClear && value != null && value !== "" && (
        <Text
          className="px-2 py-2 font-coach text-[11px]"
          style={{ color: LIGHT_THEME.wMute }}
        >
          Tap again to clear
        </Text>
      )}
    </View>
  );
}

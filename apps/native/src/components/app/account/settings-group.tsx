import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import React from "react";
import { View } from "react-native";
import { SettingsRow, SettingsRowProps } from "./settings-row";

export type SettingsGroupProps = {
  title: string;
  items?: SettingsRowProps[];
  children?: React.ReactNode;
};

export function SettingsGroup({ title, items, children }: SettingsGroupProps) {
  return (
    <View className="gap-2">
      <Text
        className="px-1 font-coach-semibold text-[11px] uppercase tracking-wider"
        style={{ color: LIGHT_THEME.wMute }}
      >
        {title}
      </Text>
      <View
        className="overflow-hidden rounded-[18px]"
        style={{
          backgroundColor: LIGHT_THEME.w1,
          borderWidth: 1,
          borderColor: LIGHT_THEME.wBrd,
        }}
      >
        {children ||
          items?.map((item, index) => (
            <SettingsRow
              key={item.label}
              {...item}
              isLast={index === (items?.length ?? 0) - 1}
            />
          ))}
      </View>
    </View>
  );
}

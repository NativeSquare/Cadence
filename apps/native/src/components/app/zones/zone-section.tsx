import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import React from "react";
import { View } from "react-native";

export type ZoneSectionProps = {
  title: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
};

export function ZoneSection({ title, headerRight, children }: ZoneSectionProps) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between px-1">
        <Text
          className="font-coach-semibold text-[13px] uppercase tracking-wider"
          style={{ color: LIGHT_THEME.wMute }}
        >
          {title}
        </Text>
        {headerRight}
      </View>
      <View
        className="overflow-hidden rounded-[18px]"
        style={{
          backgroundColor: LIGHT_THEME.w1,
          borderWidth: 1,
          borderColor: LIGHT_THEME.wBrd,
        }}
      >
        {children}
      </View>
    </View>
  );
}

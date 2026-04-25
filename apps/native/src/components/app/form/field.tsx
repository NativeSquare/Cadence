import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import React from "react";
import { View } from "react-native";

export function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-2">
      <Text
        className="px-1 font-coach-semibold text-[11px] uppercase tracking-wider"
        style={{ color: LIGHT_THEME.wMute }}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

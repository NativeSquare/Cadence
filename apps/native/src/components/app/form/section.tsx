import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import React from "react";
import { View } from "react-native";

export function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-5">
      <Text
        className="font-coach-extrabold text-[11px] uppercase tracking-widest"
        style={{ color: LIGHT_THEME.wSub }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";

export function WorkoutFaceCard({
  variant,
  title,
  children,
}: {
  variant: "planned" | "actual";
  title: string;
  children: React.ReactNode;
}) {
  const icon = variant === "planned" ? "stopwatch-outline" : "checkmark-done";
  return (
    <View
      className="overflow-hidden rounded-3xl border p-5"
      style={{
        backgroundColor: LIGHT_THEME.w1,
        borderColor: LIGHT_THEME.wBrd,
      }}
    >
      <View
        pointerEvents="none"
        className="absolute -right-5 -top-5"
        style={{ opacity: 0.06 }}
      >
        <Ionicons name={icon} size={150} color={LIGHT_THEME.wText} />
      </View>

      <View className="mb-5 flex-row items-center gap-2">
        <Ionicons name={icon} size={14} color={LIGHT_THEME.wSub} />
        <Text
          className="font-coach-extrabold text-[11px] uppercase tracking-widest"
          style={{ color: LIGHT_THEME.wSub }}
        >
          {title}
        </Text>
      </View>

      {children}
    </View>
  );
}

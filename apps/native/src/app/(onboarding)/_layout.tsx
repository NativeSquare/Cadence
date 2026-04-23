import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { LIGHT_THEME } from "@/lib/design-tokens";

export default function OnboardingLayout() {
  return (
    <View className="flex-1" style={{ backgroundColor: LIGHT_THEME.w2 }}>
      <StatusBar style="dark" />
      <Slot />
    </View>
  );
}

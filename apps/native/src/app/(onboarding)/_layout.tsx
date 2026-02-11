import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";

export default function OnboardingLayout() {
  return (
    <View className="flex-1 bg-[#0a0a0a]">
      <StatusBar style="light" />
      <Slot />
    </View>
  );
}

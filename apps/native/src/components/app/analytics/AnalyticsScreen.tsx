import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import {
  HEALTH_INVENTORY,
  TRAINING_INVENTORY,
  type SectionId,
} from "./inventory";
import { SectionToggle } from "./parts/SectionToggle";
import { InventorySection } from "./sections/InventorySection";

export function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const [section, setSection] = useState<SectionId>("training");

  const subsections =
    section === "training" ? TRAINING_INVENTORY : HEALTH_INVENTORY;

  return (
    <View className="flex-1 bg-w2">
      <View className="absolute top-0 left-0 right-0 h-1/2 bg-black" />

      <View className="bg-black">
        <View className="px-6 pb-5" style={{ paddingTop: insets.top + 12 }}>
          <Text
            className="text-[28px] font-coach-bold text-g1"
            style={{ letterSpacing: -0.03 * 28 }}
          >
            Analytics
          </Text>
          <Text className="text-[13px] font-coach text-g3 mt-1">
            Everything we track, organized by source
          </Text>
        </View>
        <View
          className="bg-w2 h-7"
          style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
        />
      </View>

      <ScrollView
        className="flex-1 bg-w2"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-5">
          <SectionToggle value={section} onChange={setSection} />
        </View>

        <InventorySection subsections={subsections} />
      </ScrollView>
    </View>
  );
}

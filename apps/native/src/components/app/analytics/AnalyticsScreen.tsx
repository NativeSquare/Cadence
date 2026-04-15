/**
 * AnalyticsScreen - Temporary mock while crash is investigated.
 * TODO: Restore full analytics once the crash root cause is fixed.
 */

import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";

export function AnalyticsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-w2">
      <View className="absolute top-0 left-0 right-0 h-1/2 bg-black" />

      {/* Dark header area */}
      <View className="bg-black">
        <View className="px-6 pb-5" style={{ paddingTop: insets.top + 12 }}>
          <Text
            className="text-[28px] font-coach-bold text-g1"
            style={{ letterSpacing: -0.03 * 28 }}
          >
            Analytics
          </Text>
        </View>
        <View
          className="bg-w2 h-7"
          style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
        />
      </View>

      {/* Mock content */}
      <View className="flex-1 bg-w2 items-center justify-center px-8">
        <Text
          className="text-[20px] font-coach-semibold text-wText text-center mb-2"
          style={{ letterSpacing: -0.03 * 20 }}
        >
          Coming Soon
        </Text>
        <Text className="text-[14px] text-wMute text-center leading-5">
          We're working on bringing you detailed training analytics. Stay tuned!
        </Text>
      </View>
    </View>
  );
}


import { Pressable, View } from "react-native";
import { Plug } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import type { OptInCta } from "../inventory";

type Props = {
  cta: OptInCta;
  onPress?: () => void;
};

export function OptInCard({ cta, onPress }: Props) {
  return (
    <View
      className="rounded-2xl p-6 items-center"
      style={{
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: "rgba(0,0,0,0.12)",
        backgroundColor: "rgba(0,0,0,0.02)",
      }}
    >
      <View className="w-12 h-12 rounded-full bg-w3 items-center justify-center mb-4">
        <Plug size={22} color={LIGHT_THEME.wSub} strokeWidth={2} />
      </View>
      <Text className="text-[14px] font-coach text-wSub text-center leading-[20px] mb-5">
        {cta.copy}
      </Text>
      <Pressable
        onPress={onPress}
        hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
        className="px-6 py-3.5 rounded-full bg-black"
      >
        <Text className="text-[14px] font-coach-semibold text-white">
          {cta.buttonLabel}
        </Text>
      </Pressable>
    </View>
  );
}

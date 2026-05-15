import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export function StepWelcome() {
  const { t } = useTranslation();

  return (
    <View className="gap-6">
      <View
        className="size-[64px] items-center justify-center self-start rounded-2xl"
        style={{ backgroundColor: LIGHT_THEME.w3 }}
      >
        <Ionicons name="walk" size={32} color={LIGHT_THEME.wText} />
      </View>

      <View className="gap-3">
        <Text
          className="font-coach-extrabold text-[28px]"
          style={{ color: LIGHT_THEME.wText, letterSpacing: -0.02 * 28 }}
        >
          {t("onboarding.welcome.heading")}
        </Text>
        <Text
          className="font-coach-medium text-[15px]"
          style={{ color: LIGHT_THEME.wSub, lineHeight: 22 }}
        >
          {t("onboarding.welcome.helper")}
        </Text>
      </View>
    </View>
  );
}

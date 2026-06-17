/**
 * ChatHeader - Header for the pushed Coach chat route: a back affordance and
 * the title. The "what the coach knows about you" Context button was folded
 * into the dashboard Portrait (the Portrait now carries the verbatim
 * transparency guarantee at MVP); `CoachContextSheet` is shelved for the
 * future synthesis split, not deleted. See CONTEXT.md "Context sheet".
 */

import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { GRAYS } from "@/lib/design-tokens";

export function ChatHeader() {
  const { t } = useTranslation();

  return (
    <View className="flex-row items-center gap-2">
      <Pressable
        onPress={() => router.back()}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={t("common.back")}
        className="h-9 w-9 -ml-2 items-center justify-center rounded-full active:opacity-70"
      >
        <ChevronLeft size={26} color={GRAYS.g1} strokeWidth={2} />
      </Pressable>

      <Text
        className="text-[28px] font-coach-bold text-g1"
        style={{ letterSpacing: -0.03 * 28 }}
      >
        {t("coach.title")}
      </Text>
    </View>
  );
}

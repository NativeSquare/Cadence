/**
 * ChatHeader - Header with title and a Context button on the right that opens
 * the "what the coach knows about you" sheet.
 */

import { useCallback, useRef } from "react";
import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Brain } from "lucide-react-native";
import type { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";
import { Text } from "@/components/ui/text";
import { GRAYS } from "@/lib/design-tokens";
import { CoachContextSheet } from "./CoachContextSheet";

export function ChatHeader() {
  const { t } = useTranslation();
  const contextSheetRef = useRef<GorhomBottomSheetModal>(null);

  const handleContextPress = useCallback(() => {
    contextSheetRef.current?.present();
  }, []);

  return (
    <View className="flex-row items-center justify-between">
      <Text
        className="text-[28px] font-coach-bold text-g1"
        style={{ letterSpacing: -0.03 * 28 }}
      >
        {t("coach.title")}
      </Text>

      <Pressable
        onPress={handleContextPress}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={t("coach.context.openLabel")}
        className="h-9 w-9 items-center justify-center rounded-full border bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)] active:opacity-70"
      >
        <Brain size={16} color={GRAYS.g2} strokeWidth={1.75} />
      </Pressable>

      <CoachContextSheet sheetRef={contextSheetRef} />
    </View>
  );
}

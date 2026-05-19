/**
 * "What I know about you" sheet.
 *
 * Read-only surface that lists everything the coach has stored about the
 * athlete via the rememberAboutAthlete tool. The list shown here is the same
 * list that gets injected verbatim into the coach's system prompt on every
 * turn — by design, what the athlete reads is exactly what the model is told.
 */

import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Brain } from "lucide-react-native";
import type { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";
import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { BottomSheetModal } from "@/components/custom/bottom-sheet";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";

type Props = {
  sheetRef: React.RefObject<GorhomBottomSheetModal | null>;
};

export function CoachContextSheet({ sheetRef }: Props) {
  const { t } = useTranslation();
  const memories = useQuery(api.table.coachMemories.listMine, {});
  const isLoading = memories === undefined;
  const isEmpty = !isLoading && memories.length === 0;

  return (
    <BottomSheetModal ref={sheetRef} scrollable snapPoints={["75%"]}>
      <View className="px-6 pb-6 pt-1 gap-5">
        <View className="flex-row items-center gap-2.5">
          <View
            className="size-9 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(200,255,0,0.18)" }}
          >
            <Brain size={18} color="#5C7700" strokeWidth={1.75} />
          </View>
          <View className="flex-1">
            <Text
              className="font-coach-bold text-[15px]"
              style={{ color: LIGHT_THEME.wText }}
            >
              {t("coach.context.title")}
            </Text>
            <Text
              className="font-coach text-[12px]"
              style={{ color: LIGHT_THEME.wMute }}
            >
              {t("coach.context.subtitle")}
            </Text>
          </View>
        </View>

        {isLoading ? null : isEmpty ? (
          <View className="py-6">
            <Text
              className="font-coach text-[14px] leading-5"
              style={{ color: LIGHT_THEME.wMute }}
            >
              {t("coach.context.empty")}
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {memories.map((m) => (
              <View
                key={m._id}
                className="flex-row gap-3"
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  backgroundColor: "rgba(0,0,0,0.04)",
                }}
              >
                <View
                  className="mt-1.5 size-1.5 rounded-full"
                  style={{ backgroundColor: "#5C7700" }}
                />
                <Text
                  className="flex-1 font-coach text-[14px] leading-5"
                  style={{ color: LIGHT_THEME.wText }}
                >
                  {m.text}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </BottomSheetModal>
  );
}

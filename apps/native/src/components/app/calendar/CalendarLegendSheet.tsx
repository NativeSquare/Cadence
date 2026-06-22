import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";

import { BottomSheetModal } from "@/components/custom/bottom-sheet";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import {
  BLOCK_TYPE_COLORS,
  WORKOUT_TYPES_COLORS,
} from "@packages/shared/colors";
import { BLOCK_TYPES, WORKOUT_TYPES } from "@packages/shared/types";
import { blendWithBg } from "./helpers";

interface CalendarLegendSheetProps {
  sheetRef: React.RefObject<GorhomBottomSheetModal | null>;
}

export function CalendarLegendSheet({ sheetRef }: CalendarLegendSheetProps) {
  const { t } = useTranslation();

  return (
    <BottomSheetModal ref={sheetRef} backgroundColor={LIGHT_THEME.w1} borderRadius={28}>
      <View className="px-6 pt-2 pb-2 gap-6">
        <Text
          className="text-[20px] font-coach-bold"
          style={{ color: LIGHT_THEME.wText, letterSpacing: -0.4 }}
        >
          {t("calendar.legend.title")}
        </Text>

        <View className="gap-3">
          <Text
            className="text-[11px] font-coach-semibold uppercase tracking-wider"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {t("calendar.legend.workoutTypes")}
          </Text>
          <View className="flex-row flex-wrap gap-y-3">
            {WORKOUT_TYPES.filter(
              (type) => type !== "recovery" && type !== "test",
            ).map((type) => (
              <View
                key={type}
                className="flex-row items-center gap-2"
                style={{ width: "50%" }}
              >
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: WORKOUT_TYPES_COLORS[type],
                  }}
                />
                <Text
                  className="text-[14px] font-coach"
                  style={{ color: LIGHT_THEME.wText }}
                >
                  {t(`workout.types.${type}`)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className="gap-3">
          <Text
            className="text-[11px] font-coach-semibold uppercase tracking-wider"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {t("calendar.legend.blockTypes")}
          </Text>
          <View className="flex-row flex-wrap gap-y-3">
            {BLOCK_TYPES.map((type) => {
              const color = BLOCK_TYPE_COLORS[type];
              return (
                <View
                  key={type}
                  className="flex-row items-center gap-2.5"
                  style={{ width: "50%" }}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 7,
                      backgroundColor: blendWithBg(color, 0.1, [255, 255, 255]),
                      borderWidth: 1,
                      borderColor: blendWithBg(color, 0.16, [255, 255, 255]),
                    }}
                  />
                  <Text
                    className="text-[14px] font-coach"
                    style={{ color: LIGHT_THEME.wText }}
                  >
                    {t(`workout.blockTypes.${type}`)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </BottomSheetModal>
  );
}

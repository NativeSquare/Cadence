import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";

import { BottomSheetModal } from "@/components/custom/bottom-sheet";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { TERRA_DATA_TYPES } from "@/lib/providers/capabilities";

interface ConnectionsDataTypesSheetProps {
  sheetRef: React.RefObject<GorhomBottomSheetModal | null>;
}

export function ConnectionsDataTypesSheet({
  sheetRef,
}: ConnectionsDataTypesSheetProps) {
  const { t } = useTranslation();

  return (
    <BottomSheetModal
      ref={sheetRef}
      backgroundColor={LIGHT_THEME.w1}
      borderRadius={28}
      scrollable
      snapPoints={["80%"]}
    >
      <View className="px-6 pt-2 pb-2 gap-5">
        <View className="gap-1.5">
          <Text
            className="text-[20px] font-coach-bold"
            style={{ color: LIGHT_THEME.wText, letterSpacing: -0.4 }}
          >
            {t("account.connections.dataTypesSheet.title")}
          </Text>
          <Text
            className="text-[13px] font-coach"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {t("account.connections.dataTypesSheet.subtitle")}
          </Text>
        </View>

        <View className="gap-4">
          {TERRA_DATA_TYPES.map(({ key, Icon }) => (
            <View
              key={key}
              className="flex-row gap-3 rounded-2xl p-3.5"
              style={{
                backgroundColor: LIGHT_THEME.w2,
                borderWidth: 1,
                borderColor: LIGHT_THEME.wBrd,
              }}
            >
              <View
                className="size-9 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: LIGHT_THEME.w3 }}
              >
                <Icon
                  size={16}
                  color={LIGHT_THEME.wText}
                  strokeWidth={2.25}
                />
              </View>
              <View className="flex-1 gap-1">
                <Text
                  className="text-[15px] font-coach-semibold"
                  style={{ color: LIGHT_THEME.wText }}
                >
                  {t(`account.connections.capabilities.dataTypes.${key}`)}
                </Text>
                <Text
                  className="text-[13px] font-coach"
                  style={{ color: LIGHT_THEME.wMute, lineHeight: 18 }}
                >
                  {t(`account.connections.dataTypesSheet.descriptions.${key}`)}
                </Text>
                <Text
                  className="mt-0.5 text-[12px] font-coach-medium"
                  style={{ color: LIGHT_THEME.wMute }}
                >
                  {t("account.connections.dataTypesSheet.examplesLabel")}{" "}
                  <Text
                    className="text-[12px] font-coach"
                    style={{ color: LIGHT_THEME.wText }}
                  >
                    {t(`account.connections.dataTypesSheet.examples.${key}`)}
                  </Text>
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </BottomSheetModal>
  );
}

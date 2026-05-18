import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, View } from "react-native";
import { ChevronDown } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import {
  ANALYTICS_DATA_TYPES,
  type DataTypeKey,
} from "@/lib/providers/capabilities";

type Props = {
  value: DataTypeKey;
  onChange: (next: DataTypeKey) => void;
};

export function DataTypePill({ value, onChange }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const ActiveIcon =
    ANALYTICS_DATA_TYPES.find((d) => d.key === value)?.Icon ??
    ANALYTICS_DATA_TYPES[0].Icon;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
        className="flex-row items-center gap-1.5 px-3.5 py-2 rounded-full"
        style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
      >
        <ActiveIcon size={14} color="#FFFFFF" strokeWidth={2.5} />
        <Text className="text-[13px] font-coach-medium" style={{ color: "#FFFFFF" }}>
          {t(`analytics.dataTypes.${value}`)}
        </Text>
        <ChevronDown size={14} color="rgba(255,255,255,0.7)" strokeWidth={2.5} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          onPress={() => setOpen(false)}
          className="flex-1 justify-end bg-black/40"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-w1 rounded-t-3xl px-5 pt-4 pb-8"
          >
            <View className="self-center w-10 h-1 rounded-full bg-w3 mb-4" />
            <Text className="text-[13px] font-coach-semibold text-wMute uppercase tracking-wider mb-3">
              {t("analytics.dataTypesPicker.title")}
            </Text>
            {ANALYTICS_DATA_TYPES.map((opt) => {
              const active = opt.key === value;
              const Icon = opt.Icon;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => {
                    onChange(opt.key);
                    setOpen(false);
                  }}
                  className={`flex-row items-center gap-3 py-4 px-3 rounded-xl ${
                    active ? "bg-w3" : ""
                  }`}
                >
                  <Icon
                    size={18}
                    color={LIGHT_THEME.wText}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  <Text
                    className={`text-[16px] ${
                      active
                        ? "font-coach-semibold text-wText"
                        : "font-coach text-wText"
                    }`}
                  >
                    {t(`analytics.dataTypes.${opt.key}`)}
                  </Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

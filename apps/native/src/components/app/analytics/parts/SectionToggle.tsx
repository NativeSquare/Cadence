import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import type { SectionId } from "../inventory";

type Props = {
  value: SectionId;
  onChange: (next: SectionId) => void;
};

const TAB_IDS: SectionId[] = ["training", "health"];

export function SectionToggle({ value, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <View className="flex-row bg-w3 rounded-full p-1 self-stretch">
      {TAB_IDS.map((id) => {
        const active = id === value;
        return (
          <Pressable
            key={id}
            onPress={() => onChange(id)}
            className={`flex-1 items-center justify-center py-3 rounded-full ${
              active ? "bg-w1" : ""
            }`}
            style={
              active
                ? {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                    elevation: 2,
                  }
                : undefined
            }
          >
            <Text
              className={`text-[15px] ${
                active
                  ? "font-coach-semibold text-wText"
                  : "font-coach text-wMute"
              }`}
            >
              {t(`analytics.sections.${id}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import type { SectionId } from "../inventory";

type Props = {
  value: SectionId;
  onChange: (next: SectionId) => void;
};

const TABS: { id: SectionId; label: string }[] = [
  { id: "training", label: "Training" },
  { id: "health", label: "Health" },
];

export function SectionToggle({ value, onChange }: Props) {
  return (
    <View className="flex-row bg-w3 rounded-full p-1 self-stretch">
      {TABS.map((tab) => {
        const active = tab.id === value;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
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
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

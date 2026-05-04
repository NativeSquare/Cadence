import { useState } from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { TimeWindowPill } from "./TimeWindowPill";
import type { CardConfig } from "../inventory";

type Props = {
  card: CardConfig;
};

export function AnalyticsCard({ card }: Props) {
  const [window, setWindow] = useState(card.defaultWindow);
  const { Icon } = card;

  return (
    <View
      className="bg-w1 rounded-2xl p-5"
      style={{
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.06)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 1,
      }}
    >
      <View className="flex-row items-start justify-between gap-3 mb-4">
        <View className="flex-row items-start gap-2.5 flex-1 min-w-0">
          <View className="w-8 h-8 rounded-lg bg-w3 items-center justify-center mt-[1px]">
            <Icon size={17} color={LIGHT_THEME.wSub} strokeWidth={2} />
          </View>
          <View className="flex-1 min-w-0">
            <Text className="text-[10px] font-coach-medium text-wMute uppercase tracking-wider">
              {card.id}
            </Text>
            <Text
              className="text-[15px] font-coach-semibold text-wText"
              numberOfLines={2}
            >
              {card.title}
            </Text>
          </View>
        </View>
        <TimeWindowPill
          value={window}
          options={card.windows}
          onChange={setWindow}
        />
      </View>

      <View
        className="rounded-xl items-center justify-center px-4"
        style={{
          height: 200,
          backgroundColor: "rgba(0,0,0,0.025)",
          borderWidth: 1,
          borderStyle: "dashed",
          borderColor: "rgba(0,0,0,0.10)",
        }}
      >
        <Text className="text-[12px] font-coach-medium text-wMute uppercase tracking-wider mb-1.5">
          {card.chart}
        </Text>
        <Text
          className="text-[12px] font-coach text-wMute text-center leading-[17px]"
          numberOfLines={4}
        >
          {card.source}
        </Text>
      </View>
    </View>
  );
}

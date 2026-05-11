import { RaceRow, type RaceWithGoal } from "@/components/app/account/race-row";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

export function RaceSection({
  title,
  rows,
  dimmed = false,
}: {
  title: string;
  rows: RaceWithGoal[];
  dimmed?: boolean;
}) {
  const router = useRouter();
  return (
    <View className="gap-3">
      <Text
        className="px-1 font-coach-extrabold text-[11px] uppercase tracking-widest"
        style={{ color: LIGHT_THEME.wSub }}
      >
        {title}
      </Text>
      <View className="gap-3">
        {rows.map(({ race, goal }) => (
          <RaceRow
            key={race._id}
            race={race}
            goal={goal}
            dimmed={dimmed}
            onPress={() =>
              router.push({
                pathname: "/(app)/account/races/[id]",
                params: { id: race._id },
              })
            }
          />
        ))}
      </View>
    </View>
  );
}

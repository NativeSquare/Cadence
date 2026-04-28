import { type RaceDoc } from "@/components/app/account/race-row";
import { RaceSection } from "@/components/app/account/race-section";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { api } from "@packages/backend/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";

const PRIORITY_RANK: Record<"A" | "B" | "C", number> = { A: 0, B: 1, C: 2 };

function partitionAndSort(races: RaceDoc[]) {
  const upcoming: RaceDoc[] = [];
  const past: RaceDoc[] = [];
  for (const r of races) {
    if (r.status === "upcoming") upcoming.push(r);
    else past.push(r);
  }
  const byPriorityThen = (dir: 1 | -1) => (a: RaceDoc, b: RaceDoc) => {
    const pa = PRIORITY_RANK[a.priority];
    const pb = PRIORITY_RANK[b.priority];
    if (pa !== pb) return pa - pb;
    return dir * a.date.localeCompare(b.date);
  };
  upcoming.sort(byPriorityThen(1));
  past.sort(byPriorityThen(-1));
  return { upcoming, past };
}

export default function RacesListScreen() {
  const router = useRouter();
  const races = useQuery(api.agoge.races.listMyRaces);

  const { upcoming, past } = React.useMemo(
    () => (races ? partitionAndSort(races) : { upcoming: [], past: [] }),
    [races],
  );

  return (
    <View
      className="pt-safe flex-1"
      style={{ backgroundColor: LIGHT_THEME.w2 }}
    >
      <View
        className="flex-row items-center gap-3 px-4 pb-3 pt-4"
        style={{ borderBottomWidth: 1, borderBottomColor: LIGHT_THEME.wBrd }}
      >
        <Pressable
          onPress={() => router.back()}
          className="size-9 items-center justify-center rounded-full active:opacity-70"
          style={{ backgroundColor: LIGHT_THEME.w3 }}
        >
          <Ionicons name="chevron-back" size={20} color={LIGHT_THEME.wText} />
        </Pressable>
        <Text
          className="flex-1 font-coach-bold text-lg"
          style={{ color: LIGHT_THEME.wText }}
        >
          Races
        </Text>
        <Pressable
          onPress={() => router.push("/(app)/account/races/new")}
          className="size-9 items-center justify-center rounded-full active:opacity-70"
          style={{ backgroundColor: LIGHT_THEME.wText }}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6"
      >
        {races === undefined ? null : upcoming.length === 0 &&
          past.length === 0 ? (
          <View className="w-full max-w-md items-center gap-2 self-center pt-20">
            <Text
              className="font-coach-medium text-[15px]"
              style={{ color: LIGHT_THEME.wText }}
            >
              No races yet
            </Text>
            <Text
              className="text-center font-coach text-[13px]"
              style={{ color: LIGHT_THEME.wMute }}
            >
              Add a target race to focus your training.
            </Text>
          </View>
        ) : (
          <View className="w-full max-w-md gap-6 self-center">
            {upcoming.length > 0 && (
              <RaceSection title="Upcoming" races={upcoming} />
            )}
            {past.length > 0 && (
              <RaceSection title="Past" races={past} dimmed />
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

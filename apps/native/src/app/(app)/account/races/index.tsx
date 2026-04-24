import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { api } from "@packages/backend/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";

type RaceDoc = NonNullable<
  ReturnType<typeof useQuery<typeof api.plan.events.listMyEvents>>
>[number];

const PRIORITY_COLORS: Record<"A" | "B" | "C", string> = {
  A: COLORS.lime,
  B: COLORS.ora,
  C: LIGHT_THEME.w3,
};

const PRIORITY_TEXT_COLORS: Record<"A" | "B" | "C", string> = {
  A: COLORS.black,
  B: COLORS.black,
  C: LIGHT_THEME.wSub,
};

const PRIORITY_RANK: Record<"A" | "B" | "C", number> = { A: 0, B: 1, C: 2 };

const STATUS_PILL_LABEL: Record<
  "completed" | "cancelled" | "dnf" | "dns",
  string
> = {
  completed: "Done",
  cancelled: "Cancelled",
  dnf: "DNF",
  dns: "DNS",
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function formatDistance(meters?: number): string | null {
  if (meters == null) return null;
  if (meters >= 1000) {
    const km = meters / 1000;
    const rounded = Math.round(km * 10) / 10;
    return `${rounded} km`;
  }
  return `${meters} m`;
}

function partitionAndSort(races: RaceDoc[]) {
  const upcoming: RaceDoc[] = [];
  const past: RaceDoc[] = [];
  for (const r of races) {
    if (r.status === "upcoming") upcoming.push(r);
    else past.push(r);
  }
  const byPriorityThen = (dir: 1 | -1) => (a: RaceDoc, b: RaceDoc) => {
    const pa = PRIORITY_RANK[a.priority as "A" | "B" | "C"];
    const pb = PRIORITY_RANK[b.priority as "A" | "B" | "C"];
    if (pa !== pb) return pa - pb;
    return dir * a.date.localeCompare(b.date);
  };
  upcoming.sort(byPriorityThen(1));
  past.sort(byPriorityThen(-1));
  return { upcoming, past };
}

export default function RacesListScreen() {
  const router = useRouter();
  const races = useQuery(api.plan.events.listMyEvents);

  const { upcoming, past } = React.useMemo(
    () => (races ? partitionAndSort(races) : { upcoming: [], past: [] }),
    [races],
  );

  return (
    <View className="mt-safe flex-1" style={{ backgroundColor: LIGHT_THEME.w2 }}>
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

function RaceSection({
  title,
  races,
  dimmed = false,
}: {
  title: string;
  races: RaceDoc[];
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
        {races.map((race) => (
          <RaceRow
            key={race._id}
            race={race}
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

function RaceRow({
  race,
  dimmed,
  onPress,
}: {
  race: RaceDoc;
  dimmed: boolean;
  onPress: () => void;
}) {
  const priority = race.priority as "A" | "B" | "C";
  const distance = formatDistance(race.distanceMeters);
  const statusPill =
    race.status !== "upcoming"
      ? STATUS_PILL_LABEL[race.status as keyof typeof STATUS_PILL_LABEL]
      : null;

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border px-4 py-3.5 active:opacity-80"
      style={{
        backgroundColor: LIGHT_THEME.w1,
        borderColor: LIGHT_THEME.wBrd,
        opacity: dimmed ? 0.65 : 1,
      }}
    >
      <View
        className="size-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: PRIORITY_COLORS[priority] }}
      >
        <Text
          className="font-coach-extrabold text-[15px]"
          style={{ color: PRIORITY_TEXT_COLORS[priority] }}
        >
          {priority}
        </Text>
      </View>
      <View className="flex-1">
        <Text
          numberOfLines={1}
          className="font-coach-semibold text-[15px]"
          style={{ color: LIGHT_THEME.wText }}
        >
          {race.name}
        </Text>
        <View className="mt-0.5 flex-row items-center gap-2">
          <Text
            className="font-coach text-[12px]"
            style={{ color: LIGHT_THEME.wSub }}
          >
            {formatDate(race.date)}
            {distance ? ` · ${distance}` : ""}
          </Text>
          {statusPill && (
            <View
              className="rounded-full px-2 py-0.5"
              style={{ backgroundColor: LIGHT_THEME.w3 }}
            >
              <Text
                className="font-coach-semibold text-[10px]"
                style={{ color: LIGHT_THEME.wSub }}
              >
                {statusPill}
              </Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={LIGHT_THEME.wMute} />
    </Pressable>
  );
}

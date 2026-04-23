import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { api } from "@packages/backend/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";

type EventDoc = NonNullable<
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

function sortEvents(events: EventDoc[]): EventDoc[] {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const past = events
    .filter((e) => e.date < today)
    .sort((a, b) => b.date.localeCompare(a.date));
  return [...upcoming, ...past];
}

export default function EventsListScreen() {
  const router = useRouter();
  const events = useQuery(api.plan.events.listMyEvents);

  const sorted = React.useMemo(() => (events ? sortEvents(events) : []), [events]);
  const today = new Date().toISOString().slice(0, 10);

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
          Events
        </Text>
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/(app)/account/events/[id]",
              params: { id: "new" },
            })
          }
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
        {events === undefined ? null : sorted.length === 0 ? (
          <View className="w-full max-w-md items-center gap-2 self-center pt-20">
            <Text
              className="font-coach-medium text-[15px]"
              style={{ color: LIGHT_THEME.wText }}
            >
              No events yet
            </Text>
            <Text
              className="text-center font-coach text-[13px]"
              style={{ color: LIGHT_THEME.wMute }}
            >
              Add a target race to focus your training.
            </Text>
          </View>
        ) : (
          <View className="w-full max-w-md gap-3 self-center">
            {sorted.map((event) => (
              <EventRow
                key={event._id}
                event={event}
                past={event.date < today}
                onPress={() =>
                  router.push({
                    pathname: "/(app)/account/events/[id]",
                    params: { id: event._id },
                  })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function EventRow({
  event,
  past,
  onPress,
}: {
  event: EventDoc;
  past: boolean;
  onPress: () => void;
}) {
  const priority = event.priority as "A" | "B" | "C";
  const distance = formatDistance(event.distanceMeters);

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border px-4 py-3.5 active:opacity-80"
      style={{
        backgroundColor: LIGHT_THEME.w1,
        borderColor: LIGHT_THEME.wBrd,
        opacity: past ? 0.55 : 1,
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
          {event.name}
        </Text>
        <Text
          className="mt-0.5 font-coach text-[12px]"
          style={{ color: LIGHT_THEME.wSub }}
        >
          {formatDate(event.date)}
          {distance ? ` · ${distance}` : ""}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={LIGHT_THEME.wMute} />
    </Pressable>
  );
}

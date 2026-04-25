import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { api } from "@packages/backend/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import type { FunctionReturnType } from "convex/server";
import React from "react";
import { Pressable, View } from "react-native";

export type RaceDoc = FunctionReturnType<
  typeof api.plan.races.listMyRaces
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

export function RaceRow({
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

import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { api } from "@packages/backend/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import type { FunctionReturnType } from "convex/server";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

export type RaceWithGoal = FunctionReturnType<
  typeof api.agoge.races.listMyRacesWithGoals
>[number];
export type RaceDoc = RaceWithGoal["race"];
export type GoalDoc = RaceWithGoal["goal"];

const PRIORITY_COLORS: Record<"A" | "B" | "C", string> = {
  A: COLORS.lime,
  B: LIGHT_THEME.w3,
  C: LIGHT_THEME.w3,
};

const PRIORITY_TEXT_COLORS: Record<"A" | "B" | "C", string> = {
  A: COLORS.black,
  B: LIGHT_THEME.wText,
  C: LIGHT_THEME.wSub,
};

type RaceStatusKey = "completed" | "cancelled" | "dnf" | "dns";

function formatDate(iso: string): string {
  // Slice handles legacy ISO-instant rows alongside the new YMD shape.
  const [y, m, d] = iso.slice(0, 10).split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function formatSecondsAsClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
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
  goal,
  dimmed,
  onPress,
}: {
  race: RaceDoc;
  goal: GoalDoc;
  dimmed: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const priority = race.priority as "A" | "B" | "C";
  const distance = formatDistance(race.distanceMeters);
  const statusPill =
    race.status !== "upcoming"
      ? t(`account.races.statusPills.${race.status as RaceStatusKey}`)
      : null;

  const targetText =
    goal && goal.category === "race" && goal.raceTarget
      ? goal.raceTarget.type === "finish"
        ? t("account.races.goal.targetFinish")
        : formatSecondsAsClock(goal.raceTarget.seconds)
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
        {goal && targetText && (
          <Text
            numberOfLines={1}
            className="mt-1 font-coach text-[12px]"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {targetText}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={16} color={LIGHT_THEME.wMute} />
    </Pressable>
  );
}

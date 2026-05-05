import {
  BLOCK_TYPE_COLORS,
  BLOCK_TYPE_LABELS,
  WORKOUT_TYPE_LABELS,
  workoutTypeColor,
  workoutTypeColorDim,
} from "@/components/app/training-plan/constants";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import { Ionicons } from "@expo/vector-icons";
import type { BlockDoc, WorkoutDoc } from "@nativesquare/agoge/schema";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";

type WorkoutWithRefs = WorkoutDoc & {
  providerRefs?: { provider: string; syncedAt: number }[];
};

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map((p) => Number.parseInt(p, 10));
  return new Date(y, m - 1, d);
}

function workoutDate(w: WorkoutWithRefs): string | undefined {
  return w.planned?.date ?? w.actual?.date;
}

function weekIndex(blockStartYmd: string, isoDate: string): number {
  const start = parseYmd(blockStartYmd);
  start.setHours(0, 0, 0, 0);
  const day = new Date(isoDate);
  day.setHours(0, 0, 0, 0);
  const diffMs = day.getTime() - start.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24) / 7));
}

function formatBlockRange(startYmd: string, endYmd: string): string {
  const s = parseYmd(startYmd);
  const e = parseYmd(endYmd);
  const sameYear = s.getFullYear() === e.getFullYear();
  const sOpts: Intl.DateTimeFormatOptions = sameYear
    ? { month: "short", day: "numeric" }
    : { month: "short", day: "numeric", year: "numeric" };
  return `${s.toLocaleDateString(undefined, sOpts)} → ${e.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
}

function formatWorkoutDay(iso: string): {
  weekday: string;
  day: string;
} {
  const d = new Date(iso);
  return {
    weekday: d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 3),
    day: String(d.getDate()),
  };
}

function formatDuration(seconds?: number): string | null {
  if (seconds == null || seconds <= 0) return null;
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m - h * 60;
  return rem === 0 ? `${h}h` : `${h}h${String(rem).padStart(2, "0")}`;
}

function formatDistance(meters?: number): string | null {
  if (meters == null || meters <= 0) return null;
  const km = meters / 1000;
  return `${km % 1 === 0 ? km.toFixed(0) : km.toFixed(1)} km`;
}

export default function TrainingPlanScreen() {
  const router = useRouter();
  const plan = useQuery(api.agoge.plans.getAthletePlan);
  const blocks = useQuery(api.agoge.blocks.listBlocksForActiveAthletePlan);
  const workouts = useQuery(api.agoge.workouts.listWorkouts, {});

  const sortedBlocks = React.useMemo(() => {
    if (!blocks) return [];
    return [...blocks].sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.startDate.localeCompare(b.startDate);
    });
  }, [blocks]);

  const workoutsByBlock = React.useMemo(() => {
    const map = new Map<string, WorkoutWithRefs[]>();
    for (const w of (workouts ?? []) as WorkoutWithRefs[]) {
      if (!w.blockId) continue;
      const arr = map.get(w.blockId) ?? [];
      arr.push(w);
      map.set(w.blockId, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) =>
        (workoutDate(a) ?? "").localeCompare(workoutDate(b) ?? ""),
      );
    }
    return map;
  }, [workouts]);

  const isLoading =
    plan === undefined || blocks === undefined || workouts === undefined;
  const hasNoPlan = !isLoading && plan === null;
  const hasNoBlocks = !isLoading && plan != null && sortedBlocks.length === 0;

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
          Training Plan
        </Text>
        {!hasNoPlan && !isLoading && (
          <Pressable
            onPress={() => {
              selectionFeedback();
              router.push("/(app)/account/training-plan/blocks/new");
            }}
            className="size-9 items-center justify-center rounded-full active:opacity-70"
            style={{ backgroundColor: LIGHT_THEME.wText }}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </Pressable>
        )}
      </View>

      {isLoading ? null : hasNoPlan ? (
        <EmptyState
          title="No active training plan"
          description="Your coach builds the plan once you set a target. Talk to your coach to get started."
        />
      ) : hasNoBlocks ? (
        <EmptyState
          title="No blocks yet"
          description="Blocks group consecutive weeks of training. Workouts go inside blocks."
          action={{
            label: "Add your first block",
            onPress: () => {
              selectionFeedback();
              router.push("/(app)/account/training-plan/blocks/new");
            },
          }}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="px-4 py-6"
        >
          <View className="w-full max-w-md gap-8 self-center">
            {sortedBlocks.map((block) => (
              <BlockSection
                key={block._id}
                block={block}
                workouts={workoutsByBlock.get(block._id) ?? []}
                onEditBlock={() =>
                  router.push({
                    pathname:
                      "/(app)/account/training-plan/blocks/[id]/edit",
                    params: { id: block._id },
                  })
                }
                onAddWorkout={() => {
                  selectionFeedback();
                  router.push({
                    pathname: "/(app)/workouts/schedule",
                    params: {
                      blockId: block._id,
                      date: block.startDate,
                    },
                  });
                }}
                onEditWorkout={(workoutId) =>
                  router.push({
                    pathname: "/(app)/workouts/[id]/edit",
                    params: { id: workoutId },
                  })
                }
              />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View className="w-full max-w-md items-center gap-3 self-center px-6 pt-20">
      <Text
        className="font-coach-medium text-[15px]"
        style={{ color: LIGHT_THEME.wText }}
      >
        {title}
      </Text>
      <Text
        className="text-center font-coach text-[13px]"
        style={{ color: LIGHT_THEME.wMute }}
      >
        {description}
      </Text>
      {action && (
        <Pressable
          onPress={action.onPress}
          className="mt-3 flex-row items-center gap-2 rounded-2xl px-5 py-3 active:opacity-90"
          style={{ backgroundColor: LIGHT_THEME.wText }}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text
            className="font-coach-bold text-[13px]"
            style={{ color: "#FFFFFF" }}
          >
            {action.label}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function BlockSection({
  block,
  workouts,
  onEditBlock,
  onAddWorkout,
  onEditWorkout,
}: {
  block: BlockDoc;
  workouts: WorkoutWithRefs[];
  onEditBlock: () => void;
  onAddWorkout: () => void;
  onEditWorkout: (workoutId: string) => void;
}) {
  const accent = BLOCK_TYPE_COLORS[block.type];
  const grouped = React.useMemo(() => {
    const byWeek = new Map<number, WorkoutWithRefs[]>();
    for (const w of workouts) {
      const date = workoutDate(w);
      if (!date) continue;
      const week = weekIndex(block.startDate, date);
      const arr = byWeek.get(week) ?? [];
      arr.push(w);
      byWeek.set(week, arr);
    }
    return Array.from(byWeek.entries()).sort(([a], [b]) => a - b);
  }, [workouts, block.startDate]);

  const showWeekHeaders = grouped.length > 1;

  return (
    <View className="gap-3">
      <Pressable
        onPress={onEditBlock}
        className="flex-row items-center gap-2 px-1 active:opacity-70"
      >
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: accent,
          }}
        />
        <View className="flex-1">
          <Text
            className="font-coach-extrabold text-[11px] uppercase"
            style={{ color: LIGHT_THEME.wSub, letterSpacing: 1.2 }}
          >
            {BLOCK_TYPE_LABELS[block.type]} · {block.name}
          </Text>
          <Text
            className="mt-0.5 font-coach text-[11px]"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {formatBlockRange(block.startDate, block.endDate)}
            {block.focus ? ` · ${block.focus}` : ""}
          </Text>
        </View>
        <Ionicons
          name="ellipsis-horizontal"
          size={16}
          color={LIGHT_THEME.wMute}
        />
      </Pressable>

      {grouped.length === 0 ? null : (
        <View className="gap-3">
          {grouped.map(([week, items]) => (
            <View key={week} className="gap-2">
              {showWeekHeaders && (
                <Text
                  className="px-1 font-coach-semibold text-[10px] uppercase"
                  style={{ color: LIGHT_THEME.wMute, letterSpacing: 1 }}
                >
                  Week {week + 1}
                </Text>
              )}
              {items.map((w) => (
                <WorkoutCard
                  key={w._id}
                  workout={w}
                  onPress={() => onEditWorkout(w._id)}
                />
              ))}
            </View>
          ))}
        </View>
      )}

      <Pressable
        onPress={onAddWorkout}
        className="flex-row items-center justify-center gap-2 rounded-2xl py-3 active:opacity-70"
        style={{
          borderWidth: 1,
          borderStyle: "dashed",
          borderColor: LIGHT_THEME.wBrd,
        }}
      >
        <Ionicons name="add" size={14} color={LIGHT_THEME.wMute} />
        <Text
          className="font-coach-semibold text-[12px]"
          style={{ color: LIGHT_THEME.wMute }}
        >
          Add workout
        </Text>
      </Pressable>
    </View>
  );
}

function WorkoutCard({
  workout,
  onPress,
}: {
  workout: WorkoutWithRefs;
  onPress: () => void;
}) {
  const date = workoutDate(workout);
  const day = date ? formatWorkoutDay(date) : null;
  const duration = formatDuration(workout.planned?.durationSeconds);
  const distance = formatDistance(workout.planned?.distanceMeters);
  const typeColor = workoutTypeColor(workout.type);
  const typeColorDim = workoutTypeColorDim(workout.type);
  const dimmed = workout.status === "skipped" || workout.status === "missed";
  const completed = workout.status === "completed";

  const subtitleParts = [WORKOUT_TYPE_LABELS[workout.type]];
  const meta = [duration, distance].filter(Boolean).join(" · ");
  if (meta) subtitleParts.push(meta);
  if (completed) subtitleParts.push("Done");
  else if (workout.status === "skipped") subtitleParts.push("Skipped");
  else if (workout.status === "missed") subtitleParts.push("Missed");

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border px-4 py-3.5 active:opacity-80"
      style={{
        backgroundColor: LIGHT_THEME.w1,
        borderColor: LIGHT_THEME.wBrd,
        opacity: dimmed ? 0.6 : 1,
      }}
    >
      <View
        className="size-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: typeColorDim }}
      >
        {day ? (
          <>
            <Text
              className="font-coach-extrabold uppercase"
              style={{
                color: typeColor,
                fontSize: 9,
                letterSpacing: 0.5,
                lineHeight: 11,
              }}
            >
              {day.weekday}
            </Text>
            <Text
              className="font-coach-extrabold"
              style={{
                color: typeColor,
                fontSize: 14,
                lineHeight: 16,
              }}
            >
              {day.day}
            </Text>
          </>
        ) : (
          <Ionicons name="calendar-outline" size={18} color={typeColor} />
        )}
      </View>
      <View className="flex-1">
        <Text
          numberOfLines={1}
          className="font-coach-semibold text-[15px]"
          style={{
            color: LIGHT_THEME.wText,
            textDecorationLine: dimmed ? "line-through" : undefined,
          }}
        >
          {workout.name}
        </Text>
        <Text
          numberOfLines={1}
          className="mt-0.5 font-coach text-[12px]"
          style={{ color: LIGHT_THEME.wSub }}
        >
          {subtitleParts.join(" · ")}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={LIGHT_THEME.wMute} />
    </Pressable>
  );
}

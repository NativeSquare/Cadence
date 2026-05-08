import { BLOCK_TYPE_COLORS } from "@/components/app/training-plan/constants";
import { blockTypeLabel } from "@/components/app/workout/workout-helpers";
import { AddWorkoutButton } from "@/components/app/workout/add-workout-button";
import { WorkoutCard } from "@/components/app/workout/workout-card";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import { useLanguage, type Language } from "@/lib/i18n";
import { Ionicons } from "@expo/vector-icons";
import type { TFunction } from "i18next";
import type { BlockDoc, WorkoutDoc } from "@nativesquare/agoge/schema";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
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

function formatBlockRange(
  locale: Language,
  startYmd: string,
  endYmd: string,
): string {
  const s = parseYmd(startYmd);
  const e = parseYmd(endYmd);
  const sameYear = s.getFullYear() === e.getFullYear();
  const sOpts: Intl.DateTimeFormatOptions = sameYear
    ? { month: "short", day: "numeric" }
    : { month: "short", day: "numeric", year: "numeric" };
  const start = new Intl.DateTimeFormat(locale, sOpts).format(s);
  const end = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(e);
  return `${start} → ${end}`;
}

export default function TrainingPlanScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const locale = useLanguage();
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
          {t("account.trainingPlan.title")}
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
          title={t("account.trainingPlan.empty.noPlan.title")}
          description={t("account.trainingPlan.empty.noPlan.description")}
        />
      ) : hasNoBlocks ? (
        <EmptyState
          title={t("account.trainingPlan.empty.noBlocks.title")}
          description={t("account.trainingPlan.empty.noBlocks.description")}
          action={{
            label: t("account.trainingPlan.empty.noBlocks.addFirst"),
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
                t={t}
                locale={locale}
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
  t,
  locale,
  block,
  workouts,
  onEditBlock,
  onAddWorkout,
  onEditWorkout,
}: {
  t: TFunction;
  locale: Language;
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
            {blockTypeLabel(t, block.type)} · {block.name}
          </Text>
          <Text
            className="mt-0.5 font-coach text-[11px]"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {formatBlockRange(locale, block.startDate, block.endDate)}
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
                  {t("account.trainingPlan.week", { number: week + 1 })}
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

      <AddWorkoutButton
        label={t("account.trainingPlan.addWorkout")}
        onPress={onAddWorkout}
      />
    </View>
  );
}


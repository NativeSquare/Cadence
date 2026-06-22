/**
 * NeedsFeedbackScreen - Triage list for past-planned workouts the user
 * hasn't categorized as done or missed.
 *
 * Each row exposes two quick actions: Mark Done (opens the existing
 * MarkDoneBottomSheet to capture RPE/notes) and Mark Missed (one-tap
 * `updateWorkout({status: "missed"})`). Rows fall out reactively as the
 * underlying Convex query updates.
 */

import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { WORKOUT_TYPES_COLORS } from "@packages/shared/colors";
import { useLanguage, type Language } from "@/lib/i18n";
import { selectionFeedback } from "@/lib/haptics";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { MarkDoneBottomSheet } from "@/components/app/workout/mark-done-bottom-sheet";
import {
  deriveWorkoutStatus,
  localTodayYmd,
  workoutTitle,
  workoutTypeLabel,
} from "@/components/app/workout/workout-helpers";
import { api } from "@packages/backend/convex/_generated/api";
import type { AgogeWorkout } from "@/components/app/plan/utils";

const LOOKBACK_DAYS = 84;

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysAgo(iso: string, today: Date): number {
  const [y, m, d] = iso
    .slice(0, 10)
    .split("-")
    .map((n) => parseInt(n, 10));
  const target = new Date(y, m - 1, d);
  target.setHours(0, 0, 0, 0);
  const t = new Date(today);
  t.setHours(0, 0, 0, 0);
  return Math.max(
    0,
    Math.round((t.getTime() - target.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

function formatRelativeDays(
  t: ReturnType<typeof useTranslation>["t"],
  days: number,
): string {
  if (days === 0) return t("workout.relativeDate.today");
  if (days === 1) return t("workout.relativeDate.yesterday");
  return t("workout.relativeDate.daysAgo", { count: days });
}

function formatLongDate(locale: Language, iso: string): string {
  const [y, m, d] = iso
    .slice(0, 10)
    .split("-")
    .map((n) => parseInt(n, 10));
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function NeedsFeedbackScreen() {
  const { t } = useTranslation();
  const locale = useLanguage();
  const router = useRouter();

  const today = React.useMemo(() => new Date(), []);
  const range = React.useMemo(() => {
    const start = new Date(today);
    start.setDate(start.getDate() - LOOKBACK_DAYS);
    return {
      startDate: `${toIsoDate(start)}T00:00:00.000Z`,
      endDate: `${toIsoDate(today)}T23:59:59.999Z`,
    };
  }, [today]);

  const workouts = useQuery(api.agoge.workouts.listWorkouts, range);
  const updateWorkout = useMutation(api.agoge.workouts.updateWorkout);
  const markDoneSheetRef = React.useRef<BottomSheetModal>(null);
  const [selected, setSelected] = React.useState<{
    id: string;
    name: string;
    plannedDate?: string;
  } | null>(null);
  const [pendingMissedId, setPendingMissedId] = React.useState<string | null>(
    null,
  );

  const needsFeedback = React.useMemo<AgogeWorkout[]>(() => {
    if (!workouts) return [];
    const todayYmd = localTodayYmd(today);
    return workouts
      .filter((w) => deriveWorkoutStatus(w, todayYmd) === "needs_feedback")
      .sort((a, b) => {
        // Oldest first — address the longest-lingering ones first.
        const ad = a.planned?.date ?? "";
        const bd = b.planned?.date ?? "";
        return ad.localeCompare(bd);
      });
  }, [workouts, today]);

  const handleMarkDone = (workout: AgogeWorkout) => {
    selectionFeedback();
    setSelected({
      id: workout._id,
      name: workout.name,
      plannedDate: workout.planned?.date,
    });
    markDoneSheetRef.current?.present();
  };

  const handleMarkMissed = async (workout: AgogeWorkout) => {
    selectionFeedback();
    setPendingMissedId(workout._id);
    try {
      await updateWorkout({ workoutId: workout._id, status: "missed" });
    } catch (err) {
      Alert.alert(
        t("workout.needsFeedback.markMissedError"),
        getConvexErrorMessage(err),
      );
    } finally {
      setPendingMissedId(null);
    }
  };

  const handleOpenDetail = (workoutId: string) => {
    router.push(`/(app)/workouts/${workoutId}`);
  };

  return (
    <View
      className="pt-safe flex-1"
      style={{ backgroundColor: LIGHT_THEME.w2 }}
    >
      <StatusBar barStyle="dark-content" animated />
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
        <View className="flex-1">
          <Text
            className="font-coach-bold text-lg"
            style={{ color: LIGHT_THEME.wText }}
          >
            {t("workout.needsFeedback.screenHeader")}
          </Text>
          <Text
            className="mt-0.5 font-coach text-[12px]"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {t("workout.needsFeedback.screenSubtitle")}
          </Text>
        </View>
      </View>

      {workouts === undefined ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={LIGHT_THEME.wMute} />
        </View>
      ) : needsFeedback.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text
            className="text-center font-coach-bold text-lg"
            style={{ color: LIGHT_THEME.wText }}
          >
            {t("workout.needsFeedback.emptyTitle")}
          </Text>
          <Text
            className="mt-2 text-center font-coach text-sm"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {t("workout.needsFeedback.emptyBody")}
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="px-4 py-4 gap-3"
        >
          {needsFeedback.map((workout) => (
            <TriageRow
              key={workout._id}
              workout={workout}
              today={today}
              locale={locale}
              onMarkDone={() => handleMarkDone(workout)}
              onMarkMissed={() => handleMarkMissed(workout)}
              onOpenDetail={() => handleOpenDetail(workout._id)}
              missedPending={pendingMissedId === workout._id}
            />
          ))}
        </ScrollView>
      )}

      {selected && (
        <MarkDoneBottomSheet
          sheetRef={markDoneSheetRef}
          workoutId={selected.id}
          workoutName={selected.name}
          plannedDate={selected.plannedDate}
        />
      )}
    </View>
  );
}

interface TriageRowProps {
  workout: AgogeWorkout;
  today: Date;
  locale: Language;
  onMarkDone: () => void;
  onMarkMissed: () => void;
  onOpenDetail: () => void;
  missedPending: boolean;
}

function TriageRow({
  workout,
  today,
  locale,
  onMarkDone,
  onMarkMissed,
  onOpenDetail,
  missedPending,
}: TriageRowProps) {
  const { t } = useTranslation();
  const plannedIso = workout.planned?.date ?? "";
  const days = plannedIso ? daysAgo(plannedIso, today) : 0;
  const typeColor = WORKOUT_TYPES_COLORS[workout.type];

  return (
    <View
      className="rounded-2xl border"
      style={{
        backgroundColor: LIGHT_THEME.w1,
        borderColor: LIGHT_THEME.wBrd,
      }}
    >
      <Pressable onPress={onOpenDetail} className="px-4 pt-3.5 pb-3 active:opacity-80">
        <View className="flex-row items-center justify-between">
          <Text
            className="font-coach-semibold text-[11px] uppercase tracking-wider"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {formatRelativeDays(t, days)}
          </Text>
          <Text
            className="font-coach text-[11px]"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {plannedIso ? formatLongDate(locale, plannedIso) : ""}
          </Text>
        </View>
        <View className="mt-1 flex-row items-start gap-2">
          <Text
            numberOfLines={1}
            className="flex-1 font-coach-bold text-base"
            style={{ color: LIGHT_THEME.wText }}
          >
            {workoutTitle(workout)}
          </Text>
          <View
            className="rounded-full px-2.5 py-1"
            style={{ backgroundColor: typeColor }}
          >
            <Text
              className="font-coach-bold text-[10px] uppercase tracking-wider"
              style={{ color: "#FFFFFF" }}
            >
              {workoutTypeLabel(t, workout.type)}
            </Text>
          </View>
        </View>
      </Pressable>

      <View
        className="flex-row gap-2 px-4 pb-3.5 pt-1"
        style={{ borderTopWidth: 0 }}
      >
        <Pressable
          onPress={onMarkMissed}
          disabled={missedPending}
          className="flex-1 items-center justify-center rounded-xl border py-2.5 active:opacity-80"
          style={{
            backgroundColor: LIGHT_THEME.w1,
            borderColor: LIGHT_THEME.wBrd,
            opacity: missedPending ? 0.5 : 1,
          }}
        >
          {missedPending ? (
            <ActivityIndicator size="small" color={COLORS.red} />
          ) : (
            <Text
              className="font-coach-bold text-[13px]"
              style={{ color: COLORS.red }}
            >
              {t("workout.needsFeedback.markMissed")}
            </Text>
          )}
        </Pressable>
        <Pressable
          onPress={onMarkDone}
          className="flex-1 items-center justify-center rounded-xl py-2.5 active:opacity-90"
          style={{ backgroundColor: LIGHT_THEME.wText }}
        >
          <Text
            className="font-coach-bold text-[13px]"
            style={{ color: "#FFFFFF" }}
          >
            {t("workout.needsFeedback.markDone")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default NeedsFeedbackScreen;

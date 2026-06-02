/**
 * Workout detail page.
 *
 * Hero with status/name/date/type, followed by a flat stack of
 * single-purpose cards: the AI coach analysis
 * first, then one card per recorded health metric, the planned structure in
 * its own card, and finally the post-session voice note. No planned-vs-actual
 * deltas — each card shows one thing.
 */

import { CoachInterventionCard } from "@/components/app/workout/coach-intervention-card";
import { ConfirmationSheet } from "@/components/shared/confirmation-sheet";
import { ManualPaceSheet } from "@/components/app/workout/manual-pace-sheet";
import { MarkDoneBottomSheet } from "@/components/app/workout/mark-done-bottom-sheet";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { WORKOUT_TYPES_COLORS } from "@packages/shared/colors";
import { useLanguage, type Language } from "@/lib/i18n";
import { selectionFeedback } from "@/lib/haptics";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import {
  deriveWorkoutStatus,
  localTodayYmd,
  mpsToPaceString,
  workoutTitle,
  workoutTypeLabel,
} from "@/components/app/workout/workout-helpers";
import { WorkoutAudioNote } from "@/components/app/workout/workout-audio-note";
import { WorkoutStatusBadge } from "@/components/app/workout/workout-status-badge";
import { WorkoutStructureView } from "@/components/app/workout/workout-structure-view";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import type { TFunction } from "i18next";
import type { Workout as WorkoutStructure } from "@nativesquare/agoge";
import type {
  ActualFace,
  PlannedFace,
  WorkoutType,
} from "@nativesquare/agoge/schema";
import { api } from "@packages/backend/convex/_generated/api";
import { summarizeStructure } from "@packages/shared/workout-summary";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  View,
} from "react-native";

export interface WorkoutDetailPageProps {
  workoutId: string;
}

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map((p) => Number.parseInt(p, 10));
  return new Date(y, m - 1, d);
}

function formatDate(locale: Language, iso: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parseIsoDate(iso));
}

function isFutureDay(iso: string): boolean {
  const target = parseIsoDate(iso);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return target.getTime() > today.getTime();
}

function formatRelativeDate(t: TFunction, iso: string): string | null {
  const target = parseIsoDate(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return t("workout.relativeDate.today");
  if (diffDays === 1) return t("workout.relativeDate.tomorrow");
  if (diffDays === -1) return t("workout.relativeDate.yesterday");
  if (diffDays > 0) return t("workout.relativeDate.inDays", { count: diffDays });
  return t("workout.relativeDate.daysAgo", { count: Math.abs(diffDays) });
}

function formatDistance(m?: number): string | null {
  if (m == null || m <= 0) return null;
  const km = Math.round((m / 1000) * 10) / 10;
  return `${km} km`;
}

function formatDurationSec(sec?: number): string | null {
  if (sec == null || sec <= 0) return null;
  const h = Math.floor(sec / 3600);
  const min = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h${String(min).padStart(2, "0")}`;
  return `${min}min`;
}

function formatPace(mps?: number): string | null {
  if (mps == null || mps <= 0) return null;
  const pace = mpsToPaceString(mps);
  return pace ? `${pace} /km` : null;
}

function formatHr(bpm?: number): string | null {
  if (bpm == null || bpm <= 0) return null;
  return `${Math.round(bpm)} bpm`;
}

function formatElevation(m?: number): string | null {
  if (m == null || m <= 0) return null;
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m)} m`;
}

function getTypeColor(type: WorkoutType): string {
  return WORKOUT_TYPES_COLORS[type];
}

function paceFromDistanceDuration(
  distanceMeters?: number,
  durationSeconds?: number,
): number | undefined {
  if (!distanceMeters || !durationSeconds) return undefined;
  if (distanceMeters <= 0 || durationSeconds <= 0) return undefined;
  return distanceMeters / durationSeconds;
}

export function WorkoutDetailPage({ workoutId }: WorkoutDetailPageProps) {
  const { t } = useTranslation();
  const locale = useLanguage();
  const router = useRouter();
  const result = useQuery(api.agoge.workouts.getWorkout, {
    workoutId,
  });
  const intervention = useQuery(api.engine.interventions.activeForWorkout, {
    workoutId,
  });
  const deleteWorkout = useMutation(api.agoge.workouts.deleteWorkout);
  const deleteSheetRef = React.useRef<BottomSheetModal>(null);
  const markDoneSheetRef = React.useRef<BottomSheetModal>(null);
  const manualPaceSheetRef = React.useRef<BottomSheetModal>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (result === undefined) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: LIGHT_THEME.w2 }}
      >
        <ActivityIndicator color={LIGHT_THEME.wMute} />
      </View>
    );
  }

  if (result === null) {
    return (
      <View
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: LIGHT_THEME.w2 }}
      >
        <Text
          className="text-center font-coach text-sm"
          style={{ color: LIGHT_THEME.wMute }}
        >
          {t("workout.errors.notFound")}
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 rounded-full border px-4 py-2 active:opacity-80"
          style={{ borderColor: LIGHT_THEME.wBrd }}
        >
          <Text
            className="font-coach-semibold text-[13px]"
            style={{ color: LIGHT_THEME.wText }}
          >
            {t("workout.common.goBack")}
          </Text>
        </Pressable>
      </View>
    );
  }

  const { workout } = result;
  const heroDate = workout.planned?.date ?? workout.actual?.date;
  const effectiveStatus = deriveWorkoutStatus(workout, localTodayYmd());

  const handleMarkAsDone = () => {
    selectionFeedback();
    markDoneSheetRef.current?.present();
  };

  const canMarkAsDone =
    (effectiveStatus === "planned" ||
      effectiveStatus === "missed" ||
      effectiveStatus === "needs_feedback") &&
    workout.planned != null &&
    !isFutureDay(workout.planned.date);

  const isBaselineTest =
    workout.type === "test" && effectiveStatus === "planned";

  const handleManualPace = () => {
    selectionFeedback();
    manualPaceSheetRef.current?.present();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteWorkout({ workoutId: workout._id });
      deleteSheetRef.current?.dismiss();
      router.back();
    } catch (err) {
      setError(getConvexErrorMessage(err));
      setIsDeleting(false);
    }
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
        <Text
          className="flex-1 font-coach-bold text-lg"
          style={{ color: LIGHT_THEME.wText }}
        >
          {t("workout.detail.header")}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6"
      >
        <View className="w-full max-w-md gap-6 self-center">
          <View>
            <View className="mb-2 flex-row items-start justify-between gap-3">
              <Text
                className="flex-1 font-coach-bold text-[15px] uppercase"
                style={{
                  color: getTypeColor(workout.type),
                  letterSpacing: 0.08 * 15,
                }}
                numberOfLines={1}
              >
                {workoutTypeLabel(t, workout.type)}
              </Text>
              <WorkoutStatusBadge status={effectiveStatus} tone="light" />
            </View>
            <Text
              className="font-coach-bold text-[26px]"
              style={{
                color: LIGHT_THEME.wText,
                letterSpacing: -0.02 * 26,
                lineHeight: 30,
              }}
            >
              {workoutTitle(workout)}
            </Text>
            {heroDate && (
              <View className="mt-2 flex-row flex-wrap items-center gap-1.5">
                <Text
                  className="font-coach text-sm"
                  style={{ color: LIGHT_THEME.wMute }}
                >
                  {formatDate(locale, heroDate)}
                </Text>
                {(() => {
                  const rel = formatRelativeDate(t, heroDate);
                  return rel ? (
                    <>
                      <Text
                        className="font-coach text-sm"
                        style={{ color: LIGHT_THEME.wMute }}
                      >
                        ·
                      </Text>
                      <Text
                        className="font-coach-semibold text-sm"
                        style={{ color: LIGHT_THEME.wSub }}
                      >
                        {rel}
                      </Text>
                    </>
                  ) : null;
                })()}
              </View>
            )}
          </View>

          {/* AI coach analysis leads the readout. */}
          {intervention && (
            <CoachInterventionCard intervention={intervention} />
          )}

          {/* Recorded health data — one card per metric. */}
          {workout.actual && <HealthMetrics actual={workout.actual} />}

          {/* Planned structure in its own card. */}
          {workout.planned && <StructureCard planned={workout.planned} />}

          {/* Post-session voice note (self-hides when absent). */}
          {workout.actual && <WorkoutAudioNote workoutId={workoutId} />}

          {error && (
            <Text
              className="text-center font-coach text-sm"
              style={{ color: COLORS.red }}
            >
              {error}
            </Text>
          )}
        </View>
      </ScrollView>

      <View className="mb-safe w-full max-w-md gap-2 self-center px-4 pb-4">
        {canMarkAsDone && (
          <Pressable
            onPress={handleMarkAsDone}
            className="items-center rounded-2xl py-3.5 active:opacity-90"
            style={{ backgroundColor: LIGHT_THEME.wText }}
          >
            <Text
              className="font-coach-bold text-sm"
              style={{ color: "#FFFFFF" }}
            >
              {t("workout.detail.actions.markAsDone")}
            </Text>
          </Pressable>
        )}
        {isBaselineTest && (
          <Pressable
            onPress={handleManualPace}
            className="items-center rounded-2xl py-3 active:opacity-80"
          >
            <Text
              className="font-coach-semibold text-sm underline"
              style={{ color: LIGHT_THEME.wMute }}
            >
              {t("workout.baseline.manualCta")}
            </Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => {
            selectionFeedback();
            deleteSheetRef.current?.present();
          }}
          className="items-center rounded-2xl border py-3.5 active:opacity-80"
          style={{
            backgroundColor: LIGHT_THEME.w1,
            borderColor: LIGHT_THEME.wBrd,
          }}
        >
          <Text
            className="font-coach-semibold text-sm"
            style={{ color: COLORS.red }}
          >
            {t("workout.common.delete")}
          </Text>
        </Pressable>
      </View>

      <ConfirmationSheet
        sheetRef={deleteSheetRef}
        icon="trash-outline"
        title={t("workout.common.deleteWorkout")}
        description={t("workout.common.cannotUndo")}
        confirmLabel={t("workout.common.delete")}
        destructive
        loading={isDeleting}
        onConfirm={handleDelete}
      />

      <MarkDoneBottomSheet
        sheetRef={markDoneSheetRef}
        workoutId={workout._id}
        workoutName={workout.name}
        isTest={workout.type === "test"}
        plannedDate={workout.planned?.date}
      />

      <ManualPaceSheet
        sheetRef={manualPaceSheetRef}
        onSuccess={() => router.replace("/(app)/(tabs)")}
      />
    </View>
  );
}

// ── Health metrics: one card per recorded metric ──
//
// Each recorded value (distance, duration, pace, avg/max HR, elevation) gets
// its own dedicated card — roomy, single-purpose, and ready to host a
// per-metric chart later (e.g. HR over time once we store samples). No
// planned-vs-actual deltas: each card shows exactly one number.
function HealthMetrics({ actual }: { actual: ActualFace }) {
  const { t } = useTranslation();

  const pace = formatPace(
    paceFromDistanceDuration(actual.distanceMeters, actual.durationSeconds),
  );

  const metrics: { label: string; value: string }[] = [];
  const distance = formatDistance(actual.distanceMeters);
  if (distance)
    metrics.push({ label: t("workout.detail.metrics.distance"), value: distance });
  const duration = formatDurationSec(actual.durationSeconds);
  if (duration)
    metrics.push({ label: t("workout.detail.metrics.duration"), value: duration });
  if (pace)
    metrics.push({ label: t("workout.detail.metrics.avgPace"), value: pace });
  const avgHr = formatHr(actual.avgHr);
  if (avgHr)
    metrics.push({ label: t("workout.detail.metrics.avgHr"), value: avgHr });
  const maxHr = formatHr(actual.maxHr);
  if (maxHr)
    metrics.push({ label: t("workout.detail.metrics.maxHr"), value: maxHr });
  const elev = formatElevation(actual.elevationGainMeters);
  if (elev)
    metrics.push({
      label: t("workout.detail.metrics.elevationGain"),
      value: elev,
    });

  return (
    <>
      {metrics.map((m) => (
        <MetricCard key={m.label} label={m.label} value={m.value} />
      ))}
    </>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <SectionLabel>{label}</SectionLabel>
      <Text
        className="font-coach-bold text-[26px]"
        style={{ color: LIGHT_THEME.wText, letterSpacing: -0.4, lineHeight: 30 }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </Card>
  );
}

// ── Structure card: the planned prescription, always its own card ──
function StructureCard({ planned }: { planned: PlannedFace }) {
  const { t } = useTranslation();

  const structure = planned.structure as WorkoutStructure | undefined;
  const hasStructure =
    structure != null &&
    Array.isArray(structure.blocks) &&
    structure.blocks.length > 0;
  if (!hasStructure || !structure) return null;

  const summary = summarizeStructure(structure);
  const distance = formatDistance(summary?.distanceMeters);
  const duration = formatDurationSec(summary?.durationSeconds);
  const totalParts = [distance, duration].filter(Boolean) as string[];
  const total = totalParts.length > 0 ? totalParts.join(" · ") : null;

  return (
    <Card>
      <View className="flex-row items-baseline justify-between gap-2">
        <SectionLabel>{t("workout.detail.structure")}</SectionLabel>
        {total && (
          <Text
            className="font-coach-semibold text-[13px]"
            style={{ color: LIGHT_THEME.wText }}
          >
            {total}
          </Text>
        )}
      </View>
      <WorkoutStructureView structure={structure} />
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      className="gap-4 rounded-2xl border p-4"
      style={{
        backgroundColor: LIGHT_THEME.w1,
        borderColor: LIGHT_THEME.wBrd,
      }}
    >
      {children}
    </View>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      className="font-coach-semibold text-[11px] uppercase tracking-wider"
      style={{ color: LIGHT_THEME.wMute }}
    >
      {children}
    </Text>
  );
}

export default WorkoutDetailPage;

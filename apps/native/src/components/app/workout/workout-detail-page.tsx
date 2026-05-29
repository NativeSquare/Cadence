/**
 * Workout detail page.
 *
 * Surfaces the full agoge workout doc: hero with status/name/date/sport/type
 * and (when available) plan-block context, optional description, stacked
 * Planned and Actual cards each with their own metrics + structure.
 *
 * The richer AI-coach analysis layout is being designed separately and will
 * compose on top of this readout.
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
  blockTypeLabel,
  deriveWorkoutStatus,
  localTodayYmd,
  mpsToPaceString,
  workoutTypeLabel,
} from "@/components/app/workout/workout-helpers";
import { WorkoutStatusBadge } from "@/components/app/workout/workout-status-badge";
import { WorkoutStructureView } from "@/components/app/workout/workout-structure-view";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import type { TFunction } from "i18next";
import type { Workout as WorkoutStructure } from "@nativesquare/agoge";
import type { WorkoutType } from "@nativesquare/agoge/schema";
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

function formatRpe(rpe?: number): string | null {
  if (rpe == null || rpe <= 0) return null;
  return `RPE ${rpe}`;
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

// Compliance color thresholds per UX direction (2026-03-26): how far the
// recorded value drifted from the prescribed target. Used for inline metric
// deltas between planned and actual.
function complianceColor(deviation: number): string {
  const abs = Math.abs(deviation);
  if (abs < 0.05) return "#15803D"; // green
  if (abs < 0.15) return "#B45309"; // amber
  if (abs < 0.25) return "#C2410C"; // orange
  return "#B91C1C"; // red
}

interface Delta {
  label: string;
  color: string;
}

function metersDelta(planned?: number, actual?: number): Delta | null {
  if (!planned || !actual || planned <= 0) return null;
  const diff = actual - planned;
  const sign = diff >= 0 ? "+" : "−";
  const abs = Math.abs(diff);
  const label =
    abs >= 100
      ? `${sign}${(abs / 1000).toFixed(abs >= 1000 ? 1 : 2)} km`
      : `${sign}${Math.round(abs)} m`;
  return { label, color: complianceColor(diff / planned) };
}

function secondsDelta(planned?: number, actual?: number): Delta | null {
  if (!planned || !actual || planned <= 0) return null;
  const diff = actual - planned;
  const sign = diff >= 0 ? "+" : "−";
  const abs = Math.abs(diff);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  let core: string;
  if (h > 0) core = `${h}h${String(m).padStart(2, "0")}`;
  else if (m > 0) core = s > 0 ? `${m}m${String(s).padStart(2, "0")}` : `${m}m`;
  else core = `${s}s`;
  return { label: `${sign}${core}`, color: complianceColor(diff / planned) };
}

function paceDelta(plannedMps?: number, actualMps?: number): Delta | null {
  if (!plannedMps || !actualMps || plannedMps <= 0 || actualMps <= 0) return null;
  const plannedSecPerKm = 1000 / plannedMps;
  const actualSecPerKm = 1000 / actualMps;
  const diff = actualSecPerKm - plannedSecPerKm;
  const sign = diff >= 0 ? "+" : "−";
  const abs = Math.round(Math.abs(diff));
  let core: string;
  if (abs >= 60) {
    const m = Math.floor(abs / 60);
    const s = abs % 60;
    core = s > 0 ? `${m}m${String(s).padStart(2, "0")}` : `${m}m`;
  } else {
    core = `${abs}s`;
  }
  return {
    label: `${sign}${core}/km`,
    color: complianceColor(diff / plannedSecPerKm),
  };
}

function computeBlockProgress(
  block: { startDate: string; endDate: string },
  date: string,
): { week: number; total: number } | null {
  const start = parseIsoDate(block.startDate).getTime();
  const end = parseIsoDate(block.endDate).getTime();
  const target = parseIsoDate(date).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  const dayMs = 1000 * 60 * 60 * 24;
  const week = Math.floor((target - start) / (7 * dayMs)) + 1;
  const total = Math.max(1, Math.ceil((end - start + dayMs) / (7 * dayMs)));
  if (week < 1 || week > total) return null;
  return { week, total };
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

  const { workout, block } = result;
  const heroDate = workout.planned?.date ?? workout.actual?.date;
  const blockProgress =
    block && heroDate ? computeBlockProgress(block, heroDate) : null;
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

  const showActualDate =
    workout.planned?.date &&
    workout.actual?.date &&
    workout.planned.date !== workout.actual.date;

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
                className="flex-1 font-coach-semibold text-[11px] uppercase"
                style={{
                  color: getTypeColor(workout.type),
                  letterSpacing: 0.08 * 11,
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
              {workout.name}
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
            {block && blockProgress && (
              <View className="mt-3 flex-row flex-wrap gap-2">
                <Chip>
                  {t("workout.detail.weekOfBlock", {
                    type: blockTypeLabel(t, block.type),
                    week: blockProgress.week,
                    total: blockProgress.total,
                  })}
                </Chip>
              </View>
            )}
          </View>

          {workout.description && workout.description.trim().length > 0 && (
            <Card>
              <SectionLabel>{t("workout.detail.description")}</SectionLabel>
              <Text
                className="font-coach text-[14px] leading-6"
                style={{ color: LIGHT_THEME.wText }}
              >
                {workout.description}
              </Text>
            </Card>
          )}

          {intervention && (
            <CoachInterventionCard intervention={intervention} />
          )}

          {workout.actual && (
            <ResultCard
              actual={workout.actual}
              planned={workout.planned}
              actualDateLabel={
                showActualDate
                  ? formatDate(locale, workout.actual.date)
                  : undefined
              }
            />
          )}

          {workout.planned && (
            <PlanCard
              planned={workout.planned}
              collapsedByDefault={Boolean(workout.actual)}
            />
          )}

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

type PlannedFace = {
  date: string;
  structure?: unknown;
};

type ActualFace = {
  date: string;
  durationSeconds?: number;
  distanceMeters?: number;
  avgHr?: number;
  maxHr?: number;
  elevationGainMeters?: number;
  rpe?: number;
  notes?: string;
};

// ── Primary stat: big value + (optional) compliance-colored delta ──
function PrimaryStat({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: Delta | null;
}) {
  return (
    <View className="flex-1 gap-1">
      <Text
        className="font-coach-semibold text-[10px] uppercase tracking-wider"
        style={{ color: LIGHT_THEME.wMute }}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text
        className="font-coach-bold text-[22px]"
        style={{ color: LIGHT_THEME.wText, letterSpacing: -0.4, lineHeight: 26 }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      {delta && (
        <Text
          className="font-coach-semibold text-[11px]"
          style={{ color: delta.color }}
          numberOfLines={1}
        >
          {delta.label}
        </Text>
      )}
    </View>
  );
}

// ── Secondary stat: compact label-value pair for less-prominent metrics ──
function SecondaryStat({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-0 flex-row items-baseline gap-1.5">
      <Text
        className="font-coach text-[12px]"
        style={{ color: LIGHT_THEME.wMute }}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text
        className="font-coach-semibold text-[13px]"
        style={{ color: LIGHT_THEME.wText }}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

// ── Result hero: actual metrics with planned-vs comparison deltas ──
//
// Primary stats (distance/duration/pace/HR) sit in a 2×2 grid with
// compliance-colored deltas vs the prescribed plan; secondary metrics
// (max HR / elevation / RPE) chip below.
function ResultCard({
  actual,
  planned,
  actualDateLabel,
}: {
  actual: ActualFace;
  planned?: PlannedFace;
  actualDateLabel?: string;
}) {
  const { t } = useTranslation();

  const plannedSummary = React.useMemo(() => {
    if (!planned?.structure) return undefined;
    return summarizeStructure(planned.structure as WorkoutStructure);
  }, [planned?.structure]);

  const actualPaceMps = paceFromDistanceDuration(
    actual.distanceMeters,
    actual.durationSeconds,
  );

  const distance = formatDistance(actual.distanceMeters);
  const duration = formatDurationSec(actual.durationSeconds);
  const pace = formatPace(actualPaceMps);
  const avgHr = formatHr(actual.avgHr);

  const primary: { label: string; value: string; delta?: Delta | null }[] = [];
  if (distance)
    primary.push({
      label: t("workout.detail.metrics.distance"),
      value: distance,
      delta: metersDelta(plannedSummary?.distanceMeters, actual.distanceMeters),
    });
  if (duration)
    primary.push({
      label: t("workout.detail.metrics.duration"),
      value: duration,
      delta: secondsDelta(
        plannedSummary?.durationSeconds,
        actual.durationSeconds,
      ),
    });
  const plannedPaceMps = paceFromDistanceDuration(
    plannedSummary?.distanceMeters,
    plannedSummary?.durationSeconds,
  );
  if (pace)
    primary.push({
      label: t("workout.detail.metrics.avgPace"),
      value: pace,
      delta: paceDelta(plannedPaceMps, actualPaceMps),
    });
  if (avgHr)
    primary.push({ label: t("workout.detail.metrics.avgHr"), value: avgHr });

  const secondary: { label: string; value: string }[] = [];
  const maxHr = formatHr(actual.maxHr);
  if (maxHr)
    secondary.push({ label: t("workout.detail.metrics.maxHr"), value: maxHr });
  const elev = formatElevation(actual.elevationGainMeters);
  if (elev)
    secondary.push({
      label: t("workout.detail.metrics.elevationGain"),
      value: elev,
    });
  const rpe = formatRpe(actual.rpe);
  if (rpe) secondary.push({ label: t("workout.detail.metrics.rpe"), value: rpe });

  const primaryRows: typeof primary[] = [];
  for (let i = 0; i < primary.length; i += 2) {
    primaryRows.push(primary.slice(i, i + 2));
  }

  const notes = actual.notes?.trim();

  return (
    <Card>
      <View className="flex-row items-center justify-between">
        <SectionLabel>{t("workout.detail.result")}</SectionLabel>
        {actualDateLabel && (
          <Text
            className="font-coach text-[12px]"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {actualDateLabel}
          </Text>
        )}
      </View>

      {primaryRows.length > 0 && (
        <View className="gap-4">
          {primaryRows.map((row, idx) => (
            <View key={idx} className="flex-row gap-4">
              {row.map((stat) => (
                <PrimaryStat
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                  delta={stat.delta}
                />
              ))}
              {row.length === 1 && <View className="flex-1" />}
            </View>
          ))}
        </View>
      )}

      {secondary.length > 0 && (
        <View
          className="flex-row flex-wrap"
          style={{ rowGap: 8, columnGap: 14 }}
        >
          {secondary.map((s) => (
            <SecondaryStat key={s.label} label={s.label} value={s.value} />
          ))}
        </View>
      )}

      {notes && (
        <View
          className="gap-1.5 pt-1"
          style={{ borderTopWidth: 1, borderTopColor: LIGHT_THEME.wBrd }}
        >
          <Text
            className="pt-3 font-coach-semibold text-[11px] uppercase tracking-wider"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {t("workout.detail.notes")}
          </Text>
          <Text
            className="font-coach text-[14px] leading-6"
            style={{ color: LIGHT_THEME.wText }}
          >
            {notes}
          </Text>
        </View>
      )}
    </Card>
  );
}

// ── Plan card: prescription view ──
//
// When no actual exists, the plan IS the page — render expanded. When an
// actual exists, the plan becomes secondary reference material — render
// collapsed with the volume teaser visible; tap to expand the full
// structure + notes.
function PlanCard({
  planned,
  collapsedByDefault,
}: {
  planned: PlannedFace;
  collapsedByDefault: boolean;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = React.useState(!collapsedByDefault);

  const structure = planned.structure as WorkoutStructure | undefined;
  const hasStructure =
    structure != null &&
    Array.isArray(structure.blocks) &&
    structure.blocks.length > 0;
  const summary = hasStructure && structure
    ? summarizeStructure(structure)
    : undefined;

  const distance = formatDistance(summary?.distanceMeters);
  const duration = formatDurationSec(summary?.durationSeconds);
  const totalParts = [distance, duration].filter(Boolean) as string[];
  const total = totalParts.length > 0 ? totalParts.join(" · ") : null;

  const hasDetails = hasStructure;

  const title = collapsedByDefault
    ? t("workout.detail.whatWasPlanned")
    : t("workout.detail.plan");

  const header = (
    <View className="flex-row items-center justify-between">
      <View className="flex-1 flex-row items-baseline gap-2">
        <Text
          className="font-coach-semibold text-[11px] uppercase tracking-wider"
          style={{ color: LIGHT_THEME.wMute }}
        >
          {title}
        </Text>
        {total && (
          <Text
            className="font-coach-semibold text-[13px]"
            style={{ color: LIGHT_THEME.wText }}
          >
            {total}
          </Text>
        )}
      </View>
      {hasDetails && collapsedByDefault && (
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={16}
          color={LIGHT_THEME.wMute}
        />
      )}
    </View>
  );

  const body = (
    <>
      {hasStructure && structure && (
        <View className="gap-2">
          <Text
            className="font-coach-semibold text-[11px] uppercase tracking-wider"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {t("workout.detail.structure")}
          </Text>
          <WorkoutStructureView structure={structure} />
        </View>
      )}
    </>
  );

  if (!collapsedByDefault) {
    return (
      <Card>
        {header}
        {body}
      </Card>
    );
  }

  return (
    <Card>
      {hasDetails ? (
        <Pressable
          onPress={() => {
            selectionFeedback();
            setExpanded((v) => !v);
          }}
          className="active:opacity-80"
        >
          {header}
        </Pressable>
      ) : (
        header
      )}
      {expanded && body}
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

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <View
      className="self-start rounded-full border px-3 py-1"
      style={{
        backgroundColor: LIGHT_THEME.w1,
        borderColor: LIGHT_THEME.wBrd,
      }}
    >
      <Text
        className="font-coach-semibold text-[12px]"
        style={{ color: LIGHT_THEME.wSub }}
      >
        {children}
      </Text>
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

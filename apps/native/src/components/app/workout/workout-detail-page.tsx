/**
 * Workout detail page.
 *
 * Surfaces the full agoge workout doc: hero with status/name/date/sport/type
 * and (when available) plan-block context, optional description, stacked
 * Planned and Actual cards each with their own metrics + structure, and an
 * adherence card when the engine has filled it in.
 *
 * The richer AI-coach analysis layout is being designed separately and will
 * compose on top of this readout.
 */

import { ConfirmationSheet } from "@/components/shared/confirmation-sheet";
import { Text } from "@/components/ui/text";
import {
  COLORS,
  getWorkoutCategory,
  LIGHT_THEME,
  WORKOUT_CATEGORY_COLORS,
} from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import {
  mpsToPaceString,
  WORKOUT_TYPE_COLORS,
} from "@/components/app/workout/workout-helpers";
import { WorkoutStructureView } from "@/components/app/workout/workout-structure-view";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import type { Workout as WorkoutStructure } from "@nativesquare/agoge";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
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

const STATUS_LABEL: Record<string, string> = {
  planned: "Planned",
  completed: "Completed",
  missed: "Missed",
  skipped: "Skipped",
};

const STATUS_COLOR: Record<string, string> = {
  planned: COLORS.blu,
  completed: COLORS.grn,
  missed: COLORS.red,
  skipped: COLORS.ylw,
};

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map((p) => Number.parseInt(p, 10));
  return new Date(y, m - 1, d);
}

function formatDate(iso: string): string {
  return parseIsoDate(iso).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelativeDate(iso: string): string | null {
  const target = parseIsoDate(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 0) return `In ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
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

function formatLoad(load?: number): string | null {
  if (load == null || load <= 0) return null;
  return String(Math.round(load));
}

function formatType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getTypeColor(type: string): string {
  const direct = (WORKOUT_TYPE_COLORS as Record<string, string>)[type];
  if (direct) return direct;
  return WORKOUT_CATEGORY_COLORS[getWorkoutCategory(type)];
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
  const router = useRouter();
  const result = useQuery(api.agoge.workouts.getWorkout, {
    workoutId,
  });
  const deleteWorkout = useMutation(api.agoge.workouts.deleteWorkout);
  const deleteSheetRef = React.useRef<BottomSheetModal>(null);
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
          Workout not found
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
            Go back
          </Text>
        </Pressable>
      </View>
    );
  }

  const { workout, block } = result;
  const heroDate = workout.planned?.date ?? workout.actual?.date;
  const blockProgress =
    block && heroDate ? computeBlockProgress(block, heroDate) : null;

  const handleEdit = () => {
    selectionFeedback();
    router.push({
      pathname: "/(app)/workouts/[id]/edit",
      params: { id: workout._id },
    });
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
          Workout
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6"
      >
        <View className="w-full max-w-md gap-6 self-center">
          <View className="gap-2">
            <View className="flex-row items-start justify-between gap-3">
              <Text
                className="flex-1 font-coach-bold text-2xl"
                style={{ color: LIGHT_THEME.wText }}
              >
                {workout.name}
              </Text>
              <Chip accent={getTypeColor(workout.type)} prominent>
                {formatType(workout.type)}
              </Chip>
            </View>
            <View className="flex-row flex-wrap items-center gap-2">
              <View className="flex-row items-center gap-1.5">
                <View
                  className="size-2 rounded-full"
                  style={{
                    backgroundColor: STATUS_COLOR[workout.status] ?? COLORS.blu,
                  }}
                />
                <Text
                  className="font-coach-semibold text-[12px] uppercase tracking-wider"
                  style={{
                    color: STATUS_COLOR[workout.status] ?? COLORS.blu,
                  }}
                >
                  {STATUS_LABEL[workout.status] ?? workout.status}
                </Text>
              </View>
              {heroDate && (
                <>
                  <Text
                    className="font-coach text-sm"
                    style={{ color: LIGHT_THEME.wMute }}
                  >
                    ·
                  </Text>
                  <Text
                    className="font-coach text-sm"
                    style={{ color: LIGHT_THEME.wMute }}
                  >
                    {formatDate(heroDate)}
                  </Text>
                  {(() => {
                    const rel = formatRelativeDate(heroDate);
                    return rel ? (
                      <Text
                        className="font-coach-semibold text-sm"
                        style={{ color: LIGHT_THEME.wSub }}
                      >
                        · {rel}
                      </Text>
                    ) : null;
                  })()}
                </>
              )}
            </View>
            {block && blockProgress && (
              <View className="mt-1 flex-row flex-wrap gap-2">
                <Chip>
                  {formatType(block.type)} · Week {blockProgress.week} of{" "}
                  {blockProgress.total}
                </Chip>
              </View>
            )}
          </View>

          {workout.description && workout.description.trim().length > 0 && (
            <Card>
              <SectionLabel>Description</SectionLabel>
              <Text
                className="font-coach text-[14px] leading-6"
                style={{ color: LIGHT_THEME.wText }}
              >
                {workout.description}
              </Text>
            </Card>
          )}

          {workout.planned && (
            <FaceCard
              title="Planned"
              face={workout.planned}
              extended={false}
            />
          )}

          {workout.actual && (
            <FaceCard
              title="Actual"
              face={workout.actual}
              extended
              dateLabel={
                showActualDate ? formatDate(workout.actual.date) : undefined
              }
            />
          )}

          {workout.adherence && <AdherenceCard adherence={workout.adherence} />}

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
        <Pressable
          onPress={handleEdit}
          className="items-center rounded-2xl py-3.5 active:opacity-90"
          style={{ backgroundColor: LIGHT_THEME.wText }}
        >
          <Text
            className="font-coach-bold text-sm"
            style={{ color: "#FFFFFF" }}
          >
            Edit workout
          </Text>
        </Pressable>
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
            Delete
          </Text>
        </Pressable>
      </View>

      <ConfirmationSheet
        sheetRef={deleteSheetRef}
        icon="trash-outline"
        title="Delete workout"
        description="This cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </View>
  );
}

type WorkoutFace = {
  date: string;
  structure?: unknown;
  durationSeconds?: number;
  distanceMeters?: number;
  load?: number;
  avgPaceMps?: number;
  avgHr?: number;
  maxHr?: number;
  elevationGainMeters?: number;
  rpe?: number;
  notes?: string;
};

function FaceCard({
  title,
  face,
  extended,
  dateLabel,
}: {
  title: string;
  face: WorkoutFace;
  extended: boolean;
  dateLabel?: string;
}) {
  const rows: { label: string; value: string }[] = [];
  const distance = formatDistance(face.distanceMeters);
  if (distance) rows.push({ label: "Distance", value: distance });
  const duration = formatDurationSec(face.durationSeconds);
  if (duration) rows.push({ label: "Duration", value: duration });
  if (extended) {
    const pace = formatPace(face.avgPaceMps);
    if (pace) rows.push({ label: "Avg pace", value: pace });
    const avgHr = formatHr(face.avgHr);
    if (avgHr) rows.push({ label: "Avg HR", value: avgHr });
    const maxHr = formatHr(face.maxHr);
    if (maxHr) rows.push({ label: "Max HR", value: maxHr });
    const elev = formatElevation(face.elevationGainMeters);
    if (elev) rows.push({ label: "Elevation gain", value: elev });
    const rpe = formatRpe(face.rpe);
    if (rpe) rows.push({ label: "RPE", value: rpe });
    const load = formatLoad(face.load);
    if (load) rows.push({ label: "Load", value: load });
  }

  const structure = face.structure as WorkoutStructure | undefined;
  const hasStructure =
    structure != null &&
    Array.isArray(structure.blocks) &&
    structure.blocks.length > 0;

  return (
    <Card>
      <View className="flex-row items-center justify-between">
        <SectionLabel>{title}</SectionLabel>
        {dateLabel && (
          <Text
            className="font-coach text-[12px]"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {dateLabel}
          </Text>
        )}
      </View>
      {rows.length > 0 && (
        <View className="gap-3">
          {rows.map((row) => (
            <SummaryRow key={row.label} label={row.label} value={row.value} />
          ))}
        </View>
      )}
      {hasStructure && structure && (
        <View className="gap-2">
          <SubLabel>Structure</SubLabel>
          <WorkoutStructureView structure={structure} />
        </View>
      )}
      {face.notes && face.notes.trim().length > 0 && (
        <View className="gap-1">
          <SubLabel>Notes</SubLabel>
          <Text
            className="font-coach text-[14px] leading-6"
            style={{ color: LIGHT_THEME.wText }}
          >
            {face.notes}
          </Text>
        </View>
      )}
    </Card>
  );
}

type AdherenceLike = {
  score: number;
  durationMatch?: number;
  distanceMatch?: number;
  intensityMatch?: number;
  structureMatch?: number;
};

function AdherenceCard({ adherence }: { adherence: AdherenceLike }) {
  const bars: { label: string; value: number }[] = [];
  if (adherence.durationMatch != null)
    bars.push({ label: "Duration", value: adherence.durationMatch });
  if (adherence.distanceMatch != null)
    bars.push({ label: "Distance", value: adherence.distanceMatch });
  if (adherence.intensityMatch != null)
    bars.push({ label: "Intensity", value: adherence.intensityMatch });
  if (adherence.structureMatch != null)
    bars.push({ label: "Structure", value: adherence.structureMatch });

  return (
    <Card>
      <View className="flex-row items-baseline justify-between">
        <SectionLabel>Adherence</SectionLabel>
        <Text
          className="font-coach-bold text-[20px]"
          style={{ color: LIGHT_THEME.wText }}
        >
          {Math.round(adherence.score * 100)}%
        </Text>
      </View>
      {bars.length > 0 && (
        <View className="gap-3">
          {bars.map((b) => (
            <AdherenceBar key={b.label} label={b.label} value={b.value} />
          ))}
        </View>
      )}
    </Card>
  );
}

function AdherenceBar({ label, value }: { label: string; value: number }) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <View className="gap-1">
      <View className="flex-row items-center justify-between">
        <Text
          className="font-coach-semibold text-[12px]"
          style={{ color: LIGHT_THEME.wSub }}
        >
          {label}
        </Text>
        <Text
          className="font-coach-bold text-[12px]"
          style={{ color: LIGHT_THEME.wText }}
        >
          {Math.round(clamped * 100)}%
        </Text>
      </View>
      <View
        className="h-1.5 overflow-hidden rounded-full"
        style={{ backgroundColor: LIGHT_THEME.w3 }}
      >
        <View
          className="h-full rounded-full"
          style={{
            width: `${clamped * 100}%`,
            backgroundColor: COLORS.grn,
          }}
        />
      </View>
    </View>
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

function Chip({
  children,
  accent,
  prominent,
}: {
  children: React.ReactNode;
  accent?: string;
  prominent?: boolean;
}) {
  return (
    <View
      className={
        prominent
          ? "self-start rounded-full border px-4 py-1.5"
          : "self-start rounded-full border px-3 py-1"
      }
      style={{
        backgroundColor: accent ?? LIGHT_THEME.w1,
        borderColor: accent ?? LIGHT_THEME.wBrd,
      }}
    >
      <Text
        className={
          prominent
            ? "font-coach-bold text-[13px] uppercase tracking-wider"
            : "font-coach-semibold text-[12px]"
        }
        style={{ color: accent ? "#FFFFFF" : LIGHT_THEME.wSub }}
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

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      className="font-coach-semibold text-[11px] uppercase tracking-wider"
      style={{ color: LIGHT_THEME.wMute }}
    >
      {children}
    </Text>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text
        className="font-coach-semibold text-[12px] uppercase tracking-wider"
        style={{ color: LIGHT_THEME.wMute }}
      >
        {label}
      </Text>
      <Text
        className="font-coach-bold text-[15px]"
        style={{ color: LIGHT_THEME.wText }}
      >
        {value}
      </Text>
    </View>
  );
}

export default WorkoutDetailPage;

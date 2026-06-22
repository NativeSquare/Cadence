/**
 * Plan display helpers (formatting, colors, status labels, agoge → UI transforms).
 *
 * Agoge workout docs are the source of truth. Transforms here shape them into
 * `WorkoutData` for the Plan/Today UI. Plan-level metadata (race goal, weekly
 * totals) remains optional until the plan generator writes richer `plan.notes`.
 */

import { WORKOUT_TYPES_COLORS } from "@packages/shared/colors";
import {
  parseStructure,
  summarizeStructure,
} from "@packages/shared/workout-summary";
import {
  deriveWorkoutStatus,
  localTodayYmd,
} from "@/components/app/workout/workout-helpers";
import type { PlanDoc, RaceDoc, WorkoutType } from "@nativesquare/agoge/schema";
import type {
  RaceGoalData,
  WorkoutData,
  WorkoutIntensity,
} from "./types";

/**
 * Subset of the agoge workout doc the Plan UI consumes.
 * Mirrors `components.agoge.public.getPlannedWorkoutsByAthlete` return shape.
 *
 * `planned.date` and `actual.date` are canonical UTC ISO 8601 timestamps
 * (e.g. "2026-05-01T00:00:00.000Z"). Workouts authored from the native form
 * are stored as `${YYYY-MM-DD}T00:00:00.000Z`, so the date prefix is the
 * local-day the user picked — bucket by that prefix to avoid timezone drift.
 */
export interface AgogeWorkout {
  _id: string;
  name: string;
  type: WorkoutType;
  description?: string;
  status: "planned" | "completed" | "missed";
  planned?: {
    date: string;
    structure?: unknown;
  };
  actual?: {
    date: string;
    durationSeconds?: number;
    distanceMeters?: number;
  };
  /** Providers this workout has been exported to. Empty when nothing was sent. */
  providerRefs?: Array<{ provider: string; syncedAt: number }>;
}

function workoutDate(w: AgogeWorkout): string | undefined {
  return w.actual?.date ?? w.planned?.date;
}

/** Parse the YYYY-MM-DD prefix of a UTC ISO timestamp into a local Date. */
function localDateFromIso(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map((n) => parseInt(n, 10));
  return new Date(y, m - 1, d);
}

/** Key format used by CalendarStrip (y-m-d, 0-indexed month, unpadded). */
function planDateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function formatDistance(meters?: number): string {
  if (meters == null) return "-";
  return (meters / 1000).toFixed(1);
}

function formatDurationShort(seconds?: number): string {
  if (seconds == null) return "-";
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${h}h` : `${h}h${rem.toString().padStart(2, "0")}`;
}

function intensityFromType(type: WorkoutType): WorkoutIntensity {
  switch (type) {
    case "race":
    case "long":
      return "key";
    case "easy":
    case "recovery":
      return "low";
    case "threshold":
    case "intervals":
    case "race_pace":
    case "test":
      return "high";
  }
}

export function workoutToWorkoutData(
  workout: AgogeWorkout,
  today: Date,
): WorkoutData {
  const dateIso = workoutDate(workout);
  const date = dateIso ? localDateFromIso(dateIso) : new Date(NaN);
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  // Structure always comes from the planned face — it's the prescription and
  // is shown regardless of completion status. Volume totals prefer the actual
  // recorded values once available, falling back to planned-structure sums.
  const plannedStructure = parseStructure(workout.planned?.structure);
  const plannedSummary = plannedStructure
    ? summarizeStructure(plannedStructure)
    : null;
  const distanceMeters =
    workout.actual?.distanceMeters ?? plannedSummary?.distanceMeters;
  const durationSeconds =
    workout.actual?.durationSeconds ?? plannedSummary?.durationSeconds;

  const exportedRef = workout.providerRefs?.[0];
  const derivedStatus = deriveWorkoutStatus(workout, localTodayYmd(today));

  return {
    workoutId: workout._id,
    type: workout.name,
    kind: workout.type,
    km: formatDistance(distanceMeters),
    dur: formatDurationShort(durationSeconds),
    done: derivedStatus === "completed",
    missed: derivedStatus === "missed",
    needsFeedback: derivedStatus === "needs_feedback",
    intensity: intensityFromType(workout.type),
    desc: workout.description ?? "",
    zone: "-",
    today: isToday,
    structure: plannedStructure,
    syncStatus: exportedRef ? "exported" : undefined,
    syncSource: exportedRef?.provider,
  };
}

export function buildWorkoutsByDate(
  workouts: AgogeWorkout[],
  today: Date,
): Record<string, WorkoutData> {
  const result: Record<string, WorkoutData> = {};
  for (const w of workouts) {
    const dateIso = workoutDate(w);
    if (!dateIso) continue;
    result[planDateKey(localDateFromIso(dateIso))] = workoutToWorkoutData(
      w,
      today,
    );
  }
  return result;
}

function formatRaceDistance(meters: number | undefined): string {
  if (meters == null) return "Race";
  if (meters >= 1000) {
    const km = Math.round((meters / 1000) * 10) / 10;
    return `${km} km`;
  }
  return `${meters} m`;
}

/**
 * Shape an Agoge RaceDoc (+ optional PlanDoc) into the UI's `RaceGoalData`.
 * The race goal's `raceId` already points at the right race — no heuristic
 * selection needed. Plan-derived fields (currentWeek/totalWeeks/phase) are
 * placeholders for now; the plan generator hasn't surfaced them yet.
 */
export function mapRaceToGoalData(
  race: RaceDoc,
  _plan: PlanDoc | null,
): RaceGoalData {
  return {
    raceName: race.name,
    raceDistance: formatRaceDistance(race.distanceMeters),
    raceDate: localDateFromIso(race.date).getTime(),
    priority: race.priority,
  };
}

export function getWorkoutColor(workout: WorkoutData): string {
  return WORKOUT_TYPES_COLORS[workout.kind ?? "easy"];
}



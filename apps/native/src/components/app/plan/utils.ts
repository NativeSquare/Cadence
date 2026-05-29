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

function isoWeekStart(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  const dow = out.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  out.setDate(out.getDate() + diff);
  return out;
}

export function getWorkoutColor(workout: WorkoutData): string {
  return WORKOUT_TYPES_COLORS[workout.kind ?? "easy"];
}

// ─── Training pulse (fitness-goal home) ─────────────────────────────────────

export interface TrainingPulseWeek {
  /** Volume in km, rounded to 1 decimal. */
  volumeKm: number;
  /** Number of completed workouts in the week. */
  count: number;
}

export interface TrainingPulse {
  /** Consecutive weeks (ending now-or-last-week) with ≥1 completed workout. */
  streakWeeks: number;
  /** Completed workouts inside the current ISO week. */
  thisWeekCount: number;
  /** Median completed workouts/week over the prior 4 weeks (excl. current). */
  thisWeekTarget: number;
  /** Last 4 ISO weeks, oldest → current. Length always 4. */
  weeks: TrainingPulseWeek[];
  /** Last-4w volume vs prior-4w volume, as percent. Null when no prior data. */
  delta4wPercent: number | null;
  /** Total completed workouts across the trailing 8 weeks. */
  trailing8wCompleted: number;
}

/**
 * Aggregates completed workouts into a streak + frequency + 4-week volume
 * trend. The current week is preserved when no workouts have been logged yet
 * (e.g. Monday morning) so a healthy streak isn't visually broken mid-week.
 */
export function computeTrainingPulse(
  workouts: AgogeWorkout[],
  today: Date,
): TrainingPulse {
  const currentWeekStart = isoWeekStart(today);

  // Bucket completed workouts by ISO-week start (timestamp ms).
  const byWeek = new Map<number, { volumeM: number; count: number }>();
  let trailing8wCompleted = 0;
  for (const w of workouts) {
    if (w.status !== "completed") continue;
    const dateIso = workoutDate(w);
    if (!dateIso) continue;
    const wkStart = isoWeekStart(localDateFromIso(dateIso)).getTime();
    const plannedStructure = parseStructure(w.planned?.structure);
    const plannedDistance = plannedStructure
      ? summarizeStructure(plannedStructure).distanceMeters
      : 0;
    const meters = w.actual?.distanceMeters ?? plannedDistance;
    const bucket = byWeek.get(wkStart) ?? { volumeM: 0, count: 0 };
    bucket.volumeM += meters;
    bucket.count += 1;
    byWeek.set(wkStart, bucket);
  }

  const weekStartAt = (offset: number): number => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - offset * 7);
    return d.getTime();
  };

  // Last 4 weeks, oldest → current (offsets 3,2,1,0).
  const weeks: TrainingPulseWeek[] = [3, 2, 1, 0].map((offset) => {
    const bucket = byWeek.get(weekStartAt(offset));
    return {
      volumeKm: bucket ? Math.round((bucket.volumeM / 1000) * 10) / 10 : 0,
      count: bucket?.count ?? 0,
    };
  });

  const thisWeekCount = weeks[3].count;

  // Streak: walk back from current week. Skip the current week if empty so
  // we don't punish the user mid-week, but keep counting from the prior one.
  let streakWeeks = 0;
  let cursor = thisWeekCount > 0 ? 0 : 1;
  while (true) {
    const bucket = byWeek.get(weekStartAt(cursor));
    if (!bucket || bucket.count === 0) break;
    streakWeeks += 1;
    cursor += 1;
  }

  // Trailing-4w target = median completed/week over weeks offset 1..4 (excl.
  // current). Falls back to 3 sessions/week when there's no history at all.
  const priorCounts: number[] = [];
  for (let offset = 1; offset <= 4; offset++) {
    priorCounts.push(byWeek.get(weekStartAt(offset))?.count ?? 0);
  }
  const sortedCounts = [...priorCounts].sort((a, b) => a - b);
  const median =
    (sortedCounts[Math.floor(sortedCounts.length / 2) - 1] +
      sortedCounts[Math.floor(sortedCounts.length / 2)]) /
    2;
  const thisWeekTarget = priorCounts.some((c) => c > 0)
    ? Math.max(1, Math.round(median))
    : 3;

  const last4VolumeKm = weeks.reduce((s, w) => s + w.volumeKm, 0);
  let prior4VolumeKm = 0;
  for (let offset = 4; offset <= 7; offset++) {
    const bucket = byWeek.get(weekStartAt(offset));
    if (bucket) prior4VolumeKm += bucket.volumeM / 1000;
  }
  prior4VolumeKm = Math.round(prior4VolumeKm * 10) / 10;
  const delta4wPercent =
    prior4VolumeKm > 0
      ? Math.round(((last4VolumeKm - prior4VolumeKm) / prior4VolumeKm) * 100)
      : null;

  for (let offset = 0; offset <= 7; offset++) {
    trailing8wCompleted += byWeek.get(weekStartAt(offset))?.count ?? 0;
  }

  return {
    streakWeeks,
    thisWeekCount,
    thisWeekTarget,
    weeks,
    delta4wPercent,
    trailing8wCompleted,
  };
}


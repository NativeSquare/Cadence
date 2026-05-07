/**
 * Plan display helpers (formatting, colors, status labels, agoge → UI transforms).
 *
 * Agoge workout docs are the source of truth. Transforms here shape them into
 * `WorkoutData` for the Plan/Today UI. Plan-level metadata (race goal, weekly
 * totals) remains optional until the plan generator writes richer `plan.notes`.
 */

import {
  WORKOUT_CATEGORY_COLORS,
  getWorkoutCategory,
} from "@/lib/design-tokens";
import { summarizeWorkout } from "@/components/app/workout/workout-summary";
import type { WorkoutType } from "@nativesquare/agoge/schema";
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
  status: "planned" | "completed" | "missed" | "skipped";
  planned?: {
    date: string;
    durationSeconds?: number;
    distanceMeters?: number;
    structure?: unknown;
  };
  actual?: {
    date: string;
    durationSeconds?: number;
    distanceMeters?: number;
    structure?: unknown;
  };
  adherence?: {
    score: number;
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

function formatDurationLong(seconds: number): string {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${h}h` : `${h}h ${rem}m`;
}

function intensityFromName(name: string): WorkoutIntensity {
  const category = getWorkoutCategory(name);
  if (category === "race") return "key";
  if (category === "long") return "key";
  if (category === "easy") return "low";
  return "high";
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

  const face = workout.actual ?? workout.planned;
  const summary = summarizeWorkout(face, workout.type);
  const distanceMeters =
    face?.distanceMeters ?? summary.totalDistanceMeters ?? undefined;
  const durationSeconds =
    face?.durationSeconds ?? summary.totalDurationSeconds ?? undefined;

  const exportedRef = workout.providerRefs?.[0];

  return {
    workoutId: workout._id,
    type: workout.name,
    kind: workout.type,
    km: formatDistance(distanceMeters),
    dur: formatDurationShort(durationSeconds),
    done: workout.status === "completed",
    intensity: intensityFromName(workout.name),
    desc: workout.description ?? "",
    zone: "-",
    today: isToday,
    structure: summary.structure,
    actualDur:
      workout.actual?.durationSeconds != null
        ? formatDurationShort(workout.actual.durationSeconds)
        : undefined,
    actualKm:
      workout.actual?.distanceMeters != null
        ? formatDistance(workout.actual.distanceMeters)
        : undefined,
    adherenceScore: workout.adherence?.score,
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

/**
 * Subset of the agoge race doc we need to render the home-page countdown.
 * Mirrors `api.agoge.races.listMyRaces[number]` without forcing this util to
 * import the generated API types.
 */
export interface RaceLite {
  name: string;
  /** YYYY-MM-DD UTC ISO string (matches schema) */
  date: string;
  distanceMeters?: number;
  priority: "A" | "B" | "C";
  status: "upcoming" | "completed" | "dnf" | "dns" | "cancelled";
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
 * Pick the primary upcoming race for the home-page card.
 *
 * Preference: next A race by date. Falls back to next B race if no A is
 * scheduled. C races and non-upcoming races are ignored — those belong on the
 * dedicated races screen, not the home page.
 */
export function selectPrimaryRace(
  races: readonly RaceLite[] | undefined,
): RaceGoalData | null {
  if (!races || races.length === 0) return null;
  const upcoming = races.filter((r) => r.status === "upcoming");
  const aRaces = upcoming.filter((r) => r.priority === "A");
  const pool = aRaces.length > 0 ? aRaces : upcoming.filter((r) => r.priority === "B");
  if (pool.length === 0) return null;
  const next = [...pool].sort((a, b) => a.date.localeCompare(b.date))[0];
  return {
    raceName: next.name,
    raceDistance: formatRaceDistance(next.distanceMeters),
    raceDate: localDateFromIso(next.date).getTime(),
    priority: next.priority,
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

export function computeWeekInsights(
  workouts: AgogeWorkout[],
  today: Date,
): {
  volumeCompleted: number;
  volumePlanned: number;
  timeCompleted: string;
  avgPace: string;
  currentWeekWorkouts: WorkoutData[];
} {
  const weekStart = isoWeekStart(today);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  let volumeCompletedMeters = 0;
  let volumePlannedMeters = 0;
  let timeCompletedSeconds = 0;
  const currentWeekWorkouts: WorkoutData[] = [];

  for (const w of workouts) {
    const dateIso = workoutDate(w);
    if (!dateIso) continue;
    const d = localDateFromIso(dateIso);
    if (d < weekStart || d > weekEnd) continue;
    currentWeekWorkouts.push(workoutToWorkoutData(w, today));

    const plannedSummary = summarizeWorkout(w.planned, w.type);
    volumePlannedMeters +=
      w.planned?.distanceMeters ?? plannedSummary.totalDistanceMeters ?? 0;
    if (w.status === "completed" && w.actual) {
      const actualSummary = summarizeWorkout(w.actual, w.type);
      volumeCompletedMeters +=
        w.actual.distanceMeters ??
        actualSummary.totalDistanceMeters ??
        w.planned?.distanceMeters ??
        plannedSummary.totalDistanceMeters ??
        0;
      timeCompletedSeconds +=
        w.actual.durationSeconds ?? actualSummary.totalDurationSeconds ?? 0;
    }
  }

  const avgPace =
    volumeCompletedMeters > 0 && timeCompletedSeconds > 0
      ? formatPace(timeCompletedSeconds / volumeCompletedMeters)
      : "-:--";

  return {
    volumeCompleted: Math.round((volumeCompletedMeters / 1000) * 10) / 10,
    volumePlanned: Math.round((volumePlannedMeters / 1000) * 10) / 10,
    timeCompleted:
      timeCompletedSeconds > 0 ? formatDurationLong(timeCompletedSeconds) : "0m",
    avgPace,
    currentWeekWorkouts,
  };
}

function formatPace(secondsPerMeter: number): string {
  const secondsPerKm = secondsPerMeter * 1000;
  const m = Math.floor(secondsPerKm / 60);
  const s = Math.round(secondsPerKm % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function getWorkoutColor(workout: WorkoutData): string {
  const category = getWorkoutCategory(workout.type);
  return WORKOUT_CATEGORY_COLORS[category];
}


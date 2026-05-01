/**
 * Plan display helpers (formatting, colors, status labels, agoge → UI transforms).
 *
 * Agoge workout docs are the source of truth. Transforms here shape them into
 * `SessionData` for the Plan/Today UI. Plan-level metadata (race goal, weekly
 * totals) remains optional until the plan generator writes richer `plan.notes`.
 */

import {
  COLORS,
  LIGHT_THEME,
  SESSION_TYPE_COLORS,
  getSessionCategory,
} from "@/lib/design-tokens";
import type {
  RaceGoalData,
  SessionData,
  SessionIntensity,
  SyncStatus,
  SyncedData,
} from "./types";

/**
 * Subset of the agoge workout doc the Plan UI consumes.
 * Mirrors `components.agoge.public.getPlannedWorkoutsByAthlete` return shape.
 */
export interface AgogeWorkout {
  _id: string;
  name: string;
  description?: string;
  status: "planned" | "completed" | "missed" | "skipped";
  planned?: {
    date: string;
    durationSeconds?: number;
    distanceMeters?: number;
  };
  actual?: {
    date: string;
    durationSeconds?: number;
    distanceMeters?: number;
  };
  adherence?: {
    score: number;
  };
}

function workoutDate(w: AgogeWorkout): string | undefined {
  return w.actual?.date ?? w.planned?.date;
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

function intensityFromName(name: string): SessionIntensity {
  const category = getSessionCategory(name);
  if (category === "race") return "key";
  if (category === "long") return "key";
  if (category === "easy") return "low";
  return "high";
}

export function workoutToSessionData(
  workout: AgogeWorkout,
  today: Date,
): SessionData {
  const dateIso = workoutDate(workout);
  const date = dateIso ? new Date(`${dateIso}T00:00:00`) : new Date(NaN);
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  return {
    sessionId: workout._id,
    type: workout.name,
    km: formatDistance(
      workout.actual?.distanceMeters ?? workout.planned?.distanceMeters,
    ),
    dur: formatDurationShort(
      workout.actual?.durationSeconds ?? workout.planned?.durationSeconds,
    ),
    done: workout.status === "completed",
    intensity: intensityFromName(workout.name),
    desc: workout.description ?? "",
    zone: "-",
    today: isToday,
    actualDur:
      workout.actual?.durationSeconds != null
        ? formatDurationShort(workout.actual.durationSeconds)
        : undefined,
    actualKm:
      workout.actual?.distanceMeters != null
        ? formatDistance(workout.actual.distanceMeters)
        : undefined,
    adherenceScore: workout.adherence?.score,
  };
}

export function buildSessionsByDate(
  workouts: AgogeWorkout[],
  today: Date,
): Record<string, SessionData> {
  const result: Record<string, SessionData> = {};
  for (const w of workouts) {
    const dateIso = workoutDate(w);
    if (!dateIso) continue;
    const d = new Date(`${dateIso}T00:00:00`);
    result[planDateKey(d)] = workoutToSessionData(w, today);
  }
  return result;
}

export function buildRaceGoal(_workouts: AgogeWorkout[]): RaceGoalData | null {
  return null;
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
  currentWeekSessions: SessionData[];
} {
  const weekStart = isoWeekStart(today);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  let volumeCompletedMeters = 0;
  let volumePlannedMeters = 0;
  let timeCompletedSeconds = 0;
  const currentWeekSessions: SessionData[] = [];

  for (const w of workouts) {
    const dateIso = workoutDate(w);
    if (!dateIso) continue;
    const d = new Date(`${dateIso}T00:00:00`);
    if (d < weekStart || d > weekEnd) continue;
    currentWeekSessions.push(workoutToSessionData(w, today));

    volumePlannedMeters += w.planned?.distanceMeters ?? 0;
    if (w.status === "completed" && w.actual) {
      volumeCompletedMeters +=
        w.actual.distanceMeters ?? w.planned?.distanceMeters ?? 0;
      timeCompletedSeconds += w.actual.durationSeconds ?? 0;
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
    currentWeekSessions,
  };
}

function formatPace(secondsPerMeter: number): string {
  const secondsPerKm = secondsPerMeter * 1000;
  const m = Math.floor(secondsPerKm / 60);
  const s = Math.round(secondsPerKm % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function getSessionColor(session: SessionData): string {
  const category = getSessionCategory(session.type);
  return SESSION_TYPE_COLORS[category];
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
}

export function formatDate(date: Date = new Date()): string {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
}

export function formatShortDate(date: Date = new Date()): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}

export function getSyncStatusColor(status: SyncStatus): string {
  switch (status) {
    case "exported":
      return LIGHT_THEME.wText;
    case "syncing":
      return COLORS.ora;
    case "synced":
      return COLORS.lime;
    case "failed":
      return COLORS.red;
    default:
      return LIGHT_THEME.wMute;
  }
}

export function getSyncStatusLabel(
  status: SyncStatus,
  syncSource?: string,
  syncedData?: SyncedData,
): string {
  const source = syncSource ? capitalize(syncSource) : "Watch";
  switch (status) {
    case "exported":
      return `Exported to ${source}`;
    case "syncing":
      return "Syncing…";
    case "synced":
      return syncedData
        ? `Synced · ${syncedData.km} km recorded`
        : "Synced";
    case "failed":
      return "Sync failed · Retry";
    default:
      return "";
  }
}

/**
 * Shared aggregation helpers for Philosophy rules that need to reason about
 * a week's worth of workouts (volume cap, quality count, deload cadence,
 * taper window).
 *
 * Weeks are bucketed by ISO 8601 week (Monday → Sunday, UTC) so the same key
 * lines up across rules and across timezone boundaries.
 */

import type { Workout as WorkoutStructure } from "@nativesquare/agoge";
import { components } from "../../_generated/api";
import type { QueryCtx } from "../../_generated/server";
import { summarizeStructure } from "../../agoge/periodization";

export type WorkoutFace = "planned" | "actual";

export type WorkoutLite = {
  _id: string;
  type: string;
  status: "planned" | "completed" | "missed";
  planned?: { date: string; structure?: unknown };
  actual?: { date: string; distanceMeters?: number; durationSeconds?: number };
};

export type WeekSummary = {
  isoWeekKey: string;
  /** UTC Monday 00:00 of this ISO week, ISO 8601 string */
  weekStart: string;
  distanceMeters: number;
  durationSeconds: number;
  qualityCount: number;
  workoutCount: number;
};

const QUALITY_TYPES = new Set([
  "tempo",
  "threshold",
  "intervals",
  "vo2max",
  "fartlek",
  "progression",
  "race_pace",
  "hills",
  "race",
  "test",
]);

export function isQualityType(type: string): boolean {
  return QUALITY_TYPES.has(type);
}

const MS_PER_DAY = 86_400_000;

function utcMidnight(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

/**
 * ISO 8601 week-numbering: weeks start Monday; week 1 is the week containing
 * the first Thursday of the calendar year.
 */
export function isoWeekKey(dateIso: string): string {
  const d = utcMidnight(new Date(dateIso));
  // Shift to the Thursday of the same ISO week, then read its year + week.
  const day = d.getUTCDay() || 7; // 1..7, Mon=1
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const year = d.getUTCFullYear();
  const yearStart = Date.UTC(year, 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / MS_PER_DAY + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function isoWeekStart(dateIso: string): string {
  const d = utcMidnight(new Date(dateIso));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - (day - 1));
  return d.toISOString();
}

/** ISO week key for the week immediately preceding `dateIso`'s ISO week. */
export function previousIsoWeekKey(dateIso: string): string {
  const monday = new Date(isoWeekStart(dateIso));
  monday.setUTCDate(monday.getUTCDate() - 7);
  return isoWeekKey(monday.toISOString());
}

function pickFaceDate(w: WorkoutLite, face: WorkoutFace): string | null {
  return w[face]?.date ?? null;
}

function faceVolume(
  w: WorkoutLite,
  face: WorkoutFace,
): { distanceMeters: number; durationSeconds: number } {
  if (face === "actual") {
    return {
      distanceMeters: w.actual?.distanceMeters ?? 0,
      durationSeconds: w.actual?.durationSeconds ?? 0,
    };
  }
  if (!w.planned?.structure) {
    return { distanceMeters: 0, durationSeconds: 0 };
  }
  const s = summarizeStructure(w.planned.structure as WorkoutStructure);
  return {
    distanceMeters: s.distanceMeters,
    durationSeconds: s.durationSeconds ?? 0,
  };
}

/**
 * Bucket workouts into ISO-week summaries using the chosen face's date as the
 * week selector and the chosen face's distance/duration as the volume.
 *
 * Workouts missing the requested face are skipped silently — callers that
 * need them should fall back to the other face.
 */
export function summarizeByIsoWeek(
  workouts: WorkoutLite[],
  face: WorkoutFace,
): Map<string, WeekSummary> {
  const out = new Map<string, WeekSummary>();
  for (const w of workouts) {
    const date = pickFaceDate(w, face);
    if (!date) continue;
    const key = isoWeekKey(date);
    const cur =
      out.get(key) ??
      ({
        isoWeekKey: key,
        weekStart: isoWeekStart(date),
        distanceMeters: 0,
        durationSeconds: 0,
        qualityCount: 0,
        workoutCount: 0,
      } satisfies WeekSummary);
    const vol = faceVolume(w, face);
    cur.distanceMeters += vol.distanceMeters;
    cur.durationSeconds += vol.durationSeconds;
    if (isQualityType(w.type)) cur.qualityCount += 1;
    cur.workoutCount += 1;
    out.set(key, cur);
  }
  return out;
}

/**
 * Convenience: load all workouts attached to a plan. Used by rules that need
 * to sweep across the active plan to compute weekly summaries.
 */
export async function loadPlanWorkouts(
  qctx: QueryCtx,
  planId: string,
): Promise<WorkoutLite[]> {
  return await qctx.runQuery(components.agoge.public.getWorkoutsByPlan, {
    planId,
  });
}

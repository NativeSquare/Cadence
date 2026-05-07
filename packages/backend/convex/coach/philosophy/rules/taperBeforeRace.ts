import { components } from "../../../_generated/api";
import type { QueryCtx } from "../../../_generated/server";
import {
  isoWeekKey,
  loadPlanWorkouts,
  summarizeByIsoWeek,
} from "../aggregates";
import type { PhilosophyRule } from "../types";

const PEAK_RATIO_LIMIT = 0.85;

type Input = {
  workoutId?: string;
  date?: string;
  planned?: { date?: string; distanceMeters?: number; durationSeconds?: number };
  startDate?: string;
  endDate?: string;
};

export const taperBeforeRace: PhilosophyRule<Input> = {
  id: "taper_before_race",
  description:
    "Within the taper window before the goal race, weekly planned volume must trend down (≤85% of peak week).",
  severity: "warn",
  triggers: [
    "workout.create",
    "workout.update",
    "workout.reschedule",
    "block.create",
    "block.update",
  ],
  check: async (input, context, qctx) => {
    const race = context.goalRace;
    const plan = context.activePlan;
    if (!race || !plan || race.status !== "upcoming") return null;

    const taperDays = taperWindowDays(race.format, race.distanceMeters);
    const taperStartMs = Date.parse(race.date) - taperDays * 86_400_000;
    if (!Number.isFinite(taperStartMs)) return null;

    const proposedDate = await resolveProposedDate(input, qctx);
    if (!proposedDate) return null;

    const proposedMs = Date.parse(proposedDate);
    if (proposedMs < taperStartMs) return null;
    if (proposedMs > Date.parse(race.date)) return null;

    const planWorkouts = await loadPlanWorkouts(qctx, plan._id);
    const planned = planWorkouts.filter(
      (w) =>
        w._id !== input.workoutId &&
        (w.status === "planned" ||
          w.status === "missed" ||
          w.status === "skipped"),
    );
    const weeks = summarizeByIsoWeek(planned, "planned");

    const proposedWeek = isoWeekKey(proposedDate);
    const inputDistance = input.planned?.distanceMeters ?? 0;
    const proposedWeekDistance =
      (weeks.get(proposedWeek)?.distanceMeters ?? 0) + inputDistance;

    let peakDistance = 0;
    for (const w of weeks.values()) {
      if (w.weekStart >= new Date(taperStartMs).toISOString()) continue;
      if (w.distanceMeters > peakDistance) peakDistance = w.distanceMeters;
    }
    if (peakDistance === 0) return null;

    const cap = peakDistance * PEAK_RATIO_LIMIT;
    if (proposedWeekDistance > cap) {
      const taperLabel = `${taperDays}-day taper`;
      return {
        code: "_overridden_by_runner",
        message:
          `Week ${proposedWeek} sits inside the ${taperLabel} for ${race.name} ` +
          `(${race.date.slice(0, 10)}). Planned volume ` +
          `${(proposedWeekDistance / 1000).toFixed(1)} km exceeds 85% of the ` +
          `peak week (${(peakDistance / 1000).toFixed(1)} km). Cap is ` +
          `${(cap / 1000).toFixed(1)} km.`,
      };
    }
    return null;
  },
};

function taperWindowDays(
  format: string | undefined,
  distanceMeters: number,
): number {
  switch (format) {
    case "5k":
      return 7;
    case "10k":
      return 10;
    case "15k":
    case "10_miles":
      return 12;
    case "half_marathon":
      return 14;
    case "marathon":
      return 21;
    case "50k":
    case "50_miles":
    case "100k":
    case "100_miles":
    case "backyard_ultra":
    case "multi_day_stage":
      return 21;
  }
  if (distanceMeters >= 30_000) return 21;
  if (distanceMeters >= 15_000) return 14;
  return 7;
}

async function resolveProposedDate(
  input: Input,
  qctx: QueryCtx,
): Promise<string | null> {
  if (input.planned?.date) return input.planned.date;
  if (typeof input.date === "string" && input.workoutId) return input.date;
  if (input.workoutId) {
    const w = await qctx.runQuery(components.agoge.public.getWorkout, {
      workoutId: input.workoutId,
    });
    if (w?.planned?.date) return w.planned.date;
  }
  if (input.startDate) return input.startDate;
  return null;
}

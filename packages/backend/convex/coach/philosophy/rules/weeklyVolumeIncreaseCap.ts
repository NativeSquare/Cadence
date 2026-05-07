import { components } from "../../../_generated/api";
import {
  isoWeekKey,
  loadPlanWorkouts,
  previousIsoWeekKey,
  summarizeByIsoWeek,
} from "../aggregates";
import type { PhilosophyRule } from "../types";

const MAX_INCREASE_RATIO = 1.1;
const MIN_PREV_WEEK_WORKOUTS = 2;

type Input = {
  workoutId?: string;
  date?: string;
  planned?: { date?: string; distanceMeters?: number; durationSeconds?: number };
};

type ProposedDelta = {
  date: string;
  distanceMeters: number;
  durationSeconds: number;
};

export const weeklyVolumeIncreaseCap: PhilosophyRule<Input> = {
  id: "weekly_volume_increase_cap",
  description:
    "A week's planned volume must not exceed the previous week's completed volume by more than 10%.",
  severity: "block",
  triggers: ["workout.create", "workout.update", "workout.reschedule"],
  check: async (input, context, qctx) => {
    const plan = context.activePlan;
    if (!plan) return null;

    let existingWorkout: Awaited<
      ReturnType<typeof getWorkout>
    > | null = null;
    if (input.workoutId) {
      existingWorkout = await getWorkout(qctx, input.workoutId);
    }

    const proposed = resolveProposed(input, existingWorkout);
    if (!proposed) return null;

    const planWorkouts = await loadPlanWorkouts(qctx, plan._id);

    const otherPlanned = planWorkouts.filter(
      (w) =>
        w._id !== input.workoutId &&
        (w.status === "planned" ||
          w.status === "missed" ||
          w.status === "skipped"),
    );
    const plannedWeeks = summarizeByIsoWeek(otherPlanned, "planned");

    const proposedWeek = isoWeekKey(proposed.date);
    const existingInWeek = plannedWeeks.get(proposedWeek);
    const proposedDistance =
      (existingInWeek?.distanceMeters ?? 0) + proposed.distanceMeters;
    const proposedDuration =
      (existingInWeek?.durationSeconds ?? 0) + proposed.durationSeconds;

    const completed = planWorkouts.filter((w) => w.status === "completed");
    const actualWeeks = summarizeByIsoWeek(completed, "actual");
    const prevWeekKey = previousIsoWeekKey(proposed.date);
    const prev = actualWeeks.get(prevWeekKey);
    if (!prev || prev.workoutCount < MIN_PREV_WEEK_WORKOUTS) return null;

    if (
      prev.distanceMeters > 0 &&
      proposedDistance > prev.distanceMeters * MAX_INCREASE_RATIO
    ) {
      const cap = (prev.distanceMeters * MAX_INCREASE_RATIO) / 1000;
      return {
        code: "_overridden_by_runner",
        message:
          `Week ${proposedWeek} planned distance ` +
          `(${(proposedDistance / 1000).toFixed(1)} km) exceeds 110% of last ` +
          `week's actual (${(prev.distanceMeters / 1000).toFixed(1)} km). ` +
          `Cap is ${cap.toFixed(1)} km — reduce this workout's distance or ` +
          `move it to a later week.`,
      };
    }

    if (
      prev.distanceMeters === 0 &&
      prev.durationSeconds > 0 &&
      proposedDuration > prev.durationSeconds * MAX_INCREASE_RATIO
    ) {
      const cap = Math.round((prev.durationSeconds * MAX_INCREASE_RATIO) / 60);
      return {
        code: "_overridden_by_runner",
        message:
          `Week ${proposedWeek} planned duration ` +
          `(${Math.round(proposedDuration / 60)} min) exceeds 110% of last ` +
          `week's actual (${Math.round(prev.durationSeconds / 60)} min). ` +
          `Cap is ${cap} min — reduce duration or move to a later week.`,
      };
    }

    return null;
  },
};

async function getWorkout(qctx: Parameters<typeof loadPlanWorkouts>[0], id: string) {
  return await qctx.runQuery(components.agoge.public.getWorkout, {
    workoutId: id,
  });
}

function resolveProposed(
  input: Input,
  existing: Awaited<ReturnType<typeof getWorkout>> | null,
): ProposedDelta | null {
  if (typeof input.date === "string" && input.workoutId) {
    if (!existing?.planned) return null;
    return {
      date: input.date,
      distanceMeters: existing.planned.distanceMeters ?? 0,
      durationSeconds: existing.planned.durationSeconds ?? 0,
    };
  }
  if (input.planned?.date) {
    return {
      date: input.planned.date,
      distanceMeters:
        input.planned.distanceMeters ??
        existing?.planned?.distanceMeters ??
        0,
      durationSeconds:
        input.planned.durationSeconds ??
        existing?.planned?.durationSeconds ??
        0,
    };
  }
  return null;
}

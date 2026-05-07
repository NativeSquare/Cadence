import { components } from "../../../_generated/api";
import type { QueryCtx } from "../../../_generated/server";
import {
  isQualityType,
  isoWeekKey,
  loadPlanWorkouts,
} from "../aggregates";
import type { PhilosophyRule } from "../types";

const MAX_QUALITY_PER_WEEK = 2;

type Input = {
  workoutId?: string;
  type?: string;
  date?: string;
  planned?: { date?: string };
};

export const maxQualitySessionsPerWeek: PhilosophyRule<Input> = {
  id: "max_quality_sessions_per_week",
  description:
    "An ISO week must contain no more than 2 quality sessions (tempo/threshold/intervals/vo2max/fartlek/progression/race_pace/hills/race/test).",
  severity: "block",
  triggers: ["workout.create", "workout.update", "workout.reschedule"],
  check: async (input, context, qctx) => {
    const plan = context.activePlan;
    if (!plan) return null;

    const existing = input.workoutId
      ? await getWorkout(qctx, input.workoutId)
      : null;

    const proposedType = input.type ?? existing?.type;
    if (!proposedType || !isQualityType(proposedType)) return null;

    const proposedDate =
      input.planned?.date ??
      (typeof input.date === "string" ? input.date : undefined) ??
      existing?.planned?.date;
    if (!proposedDate) return null;
    const proposedWeek = isoWeekKey(proposedDate);

    const planWorkouts = await loadPlanWorkouts(qctx, plan._id);
    let qualityInWeek = 0;
    for (const w of planWorkouts) {
      if (w._id === input.workoutId) continue;
      if (!isQualityType(w.type)) continue;
      const date = w.planned?.date ?? w.actual?.date;
      if (!date) continue;
      if (isoWeekKey(date) === proposedWeek) qualityInWeek += 1;
    }

    if (qualityInWeek + 1 > MAX_QUALITY_PER_WEEK) {
      return {
        code: "_overridden_by_runner",
        message:
          `Week ${proposedWeek} would have ${qualityInWeek + 1} quality ` +
          `sessions, but the cap is ${MAX_QUALITY_PER_WEEK}. Replace one ` +
          `quality session with an easy run, or move this session to a ` +
          `different week.`,
      };
    }
    return null;
  },
};

async function getWorkout(qctx: QueryCtx, id: string) {
  return await qctx.runQuery(components.agoge.public.getWorkout, {
    workoutId: id,
  });
}

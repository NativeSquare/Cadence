/**
 * One-shot migration for the calendar-date / instant split.
 *
 * Pre-split, every date field crossing into the agoge component was a full
 * UTC ISO string. After the split, calendar-day fields (plans/blocks startDate
 * & endDate, goals.targetDate) are bare YYYY-MM-DD, and only race.date /
 * workout.{planned,actual}.date remain instants. This rewrites the legacy
 * rows to the new shapes.
 *
 * Invoke from the Convex dashboard once after the schema split deploys:
 *   internal.agoge.migrations.migrateDateShapes
 *
 * Idempotent — already-migrated rows are skipped via a shape check.
 */

import { components } from "../_generated/api";
import { internalMutation } from "../_generated/server";

const CALENDAR_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const migrateDateShapes = internalMutation({
  args: {},
  handler: async (ctx) => {
    let plansUpdated = 0;
    let blocksUpdated = 0;
    let racesUpdated = 0;
    let goalsUpdated = 0;

    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      const athlete = await ctx.runQuery(
        components.agoge.public.getAthleteByUserId,
        { userId: user._id },
      );
      if (!athlete) continue;

      // Plans → blocks. Cadence keeps a single active plan per athlete; older
      // statuses aren't currently used, so we don't sweep them here.
      const plans = await ctx.runQuery(
        components.agoge.public.getPlansByAthleteAndStatus,
        { athleteId: athlete._id, status: "active" },
      );
      for (const plan of plans) {
        const nextStart = plan.startDate.slice(0, 10);
        const nextEnd = plan.endDate ? plan.endDate.slice(0, 10) : undefined;
        if (
          nextStart !== plan.startDate ||
          (plan.endDate !== undefined && nextEnd !== plan.endDate)
        ) {
          await ctx.runMutation(components.agoge.public.updatePlan, {
            planId: plan._id,
            startDate: nextStart,
            endDate: nextEnd,
          });
          plansUpdated++;
        }

        const blocks = await ctx.runQuery(
          components.agoge.public.getBlocksByPlan,
          { planId: plan._id },
        );
        for (const block of blocks) {
          const nextBlockStart = block.startDate.slice(0, 10);
          const nextBlockEnd = block.endDate.slice(0, 10);
          if (
            nextBlockStart !== block.startDate ||
            nextBlockEnd !== block.endDate
          ) {
            await ctx.runMutation(components.agoge.public.updateBlock, {
              blockId: block._id,
              startDate: nextBlockStart,
              endDate: nextBlockEnd,
            });
            blocksUpdated++;
          }
        }
      }

      // Races: pre-split rows are bare YMD; rewrite to noon-anchored instants
      // so existing data passes the new validateIsoInstantDate check.
      const races = await ctx.runQuery(
        components.agoge.public.getRacesByAthlete,
        { athleteId: athlete._id },
      );
      for (const race of races) {
        if (CALENDAR_DATE_RE.test(race.date)) {
          await ctx.runMutation(components.agoge.public.updateRace, {
            raceId: race._id,
            date: `${race.date}T12:00:00.000Z`,
          });
          racesUpdated++;
        }
      }

      // Goals: targetDate may be a legacy noon-anchored ISO from the brief
      // window when GoalForm sent ymdToUtcIso. Slice back to YMD.
      for (const status of [
        "active",
        "achieved",
        "missed",
        "abandoned",
        "paused",
      ] as const) {
        const goals = await ctx.runQuery(
          components.agoge.public.getGoalsByAthleteAndStatus,
          { athleteId: athlete._id, status },
        );
        for (const goal of goals) {
          if (
            goal.targetDate !== undefined &&
            !CALENDAR_DATE_RE.test(goal.targetDate)
          ) {
            await ctx.runMutation(components.agoge.public.updateGoal, {
              goalId: goal._id,
              targetDate: goal.targetDate.slice(0, 10),
            });
            goalsUpdated++;
          }
        }
      }
    }

    return { plansUpdated, blocksUpdated, racesUpdated, goalsUpdated };
  },
});

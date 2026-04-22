import { v } from "convex/values";
import { internalQuery } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const SESSION_WINDOW_PAST_DAYS = 7;
const SESSION_WINDOW_FUTURE_DAYS = 14;

type RouterProfile = {
  name: string;
  physical: Doc<"runners">["physical"];
} | null;

type RouterPlan = {
  plan: Doc<"trainingPlans">;
  currentWeekNumber: number;
  sessions: Doc<"plannedSessions">[];
} | null;

export type RouterContext = {
  profile: RouterProfile;
  plan: RouterPlan;
};

export const loadRouterContext = internalQuery({
  args: {
    userId: v.id("users"),
    occurredAt: v.number(),
  },
  handler: async (ctx, { userId, occurredAt }): Promise<RouterContext> => {
    const runner = await ctx.db
      .query("runners")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const profile: RouterProfile = runner
      ? { name: runner.identity.name, physical: runner.physical }
      : null;

    if (!runner) return { profile, plan: null };

    const activePlan = await ctx.db
      .query("trainingPlans")
      .withIndex("by_runnerId", (q) => q.eq("runnerId", runner._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!activePlan) return { profile, plan: null };

    const windowStart = occurredAt - SESSION_WINDOW_PAST_DAYS * MS_PER_DAY;
    const windowEnd = occurredAt + SESSION_WINDOW_FUTURE_DAYS * MS_PER_DAY;

    const sessions = await ctx.db
      .query("plannedSessions")
      .withIndex("by_date", (q) =>
        q
          .eq("runnerId", runner._id)
          .gte("scheduledDate", windowStart)
          .lte("scheduledDate", windowEnd),
      )
      .collect();

    const rawWeek = Math.floor((occurredAt - activePlan.startDate) / (7 * MS_PER_DAY)) + 1;
    const currentWeekNumber = Math.min(
      Math.max(rawWeek, 1),
      activePlan.durationWeeks,
    );

    return {
      profile,
      plan: { plan: activePlan, currentWeekNumber, sessions },
    };
  },
});

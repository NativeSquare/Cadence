import { cronJobs } from "convex/server";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";

const crons = cronJobs();

// Clean up old emails from the resend component every hour
crons.interval(
  "cleanup-old-emails",
  { hours: 1 },
  internal.crons.cleanupResendEmails,
);

// Proactive HRV-readiness check — fires daily at 04:00 UTC (≈ early morning
// in Europe/Paris year-round). For each opted-in user we fan out a per-user
// action so one slow Soma query can't block the rest of the cohort.
crons.daily(
  "hrv-readiness-check",
  { hourUTC: 4, minuteUTC: 0 },
  internal.crons.runHrvReadinessCheck,
);

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const FOUR_WEEKS_MS = 4 * ONE_WEEK_MS;

export const cleanupResendEmails = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(0, components.resend.lib.cleanupOldEmails, {
      olderThan: ONE_WEEK_MS,
    });
    await ctx.scheduler.runAfter(
      0,
      components.resend.lib.cleanupAbandonedEmails,
      { olderThan: FOUR_WEEKS_MS },
    );
    return null;
  },
});

/**
 * Fan out one HRV-readiness evaluation per opted-in user. We page through the
 * users table inline (the cohort is small enough) and let the scheduler run
 * each user's evaluator independently. Per-user failures don't block others.
 */
export const runHrvReadinessCheck = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      if (user.banned) continue;
      if (!user.hasCompletedOnboarding) continue;
      if (user.coachInterventionsEnabled === false) continue;
      await ctx.scheduler.runAfter(
        0,
        internal.coach.triggers.hrvLowReadiness.evaluateAndApplyForUser,
        { userId: user._id },
      );
    }
    return null;
  },
});

export default crons;

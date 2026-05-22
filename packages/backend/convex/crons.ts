import { cronJobs } from "convex/server";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import { internalAction, internalMutation } from "./_generated/server";

const crons = cronJobs();

// Clean up old emails from the resend component every hour
crons.interval(
  "cleanup-old-emails",
  { hours: 1 },
  internal.crons.cleanupResendEmails,
);

// Proactive daily evaluation — fires daily at 05:00 UTC (≈ 06:00 Europe/Paris
// in winter, 07:00 in summer). One deterministic ruleset over HRV readiness
// + weekly adherence; at most one workout modification per ISO week per user.
// Per-user fan-out so one slow read can't block the cohort.
crons.daily(
  "daily-evaluation",
  { hourUTC: 5, minuteUTC: 0 },
  internal.crons.runDailyEvaluation,
);

// Needs-feedback reminder — fires daily at 07:00 UTC (≈ 08–09:00 in
// Europe/Paris). For each onboarded user we fan out a per-user action that
// counts past-planned workouts still uncategorized and pushes a single
// aggregated reminder.
crons.daily(
  "needs-feedback-reminders",
  { hourUTC: 7, minuteUTC: 0 },
  internal.crons.runNeedsFeedbackReminders,
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
 * Fan out one daily evaluation per opted-in user. We page through the users
 * table inline (the cohort is small enough) and let the scheduler run each
 * user's orchestrator independently. Per-user failures don't block others.
 */
export const runDailyEvaluation = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      if (user.banned) continue;
      if (!user.hasCompletedOnboarding) continue;
      if (user.coachInterventionsEnabled === false) continue;
      await ctx.scheduler.runAfter(0, internal.crons.evaluateDailyForUser, {
        userId: user._id,
      });
    }
    return null;
  },
});

/**
 * Per-user daily evaluation orchestrator: call the Engine ruleset to decide +
 * (maybe) write, then — if a rule fired — hand the new intervention to the
 * Coach narration. Engine owns the plan write; Coach owns telling the
 * athlete what happened.
 */
export const evaluateDailyForUser = internalAction({
  args: { userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, { userId }): Promise<null> => {
    const interventionId = await ctx.runAction(
      internal.engine.dailyEvaluation.runForUser,
      { userId },
    );
    if (!interventionId) return null;
    await ctx.runAction(
      internal.coach.narrations.dailyEvaluation.sendForIntervention,
      { interventionId },
    );
    return null;
  },
});

/**
 * Fan out one needs-feedback evaluation per onboarded user. Per-user failures
 * (e.g. missing athlete row) don't block others.
 */
export const runNeedsFeedbackReminders = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      if (user.banned) continue;
      if (!user.hasCompletedOnboarding) continue;
      await ctx.scheduler.runAfter(
        0,
        internal.coach.narrations.needsFeedbackReminder.evaluateAndSendForUser,
        { userId: user._id },
      );
    }
    return null;
  },
});

export default crons;

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

// Proactive HRV-readiness check — fires daily at 04:00 UTC (≈ early morning
// in Europe/Paris year-round). For each opted-in user we fan out a per-user
// action so one slow Soma query can't block the rest of the cohort.
crons.daily(
  "hrv-readiness-check",
  { hourUTC: 4, minuteUTC: 0 },
  internal.crons.runHrvReadinessCheck,
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
 * Fan out one HRV-readiness evaluation per opted-in user. We page through the
 * users table inline (the cohort is small enough) and let the scheduler run
 * each user's orchestrator independently. Per-user failures don't block others.
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
      await ctx.scheduler.runAfter(0, internal.crons.evaluateHrvForUser, {
        userId: user._id,
      });
    }
    return null;
  },
});

/**
 * Per-user HRV orchestrator: call the Engine to decide + (maybe) write, then
 * — if the Engine modified a workout — hand the new intervention to the
 * Coach narration. Engine owns the plan write; Coach owns telling the
 * athlete what happened.
 */
export const evaluateHrvForUser = internalAction({
  args: { userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, { userId }): Promise<null> => {
    const interventionId = await ctx.runAction(
      internal.engine.checkHrv.runForUser,
      { userId },
    );
    if (!interventionId) return null;
    await ctx.runAction(
      internal.coach.narrations.hrvLowReadiness.sendForIntervention,
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

import { cronJobs } from "convex/server";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";

const crons = cronJobs();

// Clean up old emails from the resend component every hour
crons.interval(
  "cleanup-old-emails",
  { hours: 1 },
  internal.crons.cleanupResendEmails,
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

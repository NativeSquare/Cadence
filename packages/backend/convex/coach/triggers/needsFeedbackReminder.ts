/**
 * Needs-feedback reminder.
 *
 * Daily cron sweep that pings the user when one or more planned workouts in
 * the past 7 days are still uncategorized (status: "planned", no `actual`).
 * Aggregate push — one notification per user per day, count-based, never
 * per-workout. Tap deep-links to the dedicated triage screen.
 *
 * The component-level `paused` flag on @convex-dev/expo-push-notifications is
 * the user's master mute switch; we don't add a separate per-channel toggle
 * until there's a concrete need.
 */

import { v } from "convex/values";
import { api, components, internal } from "../../_generated/api";
import { internalAction } from "../../_generated/server";

const LOOKBACK_DAYS = 7;

function ymdToUtcInstant(ymd: string, endOfDay: boolean): string {
  return `${ymd}T${endOfDay ? "23:59:59.999Z" : "00:00:00.000Z"}`;
}

function todayYmdUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function ymdNDaysAgoUtc(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

export const evaluateAndSendForUser = internalAction({
  args: { userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, { userId }): Promise<null> => {
    const user = await ctx.runQuery(api.table.users.get, { id: userId });
    if (!user) return null;
    if (!user.hasCompletedOnboarding) return null;

    const athlete = await ctx.runQuery(
      components.agoge.public.getAthleteByUserId,
      { userId },
    );
    if (!athlete) return null;

    // Window: [today - 7d 00:00 UTC, yesterday 23:59:59.999 UTC]. Exclude
    // today so we never ping about workouts the user still has time to log.
    const startYmd = ymdNDaysAgoUtc(LOOKBACK_DAYS);
    const endYmd = ymdNDaysAgoUtc(1);
    const workouts = await ctx.runQuery(
      components.agoge.public.getPlannedWorkoutsByAthlete,
      {
        athleteId: athlete._id,
        startDate: ymdToUtcInstant(startYmd, false),
        endDate: ymdToUtcInstant(endYmd, true),
      },
    );

    const todayYmd = todayYmdUtc();
    let count = 0;
    for (const w of workouts) {
      if (w.status !== "planned") continue;
      if (w.actual) continue;
      if (!w.planned) continue;
      if (w.planned.date.slice(0, 10) >= todayYmd) continue;
      count += 1;
    }
    if (count === 0) return null;

    const locale: "en" | "fr" = user.locale === "fr" ? "fr" : "en";
    await ctx.runAction(internal.notifications.sendNeedsFeedbackReminder, {
      userId,
      count,
      locale,
    });
    return null;
  },
});

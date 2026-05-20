/**
 * Needs-feedback reminder.
 *
 * Daily cron sweep that pings the user when one or more planned workouts in
 * the past 7 days are still uncategorized (status: "planned", no `actual`).
 * Aggregate nudge — one message per user per day, count-based, never
 * per-workout.
 *
 * Routes through `deliverCoachNarration` (narrate profile): Haiku writes the
 * one-sentence nudge, the agent saves it as an assistant message, and the
 * push fires as a consequence. No tools, single step, no prior context.
 *
 * The component-level `paused` flag on @convex-dev/expo-push-notifications is
 * the user's master mute switch; we don't add a separate per-channel toggle
 * until there's a concrete need.
 */

import { v } from "convex/values";
import { api, components } from "../../_generated/api";
import { internalAction } from "../../_generated/server";
import { composeNarrationSystem } from "../instructions";
import { deliverCoachNarration, ensureCoachThread } from "../turns";

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

const MISSION =
  "You are Cadence, an AI running coach nudging the athlete to log past sessions you can't see results for. You're not scolding — you're just asking them to tell you what happened so the plan stays accurate.";

function buildFacts(args: { firstName: string; count: number }): string {
  return [
    `Athlete name: ${args.firstName || "(unknown)"}`,
    `Sessions still missing feedback from the last 7 days: ${args.count}`,
  ].join("\n");
}

function fallback(locale: "en" | "fr", count: number): string {
  if (locale === "fr") {
    return count === 1
      ? "Une séance attend ton retour. Faite ou manquée ?"
      : `${count} séances attendent ton retour. Faites ou manquées ?`;
  }
  return count === 1
    ? "One workout needs your feedback. Done or missed?"
    : `${count} workouts need your feedback. Done or missed?`;
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
    const tone = user.coachPrefs?.tone ?? "mentor";
    const firstName = (user.name ?? "").split(" ")[0] ?? "";

    const threadId = await ensureCoachThread(ctx, userId);
    await deliverCoachNarration(ctx, {
      userId,
      threadId,
      system: composeNarrationSystem({ locale, tone, mission: MISSION }),
      facts: buildFacts({ firstName, count }),
      fallback: fallback(locale, count),
      logTag: "needsFeedbackReminder",
    });

    return null;
  },
});

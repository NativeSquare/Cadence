/**
 * Needs-feedback reminder.
 *
 * Daily cron sweep that pings the user when one or more planned workouts in
 * the past 7 days are still uncategorized (status: "planned", no `actual`).
 * Aggregate nudge — one message per user per day, count-based, never
 * per-workout.
 *
 * Delivery: Haiku generates a short prose nudge, we drop it into the user's
 * coach thread as an assistant message, and the push fires as a consequence
 * via `sendCoachMessageNotification`. The full agent loop is bypassed — this
 * trigger narrates, it never acts, so it has no access to writing tools.
 *
 * The component-level `paused` flag on @convex-dev/expo-push-notifications is
 * the user's master mute switch; we don't add a separate per-channel toggle
 * until there's a concrete need.
 */

import { anthropic } from "@ai-sdk/anthropic";
import { createThread, saveMessage } from "@convex-dev/agent";
import { generateText } from "ai";
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

function buildPrompt(args: {
  locale: "en" | "fr";
  tone: "mentor" | "drillSergeant" | "pragmatic";
  firstName: string;
  count: number;
}): string {
  const toneLine =
    args.tone === "drillSergeant"
      ? "Tone: direct, demanding, no soft-pedaling, no exclamations."
      : args.tone === "pragmatic"
        ? "Tone: terse and neutral, just facts."
        : "Tone: warm and contextual, no judgment.";
  const localeLine =
    args.locale === "fr"
      ? "Reply in French. Tutoie l'athlète."
      : "Reply in English.";

  return [
    "You are Cadence, an AI running coach nudging the athlete to log past sessions you can't see results for. You're not scolding — you're just asking them to tell you what happened so the plan stays accurate.",
    "",
    localeLine,
    toneLine,
    "",
    "Facts:",
    `- Athlete name: ${args.firstName || "(unknown)"}`,
    `- Sessions still missing feedback from the last 7 days: ${args.count}`,
    "",
    "Reply with the message itself — plain prose, one short sentence, first person from the coach. No JSON, no markdown, no preamble.",
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

    let body: string;
    try {
      const { text } = await generateText({
        model: anthropic.chat("claude-haiku-4-5-20251001"),
        prompt: buildPrompt({ locale, tone, firstName, count }),
      });
      const trimmed = text.trim();
      body = trimmed.length > 0 ? trimmed : fallback(locale, count);
    } catch (err) {
      console.warn("[needsFeedbackReminder] Haiku call failed, using fallback", err);
      body = fallback(locale, count);
    }

    const userIdStr = userId as string;
    const existing = await ctx.runQuery(
      components.agent.threads.listThreadsByUserId,
      {
        userId: userIdStr,
        order: "desc",
        paginationOpts: { numItems: 1, cursor: null },
      },
    );
    const threadId =
      existing.page[0]?._id ??
      (await createThread(ctx, components.agent, { userId: userIdStr }));

    await saveMessage(ctx, components.agent, {
      threadId,
      userId: userIdStr,
      message: { role: "assistant", content: body },
      agentName: "Cadence Coach",
    });

    await ctx.scheduler.runAfter(
      0,
      internal.notifications.sendCoachMessageNotification,
      { userId, threadId, preview: body.slice(0, 140) },
    );
    return null;
  },
});

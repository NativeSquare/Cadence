/**
 * Daily check-in trigger.
 *
 * Action-only for now — invoke from the Convex dashboard as
 * `internal.coach.triggers.dailyCheckIn.evaluateForUser({ userId })`. No cron,
 * no opt-in flag check, no cooldown, no decision log. Its job is to validate
 * the trigger → LLM → thread-message → push pipeline end-to-end with the
 * minimum moving parts.
 *
 * Reads today's and tomorrow's planned workout from Agoge, asks Haiku for a
 * short morning briefing in the user's locale + tone as plain prose, drops it
 * into the user's coach thread as an assistant message, and lets
 * `sendCoachMessageNotification` fire the push as a consequence. The agent
 * loop is deliberately bypassed — this trigger only narrates, it never acts.
 */

import { anthropic } from "@ai-sdk/anthropic";
import { createThread, saveMessage } from "@convex-dev/agent";
import { generateText } from "ai";
import { v } from "convex/values";
import { api, components, internal } from "../../_generated/api";
import { internalAction } from "../../_generated/server";

// ---------------------------------------------------------------------------
// Helpers (pure)
// ---------------------------------------------------------------------------

type WorkoutBrief = {
  type: string;
  name: string;
  distanceMeters?: number;
  durationSeconds?: number;
};

function ymdRange(daysFromToday: number): { start: string; end: string } {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + daysFromToday);
  const start = d.toISOString();
  const endDate = new Date(d.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { start, end: endDate.toISOString() };
}

function formatKm(m?: number): string | null {
  if (m == null || m <= 0) return null;
  return `${(Math.round((m / 1000) * 10) / 10).toFixed(1)} km`;
}

function formatDuration(sec?: number): string | null {
  if (sec == null || sec <= 0) return null;
  const min = Math.round(sec / 60);
  return `${min} min`;
}

function summarize(w: WorkoutBrief | null): string {
  if (!w) return "rest day";
  const parts = [w.name, `(${w.type})`];
  const km = formatKm(w.distanceMeters);
  const dur = formatDuration(w.durationSeconds);
  if (km) parts.push(km);
  if (dur) parts.push(dur);
  return parts.join(" · ");
}

function buildPrompt(args: {
  locale: "en" | "fr";
  tone: "mentor" | "drillSergeant" | "pragmatic";
  firstName: string;
  today: WorkoutBrief | null;
  tomorrow: WorkoutBrief | null;
}): string {
  const toneLine =
    args.tone === "drillSergeant"
      ? "Tone: direct, demanding, no soft-pedaling, no exclamations."
      : args.tone === "pragmatic"
        ? "Tone: terse and neutral, just facts."
        : "Tone: warm and contextual, briefly explain why.";
  const localeLine =
    args.locale === "fr"
      ? "Reply in French. Tutoie l'athlète."
      : "Reply in English.";

  return [
    "You are Cadence, an AI running coach checking in with your athlete in the morning. You're not asking for anything — you're greeting them, naming what's on the schedule, and pointing at what matters today.",
    "",
    localeLine,
    toneLine,
    "",
    "Facts:",
    `- Athlete name: ${args.firstName || "(unknown)"}`,
    `- Today's session: ${summarize(args.today)}`,
    `- Tomorrow's session: ${summarize(args.tomorrow)}`,
    "",
    "Reply with the message itself — plain prose, one to three short sentences, first person from the coach. No JSON, no markdown headings, no preamble.",
  ].join("\n");
}

function fallback(locale: "en" | "fr", today: WorkoutBrief | null): string {
  if (locale === "fr") {
    return today
      ? `Bonjour. Au programme aujourd'hui : ${today.name}.`
      : "Bonjour. Jour de repos aujourd'hui — récupère bien.";
  }
  return today
    ? `Morning. On the menu today: ${today.name}.`
    : "Morning. Rest day today — recover well.";
}

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------

export const evaluateForUser = internalAction({
  args: { userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, { userId }): Promise<null> => {
    const user = await ctx.runQuery(api.table.users.get, { id: userId });
    if (!user) return null;

    const locale: "en" | "fr" = user.locale === "fr" ? "fr" : "en";
    const tone = user.coachPrefs?.tone ?? "mentor";
    const firstName = (user.name ?? "").split(" ")[0] ?? "";

    // Athlete may not exist yet (pre-onboarding). That's fine — we just
    // skip the workout fetch and the prompt sees "rest day".
    const athlete = await ctx.runQuery(
      components.agoge.public.getAthleteByUserId,
      { userId },
    );

    let today: WorkoutBrief | null = null;
    let tomorrow: WorkoutBrief | null = null;
    if (athlete) {
      const todayRange = ymdRange(0);
      const tomorrowRange = ymdRange(1);
      const workouts = await ctx.runQuery(
        components.agoge.public.getPlannedWorkoutsByAthlete,
        {
          athleteId: athlete._id,
          startDate: todayRange.start,
          endDate: tomorrowRange.end,
        },
      );
      const todayPrefix = todayRange.start.slice(0, 10);
      const tomorrowPrefix = tomorrowRange.start.slice(0, 10);
      for (const w of workouts) {
        if (!w.planned) continue;
        const dayPrefix = w.planned.date.slice(0, 10);
        const brief: WorkoutBrief = {
          type: w.type,
          name: w.name,
          distanceMeters: w.planned.distanceMeters,
          durationSeconds: w.planned.durationSeconds,
        };
        if (dayPrefix === todayPrefix && !today) today = brief;
        else if (dayPrefix === tomorrowPrefix && !tomorrow) tomorrow = brief;
      }
    }

    let body: string;
    try {
      const { text } = await generateText({
        model: anthropic.chat("claude-haiku-4-5-20251001"),
        prompt: buildPrompt({ locale, tone, firstName, today, tomorrow }),
      });
      const trimmed = text.trim();
      body = trimmed.length > 0 ? trimmed : fallback(locale, today);
    } catch (err) {
      console.warn("[dailyCheckIn] Haiku call failed, using fallback", err);
      body = fallback(locale, today);
    }

    // Drop the prose into the user's coach thread as an assistant message.
    // We bypass the full agent loop on purpose: this trigger narrates, it
    // never acts, so it must not have access to writing tools.
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

    // Push fires as a consequence of the new thread message. Tap deep-links
    // to the coach tab (handled by sendCoachMessageNotification).
    await ctx.scheduler.runAfter(
      0,
      internal.notifications.sendCoachMessageNotification,
      { userId, threadId, preview: body.slice(0, 140) },
    );
    return null;
  },
});

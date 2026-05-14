/**
 * Daily check-in trigger.
 *
 * Action-only for now — invoke from the Convex dashboard as
 * `internal.coach.triggers.dailyCheckIn.evaluateForUser({ userId })`. No cron,
 * no opt-in flag check, no cooldown, no decision log. Its job is to validate
 * the trigger → LLM → push pipeline end-to-end with the minimum moving parts.
 *
 * Reads today's and tomorrow's planned workout from Agoge, asks Haiku for a
 * short morning briefing in the user's locale + tone, and ships it as a push
 * notification. Tap deep-links to today's workout (if any) or just opens the
 * app to the home screen.
 */

import { anthropic } from "@ai-sdk/anthropic";
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
  workoutId?: string;
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
    "Return STRICT JSON only, no markdown, no preamble:",
    '{ "title": "<short push title, max 6 words>", "body": "<one to two short sentences, max 160 chars, first person from the coach>" }',
  ].join("\n");
}

function parseHaikuJson(
  text: string,
): { title: string; body: string } | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const obj = JSON.parse(text.slice(start, end + 1));
    if (
      typeof obj?.title === "string" &&
      typeof obj?.body === "string" &&
      obj.title.length > 0 &&
      obj.body.length > 0
    ) {
      return { title: obj.title, body: obj.body };
    }
  } catch {
    /* fall through */
  }
  return null;
}

function fallback(
  locale: "en" | "fr",
  today: WorkoutBrief | null,
): { title: string; body: string } {
  if (locale === "fr") {
    return {
      title: "Bonjour",
      body: today
        ? `Au programme aujourd'hui : ${today.name}.`
        : "Jour de repos aujourd'hui — récupère bien.",
    };
  }
  return {
    title: "Morning check-in",
    body: today
      ? `On the menu today: ${today.name}.`
      : "Rest day today — recover well.",
  };
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
          workoutId: w._id,
        };
        if (dayPrefix === todayPrefix && !today) today = brief;
        else if (dayPrefix === tomorrowPrefix && !tomorrow) tomorrow = brief;
      }
    }

    let title: string;
    let body: string;
    try {
      const { text } = await generateText({
        model: anthropic.chat("claude-haiku-4-5-20251001"),
        prompt: buildPrompt({ locale, tone, firstName, today, tomorrow }),
      });
      const parsed = parseHaikuJson(text);
      if (parsed) {
        title = parsed.title;
        body = parsed.body;
      } else {
        const fb = fallback(locale, today);
        title = fb.title;
        body = fb.body;
      }
    } catch (err) {
      console.warn("[dailyCheckIn] Haiku call failed, using fallback", err);
      const fb = fallback(locale, today);
      title = fb.title;
      body = fb.body;
    }

    // If today has a workout, deep-link to its detail page. Otherwise leave
    // the screen unset and the app opens to its home.
    const data = today?.workoutId
      ? { screen: "workout", workoutId: today.workoutId }
      : undefined;

    await ctx.runAction(internal.notifications.sendToUser, {
      userId,
      title,
      body,
      data,
    });
    return null;
  },
});

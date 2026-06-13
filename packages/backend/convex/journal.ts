import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { api, internal } from "./_generated/api";
import { action } from "./_generated/server";
import { deriveSignals } from "./coach/deriveSignals";
import { callWhisper } from "./coach/whisper";

/**
 * Calendar-day anchor (noon UTC) from a workout's actual instant date. This is
 * the join key for Soma daily summaries and Agoge workouts — distinct from the
 * entry's `_creationTime`.
 */
function dayKeyFromInstant(actualDate: string): string {
  return `${actualDate.slice(0, 10)}T12:00:00.000Z`;
}

/**
 * Capture a post-session voice debrief: transcribe it, extract structured
 * signals, mark the workout done, and persist the journal entry — the
 * capture→derive pipeline of Cadence's qualitative wedge.
 *
 * All-or-nothing: the two flaky external calls (Whisper, then the extraction
 * LLM) run BEFORE any database write. If either fails the action throws and
 * nothing is committed — no orphaned completion, no audio-only stub — so the
 * runner simply retries the recording. The retained audio is NOT deleted (it
 * plays back on the detail page), unlike the coach-chat `transcribe` action.
 */
export const capturePostSession = action({
  args: {
    workoutId: v.string(),
    audioStorageId: v.id("_storage"),
    durationMs: v.number(),
    // The workout's actual (completed) date — an instant ISO string.
    actualDate: v.string(),
    // Present only for baseline test workouts.
    testDistanceMeters: v.optional(v.number()),
    testDurationSeconds: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    if (!(await ctx.runQuery(internal.table.users.checkPro, { userId }))) {
      throw new ConvexError({
        code: "SUBSCRIPTION_REQUIRED",
        message: "An active Cadence Pro subscription is required.",
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new ConvexError({
        code: "MISCONFIGURED",
        message: "OPENAI_API_KEY is not set",
      });
    }

    // Locale is the server-side source of truth (drives Whisper hint + prompt).
    const user = await ctx.runQuery(api.table.users.get, { id: userId });
    const locale: "en" | "fr" = user?.locale === "fr" ? "fr" : "en";

    const blob = await ctx.storage.get(args.audioStorageId);
    if (!blob) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Audio file not found",
      });
    }

    // ── Flaky external calls first (no DB state yet) ──
    const transcript = await callWhisper(apiKey, blob, locale);
    const derived = await deriveSignals(transcript, locale);

    // ── Commit: complete the workout, then persist the journal entry ──
    const actual: {
      date: string;
      distanceMeters?: number;
      durationSeconds?: number;
    } = { date: args.actualDate };
    if (args.testDistanceMeters !== undefined) {
      actual.distanceMeters = args.testDistanceMeters;
    }
    if (args.testDurationSeconds !== undefined) {
      actual.durationSeconds = args.testDurationSeconds;
    }

    await ctx.runMutation(api.agoge.workouts.updateWorkout, {
      workoutId: args.workoutId,
      status: "completed",
      actual,
    });

    await ctx.runMutation(internal.table.journalEntry.recordPostSession, {
      userId,
      workoutId: args.workoutId,
      dayKey: dayKeyFromInstant(args.actualDate),
      audioStorageId: args.audioStorageId,
      durationMs: args.durationMs,
      transcript,
      transcriptLang: locale,
      derived,
    });

    return { transcript, derived };
  },
});

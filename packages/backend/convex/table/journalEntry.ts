import { getAuthUserId } from "@convex-dev/auth/server";
import { defineTable } from "convex/server";
import { ConvexError, v } from "convex/values";
import { components } from "../_generated/api";
import { internalMutation, mutation, query } from "../_generated/server";
import { migrations } from "../migrations";

/**
 * The journal spine — Cadence's qualitative wedge. A `journalEntry` captures
 * the runner's voice around a workout: the raw audio (retained for playback),
 * its transcript, and a structured `derived` object an LLM extracts from that
 * transcript. The cross of these qualitative signals with quantitative data
 * (Soma biometrics × Agoge plan, joined on `dayKey`) is what lets the coach
 * "learn about you" over time.
 *
 * This is the spine for all entry kinds; only `post_session` exists today
 * (pre-session decisions and spontaneous entries land later). No `createdAt`
 * — Convex provides `_creationTime`; `dayKey` is the calendar-day anchor used
 * as the join key, distinct from the creation instant.
 */

/**
 * Structured qualitative signals extracted by the LLM from the transcript.
 * Every field is optional — the model fills only what the runner actually
 * mentioned, and we store whatever it returns (no code gate).
 *
 * `painLocations[].area` is a canonical snake_case body-part key (e.g.
 * "calf_right") so the same body part matches across entries regardless of the
 * transcript language; it's a permissive string (not a closed enum) so an
 * unanticipated location can never abort an all-or-nothing capture. The UI
 * localizes the key for display.
 */
export const derivedValidator = v.object({
  rpe: v.optional(v.number()),
  painLocations: v.optional(
    v.array(
      v.object({
        area: v.string(),
        severity: v.optional(v.number()),
      }),
    ),
  ),
  sleepQuality: v.optional(
    v.union(v.literal("poor"), v.literal("ok"), v.literal("good")),
  ),
  lifeStress: v.optional(
    v.union(v.literal("low"), v.literal("med"), v.literal("high")),
  ),
  motivation: v.optional(
    v.union(v.literal("low"), v.literal("med"), v.literal("high")),
  ),
  effortFeel: v.optional(
    v.union(v.literal("easy"), v.literal("right"), v.literal("hard")),
  ),
  mood: v.optional(v.string()),
  rawNotes: v.optional(v.string()),
  // Triage tier the LLM assigns to the whole debrief: does it warrant
  // interrupting the runner? "none" = nothing notable, "watch" = worth a
  // gentle acknowledgment, "act" = serious enough to (later) offer a plan
  // change. Drives the scaled coach response in the Mark Done sheet. Optional
  // in storage so pre-existing `derived` rows (which lack it) still validate;
  // `deriveSignals` always emits it on new entries.
  concern: v.optional(
    v.union(v.literal("none"), v.literal("watch"), v.literal("act")),
  ),
});

const documentSchema = {
  userId: v.id("users"),
  // Calendar-day anchor (noon-anchored UTC ISO) — the join key for Soma daily
  // summaries and Agoge workouts, distinct from `_creationTime`.
  dayKey: v.string(),
  kind: v.literal("post_session"),
  workoutId: v.string(), // Agoge workout id (workouts live in the Agoge component)
  audioStorageId: v.optional(v.id("_storage")),
  durationMs: v.optional(v.number()),
  transcript: v.optional(v.string()),
  transcriptLang: v.optional(v.union(v.literal("en"), v.literal("fr"))),
  derived: v.optional(derivedValidator),
  // The runner's logged intention at the post-session fork: Keep → "go",
  // Ease → "ease". Set only when a decision fork was actually presented
  // (`concern: "act"` + a conflicting hard session); quiet sessions leave it
  // unset, so "decision is present" means "a real choice was on the table".
  // This is the minimal first-class Decision — `reason`, context snapshot, and
  // outcome are deliberately deferred until there's a reader. See CONTEXT.md
  // "Decision vs Intervention".
  decision: v.optional(v.union(v.literal("go"), v.literal("ease"))),
};

export const journalEntry = defineTable(documentSchema)
  .index("by_workout", ["workoutId"])
  .index("by_user", ["userId"])
  .index("by_user_dayKey", ["userId", "dayKey"]);

/**
 * Persist a post-session journal entry. Internal — the `capturePostSession`
 * action authenticates, runs the (flaky) transcription + extraction first, and
 * only then calls this to commit, passing the resolved `userId`.
 */
export const recordPostSession = internalMutation({
  args: {
    userId: v.id("users"),
    workoutId: v.string(),
    dayKey: v.string(),
    audioStorageId: v.id("_storage"),
    durationMs: v.number(),
    transcript: v.string(),
    transcriptLang: v.union(v.literal("en"), v.literal("fr")),
    derived: derivedValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("journalEntry", {
      userId: args.userId,
      dayKey: args.dayKey,
      kind: "post_session",
      workoutId: args.workoutId,
      audioStorageId: args.audioStorageId,
      durationMs: args.durationMs,
      transcript: args.transcript,
      transcriptLang: args.transcriptLang,
      derived: args.derived,
    });
  },
});

/**
 * Log the runner's intention at the post-session decision fork onto the entry
 * the capture just created. Called from the Mark Done sheet: Keep → "go",
 * Ease → "ease" (the ease additionally fires the Engine intervention; this only
 * records the choice). Auth-scoped to the owner. The minimal first-class
 * Decision — see the `decision` field comment.
 */
export const recordDecision = mutation({
  args: {
    entryId: v.id("journalEntry"),
    intention: v.union(v.literal("go"), v.literal("ease")),
  },
  handler: async (ctx, { entryId, intention }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }
    const row = await ctx.db.get(entryId);
    if (!row || row.userId !== userId) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Journal entry not found",
      });
    }
    await ctx.db.patch(entryId, { decision: intention });
  },
});

/**
 * Latest journal entry for a workout, with a playable audio URL. Auth-scoped to
 * the owner. Powers the workout detail page: audio player + transcript +
 * extracted-signal chips.
 */
export const getForWorkout = query({
  args: { workoutId: v.string() },
  handler: async (ctx, { workoutId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const row = await ctx.db
      .query("journalEntry")
      .withIndex("by_workout", (q) => q.eq("workoutId", workoutId))
      .order("desc")
      .first();
    if (!row || row.userId !== userId) return null;
    const audioUrl = row.audioStorageId
      ? await ctx.storage.getUrl(row.audioStorageId)
      : null;
    return { ...row, audioUrl };
  },
});

/**
 * The Decisions list behind the Coach dashboard — the runner's recorded calls
 * at a post-session fork (`decision` set: Keep → "go", Ease → "ease"). Strict:
 * only rows where a real choice was on the table appear (a fork is presented
 * only on `concern: "act"` + a conflicting hard session), so this is
 * near-empty for most users by design — it stakes out the moat surface, it
 * doesn't pretend to be full.
 *
 * Enriched server-side: each row is joined to its Agoge workout for a
 * display-ready `{ workoutName, workoutType }`. A deleted/reassigned workout
 * yields `null` names (kept, not dropped — a recorded decision must not vanish
 * because the workout was later edited); the client renders a localized
 * fallback label. Recent-N descending; the volume is trivial so the per-row
 * join is a non-issue. Auth-scoped to the owner.
 */
export const listDecisions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];

    const rows = await ctx.db
      .query("journalEntry")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    const decided = rows
      .filter((r) => r.decision !== undefined)
      .slice(0, limit ?? 50);

    return await Promise.all(
      decided.map(async (r) => {
        const workout = await ctx.runQuery(components.agoge.public.getWorkout, {
          workoutId: r.workoutId,
        });
        return {
          entryId: r._id,
          workoutId: r.workoutId,
          dayKey: r.dayKey,
          decision: r.decision!,
          workoutName: workout?.name ?? null,
          workoutType: workout?.type ?? null,
        };
      }),
    );
  },
});

/**
 * Scan reader for the chat Coach (`listJournalEntries` tool). Compact rows —
 * `derived` (the structured distillation) but NO transcript — so the agent can
 * sweep a date range cheaply and decide what to open with `getEntry`. Keeping
 * full transcripts out of the list is what protects the agent's context
 * window. Optional `dayKey` bounds (inclusive) and a `decisionOnly` filter.
 * Auth-scoped to the owner.
 */
export const listEntries = query({
  args: {
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    decisionOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, { startDate, endDate, decisionOnly }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];

    const rows = await ctx.db
      .query("journalEntry")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return rows
      .filter((r) => (startDate ? r.dayKey >= startDate : true))
      .filter((r) => (endDate ? r.dayKey <= endDate : true))
      .filter((r) => (decisionOnly ? r.decision !== undefined : true))
      .map((r) => ({
        entryId: r._id,
        dayKey: r.dayKey,
        workoutId: r.workoutId,
        decision: r.decision ?? null,
        derived: r.derived ?? null,
      }));
  },
});

/**
 * Drill-in reader for the chat Coach (`getJournalEntry` tool): the full entry
 * including transcript and a playable audio URL — the runner's actual words,
 * fetched only when restitution needs them. Auth-scoped to the owner.
 */
export const getEntry = query({
  args: { entryId: v.id("journalEntry") },
  handler: async (ctx, { entryId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const row = await ctx.db.get(entryId);
    if (!row || row.userId !== userId) return null;
    const audioUrl = row.audioStorageId
      ? await ctx.storage.getUrl(row.audioStorageId)
      : null;
    return { ...row, audioUrl };
  },
});

/**
 * One-shot backfill: lift legacy `sessionFeedback` rows (audio-only, no
 * transcript/derived) into the `journalEntry` spine as `post_session` entries.
 * Idempotent — skips a workout that already has an entry, so it's safe to
 * re-run. `dayKey` is anchored from the row's creation day (legacy rows predate
 * the dayKey concept).
 *
 * Run once in production, then remove `sessionFeedback` (table + file) and this
 * migration in a follow-up:
 *   npx convex run migrations:runAll \
 *     '{fn: "table/journalEntry:backfillFromSessionFeedback"}'
 */
export const backfillFromSessionFeedback = migrations.define({
  table: "sessionFeedback",
  migrateOne: async (ctx, doc) => {
    const existing = await ctx.db
      .query("journalEntry")
      .withIndex("by_workout", (q) => q.eq("workoutId", doc.workoutId))
      .first();
    if (existing) return;
    const dayKey = `${new Date(doc._creationTime)
      .toISOString()
      .slice(0, 10)}T12:00:00.000Z`;
    await ctx.db.insert("journalEntry", {
      userId: doc.userId,
      dayKey,
      kind: "post_session",
      workoutId: doc.workoutId,
      audioStorageId: doc.audioStorageId,
      durationMs: doc.durationMs,
    });
  },
});

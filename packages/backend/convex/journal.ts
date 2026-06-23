import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { EASE_RPE, buildEasedWorkout } from "@packages/shared/ease";
import {
  type DailyRecord,
  type Readiness,
  type SleepRecord,
  computeReadiness,
} from "@packages/shared/readiness";
import {
  parseStructure,
  summarizeStructure,
} from "@packages/shared/workout-summary";
import { api, components, internal } from "./_generated/api";
import { type ActionCtx, action } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
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

// Hard / quality session types whose intensity collides with a fresh injury
// scare or deep fatigue. Easy/long/recovery runs aren't worth interrupting for.
const HARD_TYPES = new Set(["intervals", "threshold", "race_pace"]);

// How far ahead we look for a conflicting hard session. Past this, recovery is
// too uncertain to act on now — we acknowledge and let it ride.
const CONFLICT_WINDOW_DAYS = 3;

function addDaysYmd(ymd: string, days: number): string {
  const d = new Date(`${ymd}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Trailing window the HRV / resting-HR baseline is computed over. Matches the
// 14-day baseline the glossary defines for the HRV z-score.
const READINESS_WINDOW_DAYS = 14;

/**
 * Best-effort pre-fetch of the runner's Soma Readiness for the completed
 * session's day — the deterministic input that lets the triage corroborate the
 * voice debrief with the body's signal (ADR-0009). Reads the trailing 14-day
 * window of daily summaries + sleep and folds them into the normalized block.
 *
 * Soma is an OPPORTUNISTIC enrichment, never a point of failure: any error (no
 * connection, component hiccup) is swallowed and degrades to `noSignal`. This
 * runs before `deriveSignals` and any DB write, so a failure here can never
 * break the all-or-nothing capture (ADR-0004).
 */
async function fetchReadiness(
  ctx: ActionCtx,
  userId: Id<"users">,
  actualDate: string,
): Promise<Readiness> {
  try {
    const endYmd = actualDate.slice(0, 10);
    const startYmd = addDaysYmd(endYmd, -READINESS_WINDOW_DAYS);
    const range = {
      userId,
      startTime: `${startYmd}T00:00:00.000Z`,
      endTime: `${endYmd}T23:59:59.999Z`,
      order: "asc" as const,
    };
    const [dailies, sleeps] = await Promise.all([
      ctx.runQuery(components.soma.public.listDaily, range),
      ctx.runQuery(components.soma.public.listSleep, range),
    ]);
    return computeReadiness({
      dayKey: dayKeyFromInstant(actualDate),
      dailies: dailies as DailyRecord[],
      sleeps: sleeps as SleepRecord[],
    });
  } catch {
    return { noSignal: true };
  }
}

/**
 * Step 1 of the post-session capture: transcribe the uploaded audio. Returns
 * the transcript (and the locale it was transcribed in) and writes NOTHING.
 *
 * Split out from `deriveAndCommit` so the client can show the runner their own
 * words the moment Whisper finishes — filling the dead time while the
 * extraction LLM runs (the wedge's "watch the coach hear you" beat). Writing
 * nothing here keeps the all-or-nothing DB guarantee: the only writer is
 * `deriveAndCommit`, and it writes only after its own flaky LLM call succeeds.
 * A failure at this step commits nothing, so the runner cleanly retries.
 * See ADR-0004.
 */
export const transcribe = action({
  args: { audioStorageId: v.id("_storage") },
  handler: async (
    ctx,
    args,
  ): Promise<{ transcript: string; transcriptLang: "en" | "fr" }> => {
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

    // Locale is the server-side source of truth (drives the Whisper hint and,
    // later, the extraction prompt language).
    const user = await ctx.runQuery(api.table.users.get, { id: userId });
    const locale: "en" | "fr" = user?.locale === "fr" ? "fr" : "en";

    const blob = await ctx.storage.get(args.audioStorageId);
    if (!blob) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Audio file not found",
      });
    }

    const transcript = await callWhisper(apiKey, blob, locale);
    return { transcript, transcriptLang: locale };
  },
});

/**
 * Step 2 of the post-session capture: extract structured signals from the
 * (already-transcribed) text, mark the workout done, and persist the journal
 * entry — the "derive" half of Cadence's qualitative wedge.
 *
 * All-or-nothing: the flaky extraction LLM runs BEFORE any database write, so a
 * failure commits nothing — no orphaned completion, no audio-only stub — and
 * the client retries *this step only*, reusing the transcript it already holds
 * (no second Whisper call). The transcript is passed from the client: it is the
 * runner's own spoken debrief about themselves, so tampering only corrupts
 * their own signals — we trust it rather than re-transcribe. See ADR-0004.
 */
export const deriveAndCommit = action({
  args: {
    workoutId: v.string(),
    audioStorageId: v.id("_storage"),
    durationMs: v.number(),
    // The workout's actual (completed) date — an instant ISO string.
    actualDate: v.string(),
    // The transcript from `transcribe`, plus the locale it was produced in
    // (drives the extraction prompt language).
    transcript: v.string(),
    transcriptLang: v.union(v.literal("en"), v.literal("fr")),
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

    // ── Best-effort Soma read (no DB state yet); degrades to noSignal ──
    const readiness = await fetchReadiness(ctx, userId, args.actualDate);

    // ── Flaky external call first (no DB state yet) ──
    const { derived, coachReply } = await deriveSignals(
      args.transcript,
      args.transcriptLang,
      readiness,
    );

    // ── Commit: complete the workout, then persist the journal entry ──
    await ctx.runMutation(api.agoge.workouts.updateWorkout, {
      workoutId: args.workoutId,
      status: "completed",
      actual: { date: args.actualDate },
    });

    // Annotated (not inferred) to break the action→generated-API→action type
    // cycle that otherwise makes this handler's return type implicitly `any`.
    const entryId: Id<"journalEntry"> = await ctx.runMutation(
      internal.table.journalEntry.recordPostSession,
      {
        userId,
        workoutId: args.workoutId,
        dayKey: dayKeyFromInstant(args.actualDate),
        audioStorageId: args.audioStorageId,
        durationMs: args.durationMs,
        transcript: args.transcript,
        transcriptLang: args.transcriptLang,
        derived,
        readiness,
      },
    );

    // When the debrief is serious enough to act on (`concern: "act"`), look for
    // the nearest upcoming hard session in the next few days. If one exists,
    // the client offers a one-tap ease (the Path B decision prompt). No
    // conflicting hard session → no prompt, just the serious acknowledgment.
    const conflict =
      derived.concern === "act"
        ? await findConflictingHardSession(
            ctx,
            userId,
            args.actualDate,
            args.transcriptLang,
          )
        : null;

    // `coachReply` rides back to the client for the in-the-moment "we heard
    // you" response in the Mark Done sheet; it is not persisted. `derived`
    // drives the signal chips + Concern-tier pill, `conflict` the decision
    // prompt when present. `entryId` lets the client log the runner's intention
    // (`recordDecision`) onto the entry on Keep/Ease.
    return { derived, coachReply, conflict, entryId };
  },
});

/** A workout's volume for the before/after preview. `0` means "not computable". */
type PreviewVolume = { type: string; durationSec: number; distanceM: number };

/**
 * Nearest planned hard session strictly after the completed session's day and
 * within `CONFLICT_WINDOW_DAYS`. Returns the shape the client needs to render
 * the white-box ease preview and act on the prompt, or null if none.
 *
 * `before` summarises the session as prescribed; `after` is the eased form from
 * the *same* `buildEasedWorkout` core the Engine mutation uses, so the preview
 * matches what tapping "Ease it" will produce. Either volume is `0` when the
 * session has no computable distance/duration — the client then shows a
 * type-only contrast instead of inventing numbers.
 */
async function findConflictingHardSession(
  ctx: ActionCtx,
  userId: Id<"users">,
  actualDate: string,
  locale: "en" | "fr",
): Promise<{
  workoutId: string;
  name: string;
  date: string;
  type: string;
  before: PreviewVolume;
  after: PreviewVolume & { rpe: number };
} | null> {
  const athlete = await ctx.runQuery(
    components.agoge.public.getAthleteByUserId,
    { userId },
  );
  if (!athlete) return null;

  const fromYmd = actualDate.slice(0, 10);
  const planned = await ctx.runQuery(
    components.agoge.public.getPlannedWorkoutsByAthlete,
    {
      athleteId: athlete._id,
      startDate: `${fromYmd}T00:00:00.000Z`,
      endDate: `${addDaysYmd(fromYmd, CONFLICT_WINDOW_DAYS)}T23:59:59.999Z`,
    },
  );

  const next = planned
    .filter(
      (w) =>
        HARD_TYPES.has(w.type) &&
        w.planned?.date != null &&
        w.planned.date.slice(0, 10) > fromYmd,
    )
    .sort((a, b) => a.planned!.date.localeCompare(b.planned!.date))[0];

  if (!next || !next.planned) return null;

  const structure = parseStructure(next.planned.structure);
  const beforeSummary = structure
    ? summarizeStructure(structure)
    : { durationSeconds: 0, distanceMeters: 0 };
  const eased = structure ? buildEasedWorkout(structure, locale) : null;

  return {
    workoutId: next._id,
    name: next.name,
    date: next.planned.date,
    type: next.type,
    before: {
      type: next.type,
      durationSec: beforeSummary.durationSeconds,
      distanceM: beforeSummary.distanceMeters,
    },
    after: {
      type: "easy",
      durationSec: eased?.summary.durationSec ?? 0,
      distanceM: eased?.summary.distanceM ?? 0,
      rpe: EASE_RPE,
    },
  };
}

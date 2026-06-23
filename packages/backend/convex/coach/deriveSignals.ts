/**
 * Signal extraction — the "derive" step of the qualitative wedge.
 *
 * Takes a post-session voice transcript and pulls out a structured `derived`
 * object (RPE, pain, sleep, stress, motivation, effort feel, mood) with a
 * single stateless LLM call. This is NOT routed through the Coach Agent: there
 * is no thread, no tools, no history — just transcript in, struct out. The
 * Coach's first-person voice stays separate from this silent extraction job.
 *
 * Detection stays deterministic downstream; this only structures what the
 * runner said. Every field is optional and the model is told to fill ONLY what
 * was actually mentioned — we store whatever comes back (no code gate).
 */

import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import type { Infer } from "convex/values";
import {
  type Concern,
  type Readiness,
  ratchetConcern,
} from "@packages/shared/readiness";
import type { derivedValidator } from "../table/journalEntry";

export type Derived = Infer<typeof derivedValidator>;

// Canonical body-part vocabulary. The LLM emits these keys regardless of the
// transcript language so the same location matches across entries; the UI
// localizes them for display. Kept as guidance (not a closed enum) so a novel
// location still gets captured rather than aborting the capture.
const BODY_PART_VOCAB = [
  "calf_left",
  "calf_right",
  "shin_left",
  "shin_right",
  "achilles_left",
  "achilles_right",
  "ankle_left",
  "ankle_right",
  "foot_left",
  "foot_right",
  "knee_left",
  "knee_right",
  "hamstring_left",
  "hamstring_right",
  "quad_left",
  "quad_right",
  "it_band_left",
  "it_band_right",
  "hip_left",
  "hip_right",
  "hip_flexor_left",
  "hip_flexor_right",
  "glute_left",
  "glute_right",
  "groin",
  "lower_back",
  "upper_back",
] as const;

const derivedSchema = z.object({
  rpe: z
    .number()
    .optional()
    .describe(
      "Rate of perceived exertion as an integer from 0 (rest) to 10 (max effort).",
    ),
  painLocations: z
    .array(
      z.object({
        area: z
          .string()
          .describe(
            `Canonical snake_case body part. Prefer one of: ${BODY_PART_VOCAB.join(
              ", ",
            )}. Use a "_left"/"_right" suffix only when the runner names a side; otherwise omit the side. Coin a new snake_case key only if none fit.`,
          ),
        severity: z
          .number()
          .optional()
          .describe(
            "How bad it sounds as an integer from 1 (slight niggle) to 5 (severe).",
          ),
      }),
    )
    .optional()
    .describe("Any aches, pains, tightness or niggles the runner mentioned."),
  sleepQuality: z.enum(["poor", "ok", "good"]).optional(),
  lifeStress: z.enum(["low", "med", "high"]).optional(),
  motivation: z.enum(["low", "med", "high"]).optional(),
  effortFeel: z
    .enum(["easy", "right", "hard"])
    .optional()
    .describe("How the prescribed effort actually felt to the runner."),
  mood: z
    .string()
    .optional()
    .describe("Short free-text mood, in the runner's own language."),
  rawNotes: z
    .string()
    .optional()
    .describe(
      "Anything else useful the runner said that doesn't fit the fields above, verbatim and in their own language.",
    ),
});

const CONCERN_TIER_GUIDANCE = [
  "Triage tier — how much this debrief warrants interrupting the runner. Judge the whole message, not any single number:",
  '"none" — nothing notable; the session went fine.',
  '"watch" — a mild niggle or off-feeling worth acknowledging and keeping an eye on, but not acting on.',
  '"act" — something serious: real pain, an injury scare, or clear anxiety about upcoming hard sessions, where a good coach would consider changing the plan.',
  "Lean on what the runner conveys, not just severity numbers — genuine worry counts even without a high pain score.",
].join(" ");

/**
 * The LLM emits the signals plus a short first-person coach reply in the same
 * call. `coachReply` is *narration*, not a stored signal — the caller returns
 * it to the client for the in-the-moment "we heard you" response and does not
 * persist it on the entry.
 */
const replySchema = derivedSchema.extend({
  concernFromVoice: z
    .enum(["none", "watch", "act"])
    .describe(
      `${CONCERN_TIER_GUIDANCE} Judge this purely from the runner's WORDS — ignore any Readiness context. Always pick exactly one.`,
    ),
  concernFinal: z
    .enum(["none", "watch", "act"])
    .describe(
      [
        `${CONCERN_TIER_GUIDANCE}`,
        "This is your tier AFTER also weighing the Readiness context block (HRV, resting HR, sleep), if one was provided.",
        "Readiness may only CORROBORATE the runner's words: you may raise concernFromVoice by at most one step when poor readiness backs up a concern they voiced (none→watch, or watch→act).",
        "Never lower it below concernFromVoice, never jump none→act, and if NO Readiness context was provided you MUST return exactly concernFromVoice.",
      ].join(" "),
    ),
  coachReply: z
    .string()
    .describe(
      "A short (1-2 sentence) first-person reply from the coach to the runner, in the runner's language. Warm, direct, never clinical. Scale it to your final tier: affirm a good session for \"none\"; acknowledge and say you'll keep an eye on it for \"watch\"; for \"act\", take it seriously and recommend going easy on the next hard session. You may reference the Readiness context naturally when it corroborates (\"your HRV was down this morning\"), but never invent specific plan numbers.",
    ),
});

function systemPrompt(locale: "en" | "fr"): string {
  const lang = locale === "fr" ? "French" : "English";
  return [
    "You extract structured training signals from a runner's spoken post-session debrief.",
    `The transcript is in ${lang}. Read it carefully and fill in ONLY the fields the runner actually mentioned — leave everything else unset. Do not infer, guess, or invent.`,
    "Pain/effort/sleep/stress/motivation enums are fixed English tokens. Body-part keys are canonical snake_case (see the field description). `mood` and `rawNotes` stay in the runner's own language.",
    "If the runner said nothing relevant to a field, omit it.",
    "Always set BOTH `concernFromVoice` (the tier from the runner's words alone) and `concernFinal` (after weighing any Readiness context, per its field rules), and write a `coachReply` in the runner's language scaled to the final tier.",
  ].join(" ");
}

/**
 * Render the Readiness block as a compact English context section appended to
 * the transcript. Returns null when there is no usable signal — the prompt then
 * carries no Readiness section and the LLM is told to keep `concernFinal` equal
 * to `concernFromVoice`.
 */
function renderReadiness(readiness?: Readiness): string | null {
  if (!readiness || readiness.noSignal) return null;
  const lines: string[] = [];
  if (typeof readiness.hrvZScore === "number") {
    const dir =
      readiness.hrvZScore <= -1
        ? "well below"
        : readiness.hrvZScore < 0
          ? "below"
          : "at or above";
    lines.push(
      `- HRV: z-score ${readiness.hrvZScore} (${dir} their own 14-day baseline)`,
    );
  }
  if (typeof readiness.restingHrDelta === "number") {
    const sign = readiness.restingHrDelta > 0 ? "+" : "";
    lines.push(
      `- Resting HR: ${sign}${readiness.restingHrDelta} bpm vs baseline`,
    );
  }
  if (typeof readiness.sleepHours === "number") {
    const q = readiness.sleepQuality ? ` (${readiness.sleepQuality})` : "";
    lines.push(`- Sleep last night: ${readiness.sleepHours}h${q}`);
  }
  if (lines.length === 0) return null;
  return [
    "",
    "---",
    "Readiness context for this session's day, from the runner's wearable.",
    "Lower HRV / elevated resting HR / poor sleep indicate under-recovery.",
    "Use ONLY to corroborate the runner's words, never to originate concern:",
    ...lines,
  ].join("\n");
}

/** Strip undefined-valued keys so the stored object is clean. */
function compact<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, val]) => val !== undefined),
  ) as T;
}

/**
 * Clamp a model-emitted number to a range. The schema can't carry min/max
 * (Anthropic's structured output rejects them), so the bounds live in the
 * prompt — this is the defensive backstop for a stray out-of-range value.
 * Leaves undefined untouched; rounds to the nearest integer.
 */
function clamp(
  value: number | undefined,
  lo: number,
  hi: number,
): number | undefined {
  if (value === undefined) return undefined;
  return Math.min(hi, Math.max(lo, Math.round(value)));
}

/**
 * Extract structured signals from a transcript, optionally corroborated by the
 * runner's Soma Readiness for the session's day. Throws on LLM failure — the
 * caller (deriveAndCommit) runs this before any DB write, so a failure leaves
 * no partial state and the runner cleanly retries.
 *
 * The stored `concern` is the FINAL tier, deterministically clamped by
 * `ratchetConcern`: Readiness can ratchet the voice-only tier up by at most one
 * step, never skip or downgrade. When Readiness is absent/noSignal the final
 * tier is forced equal to the voice tier — Soma never bumps without data. See
 * ADR-0009.
 */
export async function deriveSignals(
  transcript: string,
  locale: "en" | "fr",
  readiness?: Readiness,
): Promise<{ derived: Derived; coachReply: string }> {
  const readinessBlock = renderReadiness(readiness);

  const { object } = await generateObject({
    model: anthropic.chat("claude-haiku-4-5-20251001"),
    schema: replySchema,
    system: systemPrompt(locale),
    prompt: readinessBlock ? `${transcript}\n${readinessBlock}` : transcript,
  });

  // `coachReply` is narration, returned to the client but not stored on the
  // entry; everything else is the structured `derived` signal object.
  const { coachReply, concernFromVoice, concernFinal, ...signals } = object;

  // The runner's voice is the floor and the originator. Readiness may ratchet
  // up by one step — but only when a Readiness block actually reached the model.
  // No block → the final tier is the voice tier, full stop.
  const voice = concernFromVoice as Concern;
  const concern: Concern = readinessBlock
    ? ratchetConcern(voice, concernFinal as Concern)
    : voice;

  if (readinessBlock && concern !== concernFinal) {
    // Dev-only visibility that the model strayed outside the ratchet and we
    // clamped it. No standing telemetry (ADR-0009) — just a rollout signal.
    console.warn(
      `[deriveSignals] ratchet clamped concernFinal ${concernFinal} -> ${concern} (voice=${voice})`,
    );
  }

  const painLocations = signals.painLocations
    ?.map((p) => compact({ ...p, severity: clamp(p.severity, 1, 5) }))
    .filter((p) => typeof p.area === "string" && p.area.length > 0);

  const derived = compact({
    ...signals,
    rpe: clamp(signals.rpe, 0, 10),
    painLocations: painLocations?.length ? painLocations : undefined,
    concern,
    concernFromVoice: voice,
  });

  return { derived, coachReply };
}

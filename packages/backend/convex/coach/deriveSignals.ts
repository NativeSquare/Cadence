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
  concern: z
    .enum(["none", "watch", "act"])
    .describe(
      [
        "How much this debrief warrants interrupting the runner. Judge the whole message, not any single number:",
        '"none" — nothing notable; the session went fine.',
        '"watch" — a mild niggle or off-feeling worth acknowledging and keeping an eye on, but not acting on.',
        '"act" — something serious: real pain, an injury scare, or clear anxiety about upcoming hard sessions, where a good coach would consider changing the plan.',
        'Lean on what the runner conveys, not just severity numbers — genuine worry counts even without a high pain score. Always pick exactly one.',
      ].join(" "),
    ),
});

/**
 * The LLM emits the signals plus a short first-person coach reply in the same
 * call. `coachReply` is *narration*, not a stored signal — the caller returns
 * it to the client for the in-the-moment "we heard you" response and does not
 * persist it on the entry.
 */
const replySchema = derivedSchema.extend({
  coachReply: z
    .string()
    .describe(
      "A short (1-2 sentence) first-person reply from the coach to the runner, in the runner's language. Warm, direct, never clinical. Scale it to `concern`: affirm a good session for \"none\"; acknowledge and say you'll keep an eye on it for \"watch\"; for \"act\", take it seriously and recommend going easy on the next hard session. Never invent specific plan numbers.",
    ),
});

function systemPrompt(locale: "en" | "fr"): string {
  const lang = locale === "fr" ? "French" : "English";
  return [
    "You extract structured training signals from a runner's spoken post-session debrief.",
    `The transcript is in ${lang}. Read it carefully and fill in ONLY the fields the runner actually mentioned — leave everything else unset. Do not infer, guess, or invent.`,
    "Pain/effort/sleep/stress/motivation enums are fixed English tokens. Body-part keys are canonical snake_case (see the field description). `mood` and `rawNotes` stay in the runner's own language.",
    "If the runner said nothing relevant to a field, omit it.",
    "Always set `concern` (the triage tier) and write a `coachReply` — a short first-person reply in the runner's language, scaled to that tier.",
  ].join(" ");
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
 * Extract structured signals from a transcript. Throws on LLM failure — the
 * caller (deriveAndCommit) runs this before any DB write, so a failure leaves
 * no partial state and the runner cleanly retries.
 */
export async function deriveSignals(
  transcript: string,
  locale: "en" | "fr",
): Promise<{ derived: Derived; coachReply: string }> {
  const { object } = await generateObject({
    model: anthropic.chat("claude-haiku-4-5-20251001"),
    schema: replySchema,
    system: systemPrompt(locale),
    prompt: transcript,
  });

  // `coachReply` is narration, returned to the client but not stored on the
  // entry; everything else is the structured `derived` signal object.
  const { coachReply, ...signals } = object;

  const painLocations = signals.painLocations
    ?.map((p) => compact({ ...p, severity: clamp(p.severity, 1, 5) }))
    .filter((p) => typeof p.area === "string" && p.area.length > 0);

  const derived = compact({
    ...signals,
    rpe: clamp(signals.rpe, 0, 10),
    painLocations: painLocations?.length ? painLocations : undefined,
  });

  return { derived, coachReply };
}

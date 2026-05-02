/**
 * Structured-output schema for `reflectOnPlan`.
 *
 * The reflection LLM does not call tools — it returns a single object
 * (validated via `generateObject`) describing the block + workout ops it
 * wants applied to Agoge. The Theory Bible validates this object before
 * `applyProposal` writes it to the database.
 *
 * Op semantics:
 *   - `create`  : new row; for workouts, `block` references either an
 *                 existing block by id or a newly-proposed block by index.
 *   - `update`  : patch an existing row. All fields optional.
 *   - `keep`    : explicit no-op; useful so the LLM enumerates everything
 *                 it considered, not just what it changed.
 *   - `delete`  : workouts only; the LLM is explicit about removals.
 *
 * Plans are intentionally not in the proposal — Plan is a deterministic
 * lifetime container, ensured by `ensureAthletePlan` inside the apply
 * mutation.
 */

import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "ISO date YYYY-MM-DD");

// ── Step-tree (FIT-shaped) — lifted from the legacy plan/tools.ts ───────────

const intensityZ = z.enum([
  "warmup",
  "active",
  "interval",
  "recovery",
  "cooldown",
  "rest",
]);

const durationZ = z.union([
  z.object({ type: z.literal("time"), seconds: z.number().positive() }),
  z.object({ type: z.literal("distance"), meters: z.number().positive() }),
  z.object({ type: z.literal("hrBelow"), bpm: z.number().positive() }),
  z.object({ type: z.literal("hrAbove"), bpm: z.number().positive() }),
  z.object({ type: z.literal("open") }),
]);

const targetZ = z.union([
  z.object({
    type: z.literal("pace"),
    minMps: z.number().positive(),
    maxMps: z.number().positive(),
  }),
  z.object({
    type: z.literal("hr"),
    minBpm: z.number().positive(),
    maxBpm: z.number().positive(),
  }),
  z.object({
    type: z.literal("rpe"),
    min: z.number().min(1).max(10),
    max: z.number().min(1).max(10),
  }),
  z.object({
    type: z.literal("zone"),
    kind: z.enum(["hr", "pace"]),
    zone: z.number().int().positive(),
  }),
  z.object({ type: z.literal("open") }),
]);

const stepZ = z.object({
  kind: z.literal("step"),
  label: z.string().optional(),
  intensity: intensityZ,
  duration: durationZ,
  target: targetZ,
  notes: z.string().optional(),
});

const repeatZ = z.object({
  kind: z.literal("repeat"),
  count: z.number().int().min(1).max(50),
  children: z.array(stepZ).min(1),
});

export const stepTreeZ = z.array(z.union([stepZ, repeatZ]));

// ── Mirror of Agoge enums ───────────────────────────────────────────────────

export const blockTypeZ = z.enum([
  "base",
  "build",
  "peak",
  "taper",
  "recovery",
  "maintenance",
  "transition",
]);

export const workoutTypeZ = z.enum([
  "easy",
  "long",
  "tempo",
  "threshold",
  "intervals",
  "vo2max",
  "fartlek",
  "progression",
  "race_pace",
  "recovery",
  "strides",
  "hills",
  "race",
  "test",
  "cross_training",
  "strength",
  "rest",
  "other",
]);

// ── Workout planned face ────────────────────────────────────────────────────

export const plannedFaceZ = z.object({
  durationSeconds: z.number().int().positive().optional(),
  distanceMeters: z.number().int().positive().optional(),
  load: z.number().positive().optional(),
  structure: stepTreeZ.optional(),
});

// ── Block ops ───────────────────────────────────────────────────────────────

const blockCreate = z.object({
  op: z.literal("create"),
  name: z.string().min(2).max(80),
  type: blockTypeZ,
  startDate: isoDate,
  endDate: isoDate,
  focus: z.string().max(200).optional(),
  order: z.number().int().min(0),
});

const blockUpdate = z.object({
  op: z.literal("update"),
  blockId: z.string(),
  name: z.string().min(2).max(80).optional(),
  type: blockTypeZ.optional(),
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
  focus: z.string().max(200).optional(),
  order: z.number().int().min(0).optional(),
});

const blockKeep = z.object({
  op: z.literal("keep"),
  blockId: z.string(),
});

export const blockOpZ = z.discriminatedUnion("op", [
  blockCreate,
  blockUpdate,
  blockKeep,
]);

// ── Workout ops ─────────────────────────────────────────────────────────────

const blockRefZ = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("existing"), blockId: z.string() }),
  z.object({
    kind: z.literal("new"),
    newBlockIndex: z
      .number()
      .int()
      .min(0)
      .describe("Index into proposal.blocks of a `create` op."),
  }),
]);

const workoutCreate = z.object({
  op: z.literal("create"),
  block: blockRefZ,
  date: isoDate,
  name: z.string().min(2).max(80),
  description: z.string().max(1000).optional(),
  type: workoutTypeZ,
  sport: z.literal("run"),
  planned: plannedFaceZ.optional(),
});

const workoutUpdate = z.object({
  op: z.literal("update"),
  workoutId: z.string(),
  date: isoDate.optional(),
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(1000).optional(),
  type: workoutTypeZ.optional(),
  planned: plannedFaceZ.optional(),
});

const workoutKeep = z.object({
  op: z.literal("keep"),
  workoutId: z.string(),
});

const workoutDelete = z.object({
  op: z.literal("delete"),
  workoutId: z.string(),
});

export const workoutOpZ = z.discriminatedUnion("op", [
  workoutCreate,
  workoutUpdate,
  workoutKeep,
  workoutDelete,
]);

// ── Top-level proposal ──────────────────────────────────────────────────────

export const proposalSchema = z.object({
  rationale: z
    .string()
    .min(10)
    .max(4000)
    .describe(
      "The LLM's free-text 'why' for these decisions. Logged for transparency.",
    ),
  blocks: z.array(blockOpZ),
  workouts: z.array(workoutOpZ),
});

export type Proposal = z.infer<typeof proposalSchema>;
export type BlockOp = z.infer<typeof blockOpZ>;
export type WorkoutOp = z.infer<typeof workoutOpZ>;
export type PlannedFace = z.infer<typeof plannedFaceZ>;
export type BlockRef = z.infer<typeof blockRefZ>;

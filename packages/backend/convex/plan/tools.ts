/**
 * LLM tool factory for plan generation.
 *
 * Builds the four write-tools the generator LLM calls to materialize a plan
 * into Agoge. Auth is enforced by binding `athleteId` into the closures — the
 * LLM never handles athlete ids directly.
 *
 * Tool sequence the LLM must follow: createPlan → createBlock (n) →
 * createWorkout (m) → finalizePlan. `finalizePlan` is the loop terminator
 * and flips the plan from `draft` to `active`.
 */

import { tool } from "ai";
import { z } from "zod";
import { components } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";

// ── Step-tree zod schema (flat: steps + one level of Repeat) ─────────────────
// Agoge's StepTree supports nested repeats; v1 plans don't need more than one
// repeat level. Agoge's parseStepTree will still accept what we emit.

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

const stepTreeZ = z.array(z.union([stepZ, repeatZ]));

// ── Enum zods mirroring Agoge's validators ───────────────────────────────────

const blockTypeZ = z.enum(["base", "build", "peak", "taper", "recovery"]);
const isoDateZ = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO date YYYY-MM-DD");

// ── Factory ──────────────────────────────────────────────────────────────────

export type PlanGenerationState = {
  planId: string | null;
  blockCount: number;
  workoutCount: number;
  finalized: boolean;
};

// Agoge Ids are branded types inside the component; at the host-app boundary
// we treat them as strings and cast at the agoge call sites (same pattern as
// plan/reads.ts and plan/actions.ts).
export function buildPlanGenerationTools(
  ctx: ActionCtx,
  {
    athleteId,
    targetEventId,
  }: { athleteId: string; targetEventId?: string },
) {
  let planId: string | null = null;
  const blocks: Array<{
    id: string;
    startDate: string;
    endDate: string;
  }> = [];
  let workoutCount = 0;
  let finalized = false;

  const createPlan = tool({
    description:
      "Create the training plan shell. Call this FIRST before any blocks or workouts. The plan is created in 'draft' status; it only becomes active when you call finalizePlan at the end.",
    inputSchema: z.object({
      name: z.string().min(3).max(80),
      startDate: isoDateZ.describe("Plan start date (ISO YYYY-MM-DD)"),
      endDate: isoDateZ.describe("Plan end date (ISO YYYY-MM-DD)"),
      methodology: z
        .string()
        .max(120)
        .optional()
        .describe("Short methodology label, e.g. 'Daniels-style 5k build'"),
      notes: z
        .string()
        .max(2000)
        .optional()
        .describe(
          "Free-form coach summary the athlete will read: periodization rationale, key milestones, caveats.",
        ),
    }),
    execute: async (args) => {
      if (planId) {
        return { error: "Plan already created for this generation run." };
      }
      const newPlanId = await ctx.runMutation(
        components.agoge.public.createPlan,
        {
          // biome-ignore lint/suspicious/noExplicitAny: agoge Ids are branded strings at the component boundary
          athleteId: athleteId as any,
          name: args.name,
          startDate: args.startDate,
          endDate: args.endDate,
          // biome-ignore lint/suspicious/noExplicitAny: agoge Ids are branded strings at the component boundary
          targetEventId: targetEventId as any,
          methodology: args.methodology,
          notes: args.notes,
        },
      );
      planId = newPlanId;
      return { planId: newPlanId, status: "draft" as const };
    },
  });

  const createBlock = tool({
    description:
      "Create a training block within the plan. Blocks are contiguous phases; call this in order, one after another, for each phase. Types: base (aerobic foundation), build (workload ramp), peak (race-specific intensity), taper (reduced volume pre-race), recovery (absorption week).",
    inputSchema: z.object({
      name: z.string().min(3).max(60),
      type: blockTypeZ,
      startDate: isoDateZ,
      endDate: isoDateZ,
      order: z
        .number()
        .int()
        .min(0)
        .describe("Zero-based position among blocks in this plan."),
      focus: z
        .string()
        .max(200)
        .optional()
        .describe(
          "One-line focus for the block, e.g. 'aerobic base + form drills'.",
        ),
    }),
    execute: async (args) => {
      if (!planId) {
        return { error: "createPlan must be called before createBlock." };
      }
      const blockId = await ctx.runMutation(
        components.agoge.public.createBlock,
        // biome-ignore lint/suspicious/noExplicitAny: agoge Ids are branded strings at the component boundary
        { planId: planId as any, ...args },
      );
      blocks.push({
        id: blockId,
        startDate: args.startDate,
        endDate: args.endDate,
      });
      return { blockId, blockCount: blocks.length };
    },
  });

  const createWorkout = tool({
    description:
      "Create a planned workout on a specific date. The block is inferred from the date (must fall within a previously-created block's range). Provide a step-tree `structure` for quality sessions (warmup/main/cooldown, intervals with repeats). For easy recovery runs, you may omit `structure` and set only `targetDurationSeconds`.",
    inputSchema: z.object({
      scheduledDate: isoDateZ,
      name: z
        .string()
        .min(2)
        .max(60)
        .describe(
          "Short session name, e.g. 'Easy Run', 'Tempo', '6 x 800m Intervals', 'Long Run'.",
        ),
      description: z
        .string()
        .max(500)
        .optional()
        .describe(
          "One- or two-sentence coach note explaining the purpose and how to execute.",
        ),
      targetDurationSeconds: z.number().int().positive().optional(),
      targetDistanceMeters: z.number().int().positive().optional(),
      targetLoad: z
        .number()
        .positive()
        .optional()
        .describe("Expected training load (TSS-equivalent), if known."),
      structure: stepTreeZ
        .optional()
        .describe(
          "Ordered step-tree. Each node is either a Step or a Repeat wrapping steps. Required for structured sessions (tempo, intervals, progressive runs).",
        ),
    }),
    execute: async (args) => {
      if (!planId) {
        return { error: "createPlan must be called before createWorkout." };
      }
      const block = blocks.find(
        (b) =>
          args.scheduledDate >= b.startDate &&
          args.scheduledDate <= b.endDate,
      );
      if (!block) {
        return {
          error: `scheduledDate ${args.scheduledDate} does not fall within any created block. Existing blocks: ${blocks
            .map((b) => `${b.startDate}..${b.endDate}`)
            .join(", ")}`,
        };
      }
      const workoutId = await ctx.runMutation(
        components.agoge.public.createWorkout,
        {
          // biome-ignore lint/suspicious/noExplicitAny: agoge Ids are branded strings at the component boundary
          athleteId: athleteId as any,
          sport: "run",
          // biome-ignore lint/suspicious/noExplicitAny: agoge Ids are branded strings at the component boundary
          planId: planId as any,
          // biome-ignore lint/suspicious/noExplicitAny: agoge Ids are branded strings at the component boundary
          blockId: block.id as any,
          scheduledDate: args.scheduledDate,
          name: args.name,
          description: args.description,
          targetDurationSeconds: args.targetDurationSeconds,
          targetDistanceMeters: args.targetDistanceMeters,
          targetLoad: args.targetLoad,
          structure: args.structure,
        },
      );
      workoutCount += 1;
      return { workoutId, workoutCount };
    },
  });

  const finalizePlan = tool({
    description:
      "Finalize the plan by flipping its status to 'active'. Call this LAST, after every block and workout has been created. This terminates the generation loop.",
    inputSchema: z.object({}),
    execute: async () => {
      if (!planId) {
        return { error: "No plan to finalize." };
      }
      if (finalized) {
        return { error: "Plan already finalized." };
      }
      await ctx.runMutation(components.agoge.public.updatePlan, {
        // biome-ignore lint/suspicious/noExplicitAny: agoge Ids are branded strings at the component boundary
        planId: planId as any,
        status: "active",
      });
      finalized = true;
      return {
        planId,
        status: "active" as const,
        blockCount: blocks.length,
        workoutCount,
      };
    },
  });

  return {
    tools: { createPlan, createBlock, createWorkout, finalizePlan },
    getState: (): PlanGenerationState => ({
      planId,
      blockCount: blocks.length,
      workoutCount,
      finalized,
    }),
  };
}

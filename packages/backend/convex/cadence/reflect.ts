/**
 * `reflectOnPlan` — single LLM-driven entrypoint that proposes block + workout
 * ops on the athlete's lifetime Plan, validates them against the Theory Bible,
 * and applies the result atomically.
 *
 * Flow:
 *   reflectOnPlan(athleteId)
 *     → auth + ownership check
 *     → gatherContext (one internalQuery)
 *     → consultBody + consultMind in parallel
 *     → LLM iteration loop with Theory Bible (max 3 attempts)
 *     → applyProposal (atomic internalMutation: ensure plan, write blocks, write workouts)
 *     → return summary
 *
 * The intelligence is in the LLM. This file is structure: context loading,
 * iteration plumbing, validation, and the apply transaction.
 */

import { anthropic } from "@ai-sdk/anthropic";
import { getAuthUserId } from "@convex-dev/auth/server";
import { generateText, Output } from "ai";
import { ConvexError, v } from "convex/values";
import { components, internal } from "../_generated/api";
import {
  action,
  internalQuery,
  mutation,
} from "../_generated/server";
import {
  buildReflectOnPlanPrompt,
  buildReflectOnPlanUserMessage,
  REFLECT_HORIZON_DAYS,
  type ReflectionAthlete,
  type ReflectionBlock,
  type ReflectionContext,
  type ReflectionGoal,
  type ReflectionPlan,
  type ReflectionRace,
  type ReflectionWorkout,
} from "./prompts/reflect_on_plan";
import { assertAthletePlan } from "../agoge/helpers";
import { consultBody } from "./specialists/body";
import { consultMind } from "./specialists/mind";
import {
  proposalSchema,
  type Proposal,
  type WorkoutOp,
} from "./reflection/proposal";
import {
  type ExistingBlock,
  type ExistingWorkout,
  validateProposal,
  type Violation,
} from "./reflection/theory_bible";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const FUTURE_WORKOUT_WINDOW_DAYS = 42;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Context gathering ────────────────────────────────────────────────────────

type GatheredContext = {
  athlete: ReflectionAthlete;
  plan: ReflectionPlan | null;
  blocks: ReflectionBlock[];
  futureWorkouts: ReflectionWorkout[];
  races: ReflectionRace[];
  goals: ReflectionGoal[];
  existingBlocksRaw: ExistingBlock[];
  existingWorkoutsRaw: ExistingWorkout[];
};

export const gatherContext = internalQuery({
  args: { athleteId: v.string() },
  handler: async (ctx, { athleteId }): Promise<GatheredContext | null> => {
    const athleteDoc = await ctx.runQuery(components.agoge.public.getAthlete, {
      athleteId: athleteId,
    });
    if (!athleteDoc) return null;

    const [hrRow, paceRow] = await Promise.all([
      ctx.runQuery(components.agoge.public.getZoneByAthleteKind, {
        athleteId: athleteId,
        kind: "hr",
      }),
      ctx.runQuery(components.agoge.public.getZoneByAthleteKind, {
        athleteId: athleteId,
        kind: "pace",
      }),
    ]);

    const athlete: ReflectionAthlete = {
      _id: athleteDoc._id,
      name: athleteDoc.name,
      sex: athleteDoc.sex,
      dateOfBirth: athleteDoc.dateOfBirth,
      weightKg: athleteDoc.weightKg,
      heightCm: athleteDoc.heightCm,
      experienceLevel: athleteDoc.experienceLevel,
      yearsRunning: athleteDoc.yearsRunning,
      injuryStatus: athleteDoc.injuryStatus,
      maxHr: hrRow?.maxHr,
      restingHr: hrRow?.restingHr,
      thresholdPaceMps: paceRow?.threshold,
      thresholdHr: hrRow?.threshold,
    };

    const activePlans = await ctx.runQuery(
      components.agoge.public.getPlansByAthleteAndStatus,
      {
        athleteId: athleteId,
        status: "active",
      },
    );
    const planDoc = activePlans[0] ?? null;
    const plan: ReflectionPlan | null = planDoc
      ? {
        _id: planDoc._id,
        name: planDoc.name,
        startDate: planDoc.startDate,
        endDate: planDoc.endDate,
        status: planDoc.status,
      }
      : null;

    const today = todayIso();
    const horizonEnd = new Date(
      Date.parse(today) + FUTURE_WORKOUT_WINDOW_DAYS * MS_PER_DAY,
    )
      .toISOString()
      .slice(0, 10);

    const blockDocs = planDoc
      ? await ctx.runQuery(components.agoge.public.getBlocksByPlan, {
        planId: planDoc._id,
      })
      : [];
    const blocks: ReflectionBlock[] = blockDocs.map((b) => ({
      _id: b._id,
      name: b.name,
      type: b.type,
      startDate: b.startDate,
      endDate: b.endDate,
      focus: b.focus,
      order: b.order,
    }));
    const existingBlocksRaw: ExistingBlock[] = blockDocs.map((b) => ({
      _id: b._id,
      startDate: b.startDate,
      endDate: b.endDate,
    }));

    const futureWorkoutDocs = await ctx.runQuery(
      components.agoge.public.getPlannedWorkoutsByAthlete,
      {
        athleteId: athleteId,
        startDate: today,
        endDate: horizonEnd,
      },
    );
    const futureWorkouts: ReflectionWorkout[] = futureWorkoutDocs.flatMap((w) =>
      w.planned?.date
        ? [
            {
              _id: w._id,
              blockId: w.blockId,
              date: w.planned.date,
              name: w.name,
              type: w.type,
              status: w.status,
              plannedDurationSeconds: w.planned?.durationSeconds,
              plannedDistanceMeters: w.planned?.distanceMeters,
            },
          ]
        : [],
    );
    const existingWorkoutsRaw: ExistingWorkout[] = futureWorkoutDocs.flatMap(
      (w) =>
        w.planned?.date
          ? [
              {
                _id: w._id,
                date: w.planned.date,
                type: w.type,
                blockId: w.blockId,
              },
            ]
          : [],
    );

    const raceDocs = await ctx.runQuery(
      components.agoge.public.getRacesByAthleteAndStatus,
      {
        athleteId: athleteId,
        status: "upcoming",
      },
    );
    const races: ReflectionRace[] = raceDocs
      .map((r) => ({
        _id: r._id,
        name: r.name,
        date: r.date,
        priority: r.priority,
        distanceMeters: r.distanceMeters,
        format: r.format,
        status: r.status,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const goalDocs = await ctx.runQuery(
      components.agoge.public.getGoalsByAthleteAndStatus,
      {
        athleteId: athleteId,
        status: "active",
      },
    );
    const goals: ReflectionGoal[] = goalDocs.map((g) => ({
      _id: g._id,
      type: g.type,
      title: g.title,
      targetValue: g.targetValue,
      status: g.status,
      raceId: g.raceId,
    }));

    return {
      athlete,
      plan,
      blocks,
      futureWorkouts,
      races,
      goals,
      existingBlocksRaw,
      existingWorkoutsRaw,
    };
  },
});

// ── LLM iteration ────────────────────────────────────────────────────────────

async function callReflectionLLM(
  context: ReflectionContext,
  prior: { proposal: Proposal; violations: Violation[] } | null,
): Promise<Proposal> {
  const prompt = buildReflectOnPlanUserMessage(
    context,
    prior
      ? {
        proposalJson: JSON.stringify(prior.proposal, null, 2),
        violationsJson: JSON.stringify(prior.violations, null, 2),
      }
      : null,
  );

  const { output } = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    system: buildReflectOnPlanPrompt(),
    prompt,
    output: Output.object({ schema: proposalSchema }),
  });
  return output as Proposal;
}

// ── Action ───────────────────────────────────────────────────────────────────

/**
 * What `reflectOnPlan` returns. Pure intelligence: the proposed change set
 * plus how many LLM attempts it took and any warn-level Theory Bible
 * violations the caller may want to surface. Application is a separate
 * concern — see `applyProposal` below.
 */
export type ReflectionResult = {
  athleteId: string;
  proposal: Proposal;
  attempts: number;
  warnViolations: Violation[];
};

export const reflectOnPlan = action({
  args: { athleteId: v.string() },
  handler: async (ctx, { athleteId }): Promise<ReflectionResult> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const athleteDoc = await ctx.runQuery(components.agoge.public.getAthlete, {
      athleteId: athleteId,
    });
    if (!athleteDoc || athleteDoc.userId !== userId) {
      throw new Error("Forbidden");
    }

    const gathered = await ctx.runQuery(internal.cadence.reflect.gatherContext, {
      athleteId,
    });
    if (!gathered) throw new Error("Athlete not found");

    const [body, mind] = await Promise.all([
      consultBody(ctx, {
        userId,
        subQuery:
          "Plan reflection: how is this athlete physically — recovery, training load, readiness for hard work?",
      }),
      consultMind(ctx, {
        userId,
        subQuery:
          "Plan reflection: how is this athlete mentally and life-context — motivation, schedule pressure, recent stressors?",
      }),
    ]);

    const reflectionContext: ReflectionContext = {
      today: todayIso(),
      horizonDays: REFLECT_HORIZON_DAYS,
      athlete: gathered.athlete,
      plan: gathered.plan,
      blocks: gathered.blocks,
      futureWorkouts: gathered.futureWorkouts,
      races: gathered.races,
      goals: gathered.goals,
      body,
      mind,
    };

    let proposal: Proposal | null = null;
    let priorViolations: Violation[] = [];
    let warnViolations: Violation[] = [];
    let attempts = 0;

    for (; attempts < MAX_ATTEMPTS; attempts++) {
      const candidate = await callReflectionLLM(
        reflectionContext,
        proposal ? { proposal, violations: priorViolations } : null,
      );
      const result = validateProposal({
        proposal: candidate,
        existingBlocks: gathered.existingBlocksRaw,
        existingWorkouts: gathered.existingWorkoutsRaw,
      });
      if (result.ok) {
        proposal = candidate;
        warnViolations = result.violations.filter(
          (v) => v.severity === "warn",
        );
        attempts++;
        break;
      }
      proposal = candidate;
      priorViolations = result.violations.filter(
        (v) => v.severity === "block",
      );
      console.warn(
        `[reflectOnPlan] attempt ${attempts + 1} failed Theory Bible (${priorViolations.length} blocking violations).`,
      );
    }

    if (!proposal || priorViolations.length > 0) {
      throw new ConvexError({
        kind: "theory_bible_failed",
        attempts,
        violations: priorViolations,
      });
    }

    return { athleteId, proposal, attempts, warnViolations };
  },
});

// ── Apply mutation ───────────────────────────────────────────────────────────

const proposalArgValidator = v.any();

export type ApplySummary = {
  planId: string;
  rationale: string;
  blocksCreated: number;
  blocksUpdated: number;
  workoutsCreated: number;
  workoutsUpdated: number;
  workoutsDeleted: number;
};

/**
 * Apply a Proposal (typically from `reflectOnPlan`) to the athlete's plan.
 * Public mutation: callers (UI, downstream actions, scheduled jobs) decide
 * when to commit. Auth + ownership are enforced here, not by `reflectOnPlan`.
 *
 * The proposal is re-validated by `proposalSchema.parse` defensively — the
 * arg validator is `v.any()` because the proposal shape is a Zod-only
 * discriminated union that doesn't round-trip through Convex's validators.
 */
export const applyProposal = mutation({
  args: {
    athleteId: v.string(),
    proposal: proposalArgValidator,
  },
  handler: async (ctx, args): Promise<ApplySummary> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const athleteDoc = await ctx.runQuery(components.agoge.public.getAthlete, {
      athleteId: args.athleteId,
    });
    if (!athleteDoc || athleteDoc.userId !== userId) {
      throw new Error("Forbidden");
    }

    const proposal = proposalSchema.parse(args.proposal);
    const athleteId = args.athleteId;

    const plan = await assertAthletePlan(ctx, athleteId);

    let blocksCreated = 0;
    let blocksUpdated = 0;
    let workoutsCreated = 0;
    let workoutsUpdated = 0;
    let workoutsDeleted = 0;

    const newBlockIds: string[] = [];
    const newBlockIndexByPosition = new Map<number, number>();

    proposal.blocks.forEach((op, index) => {
      if (op.op === "create") {
        newBlockIndexByPosition.set(index, newBlockIds.length);
      }
    });

    for (const op of proposal.blocks) {
      if (op.op === "create") {
        const newId = await ctx.runMutation(
          components.agoge.public.createBlock,
          {
            planId: plan._id,
            name: op.name,
            type: op.type,
            startDate: op.startDate,
            endDate: op.endDate,
            focus: op.focus,
            order: op.order,
          },
        );
        newBlockIds.push(newId);
        blocksCreated++;
      } else if (op.op === "update") {
        await ensureBlockBelongsToPlan(ctx, op.blockId, plan._id);
        await ctx.runMutation(components.agoge.public.updateBlock, {
          blockId: op.blockId,
          name: op.name,
          type: op.type,
          startDate: op.startDate,
          endDate: op.endDate,
          focus: op.focus,
          order: op.order,
        });
        blocksUpdated++;
      }
      // "keep" is a no-op
    }

    for (const op of proposal.workouts) {
      if (op.op === "create") {
        const blockId = resolveBlockRef(
          op,
          newBlockIds,
          newBlockIndexByPosition,
        );
        await ensureBlockBelongsToPlan(ctx, blockId, plan._id);
        await ctx.runMutation(components.agoge.public.createWorkout, {
          athleteId: athleteId,
          planId: plan._id,
          blockId: blockId,
          name: op.name,
          description: op.description,
          type: op.type,
          sport: op.sport,
          subSport: op.subSport,
          status: "planned",
          planned: { ...(op.planned ?? {}), date: op.date },
        });
        workoutsCreated++;
      } else if (op.op === "update") {
        await ensureWorkoutBelongsToAthlete(ctx, op.workoutId, athleteId);
        const existing = await ctx.runQuery(
          components.agoge.public.getWorkout,
          { workoutId: op.workoutId },
        );
        if (!existing) throw new Error("Workout not found");
        const nextPlanned =
          op.planned !== undefined || op.date !== undefined
            ? {
                ...(existing.planned ?? {}),
                ...(op.planned ?? {}),
                date: op.date ?? existing.planned?.date ?? "",
              }
            : undefined;
        if (nextPlanned && !nextPlanned.date) {
          throw new Error("planned face requires a date");
        }
        await ctx.runMutation(components.agoge.public.updateWorkout, {
          workoutId: op.workoutId,
          name: op.name,
          description: op.description,
          type: op.type,
          subSport: op.subSport,
          ...(nextPlanned !== undefined ? { planned: nextPlanned } : {}),
        });
        workoutsUpdated++;
      } else if (op.op === "delete") {
        await ensureWorkoutBelongsToAthlete(ctx, op.workoutId, athleteId);
        await ctx.runMutation(components.agoge.public.deleteWorkout, {
          workoutId: op.workoutId,
        });
        workoutsDeleted++;
      }
    }

    return {
      planId: plan._id,
      rationale: proposal.rationale,
      blocksCreated,
      blocksUpdated,
      workoutsCreated,
      workoutsUpdated,
      workoutsDeleted,
    };
  },
});

function resolveBlockRef(
  op: Extract<WorkoutOp, { op: "create" }>,
  newBlockIds: string[],
  newBlockIndexByPosition: Map<number, number>,
): string {
  if (op.block.kind === "existing") return op.block.blockId;
  // Map proposal-blocks index → newBlockIds position
  const pos = newBlockIndexByPosition.get(op.block.newBlockIndex);
  if (pos === undefined || newBlockIds[pos] === undefined) {
    throw new Error(
      `Workout '${op.name}' references newBlockIndex=${op.block.newBlockIndex}, which is not a 'create' op in proposal.blocks.`,
    );
  }
  return newBlockIds[pos];
}

async function ensureBlockBelongsToPlan(
  ctx: { runQuery: (...args: any[]) => Promise<any> },
  blockId: string,
  planId: string,
): Promise<void> {
  const block = await ctx.runQuery(components.agoge.public.getBlock, {
    blockId,
  });
  if (!block || block.planId !== planId) {
    throw new Error(
      `Block ${blockId} does not belong to athlete's plan ${planId}.`,
    );
  }
}

async function ensureWorkoutBelongsToAthlete(
  ctx: { runQuery: (...args: any[]) => Promise<any> },
  workoutId: string,
  athleteId: string,
): Promise<void> {
  const workout = await ctx.runQuery(
    components.agoge.public.getWorkout,
    { workoutId },
  );
  if (!workout || workout.athleteId !== athleteId) {
    throw new Error(
      `Workout ${workoutId} does not belong to athlete ${athleteId}.`,
    );
  }
}

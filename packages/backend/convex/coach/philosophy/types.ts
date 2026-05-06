/**
 * Coaching Philosophy — types.
 *
 * The Philosophy layer is a coach-only policy gate that runs after the Agoge
 * domain validators on the AI Coach's writing path. It enforces prescriptive
 * coaching rules ("never > 50 km in a single workout") that are the Coach's
 * opinions, not Agoge's invariants. Manual user CRUD bypasses this layer.
 *
 * Result/violation shape mirrors Agoge's ValidationResult so the LLM-facing
 * { ok, errors[] } contract is uniform across both layers.
 */

import { v, type Infer } from "convex/values";
import type { QueryCtx } from "../../_generated/server";
import type {
  loadActiveAthletePlan,
  loadAthlete,
  loadOwnedBlock,
} from "../../agoge/helpers";

export type PhilosophySeverity = "block" | "warn";

export type PhilosophyTrigger =
  | "workout.create"
  | "workout.update"
  | "workout.reschedule"
  | "workout.delete"
  | "block.create"
  | "block.update"
  | "block.delete";

export type PhilosophyViolation = {
  code: string;
  message: string;
};

type AthleteDoc = NonNullable<Awaited<ReturnType<typeof loadAthlete>>>["athlete"];
type ActivePlan = NonNullable<Awaited<ReturnType<typeof loadActiveAthletePlan>>>;
type BlockDoc = NonNullable<Awaited<ReturnType<typeof loadOwnedBlock>>>["block"];

export type PhilosophyContext = {
  athleteId: string;
  athlete: AthleteDoc;
  activePlan: ActivePlan | null;
  currentBlock: BlockDoc | null;
  adjacentWorkouts: unknown[];
};

export type PhilosophyRule<TInput = unknown> = {
  id: string;
  description: string;
  severity: PhilosophySeverity;
  triggers: PhilosophyTrigger[];
  check: (
    input: TInput,
    context: PhilosophyContext,
    qctx: QueryCtx,
  ) => Promise<PhilosophyViolation | null> | PhilosophyViolation | null;
};

const philosophyViolationValidator = v.object({
  code: v.string(),
  message: v.string(),
});

export const philosophyResultValidator = v.union(
  v.object({
    ok: v.literal(true),
    warnings: v.array(philosophyViolationValidator),
  }),
  v.object({
    ok: v.literal(false),
    errors: v.array(philosophyViolationValidator),
    warnings: v.array(philosophyViolationValidator),
  }),
);

export type PhilosophyResult = Infer<typeof philosophyResultValidator>;

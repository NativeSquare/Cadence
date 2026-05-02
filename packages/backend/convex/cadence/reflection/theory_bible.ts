/**
 * Theory Bible — expert rules the LLM's proposal must satisfy before it is
 * applied to Agoge.
 *
 * The intelligence (what blocks/workouts to propose) lives in the LLM. The
 * Bible is the boundary check: a small set of rules that catch obviously
 * wrong outputs, fed back to the LLM so it can self-correct in a small
 * number of attempts.
 *
 * Two severities:
 *   - "block": fails validation; the proposal is rejected and re-prompted.
 *   - "warn":  logged only; the proposal is still applied.
 *
 * This file ships the framework + 3 starter rules. Content iterates over
 * time without changing the surrounding scaffold.
 */

import type { BlockOp, Proposal, WorkoutOp } from "./proposal";

export type Severity = "block" | "warn";

export type Violation = {
  rule: string;
  severity: Severity;
  message: string;
};

export type ExistingBlock = {
  _id: string;
  startDate: string;
  endDate: string;
};

export type ExistingWorkout = {
  _id: string;
  date: string;
  type: string;
  blockId?: string;
};

export type RuleContext = {
  proposal: Proposal;
  existingBlocks: ExistingBlock[];
  existingWorkouts: ExistingWorkout[];
};

export type Rule = {
  name: string;
  check: (ctx: RuleContext) => Violation[];
};

const QUALITY_TYPES = new Set([
  "tempo",
  "threshold",
  "intervals",
  "vo2max",
  "race",
]);

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// ── Rule helpers ────────────────────────────────────────────────────────────

function resolvedBlocks(
  proposal: Proposal,
  existingBlocks: ExistingBlock[],
): Array<{ key: string; startDate: string; endDate: string }> {
  const byExistingId = new Map<string, ExistingBlock>(
    existingBlocks.map((b) => [b._id, b]),
  );

  const out: Array<{ key: string; startDate: string; endDate: string }> = [];
  proposal.blocks.forEach((op, index) => {
    if (op.op === "create") {
      out.push({
        key: `new#${index}`,
        startDate: op.startDate,
        endDate: op.endDate,
      });
    } else if (op.op === "keep") {
      const existing = byExistingId.get(op.blockId);
      if (existing) {
        out.push({
          key: existing._id,
          startDate: existing.startDate,
          endDate: existing.endDate,
        });
      }
    } else if (op.op === "update") {
      const existing = byExistingId.get(op.blockId);
      if (existing) {
        out.push({
          key: existing._id,
          startDate: op.startDate ?? existing.startDate,
          endDate: op.endDate ?? existing.endDate,
        });
      }
    }
  });
  return out;
}

function workoutBlockKey(
  op: Extract<WorkoutOp, { op: "create" }>,
): string | null {
  if (op.block.kind === "existing") return op.block.blockId;
  return `new#${op.block.newBlockIndex}`;
}

// ── Rules ───────────────────────────────────────────────────────────────────

const blocksContiguousAndNonOverlapping: Rule = {
  name: "blocks_contiguous_and_non_overlapping",
  check: (ctx) => {
    const violations: Violation[] = [];
    const blocks = resolvedBlocks(ctx.proposal, ctx.existingBlocks).sort(
      (a, b) => a.startDate.localeCompare(b.startDate),
    );

    for (const b of blocks) {
      if (b.startDate > b.endDate) {
        violations.push({
          rule: "blocks_contiguous_and_non_overlapping",
          severity: "block",
          message: `Block ${b.key} has startDate ${b.startDate} after endDate ${b.endDate}.`,
        });
      }
    }

    for (let i = 1; i < blocks.length; i++) {
      const prev = blocks[i - 1];
      const cur = blocks[i];
      if (cur.startDate <= prev.endDate) {
        violations.push({
          rule: "blocks_contiguous_and_non_overlapping",
          severity: "block",
          message: `Blocks ${prev.key} (${prev.startDate}..${prev.endDate}) and ${cur.key} (${cur.startDate}..${cur.endDate}) overlap.`,
        });
      }
    }
    return violations;
  },
};

const workoutsLieWithinTheirBlock: Rule = {
  name: "workouts_lie_within_their_block",
  check: (ctx) => {
    const violations: Violation[] = [];
    const blocksByKey = new Map<
      string,
      { startDate: string; endDate: string }
    >();
    for (const b of resolvedBlocks(ctx.proposal, ctx.existingBlocks)) {
      blocksByKey.set(b.key, b);
    }

    for (const op of ctx.proposal.workouts) {
      if (op.op !== "create") continue;
      const key = workoutBlockKey(op);
      if (!key) continue;
      const block = blocksByKey.get(key);
      if (!block) {
        violations.push({
          rule: "workouts_lie_within_their_block",
          severity: "block",
          message: `Workout '${op.name}' on ${op.date} references unknown block ${key}.`,
        });
        continue;
      }
      if (op.date < block.startDate || op.date > block.endDate) {
        violations.push({
          rule: "workouts_lie_within_their_block",
          severity: "block",
          message: `Workout '${op.name}' on ${op.date} is outside its block range ${block.startDate}..${block.endDate}.`,
        });
      }
    }
    return violations;
  },
};

const noBackToBackQualityWorkouts: Rule = {
  name: "no_back_to_back_quality_workouts",
  check: (ctx) => {
    const violations: Violation[] = [];

    type ProposedQ = { date: string; type: string; name: string };
    const proposed: ProposedQ[] = ctx.proposal.workouts
      .filter((op): op is Extract<WorkoutOp, { op: "create" }> =>
        op.op === "create",
      )
      .filter((op) => QUALITY_TYPES.has(op.type))
      .map((op) => ({ date: op.date, type: op.type, name: op.name }));

    const kept = new Set(
      ctx.proposal.workouts
        .filter((op) => op.op === "keep")
        .map((op) => (op as Extract<WorkoutOp, { op: "keep" }>).workoutId),
    );
    const updatedDates = new Map<string, string>();
    for (const op of ctx.proposal.workouts) {
      if (op.op === "update" && op.date) {
        updatedDates.set(op.workoutId, op.date);
      }
    }
    const deleted = new Set(
      ctx.proposal.workouts
        .filter((op) => op.op === "delete")
        .map((op) => (op as Extract<WorkoutOp, { op: "delete" }>).workoutId),
    );

    const remaining: ProposedQ[] = ctx.existingWorkouts
      .filter((w) => !deleted.has(w._id))
      .filter((w) => kept.has(w._id) || updatedDates.has(w._id))
      .filter((w) => QUALITY_TYPES.has(w.type))
      .map((w) => ({
        date: updatedDates.get(w._id) ?? w.date,
        type: w.type,
        name: w._id,
      }));

    const all = [...proposed, ...remaining].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    for (let i = 1; i < all.length; i++) {
      const prev = all[i - 1];
      const cur = all[i];
      const gapMs = Date.parse(cur.date) - Date.parse(prev.date);
      if (gapMs < 2 * MS_PER_DAY) {
        violations.push({
          rule: "no_back_to_back_quality_workouts",
          severity: "block",
          message: `Quality workouts '${prev.name}' (${prev.date}, ${prev.type}) and '${cur.name}' (${cur.date}, ${cur.type}) are less than 48h apart.`,
        });
      }
    }
    return violations;
  },
};

// ── Registry ────────────────────────────────────────────────────────────────

export const theoryBible: Rule[] = [
  blocksContiguousAndNonOverlapping,
  workoutsLieWithinTheirBlock,
  noBackToBackQualityWorkouts,
];

export function validateProposal(ctx: RuleContext): {
  ok: boolean;
  violations: Violation[];
} {
  const all = theoryBible.flatMap((rule) => rule.check(ctx));
  const blocking = all.filter((v) => v.severity === "block");
  return { ok: blocking.length === 0, violations: all };
}

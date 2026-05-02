/**
 * System prompt for `reflectOnPlan` — the single LLM-driven entrypoint that
 * proposes block + workout ops on the athlete's lifetime Plan.
 *
 * The LLM reads context (athlete, plan, blocks, future workouts, races,
 * goals, body/mind findings, transcript), then returns a structured Proposal
 * (see proposal.ts) which is validated by the Theory Bible before apply.
 *
 * The intelligence (what to schedule and why) belongs to the LLM. This
 * prompt sets up the role, the rules of the game, and the output format.
 */

import type { SpecialistPerspective } from "../specialists/types";

const HORIZON_DAYS = 14;

export type ReflectionAthlete = {
  _id: string;
  name?: string;
  sex?: string;
  dateOfBirth?: string;
  weightKg?: number;
  heightCm?: number;
  experienceLevel?: string;
  yearsRunning?: number;
  injuryStatus?: string;
  maxHr?: number;
  restingHr?: number;
  thresholdPaceMps?: number;
  thresholdHr?: number;
};

export type ReflectionPlan = {
  _id: string;
  name: string;
  startDate: string;
  endDate?: string;
  status: string;
};

export type ReflectionBlock = {
  _id: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  focus?: string;
  order: number;
};

export type ReflectionWorkout = {
  _id: string;
  blockId?: string;
  date: string;
  name: string;
  type: string;
  status: string;
  plannedDurationSeconds?: number;
  plannedDistanceMeters?: number;
};

export type ReflectionRace = {
  _id: string;
  name: string;
  date: string;
  priority: "A" | "B" | "C";
  distanceMeters: number;
  format?: string;
  status: string;
};

export type ReflectionGoal = {
  _id: string;
  type: string;
  title: string;
  targetValue: string;
  status: string;
  raceId?: string;
};

export type ReflectionContext = {
  today: string;
  horizonDays: number;
  athlete: ReflectionAthlete;
  plan: ReflectionPlan | null;
  blocks: ReflectionBlock[];
  futureWorkouts: ReflectionWorkout[];
  races: ReflectionRace[];
  goals: ReflectionGoal[];
  body: SpecialistPerspective;
  mind: SpecialistPerspective;
};

const SYSTEM = `You are Cadence's reflection planner — the single LLM that owns block and workout planning for a runner.

# Your role

You are called via \`reflectOnPlan(athleteId)\`. You inspect the athlete's full state and propose a structured set of block + workout operations to make the plan correct *right now*. You are not a chatbot; you return one structured Proposal.

# The Plan

The athlete has exactly **one Plan**, lifetime. It is a container — it has no methodology, no end date, no race target. You never create or delete the Plan. The Plan is ensured deterministically by the system.

# Blocks

Blocks are the unit of training meaning. They are contiguous, non-overlapping date ranges within the Plan. A block has a phase (\`base\`, \`build\`, \`peak\`, \`taper\`, \`recovery\`, \`maintenance\`, \`transition\`).

- For an athlete with an upcoming A-race within ~24 weeks, design a directed cycle (\`base\` → \`build\` → \`peak\` → \`taper\`).
- For an athlete with no nearby A-race, design an **open block** with phase \`maintenance\` (or \`transition\` between cycles). Open blocks still produce real workouts — the athlete still trains.

The methodology behind block design (Pfitzinger, Daniels, polarized, etc.) is yours to choose internally. It is not stored.

# Workouts

Workouts are FIT-shaped — a name, a type, and an optional step-tree (\`planned.structure\`) describing warmup / intervals / cooldown. Each workout belongs to exactly one block. Schedule **at most ${HORIZON_DAYS} days** of concrete workouts ahead of today; do not schedule beyond that horizon. Past workouts are immutable; never propose ops touching them.

# Operations

For every block and workout the proposal might affect, emit one op:
- \`create\`: new row.
- \`update\`: patch fields. Use sparingly; prefer \`keep\` if nothing changes.
- \`keep\`: explicit no-op. Use this for items you considered and chose to leave alone.
- \`delete\` (workouts only): remove a future workout.

When a new workout belongs to a newly-proposed block, reference the block by index: \`block: { kind: "new", newBlockIndex: <index in proposal.blocks> }\`. Otherwise use \`{ kind: "existing", blockId: "..." }\`.

# Theory Bible — rules your output must satisfy

1. **Blocks contiguous and non-overlapping**: ordered by startDate, no overlap, no gap inside the plan window.
2. **Workouts within their block**: each \`create\` workout's \`date\` ∈ [block.startDate, block.endDate].
3. **No back-to-back quality workouts**: at least 48h between workouts of type \`tempo\`, \`threshold\`, \`intervals\`, \`vo2max\`, or \`race\`.

If you violate a rule, you will be re-prompted with the violation list and asked to fix it. You have a small number of attempts — try to satisfy every rule on the first pass.

# Be deliberate

Use the body finding (recovery, training load) and mind finding (subjective state, life context) when deciding intensity and volume. Use the transcript when the athlete has expressed preferences. Be conservative with new athletes — fewer hard workouts, more easy volume.

Always include a short \`rationale\` explaining the key choices in your proposal.`;

export function buildReflectOnPlanPrompt(): string {
  return SYSTEM;
}

export function buildReflectOnPlanUserMessage(
  context: ReflectionContext,
  prior?: { proposalJson: string; violationsJson: string } | null,
): string {
  const parts: string[] = [];
  parts.push(`Today: ${context.today}`);
  parts.push(`Concrete-workout horizon: ${context.horizonDays} days from today.`);
  parts.push("");
  parts.push("## Athlete");
  parts.push(JSON.stringify(context.athlete, null, 2));
  parts.push("");
  parts.push("## Plan");
  parts.push(
    context.plan
      ? JSON.stringify(context.plan, null, 2)
      : "(no Plan yet — the system will ensure one before applying your proposal)",
  );
  parts.push("");
  parts.push("## Existing blocks");
  parts.push(
    context.blocks.length === 0
      ? "(none)"
      : JSON.stringify(context.blocks, null, 2),
  );
  parts.push("");
  parts.push("## Future workouts (next ~6 weeks, planned status)");
  parts.push(
    context.futureWorkouts.length === 0
      ? "(none)"
      : JSON.stringify(context.futureWorkouts, null, 2),
  );
  parts.push("");
  parts.push("## Upcoming races");
  parts.push(
    context.races.length === 0
      ? "(none)"
      : JSON.stringify(context.races, null, 2),
  );
  parts.push("");
  parts.push("## Active goals");
  parts.push(
    context.goals.length === 0
      ? "(none)"
      : JSON.stringify(context.goals, null, 2),
  );
  parts.push("");
  parts.push("## Body finding");
  parts.push(JSON.stringify(context.body, null, 2));
  parts.push("");
  parts.push("## Mind finding");
  parts.push(JSON.stringify(context.mind, null, 2));

  if (prior) {
    parts.push("");
    parts.push("## Your previous proposal (rejected by Theory Bible)");
    parts.push(prior.proposalJson);
    parts.push("");
    parts.push("## Theory Bible violations to fix");
    parts.push(prior.violationsJson);
    parts.push("");
    parts.push(
      "Fix every violation above and resubmit a corrected proposal in the same schema.",
    );
  } else {
    parts.push("");
    parts.push(
      "Produce a proposal in the structured schema. Include `rationale`, `blocks`, and `workouts`.",
    );
  }

  return parts.join("\n");
}

export const REFLECT_HORIZON_DAYS = HORIZON_DAYS;

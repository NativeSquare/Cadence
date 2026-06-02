import { getAuthUserId } from "@convex-dev/auth/server";
import { safeParseWorkout, type Workout } from "@nativesquare/agoge";
import type {
  PlanDoc,
  RaceDoc,
  RaceFormat,
  RaceStatus,
  WorkoutStatus,
} from "@nativesquare/agoge/schema";
import { Infer, v } from "convex/values";
import { components } from "../_generated/api";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
  daysBetweenYmd,
  minimumPlanWeeksForFormat,
} from "./periodization";

// ---------------------------------------------------------------------------
// Validation result shape
// ---------------------------------------------------------------------------

export const validationCodeValidator = v.union(
  v.literal("NOT_AUTHORIZED"),
  v.literal("NOT_FOUND"),
  v.literal("INVALID_DATE"),
  v.literal("DATE_OUT_OF_RANGE"),
  v.literal("INVALID_STATE"),
  v.literal("INVALID_INPUT"),
  v.literal("CONFLICT"),
);
export type ValidationCode = Infer<typeof validationCodeValidator>;

export const validationErrorValidator = v.object({
  code: validationCodeValidator,
  message: v.string(),
});
export type ValidationError = Infer<typeof validationErrorValidator>;

export const validationResultValidator = v.union(
  v.object({ ok: v.literal(true) }),
  v.object({ ok: v.literal(false), errors: v.array(validationErrorValidator) }),
);
export type ValidationResult = Infer<typeof validationResultValidator>;

export const ok: ValidationResult = { ok: true };
export const fail = (errors: ValidationError[]): ValidationResult => ({
  ok: false,
  errors,
});
export const result = (errors: ValidationError[]): ValidationResult =>
  errors.length === 0 ? ok : fail(errors);

export function push(
  errors: ValidationError[],
  error: ValidationError | null | undefined,
): void {
  if (error) errors.push(error);
}

const notAuthorized = (message: string): ValidationError => ({
  code: "NOT_AUTHORIZED",
  message,
});
const notFound = (message: string): ValidationError => ({
  code: "NOT_FOUND",
  message,
});

// ---------------------------------------------------------------------------
// Loaders (no errors, just shape) — used by both validators and mutations
// ---------------------------------------------------------------------------

export async function loadAthlete(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  const athlete = await ctx.runQuery(
    components.agoge.public.getAthleteByUserId,
    { userId },
  );
  if (!athlete) return null;
  return { userId, athlete };
}

/**
 * Convex `v.id("table")` validators throw `ArgumentValidationError` when the
 * incoming string doesn't match the expected tagged-id shape. Loaders called
 * with hallucinated or stale ids (LLM tools, optimistic client queries) should
 * NOT propagate that as a 500 — return null and let the caller decide. This
 * helper swallows validator throws and turns missing/malformed ids into
 * `null`.
 */
async function tryGetById<T>(
  fn: () => Promise<T | null>,
): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

export async function loadOwnedWorkout(
  ctx: QueryCtx | MutationCtx,
  workoutId: string,
) {
  const [auth, workout] = await Promise.all([
    loadAthlete(ctx),
    tryGetById(() =>
      ctx.runQuery(components.agoge.public.getWorkout, { workoutId }),
    ),
  ]);
  if (!auth || !workout) return null;
  if (workout.athleteId !== auth.athlete._id) return null;
  return { userId: auth.userId, workout };
}

export async function loadOwnedBlock(
  ctx: QueryCtx | MutationCtx,
  blockId: string,
) {
  const [auth, block] = await Promise.all([
    loadAthlete(ctx),
    tryGetById(() =>
      ctx.runQuery(components.agoge.public.getBlock, { blockId }),
    ),
  ]);
  if (!auth || !block) return null;
  const plan = await tryGetById(() =>
    ctx.runQuery(components.agoge.public.getPlan, { planId: block.planId }),
  );
  if (!plan || plan.athleteId !== auth.athlete._id) return null;
  const goal = await tryGetById(() =>
    ctx.runQuery(components.agoge.public.getGoal, { goalId: plan.goalId }),
  );
  if (!goal || !goal.raceId) return null;
  const race = await tryGetById(() =>
    ctx.runQuery(components.agoge.public.getRace, { raceId: goal.raceId! }),
  );
  if (!race) return null;
  return { userId: auth.userId, athlete: auth.athlete, block, plan, race };
}

export async function loadOwnedRace(
  ctx: QueryCtx | MutationCtx,
  raceId: string,
) {
  const [auth, race] = await Promise.all([
    loadAthlete(ctx),
    tryGetById(() => ctx.runQuery(components.agoge.public.getRace, { raceId })),
  ]);
  if (!auth || !race) return null;
  if (race.athleteId !== auth.athlete._id) return null;
  return { userId: auth.userId, race };
}

export async function loadOwnedPlan(
  ctx: QueryCtx | MutationCtx,
  planId: string,
) {
  const [auth, plan] = await Promise.all([
    loadAthlete(ctx),
    tryGetById(() => ctx.runQuery(components.agoge.public.getPlan, { planId })),
  ]);
  if (!auth || !plan) return null;
  if (plan.athleteId !== auth.athlete._id) return null;
  return { userId: auth.userId, athlete: auth.athlete, plan };
}

/**
 * The athlete's *current* plan — non-archived, with today between
 * `plan.startDate` (inclusive) and `race.date` (inclusive). Returns the plan
 * joined with its target race, since callers almost always need both.
 *
 * Returns null when no plan is current (planless state is legitimate).
 * Plans whose goal is not race-anchored are skipped — our host-app rule is
 * "Plan only for Goal with raceId" (see plans.ts).
 */
export async function loadCurrentAthletePlan(
  ctx: QueryCtx | MutationCtx,
  athleteId: string,
): Promise<{ plan: PlanDoc; race: RaceDoc } | null> {
  const plans = await ctx.runQuery(
    components.agoge.public.getPlansByAthlete,
    { athleteId },
  );
  const todayYmd = new Date().toISOString().slice(0, 10);
  for (const plan of plans) {
    if (plan.archivedAt !== undefined) continue;
    const goal = await ctx.runQuery(components.agoge.public.getGoal, {
      goalId: plan.goalId,
    });
    if (!goal || !goal.raceId) continue;
    const race = await ctx.runQuery(components.agoge.public.getRace, {
      raceId: goal.raceId,
    });
    if (!race) continue;
    const raceYmd = race.date.slice(0, 10);
    if (todayYmd >= plan.startDate && todayYmd <= raceYmd) {
      return { plan, race };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Short-circuit helpers used at the top of per-mutation validators
// ---------------------------------------------------------------------------

export const requireAuthError: ValidationError = notAuthorized("Not authorized");
export const noCurrentPlanError: ValidationError = {
  code: "INVALID_STATE",
  message: "Athlete has no current plan",
};

// ---------------------------------------------------------------------------
// Date / face primitives (pure)
// ---------------------------------------------------------------------------

const CALENDAR_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Calendar-date fields (e.g. goal.targetDate, block.startDate, plan.startDate)
 * carry a day with no meaningful time-of-day. Stored as YYYY-MM-DD.
 */
export function validateIsoCalendarDate(
  date: string | undefined,
  label: string,
): ValidationError | null {
  if (date === undefined) return null;
  if (!CALENDAR_DATE_RE.test(date)) {
    return {
      code: "INVALID_DATE",
      message: `${label} must be an ISO calendar date in YYYY-MM-DD form (e.g. '2026-05-01'), got '${date}'`,
    };
  }
  // Reject "2026-13-40" — string matched the shape but isn't a real day.
  const [y, m, d] = date.split("-").map((p) => Number.parseInt(p, 10));
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (
    probe.getUTCFullYear() !== y ||
    probe.getUTCMonth() !== m - 1 ||
    probe.getUTCDate() !== d
  ) {
    return {
      code: "INVALID_DATE",
      message: `${label} is not a valid calendar date: '${date}'`,
    };
  }
  return null;
}

/**
 * Instant fields (e.g. race.date, workout.planned.date) carry a moment in time.
 * Stored as canonical UTC ISO 8601 — must round-trip through Date.toISOString().
 */
export function validateIsoInstantDate(
  date: string | undefined,
  label: string,
): ValidationError | null {
  if (date === undefined) return null;
  if (Number.isNaN(Date.parse(date)) || new Date(date).toISOString() !== date) {
    return {
      code: "INVALID_DATE",
      message: `${label} must be a canonical UTC ISO 8601 timestamp (e.g. '2026-05-01T14:30:00.000Z'), got '${date}'`,
    };
  }
  return null;
}

export function validatePlannedFace(
  status: WorkoutStatus,
  planned: unknown,
): ValidationError | null {
  if ((status === "planned" || status === "missed") && !planned) {
    return {
      code: "INVALID_STATE",
      message: `A workout with status '${status}' must include a 'planned' face`,
    };
  }
  return null;
}

export function validateActualFace(
  status: WorkoutStatus,
  actual: unknown,
): ValidationError | null {
  if (status === "completed" && !actual) {
    return {
      code: "INVALID_STATE",
      message: "A 'completed' workout must include an 'actual' face",
    };
  }
  if (status !== "completed" && actual) {
    return {
      code: "INVALID_STATE",
      message: `A workout with status '${status}' cannot include an 'actual' face — only 'completed' workouts may have one`,
    };
  }
  return null;
}

export function validatePlannedDateNotAfterActual(
  planned: { date?: string } | undefined,
  actual: { date?: string } | undefined,
): ValidationError | null {
  if (!planned?.date || !actual?.date) return null;
  if (planned.date > actual.date) {
    return {
      code: "DATE_OUT_OF_RANGE",
      message: "planned.date cannot be after actual.date",
    };
  }
  return null;
}

const CLOCK_SKEW_TOLERANCE_MS = 60_000;

export function validateActualDateNotInFuture(
  actual: { date?: string } | undefined,
): ValidationError | null {
  if (!actual?.date) return null;
  if (Date.parse(actual.date) > Date.now() + CLOCK_SKEW_TOLERANCE_MS) {
    return {
      code: "INVALID_DATE",
      message: "actual.date cannot be in the future",
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Block / plan range primitives (pure)
// ---------------------------------------------------------------------------

export function validateBlockDateRange(
  startDate: string,
  endDate: string,
): ValidationError | null {
  const start = validateIsoCalendarDate(startDate, "Block startDate");
  if (start) return start;
  const end = validateIsoCalendarDate(endDate, "Block endDate");
  if (end) return end;
  if (endDate < startDate) {
    return {
      code: "DATE_OUT_OF_RANGE",
      message: "Block endDate must be on or after startDate.",
    };
  }
  return null;
}

/**
 * A plan's startDate is user-chosen; the endDate is always `race.date` (the
 * plan target). Validate the start lands on a real day and is on/before the
 * race day.
 */
export function validatePlanStart(
  startDate: string,
  raceDate: string,
): ValidationError | null {
  const start = validateIsoCalendarDate(startDate, "Plan startDate");
  if (start) return start;
  // race.date is an instant; compare on the YMD prefix.
  const raceYmd = raceDate.slice(0, 10);
  if (startDate > raceYmd) {
    return {
      code: "DATE_OUT_OF_RANGE",
      message: `Plan startDate (${startDate}) cannot be after race date (${raceYmd}).`,
    };
  }
  return null;
}

/**
 * Format-specific floor on `raceDate - startDate`. Below the floor the plan
 * has no pedagogical value (e.g. a 5K plan needs at least 4 weeks to land
 * one construction-early + one construction-late + spécifique + taper).
 * Returns null when the format has no enforced minimum.
 */
export function validateMinimumPlanDuration(
  startDate: string,
  raceDate: string,
  format: RaceFormat | undefined,
): ValidationError | null {
  const minWeeks = minimumPlanWeeksForFormat(format);
  if (minWeeks === undefined) return null;
  const raceYmd = raceDate.slice(0, 10);
  const days = daysBetweenYmd(startDate, raceYmd);
  if (days < minWeeks * 7) {
    return {
      code: "DATE_OUT_OF_RANGE",
      message: `A ${format} plan needs at least ${minWeeks} weeks before the race (only ${days} days from ${startDate} to ${raceYmd}).`,
    };
  }
  return null;
}

export function validateBlockWithinPlan(
  range: { startDate: string; endDate: string },
  plan: { startDate: string },
  race: { name: string; date: string },
): ValidationError | null {
  const raceYmd = race.date.slice(0, 10);
  if (range.startDate < plan.startDate) {
    return {
      code: "DATE_OUT_OF_RANGE",
      message: `Block startDate (${range.startDate}) cannot be before plan startDate (${plan.startDate}) for "${race.name}".`,
    };
  }
  if (range.endDate > raceYmd) {
    return {
      code: "DATE_OUT_OF_RANGE",
      message: `Block endDate (${range.endDate}) cannot be after race date (${raceYmd}) for "${race.name}".`,
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Block / workout primitives (DB-touching)
// ---------------------------------------------------------------------------

export async function validatePlannedDateInBlock(
  ctx: QueryCtx | MutationCtx,
  plannedDate: string | undefined,
  blockId: string | null | undefined,
): Promise<ValidationError | null> {
  if (!blockId || !plannedDate) return null;
  const block = await ctx.runQuery(components.agoge.public.getBlock, {
    blockId,
  });
  if (!block) return notFound("Block not found");
  // plannedDate is an instant; block boundaries are calendar dates. Compare
  // on the calendar-date prefix so an 8 AM workout on the block's first day
  // isn't reported as "before" the block (lexicographic comparison would
  // otherwise sort the longer instant string above the shorter date string).
  const plannedYmd = plannedDate.slice(0, 10);
  if (plannedYmd < block.startDate || plannedYmd > block.endDate) {
    return {
      code: "DATE_OUT_OF_RANGE",
      message: `planned.date (${plannedDate}) must fall within the selected block (${block.startDate} → ${block.endDate})`,
    };
  }
  return null;
}

export async function validateNoBlockOverlap(
  ctx: QueryCtx | MutationCtx,
  planId: string,
  range: { startDate: string; endDate: string },
  options?: { excludeBlockId?: string },
): Promise<ValidationError | null> {
  const siblings = await ctx.runQuery(components.agoge.public.getBlocksByPlan, {
    planId,
  });
  const conflict = siblings.find(
    (b) =>
      b._id !== options?.excludeBlockId &&
      range.startDate <= b.endDate &&
      range.endDate >= b.startDate,
  );
  if (conflict) {
    return {
      code: "CONFLICT",
      message: `Block dates overlap with existing block (${conflict.startDate} → ${conflict.endDate}).`,
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Workout structure primitives
// ---------------------------------------------------------------------------

export type WorkoutStructureValidation =
  | { ok: true; structure: Workout }
  | { ok: false; error: ValidationError };

export function validateWorkoutStructure(
  raw: unknown,
): WorkoutStructureValidation {
  const parsed = safeParseWorkout(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const path = first?.path?.join(".") ?? "structure";
    return {
      ok: false,
      error: {
        code: "INVALID_INPUT",
        message: `${path}: ${first?.message ?? "invalid workout structure"}`,
      },
    };
  }
  return { ok: true, structure: parsed.data };
}

export function validateStructureSportMatchesWorkout(
  structure: Workout,
  workoutSport: string,
): ValidationError | null {
  if (structure.sport !== workoutSport) {
    return {
      code: "INVALID_INPUT",
      message: `Workout sport is "${workoutSport}" but structure sport is "${structure.sport}".`,
    };
  }
  return null;
}

function collectZoneTargetTypes(structure: Workout): Set<string> {
  const types = new Set<string>();
  const visit = (step: { target?: { type: string } }) => {
    const t = step.target?.type;
    if (t === "hr_zone" || t === "power_zone") types.add(t);
  };
  for (const block of structure.blocks) {
    if (block.kind === "step") visit(block);
    else for (const child of block.children) visit(child);
  }
  return types;
}

export async function validateZonesAvailableForStructure(
  _ctx: QueryCtx | MutationCtx,
  _athleteId: string,
  structure: Workout,
): Promise<ValidationError | null> {
  const targetTypes = collectZoneTargetTypes(structure);
  if (targetTypes.has("power_zone")) {
    return {
      code: "INVALID_INPUT",
      message: "Power zones are not supported.",
    };
  }
  if (targetTypes.has("hr_zone")) {
    return {
      code: "INVALID_INPUT",
      message: "Heart-rate zones are not supported.",
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Race primitives
// ---------------------------------------------------------------------------

export async function validateNoUpcomingARaceConflict(
  ctx: QueryCtx | MutationCtx,
  athleteId: string,
  options?: { excludeRaceId?: string },
): Promise<ValidationError | null> {
  const races = await ctx.runQuery(
    components.agoge.public.getRacesByAthleteAndPriority,
    { athleteId, priority: "A" as const },
  );
  const hasConflict = races.some(
    (r) => r.status === "upcoming" && r._id !== options?.excludeRaceId,
  );
  if (hasConflict) {
    return {
      code: "CONFLICT",
      message: "Another upcoming A race already exists.",
    };
  }
  return null;
}

export function validateRaceDateStatusCoherent(
  date: string,
  status: RaceStatus,
): ValidationError | null {
  // Slice tolerates legacy ISO-instant rows still in the DB (`2026-05-11T10:…`).
  const ymd = date.slice(0, 10);
  const todayYmd = new Date().toISOString().slice(0, 10);
  if (status === "upcoming" && ymd < todayYmd) {
    return {
      code: "INVALID_STATE",
      message: "An upcoming race must have a future date.",
    };
  }
  if (
    (status === "completed" || status === "dnf" || status === "dns") &&
    ymd > todayYmd
  ) {
    return {
      code: "INVALID_STATE",
      message: "A completed/DNF/DNS race must have a past date.",
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Cross-entity ownership primitives (used when validating an entity that
// references another entity owned by the same athlete)
// ---------------------------------------------------------------------------

export async function validateRaceOwnership(
  ctx: QueryCtx | MutationCtx,
  raceId: string,
  athleteId: string,
): Promise<ValidationError | null> {
  const race = await ctx.runQuery(components.agoge.public.getRace, { raceId });
  if (!race || race.athleteId !== athleteId) return notFound("Race not found");
  return null;
}


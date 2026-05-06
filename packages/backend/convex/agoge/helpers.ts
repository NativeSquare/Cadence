import { getAuthUserId } from "@convex-dev/auth/server";
import { safeParseWorkout, type Workout } from "@nativesquare/agoge";
import type { RaceStatus, WorkoutStatus } from "@nativesquare/agoge/schema";
import { Infer, v } from "convex/values";
import { components } from "../_generated/api";
import type { MutationCtx, QueryCtx } from "../_generated/server";

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

// `userIdOverride` lets callers in auth-less contexts (e.g. the coach agent's
// post-approval scheduled internalAction) pass a thread-bound userId instead
// of relying on getAuthUserId, which returns null in those contexts.
export async function loadAthlete(
  ctx: QueryCtx | MutationCtx,
  userIdOverride?: string,
) {
  const userId = userIdOverride ?? (await getAuthUserId(ctx));
  if (!userId) return null;
  const athlete = await ctx.runQuery(
    components.agoge.public.getAthleteByUserId,
    { userId },
  );
  if (!athlete) return null;
  return { userId, athlete };
}

export async function loadOwnedWorkout(
  ctx: QueryCtx | MutationCtx,
  workoutId: string,
  userIdOverride?: string,
) {
  const [auth, workout] = await Promise.all([
    loadAthlete(ctx, userIdOverride),
    ctx.runQuery(components.agoge.public.getWorkout, { workoutId }),
  ]);
  if (!auth || !workout) return null;
  if (workout.athleteId !== auth.athlete._id) return null;
  return { userId: auth.userId, workout };
}

export async function loadOwnedBlock(
  ctx: QueryCtx | MutationCtx,
  blockId: string,
  userIdOverride?: string,
) {
  const [auth, block] = await Promise.all([
    loadAthlete(ctx, userIdOverride),
    ctx.runQuery(components.agoge.public.getBlock, { blockId }),
  ]);
  if (!auth || !block) return null;
  const plan = await ctx.runQuery(components.agoge.public.getPlan, {
    planId: block.planId,
  });
  if (!plan || plan.athleteId !== auth.athlete._id) return null;
  return { userId: auth.userId, athlete: auth.athlete, block, plan };
}

export async function loadOwnedRace(
  ctx: QueryCtx | MutationCtx,
  raceId: string,
) {
  const [auth, race] = await Promise.all([
    loadAthlete(ctx),
    ctx.runQuery(components.agoge.public.getRace, { raceId }),
  ]);
  if (!auth || !race) return null;
  if (race.athleteId !== auth.athlete._id) return null;
  return { userId: auth.userId, race };
}

export async function loadOwnedZone(
  ctx: QueryCtx | MutationCtx,
  zoneId: string,
) {
  const [auth, zone] = await Promise.all([
    loadAthlete(ctx),
    ctx.runQuery(components.agoge.public.getZone, { zoneId }),
  ]);
  if (!auth || !zone) return null;
  if (zone.athleteId !== auth.athlete._id) return null;
  return { userId: auth.userId, zone };
}

export async function loadOwnedWorkoutTemplate(
  ctx: QueryCtx | MutationCtx,
  templateId: string,
) {
  const [auth, template] = await Promise.all([
    loadAthlete(ctx),
    ctx.runQuery(components.agoge.public.getWorkoutTemplate, { templateId }),
  ]);
  if (!auth || !template) return null;
  if (template.athleteId !== auth.athlete._id) return null;
  return { userId: auth.userId, template };
}

export async function loadActiveAthletePlan(
  ctx: QueryCtx | MutationCtx,
  athleteId: string,
) {
  const plans = await ctx.runQuery(
    components.agoge.public.getPlansByAthleteAndStatus,
    { athleteId, status: "active" },
  );
  return plans[0] ?? null;
}

// ---------------------------------------------------------------------------
// Short-circuit helpers used at the top of per-mutation validators
// ---------------------------------------------------------------------------

export const requireAuthError: ValidationError = notAuthorized("Not authorized");
export const noActivePlanError: ValidationError = {
  code: "INVALID_STATE",
  message: "Athlete has no active plan",
};

// ---------------------------------------------------------------------------
// Date / face primitives (pure)
// ---------------------------------------------------------------------------

export function validateUtcDate(
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
  if (
    (status === "planned" || status === "missed" || status === "skipped") &&
    !planned
  ) {
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
  const start = validateUtcDate(startDate, "Block startDate");
  if (start) return start;
  const end = validateUtcDate(endDate, "Block endDate");
  if (end) return end;
  if (endDate < startDate) {
    return {
      code: "DATE_OUT_OF_RANGE",
      message: "Block endDate must be on or after startDate.",
    };
  }
  return null;
}

export function validatePlanDateRange(
  startDate: string,
  endDate?: string,
): ValidationError | null {
  const start = validateUtcDate(startDate, "Plan startDate");
  if (start) return start;
  if (endDate !== undefined) {
    const end = validateUtcDate(endDate, "Plan endDate");
    if (end) return end;
    if (endDate < startDate) {
      return {
        code: "DATE_OUT_OF_RANGE",
        message: "Plan endDate must be on or after startDate.",
      };
    }
  }
  return null;
}

export function validateBlockWithinPlan(
  range: { startDate: string; endDate: string },
  plan: { startDate: string; endDate?: string; name: string },
): ValidationError | null {
  if (range.startDate < plan.startDate) {
    return {
      code: "DATE_OUT_OF_RANGE",
      message: `Block startDate (${range.startDate}) cannot be before plan "${plan.name}" startDate (${plan.startDate}).`,
    };
  }
  if (plan.endDate && range.endDate > plan.endDate) {
    return {
      code: "DATE_OUT_OF_RANGE",
      message: `Block endDate (${range.endDate}) cannot be after plan "${plan.name}" endDate (${plan.endDate}).`,
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
  if (plannedDate < block.startDate || plannedDate > block.endDate) {
    return {
      code: "DATE_OUT_OF_RANGE",
      message: `planned.date (${plannedDate}) must fall within the selected block "${block.name}" (${block.startDate} → ${block.endDate})`,
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
      message: `Block dates overlap with existing block "${conflict.name}" (${conflict.startDate} → ${conflict.endDate}).`,
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
  ctx: QueryCtx | MutationCtx,
  athleteId: string,
  structure: Workout,
): Promise<ValidationError | null> {
  const targetTypes = collectZoneTargetTypes(structure);
  if (targetTypes.size === 0) return null;
  if (targetTypes.has("power_zone")) {
    return {
      code: "INVALID_INPUT",
      message:
        "This workout uses power zones, but power zones are not configured.",
    };
  }
  if (targetTypes.has("hr_zone")) {
    const hrZone = await ctx.runQuery(
      components.agoge.public.getZoneByAthleteKind,
      { athleteId, kind: "hr" },
    );
    if (!hrZone) {
      return {
        code: "INVALID_INPUT",
        message:
          "This workout uses HR zones, but you have no HR zone configured.",
      };
    }
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
  const dateMs = Date.parse(date);
  const now = Date.now();
  if (status === "upcoming" && dateMs < now - CLOCK_SKEW_TOLERANCE_MS) {
    return {
      code: "INVALID_STATE",
      message: "An upcoming race must have a future date.",
    };
  }
  if (
    (status === "completed" || status === "dnf" || status === "dns") &&
    dateMs > now + CLOCK_SKEW_TOLERANCE_MS
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

export async function validateWorkoutTemplateOwnership(
  ctx: QueryCtx | MutationCtx,
  templateId: string,
  athleteId: string,
): Promise<ValidationError | null> {
  const template = await ctx.runQuery(
    components.agoge.public.getWorkoutTemplate,
    { templateId },
  );
  if (!template || template.athleteId !== athleteId) {
    return notFound("Template not found");
  }
  return null;
}

// ---------------------------------------------------------------------------
// Zone primitives (pure)
// ---------------------------------------------------------------------------

export function validateZoneBoundariesLength(
  boundaries: number[],
): ValidationError | null {
  if (boundaries.length !== 6) {
    return {
      code: "INVALID_INPUT",
      message:
        "Zone boundaries must have 6 values (Z1 floor + 4 inner bounds + Z5 cap).",
    };
  }
  return null;
}

export function validateZoneBoundariesOrder(
  boundaries: number[],
): ValidationError | null {
  for (let i = 1; i < boundaries.length; i++) {
    if (boundaries[i] <= boundaries[i - 1]) {
      return {
        code: "INVALID_INPUT",
        message: "Zone boundaries must be strictly ascending.",
      };
    }
  }
  return null;
}

export function validateZoneBoundariesExtremes(
  boundaries: number[],
): ValidationError | null {
  for (const b of boundaries) {
    if (!Number.isFinite(b) || b < 0) {
      return {
        code: "INVALID_INPUT",
        message: "Zone boundaries must be finite and non-negative.",
      };
    }
  }
  return null;
}

import { getAuthUserId } from "@convex-dev/auth/server";
import { safeParseWorkout, type Workout } from "@nativesquare/agoge";
import type { RaceStatus, WorkoutStatus } from "@nativesquare/agoge/schema";
import { ConvexError } from "convex/values";
import { components } from "../_generated/api";
import type { MutationCtx, QueryCtx } from "../_generated/server";

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

export async function assertAthlete(ctx: MutationCtx) {
  const result = await loadAthlete(ctx);
  if (!result) throw new Error("Not authorized");
  return result;
}

export async function loadOwnedWorkout(
  ctx: QueryCtx | MutationCtx,
  workoutId: string,
) {
  const [auth, workout] = await Promise.all([
    loadAthlete(ctx),
    ctx.runQuery(components.agoge.public.getWorkout, { workoutId }),
  ]);
  if (!auth || !workout) return null;
  if (workout.athleteId !== auth.athlete._id) return null;
  return { userId: auth.userId, workout };
}

export async function assertWorkoutOwnership(
  ctx: MutationCtx,
  workoutId: string,
) {
  const result = await loadOwnedWorkout(ctx, workoutId);
  if (!result) throw new Error("Not authorized");
  return result;
}

export function assertPlannedFace(status: WorkoutStatus, planned: unknown) {
  if (
    (status === "planned" || status === "missed" || status === "skipped") &&
    !planned
  ) {
    throw new Error(
      `A workout with status '${status}' must include a 'planned' face`,
    );
  }
}

export function assertActualFace(status: WorkoutStatus, actual: unknown) {
  if (status === "completed" && !actual) {
    throw new Error("A 'completed' workout must include an 'actual' face");
  }
}

export function assertUtcDate(date: string, label: string) {
  if (Number.isNaN(Date.parse(date)) || new Date(date).toISOString() !== date) {
    throw new Error(
      `${label} must be a canonical UTC ISO 8601 timestamp (e.g. '2026-05-01T14:30:00.000Z'), got '${date}'`,
    );
  }
}

export function assertFaceDatesAreUtc(
  planned: { date?: string } | undefined,
  actual: { date?: string } | undefined,
) {
  if (planned?.date) assertUtcDate(planned.date, "planned.date");
  if (actual?.date) assertUtcDate(actual.date, "actual.date");
}

export function assertPlannedDateNotAfterActual(
  planned: { date?: string } | undefined,
  actual: { date?: string } | undefined,
) {
  if (!planned?.date || !actual?.date) return;
  if (planned.date > actual.date) {
    throw new Error("planned.date cannot be after actual.date");
  }
}

const CLOCK_SKEW_TOLERANCE_MS = 60_000;

export function assertActualDateNotInFuture(
  actual: { date?: string } | undefined,
) {
  if (!actual?.date) return;
  if (Date.parse(actual.date) > Date.now() + CLOCK_SKEW_TOLERANCE_MS) {
    throw new Error("actual.date cannot be in the future");
  }
}

export function assertWorkoutStructure(raw: unknown): Workout {
  const result = safeParseWorkout(raw);
  if (!result.success) {
    const first = result.error.issues[0];
    const path = first?.path?.join(".") ?? "structure";
    throw new ConvexError({
      code: "INVALID_STRUCTURE",
      message: `${path}: ${first?.message ?? "invalid workout structure"}`,
    });
  }
  return result.data;
}

export function assertStructureSportMatchesWorkout(
  structure: Workout,
  workoutSport: string,
) {
  if (structure.sport !== workoutSport) {
    throw new ConvexError({
      code: "SPORT_MISMATCH",
      message: `Workout sport is "${workoutSport}" but structure sport is "${structure.sport}".`,
    });
  }
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

export async function assertZonesAvailableForStructure(
  ctx: QueryCtx | MutationCtx,
  athleteId: string,
  structure: Workout,
) {
  const targetTypes = collectZoneTargetTypes(structure);
  if (targetTypes.size === 0) return;

  if (targetTypes.has("power_zone")) {
    throw new ConvexError({
      code: "MISSING_ZONE",
      message:
        "This workout uses power zones, but power zones are not configured.",
    });
  }
  if (targetTypes.has("hr_zone")) {
    const hrZone = await ctx.runQuery(
      components.agoge.public.getZoneByAthleteKind,
      { athleteId, kind: "hr" },
    );
    if (!hrZone) {
      throw new ConvexError({
        code: "MISSING_ZONE",
        message:
          "This workout uses HR zones, but you have no HR zone configured.",
      });
    }
  }
}

export async function assertAthletePlan(
  ctx: QueryCtx | MutationCtx,
  athleteId: string,
) {
  const plans = await ctx.runQuery(
    components.agoge.public.getPlansByAthleteAndStatus,
    { athleteId, status: "active" },
  );
  const plan = plans[0];
  if (!plan) throw new Error("Athlete has no active plan");
  return plan;
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

export async function assertWorkoutTemplateOwnership(
  ctx: QueryCtx | MutationCtx,
  templateId: string,
  athleteId: string,
) {
  const template = await ctx.runQuery(
    components.agoge.public.getWorkoutTemplate,
    { templateId },
  );
  if (!template || template.athleteId !== athleteId) {
    throw new Error("Template not found");
  }
  return template;
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

export async function assertRaceOwnership(
  ctx: QueryCtx | MutationCtx,
  raceId: string,
  athleteId: string,
) {
  const race = await ctx.runQuery(components.agoge.public.getRace, { raceId });
  if (!race || race.athleteId !== athleteId) {
    throw new Error("Race not found");
  }
  return race;
}

export async function assertNoUpcomingARaceConflict(
  ctx: QueryCtx | MutationCtx,
  athleteId: string,
  options?: { excludeRaceId?: string },
) {
  const races = await ctx.runQuery(
    components.agoge.public.getRacesByAthleteAndPriority,
    { athleteId, priority: "A" as const },
  );
  const hasConflict = races.some(
    (r) => r.status === "upcoming" && r._id !== options?.excludeRaceId,
  );
  if (hasConflict) {
    throw new ConvexError({
      code: "A_RACE_CONFLICT",
      message: "Another upcoming A race already exists.",
    });
  }
}

export function assertRaceDateStatusCoherent(date: string, status: RaceStatus) {
  const dateMs = Date.parse(date);
  const now = Date.now();
  if (status === "upcoming" && dateMs < now - CLOCK_SKEW_TOLERANCE_MS) {
    throw new ConvexError({
      message: "An upcoming race must have a future date.",
    });
  }
  if (
    (status === "completed" || status === "dnf" || status === "dns") &&
    dateMs > now + CLOCK_SKEW_TOLERANCE_MS
  ) {
    throw new ConvexError({
      message: "A completed/DNF/DNS race must have a past date.",
    });
  }
}

export async function assertGoalOwnership(
  ctx: QueryCtx | MutationCtx,
  goalId: string,
  athleteId: string,
) {
  const goal = await ctx.runQuery(components.agoge.public.getGoal, { goalId });
  if (!goal || goal.athleteId !== athleteId) {
    throw new Error("Goal not found");
  }
  return goal;
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

export async function assertZoneOwnership(
  ctx: QueryCtx | MutationCtx,
  zoneId: string,
  athleteId: string,
) {
  const zone = await ctx.runQuery(components.agoge.public.getZone, { zoneId });
  if (!zone || zone.athleteId !== athleteId) {
    throw new Error("Zone not found");
  }
  return zone;
}

export function assertZoneBoundariesLength(boundaries: number[]) {
  if (boundaries.length !== 6) {
    throw new Error(
      "Zone boundaries must have 6 values (Z1 floor + 4 inner bounds + Z5 cap).",
    );
  }
}

export function assertZoneBoundariesOrder(boundaries: number[]) {
  for (let i = 1; i < boundaries.length; i++) {
    if (boundaries[i] <= boundaries[i - 1]) {
      throw new Error("Zone boundaries must be strictly ascending.");
    }
  }
}

export function assertZoneBoundariesExtremes(boundaries: number[]) {
  for (const b of boundaries) {
    if (!Number.isFinite(b) || b < 0) {
      throw new Error("Zone boundaries must be finite and non-negative.");
    }
  }
}

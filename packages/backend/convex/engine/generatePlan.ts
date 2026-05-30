/**
 * Engine: plan generation. Fill a freshly-created Plan with Blocks + planned
 * Workouts.
 *
 * - `generate`: race-category goals (finish + time targets). Paces from
 *   Daniels VDOT; 80/20 easy/quality split in Base/Build/Taper; Peak goes
 *   pyramidal to fit race-specific M-pace work. Ultra/relay formats are skipped.
 * - `generateFitness`: fitness-category goals — single base block, no peak,
 *   no taper, no paces. Length + volume tuned per `fitnessIntent`.
 *
 * Math is in `../agoge/periodization.ts`. Both actions are idempotent: if
 * Blocks already exist for the plan, the action returns early (handles
 * scheduler retries and accidental double-fires).
 */

import type { BlockType } from "@nativesquare/agoge/schema";
import { v } from "convex/values";
import { api, components } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { type ActionCtx, internalAction } from "../_generated/server";

// Agoge tables live in a Convex component, so their IDs aren't part of the
// host-app `Id<>` brand. They cross the wire as plain strings.
type ComponentId = string;
import {
  addDaysYmd,
  buildRaceStructure,
  buildStructure,
  computeVdot,
  daysBetweenYmd,
  DEFAULT_SCHEDULE,
  distancePeakKm,
  type FitnessIntent,
  fitnessPlanShape,
  fitnessVolumeCurve,
  isoDayOfWeek,
  isSupportedFormat,
  type Locale,
  microcycle,
  type Paces,
  type Schedule,
  type SessionSpec,
  splitPhases,
  summarizeStructure,
  taperWeeksForFormat,
  trainingPaces,
  weeklyVolumeCurve,
  workoutName,
  ymdToNoonUtc,
} from "../agoge/periodization";
import {
  buildFiveKPlan,
  expandPhases,
  type TracedSession,
} from "../agoge/plans/buildFiveKPlan";

const GENERATOR_VERSION = "v1";
const BASELINE_LOOKBACK_DAYS = 56;
const FALLBACK_WEEKLY_KM = 20;

/** Shared inputs for every emitted training workout in a single plan run. */
type WorkoutCommon = {
  athleteId: ComponentId;
  planId: ComponentId;
  locale: Locale;
  paces: Paces | undefined;
  planStart: string;
  raceYmd: string;
};

function scheduleFromAthlete(athlete: {
  availableDays?: number[];
  sessionsPerWeek?: number;
}): Schedule {
  return {
    availableDays: athlete.availableDays ?? DEFAULT_SCHEDULE.availableDays,
    sessionsPerWeek:
      athlete.sessionsPerWeek ?? DEFAULT_SCHEDULE.sessionsPerWeek,
  };
}

/**
 * Materialise one planned training workout from a `SessionSpec` at `dateYmd`.
 * Drops anything outside [planStart, raceYmd) (race day belongs to the race
 * workout) and anything too short to be worth a workout.
 */
async function emitTrainingWorkout(
  ctx: ActionCtx,
  common: WorkoutCommon,
  blockId: ComponentId,
  dateYmd: string,
  session: SessionSpec,
): Promise<void> {
  if (dateYmd < common.planStart || dateYmd >= common.raceYmd) return;
  const distanceMeters = Math.round(session.distanceKm * 1000);
  if (distanceMeters < 500 && !session.structureSpec) return;
  const structure = buildStructure(
    session.type,
    session.intensity,
    distanceMeters,
    common.paces,
    session.structureSpec,
  );
  if (!structure) return;

  // Structure is the source of truth for what the workout demands —
  // distance/pace/duration are derived from it on read.
  const labelDistance = summarizeStructure(structure).distanceMeters;

  await ctx.runMutation(components.agoge.public.createWorkout, {
    athleteId: common.athleteId,
    planId: common.planId,
    blockId,
    name: workoutName({
      type: session.type,
      distanceMeters: labelDistance,
      structure,
      locale: common.locale,
    }),
    type: session.type,
    sport: "run",
    status: "planned",
    planned: {
      date: ymdToNoonUtc(dateYmd),
      structure,
    },
  });
}

export const generate = internalAction({
  args: { planId: v.string() },
  handler: async (ctx, { planId }): Promise<void> => {
    const plan = await ctx.runQuery(components.agoge.public.getPlan, { planId });
    if (!plan) return;

    // Idempotency: another invocation already populated this plan.
    const existingBlocks = await ctx.runQuery(
      components.agoge.public.getBlocksByPlan,
      { planId: plan._id },
    );
    if (existingBlocks.length > 0) return;

    const goal = await ctx.runQuery(components.agoge.public.getGoal, {
      goalId: plan.goalId,
    });
    if (!goal || goal.category !== "race" || !goal.raceId) return;

    const race = await ctx.runQuery(components.agoge.public.getRace, {
      raceId: goal.raceId,
    });
    if (!race) return;

    if (!isSupportedFormat(race.format)) {
      await markGenerated(ctx, plan._id, plan.notes, "unsupported-format");
      return;
    }

    const athlete = await ctx.runQuery(components.agoge.public.getAthlete, {
      athleteId: plan.athleteId,
    });
    if (!athlete) return;

    const user = await ctx.runQuery(api.table.users.get, {
      id: athlete.userId as Id<"users">,
    });
    const locale: Locale = user?.locale ?? "en";

    const raceYmd = race.date.slice(0, 10);
    const totalDays = daysBetweenYmd(plan.startDate, raceYmd);
    if (totalDays < 1) {
      await markGenerated(ctx, plan._id, plan.notes, "race-too-soon");
      return;
    }

    const planStart = plan.startDate;
    const currentKm = await loadBaselineVolume(ctx, plan.athleteId);
    const peakKm = distancePeakKm(race.format, race.distanceMeters);
    const schedule = scheduleFromAthlete(athlete);

    const vdot: number | undefined =
      goal.raceTarget?.type === "time" && goal.raceTarget.seconds > 0
        ? computeVdot(race.distanceMeters, goal.raceTarget.seconds)
        : undefined;
    const paces: Paces | undefined =
      vdot !== undefined ? trainingPaces(vdot) : undefined;

    const common: WorkoutCommon = {
      athleteId: plan.athleteId,
      planId: plan._id,
      locale,
      paces,
      planStart,
      raceYmd,
    };

    let blockIds: Partial<Record<BlockType, ComponentId>>;

    if (race.format === "5k") {
      // 5K: every base/build/peak block is a full Mon→Sun week and the taper is
      // a variable 4–10 day tail anchored to race day. The whole plan is computed
      // by the pure `buildFiveKPlan` (shared verbatim with the admin simulator);
      // here we create the blocks and persist the traced sessions.
      const trace = buildFiveKPlan({
        planStartYmd: planStart,
        raceYmd,
        currentKm,
        schedule,
        locale,
        raceDistanceMeters: race.distanceMeters,
        peakKm,
        vdot,
        paces,
      });

      blockIds = await createBlocks5K(
        ctx,
        plan._id,
        trace.grid.gridStartYmd,
        planStart,
        trace.grid.taperStartYmd,
        raceYmd,
        trace.phaseByWeek,
      );

      // Persist every non-dropped session. The trace already applied the same
      // emit guards (date window + min distance) the old inline
      // `emitTrainingWorkout` used, so dropped sessions are skipped identically.
      const persist = async (
        blockId: ComponentId,
        s: TracedSession,
      ): Promise<void> => {
        if (s.dropped || !s.structure) return;
        await ctx.runMutation(components.agoge.public.createWorkout, {
          athleteId: plan.athleteId,
          planId: plan._id,
          blockId,
          name: s.workoutName ?? "",
          type: s.spec.type,
          sport: "run",
          status: "planned",
          planned: {
            date: ymdToNoonUtc(s.dateYmd),
            structure: s.structure,
          },
        });
      };

      for (const week of trace.weeks) {
        const blockId = blockIds[week.phase];
        if (!blockId) continue;
        for (const s of week.sessions) await persist(blockId, s);
      }
      const taperBlockId = blockIds.taper;
      if (taperBlockId) {
        for (const s of trace.taper.sessions) await persist(taperBlockId, s);
      }
    } else {
      // Other formats: race-anchored week grid — weeks count back from race day
      // so the final training week ends the day before the race and the taper
      // culminates at the race. A non-multiple-of-7 gap lands as a partial first
      // week, whose pre-`planStart` days are dropped by the date guard.
      const planWeeks = Math.max(1, Math.ceil((totalDays + 1) / 7));
      const gridStart = addDaysYmd(raceYmd, -planWeeks * 7);
      const taperWeeks = Math.min(taperWeeksForFormat(race.format), planWeeks);
      const maxBuildMultiple = planWeeks < 6 ? 1.2 : 2.5;
      const volumeCurve = weeklyVolumeCurve({
        weeks: planWeeks,
        currentKm,
        peakKm,
        taperWeeks,
        maxBuildMultiple,
      });
      const phaseByWeek = expandPhases(splitPhases(planWeeks, race.format));

      blockIds = await createBlocks(
        ctx,
        plan._id,
        gridStart,
        planStart,
        raceYmd,
        phaseByWeek,
      );

      for (let w = 0; w < planWeeks; w++) {
        const phase = phaseByWeek[w];
        if (!phase) continue;
        const blockId = blockIds[phase];
        if (!blockId) continue;
        const weekKm = volumeCurve[w] ?? 0;
        const weekStart = addDaysYmd(gridStart, w * 7);
        const weekStartDow = isoDayOfWeek(weekStart);

        for (const session of microcycle(phase, weekKm, schedule)) {
          const dayOffset = (session.dayOfWeek - weekStartDow + 7) % 7;
          const dateYmd = addDaysYmd(weekStart, dayOffset);
          await emitTrainingWorkout(ctx, common, blockId, dateYmd, session);
        }
      }
    }

    // Race day: emit the race itself as a workout so it shows up alongside
    // training and can collect `actual` data once completed.
    const raceStructure = buildRaceStructure({
      distanceMeters: race.distanceMeters,
      goalSeconds:
        goal.raceTarget?.type === "time" ? goal.raceTarget.seconds : undefined,
    });
    if (raceStructure) {
      await ctx.runMutation(components.agoge.public.createWorkout, {
        athleteId: plan.athleteId,
        planId: plan._id,
        ...(blockIds.taper ? { blockId: blockIds.taper } : {}),
        name: race.name,
        type: "race",
        sport: "run",
        status: "planned",
        planned: {
          date: ymdToNoonUtc(raceYmd),
          structure: raceStructure,
        },
      });
    }

    await markGenerated(ctx, plan._id, plan.notes, undefined);
  },
});

export const generateFitness = internalAction({
  args: { planId: v.string() },
  handler: async (ctx, { planId }): Promise<void> => {
    const plan = await ctx.runQuery(components.agoge.public.getPlan, { planId });
    if (!plan) return;

    const existingBlocks = await ctx.runQuery(
      components.agoge.public.getBlocksByPlan,
      { planId: plan._id },
    );
    if (existingBlocks.length > 0) return;

    const goal = await ctx.runQuery(components.agoge.public.getGoal, {
      goalId: plan.goalId,
    });
    if (!goal || goal.category !== "fitness" || !goal.fitnessIntent) return;

    const athlete = await ctx.runQuery(components.agoge.public.getAthlete, {
      athleteId: plan.athleteId,
    });
    if (!athlete) return;

    const user = await ctx.runQuery(api.table.users.get, {
      id: athlete.userId as Id<"users">,
    });
    const locale: Locale = user?.locale ?? "en";

    const baselineKm = await loadBaselineVolume(ctx, plan.athleteId);
    const shape = fitnessPlanShape(
      goal.fitnessIntent as FitnessIntent,
      baselineKm,
    );
    const volumeCurve = fitnessVolumeCurve(shape);
    const planStart = plan.startDate;

    // Fitness has no phases — one base block spans the whole plan.
    const blockId = await ctx.runMutation(components.agoge.public.createBlock, {
      planId: plan._id,
      type: "base",
      startDate: planStart,
      endDate: addDaysYmd(planStart, shape.weeks * 7 - 1),
    });
    const schedule = scheduleFromAthlete(athlete);

    for (let w = 0; w < shape.weeks; w++) {
      const weekKm = volumeCurve[w] ?? 0;
      const weekStart = addDaysYmd(planStart, w * 7);
      const weekStartDow = isoDayOfWeek(weekStart);
      for (const session of microcycle("base", weekKm, schedule)) {
        const dayOffset = (session.dayOfWeek - weekStartDow + 7) % 7;
        const dateYmd = addDaysYmd(weekStart, dayOffset);
        const distanceMeters = Math.round(session.distanceKm * 1000);
        if (distanceMeters < 500) continue;
        // No VDOT in fitness plans → buildStructure emits RPE-targeted steps.
        const structure = buildStructure(
          session.type,
          session.intensity,
          distanceMeters,
          undefined,
        );
        if (!structure) continue;
        const labelDistance = summarizeStructure(structure).distanceMeters;
        await ctx.runMutation(components.agoge.public.createWorkout, {
          athleteId: plan.athleteId,
          planId: plan._id,
          blockId,
          name: workoutName({
            type: session.type,
            distanceMeters: labelDistance,
            structure,
            locale,
          }),
          type: session.type,
          sport: "run",
          status: "planned",
          planned: {
            date: ymdToNoonUtc(dateYmd),
            structure,
          },
        });
      }
    }

    await markGenerated(ctx, plan._id, plan.notes, undefined);
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loadBaselineVolume(
  ctx: ActionCtx,
  athleteId: ComponentId,
): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const lookbackStart = addDaysYmd(today, -BASELINE_LOOKBACK_DAYS);
  const completed = await ctx.runQuery(
    components.agoge.public.getCompletedWorkoutsByAthlete,
    {
      athleteId,
      startDate: ymdToNoonUtc(lookbackStart),
      endDate: ymdToNoonUtc(today),
    },
  );
  const totalKm = completed.reduce((acc, w) => {
    const d = w.actual?.distanceMeters ?? 0;
    return acc + d / 1000;
  }, 0);
  if (totalKm <= 0) return FALLBACK_WEEKLY_KM;
  const weeklyKm = totalKm / (BASELINE_LOOKBACK_DAYS / 7);
  return Math.max(5, weeklyKm);
}

async function createBlocks(
  ctx: ActionCtx,
  planId: ComponentId,
  gridStart: string,
  planStart: string,
  raceYmd: string,
  phaseByWeek: BlockType[],
): Promise<Partial<Record<BlockType, ComponentId>>> {
  const blockIds: Partial<Record<BlockType, ComponentId>> = {};
  const order: BlockType[] = ["base", "build", "peak", "taper"];
  const lastWeekIdx = phaseByWeek.length - 1;

  for (const phase of order) {
    const startIdx = phaseByWeek.indexOf(phase);
    if (startIdx === -1) continue;
    let endIdx = startIdx;
    while (
      endIdx + 1 < phaseByWeek.length &&
      phaseByWeek[endIdx + 1] === phase
    ) {
      endIdx++;
    }
    // Weeks count back from race day, so the grid's first week may start
    // before `planStart`; clamp the opening block to the real start date.
    const gridBlockStart = addDaysYmd(gridStart, startIdx * 7);
    const startDate = gridBlockStart < planStart ? planStart : gridBlockStart;
    // The closing block runs through race day (it owns the race workout);
    // every other block ends the day before the next one begins.
    const endDate =
      endIdx === lastWeekIdx
        ? raceYmd
        : addDaysYmd(gridStart, (endIdx + 1) * 7 - 1);
    const blockId = await ctx.runMutation(
      components.agoge.public.createBlock,
      {
        planId,
        type: phase,
        startDate,
        endDate,
      },
    );
    blockIds[phase] = blockId;
  }

  return blockIds;
}

/**
 * Create a 5K plan's blocks on a Mon→Sun grid. Base/build/peak each span full
 * calendar weeks ending on a Sunday; the taper runs from its Monday (clamped to
 * the plan start) through race day, which it owns. The opening block is clamped
 * to the plan start when the grid's first week begins before it.
 */
async function createBlocks5K(
  ctx: ActionCtx,
  planId: ComponentId,
  gridStartYmd: string,
  planStart: string,
  taperStartYmd: string,
  raceYmd: string,
  phaseByWeek: BlockType[],
): Promise<Partial<Record<BlockType, ComponentId>>> {
  const blockIds: Partial<Record<BlockType, ComponentId>> = {};
  const order: BlockType[] = ["base", "build", "peak"];

  for (const phase of order) {
    const startIdx = phaseByWeek.indexOf(phase);
    if (startIdx === -1) continue;
    let endIdx = startIdx;
    while (
      endIdx + 1 < phaseByWeek.length &&
      phaseByWeek[endIdx + 1] === phase
    ) {
      endIdx++;
    }
    const gridBlockStart = addDaysYmd(gridStartYmd, startIdx * 7);
    const startDate = gridBlockStart < planStart ? planStart : gridBlockStart;
    // Each pre-taper block ends on its last week's Sunday.
    const endDate = addDaysYmd(gridStartYmd, (endIdx + 1) * 7 - 1);
    blockIds[phase] = await ctx.runMutation(
      components.agoge.public.createBlock,
      { planId, type: phase, startDate, endDate },
    );
  }

  const taperStart = taperStartYmd < planStart ? planStart : taperStartYmd;
  blockIds.taper = await ctx.runMutation(components.agoge.public.createBlock, {
    planId,
    type: "taper",
    startDate: taperStart,
    endDate: raceYmd,
  });

  return blockIds;
}

async function markGenerated(
  ctx: ActionCtx,
  planId: ComponentId,
  existingNotes: string | undefined,
  flag: string | undefined,
): Promise<void> {
  const dateStamp = new Date().toISOString().slice(0, 10);
  const marker = flag
    ? `generator:${flag}@${dateStamp}`
    : `generator:${GENERATOR_VERSION}@${dateStamp}`;
  const notes = existingNotes ? `${existingNotes}\n${marker}` : marker;
  await ctx.runMutation(components.agoge.public.updatePlan, {
    planId,
    notes,
  });
}


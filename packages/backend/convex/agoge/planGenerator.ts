/**
 * Race-plan generator. Fills a freshly-created Plan with Blocks + planned
 * Workouts using Daniels VDOT + 80/20 polarized periodization.
 *
 * Scope: race-category goals only (finish + time targets). Fitness goals and
 * ultra/relay formats are skipped. Math is in `./periodization.ts`.
 *
 * Idempotent: if Blocks already exist for the plan, the action returns early
 * (handles scheduler retries and accidental double-fires).
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
  buildStructure,
  buildTestStructure,
  computeVdot,
  daysBetweenYmd,
  distancePeakKm,
  isSupportedFormat,
  type Locale,
  microcycle,
  type Paces,
  splitPhases,
  summarizeStructure,
  taperWeeksForFormat,
  trainingPaces,
  weeklyVolumeCurve,
  workoutName,
  ymdToNoonUtc,
} from "./periodization";

const TEST_PLAN_WEEKS_MIN = 4;
const TEST_DISTANCE_METERS = 8000;
const TEST_NAME: Record<Locale, string> = {
  en: "5K time trial",
  fr: "Test 5 km",
};
const TEST_DESCRIPTION: Record<Locale, string> = {
  en: "Run 5 km as fast as you can sustain. Your finish time sets the pace targets for the rest of your plan.",
  fr: "Cours 5 km aussi vite que tu peux le maintenir. Ton temps déterminera les allures cibles du reste du plan.",
};

const GENERATOR_VERSION = "v1";
const BASELINE_LOOKBACK_DAYS = 56;
const FALLBACK_WEEKLY_KM = 20;

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

    const planWeeks = Math.max(1, Math.ceil((totalDays + 1) / 7));
    const planStart = plan.startDate;

    const currentKm = await loadBaselineVolume(ctx, plan.athleteId);
    const peakKm = distancePeakKm(race.format, race.distanceMeters);
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

    const paces: Paces | undefined =
      goal.raceTarget?.type === "time" && goal.raceTarget.seconds > 0
        ? trainingPaces(
            computeVdot(race.distanceMeters, goal.raceTarget.seconds),
          )
        : undefined;

    const blockIds = await createBlocks(ctx, plan._id, planStart, phaseByWeek);

    // Baseline test: no paces (= no time goal, no VDOT) and enough runway
    // for a 5K TT to be useful. Lands on day 1, replaces that day's easy run.
    const needsTest = !paces && planWeeks >= TEST_PLAN_WEEKS_MIN;
    const testYmd = needsTest ? planStart : undefined;

    for (let w = 0; w < planWeeks; w++) {
      const phase = phaseByWeek[w];
      if (!phase) continue;
      const blockId = blockIds[phase];
      if (!blockId) continue;
      const weekKm = volumeCurve[w] ?? 0;
      const weekStart = addDaysYmd(planStart, w * 7);

      for (const session of microcycle(phase, weekKm)) {
        const dateYmd = addDaysYmd(weekStart, session.dayOffset);
        // Race day is reserved for the race workout itself.
        if (dateYmd < planStart || dateYmd >= raceYmd) continue;
        // Test day (if any) is reserved for the baseline test.
        if (testYmd && dateYmd === testYmd) continue;
        const distanceMeters = Math.round(session.distanceKm * 1000);
        if (distanceMeters < 500) continue;
        const structure = buildStructure(
          session.type,
          session.intensity,
          distanceMeters,
          paces,
        );

        // When a structure exists it's the source of truth — derive the
        // top-level summary fields from it so they reflect the mixed-intensity
        // reality (e.g. a peak-phase long run is mostly E-paced, not M-paced).
        let plannedDistance: number;
        let plannedAvgPace: number | undefined;
        let plannedDuration: number | undefined;
        if (structure) {
          const s = summarizeStructure(structure);
          plannedDistance = s.distanceMeters;
          plannedAvgPace = s.avgPaceMps;
          plannedDuration = s.durationSeconds;
        } else {
          plannedDistance = distanceMeters;
          plannedAvgPace = paces ? paces[session.intensity] : undefined;
          plannedDuration = plannedAvgPace
            ? Math.round(plannedDistance / plannedAvgPace)
            : undefined;
        }

        await ctx.runMutation(components.agoge.public.createWorkout, {
          athleteId: plan.athleteId,
          planId: plan._id,
          blockId,
          name: workoutName({
            type: session.type,
            distanceMeters: plannedDistance,
            structure,
            locale,
          }),
          type: session.type,
          sport: "run",
          status: "planned",
          planned: {
            date: ymdToNoonUtc(dateYmd),
            distanceMeters: plannedDistance,
            ...(plannedAvgPace !== undefined ? { avgPaceMps: plannedAvgPace } : {}),
            ...(plannedDuration !== undefined ? { durationSeconds: plannedDuration } : {}),
            ...(structure ? { structure } : {}),
          },
        });
      }
    }

    // Baseline test workout (when needed): attached to the first block in
    // phase order, sitting on day 1 of the plan.
    if (testYmd) {
      const testBlockId =
        blockIds.base ?? blockIds.build ?? blockIds.peak ?? blockIds.taper;
      if (testBlockId) {
        await ctx.runMutation(components.agoge.public.createWorkout, {
          athleteId: plan.athleteId,
          planId: plan._id,
          blockId: testBlockId,
          name: TEST_NAME[locale],
          description: TEST_DESCRIPTION[locale],
          type: "test",
          sport: "run",
          status: "planned",
          planned: {
            date: ymdToNoonUtc(testYmd),
            distanceMeters: TEST_DISTANCE_METERS,
            structure: buildTestStructure(),
          },
        });
      }
    }

    // Race day: emit the race itself as a workout so it shows up alongside
    // training and can collect `actual` data once completed.
    const raceGoalSeconds =
      goal.raceTarget?.type === "time" && goal.raceTarget.seconds > 0
        ? goal.raceTarget.seconds
        : undefined;
    const racePaceMps = raceGoalSeconds
      ? race.distanceMeters / raceGoalSeconds
      : undefined;
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
        distanceMeters: race.distanceMeters,
        ...(racePaceMps !== undefined ? { avgPaceMps: racePaceMps } : {}),
        ...(raceGoalSeconds !== undefined ? { durationSeconds: raceGoalSeconds } : {}),
      },
    });

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
    const d = w.actual?.distanceMeters ?? w.planned?.distanceMeters ?? 0;
    return acc + d / 1000;
  }, 0);
  if (totalKm <= 0) return FALLBACK_WEEKLY_KM;
  const weeklyKm = totalKm / (BASELINE_LOOKBACK_DAYS / 7);
  return Math.max(5, weeklyKm);
}

async function createBlocks(
  ctx: ActionCtx,
  planId: ComponentId,
  planStart: string,
  phaseByWeek: BlockType[],
): Promise<Partial<Record<BlockType, ComponentId>>> {
  const blockIds: Partial<Record<BlockType, ComponentId>> = {};
  const order: BlockType[] = ["base", "build", "peak", "taper"];

  for (const phase of order) {
    const startIdx = phaseByWeek.indexOf(phase);
    if (startIdx === -1) continue;
    let endIdx = startIdx;
    while (endIdx + 1 < phaseByWeek.length && phaseByWeek[endIdx + 1] === phase) {
      endIdx++;
    }
    const startDate = addDaysYmd(planStart, startIdx * 7);
    const endDate = addDaysYmd(planStart, (endIdx + 1) * 7 - 1);
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

function expandPhases(phases: {
  base: number;
  build: number;
  peak: number;
  taper: number;
}): BlockType[] {
  const out: BlockType[] = [];
  for (let i = 0; i < phases.base; i++) out.push("base");
  for (let i = 0; i < phases.build; i++) out.push("build");
  for (let i = 0; i < phases.peak; i++) out.push("peak");
  for (let i = 0; i < phases.taper; i++) out.push("taper");
  return out;
}


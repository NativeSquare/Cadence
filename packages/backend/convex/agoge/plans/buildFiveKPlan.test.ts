/**
 * Equivalence tests for `buildFiveKPlan`.
 *
 * `buildFiveKPlan` was extracted from the inline 5K orchestration that used to
 * live in `engine/generatePlan.ts` → `generate`. Production now calls it and
 * persists the result, so the old code path no longer exists to diff against at
 * runtime. Instead, this file rebuilds an INDEPENDENT oracle — it replays the
 * exact former orchestration (same primitives: `fiveKGrid` / `microcycle5K` /
 * `taperSessions5K`, same emit guards, same naming) — and asserts the persisted
 * (non-dropped) workout set produced by `buildFiveKPlan` is identical. If anyone
 * later edits `buildFiveKPlan` and breaks the mirror, these tests fail.
 *
 * No Convex deps — runs under vitest.
 */

import { describe, expect, it } from "vitest";

import type { BlockType } from "@nativesquare/agoge/schema";
import {
  addDaysYmd,
  buildStructure,
  computeVdot,
  distancePeakKm,
  isoDayOfWeek,
  type Locale,
  type Paces,
  type Schedule,
  type SessionSpec,
  summarizeStructure,
  trainingPaces,
  weeklyVolumeCurve,
  workoutName,
} from "../periodization";
import { fiveKGrid, microcycle5K, taperSessions5K } from "./fiveK";
import {
  type BuildFiveKPlanInputs,
  buildFiveKPlan,
} from "./buildFiveKPlan";

const TAPER_VOLUME_FACTOR = 0.6;
const DEFAULT_5K_DISTANCE_M = 5000;

// --- Independent oracle: a verbatim replay of the FORMER generate 5K loop -----

type EmittedWorkout = {
  dateYmd: string;
  type: SessionSpec["type"];
  name: string;
  structure: unknown;
};

/** Inlined copy of the (now-relocated) phase-count helpers — kept here so the
 * oracle is a fully independent reimplementation, not a re-import of the code
 * under test. */
function oracleSplit(preTaperWeeks: number) {
  if (preTaperWeeks <= 0) return { base: 0, build: 0, peak: 0 };
  if (preTaperWeeks === 1) return { base: 0, build: 0, peak: 1 };
  const peak = 1;
  const build = Math.min(4, preTaperWeeks - peak);
  return { base: preTaperWeeks - peak - build, build, peak };
}
function oracleExpand(p: {
  base: number;
  build: number;
  peak: number;
}): BlockType[] {
  const out: BlockType[] = [];
  for (let i = 0; i < p.base; i++) out.push("base");
  for (let i = 0; i < p.build; i++) out.push("build");
  for (let i = 0; i < p.peak; i++) out.push("peak");
  return out;
}

function resolve(inputs: BuildFiveKPlanInputs): {
  vdot?: number;
  paces?: Paces;
} {
  if (inputs.paces) return { vdot: inputs.vdot, paces: inputs.paces };
  const vdot =
    inputs.vdot ??
    (inputs.targetTimeSeconds && inputs.targetTimeSeconds > 0
      ? computeVdot(
          inputs.raceDistanceMeters ?? DEFAULT_5K_DISTANCE_M,
          inputs.targetTimeSeconds,
        )
      : undefined);
  return { vdot, paces: vdot !== undefined ? trainingPaces(vdot) : undefined };
}

/** Mirror of the former `emitTrainingWorkout` guards + naming. */
function emit(
  out: EmittedWorkout[],
  common: {
    planStart: string;
    raceYmd: string;
    paces?: Paces;
    locale: Locale;
  },
  dateYmd: string,
  spec: SessionSpec,
): void {
  if (dateYmd < common.planStart || dateYmd >= common.raceYmd) return;
  const distanceMeters = Math.round(spec.distanceKm * 1000);
  if (distanceMeters < 500 && !spec.structureSpec) return;
  const structure = buildStructure(
    spec.type,
    spec.intensity,
    distanceMeters,
    common.paces,
    spec.structureSpec,
  );
  if (!structure) return;
  const labelDistance = summarizeStructure(structure).distanceMeters;
  out.push({
    dateYmd,
    type: spec.type,
    name: workoutName({
      type: spec.type,
      distanceMeters: labelDistance,
      structure,
      locale: common.locale,
    }),
    structure,
  });
}

function oracle(inputs: BuildFiveKPlanInputs): EmittedWorkout[] {
  const { planStartYmd: planStart, raceYmd, currentKm, schedule, locale } =
    inputs;
  const raceDist = inputs.raceDistanceMeters ?? DEFAULT_5K_DISTANCE_M;
  const { vdot, paces } = resolve(inputs);
  const peakKm = inputs.peakKm ?? distancePeakKm("5k", raceDist);
  const common = { planStart, raceYmd, paces, locale };

  const { gridStartYmd, taperStartYmd, preTaperWeeks } = fiveKGrid(
    planStart,
    raceYmd,
  );
  const phaseByWeek = oracleExpand(oracleSplit(preTaperWeeks));
  const maxBuildMultiple = preTaperWeeks + 1 < 6 ? 1.2 : 2.5;
  const volumeCurve = weeklyVolumeCurve({
    weeks: preTaperWeeks,
    currentKm,
    peakKm,
    taperWeeks: 0,
    maxBuildMultiple,
  });
  const planPeakKm = Math.max(currentKm, ...volumeCurve);

  const out: EmittedWorkout[] = [];
  let weekIndexInPhase = 0;
  let prevPhase: BlockType | undefined;
  for (let w = 0; w < preTaperWeeks; w++) {
    const phase = phaseByWeek[w];
    if (!phase) continue;
    const weekKm = volumeCurve[w] ?? 0;
    const weekStart = addDaysYmd(gridStartYmd, w * 7);
    if (phase === prevPhase) weekIndexInPhase += 1;
    else {
      weekIndexInPhase = 0;
      prevPhase = phase;
    }
    const sessions = microcycle5K({
      phase,
      weekIndexInPhase,
      weekKm,
      schedule,
      peakKm: planPeakKm,
      paces,
      vdot,
      raceDow: isoDayOfWeek(raceYmd),
      planProgress: preTaperWeeks <= 1 ? 1 : w / (preTaperWeeks - 1),
    });
    for (const session of sessions) {
      emit(out, common, addDaysYmd(weekStart, session.dayOfWeek), session);
    }
  }

  const taperList = taperSessions5K({
    taperStartYmd,
    raceYmd,
    weekKm: planPeakKm * TAPER_VOLUME_FACTOR,
    peakKm: planPeakKm,
    schedule,
    paces,
    vdot,
  });
  for (const { spec, dateYmd } of taperList) emit(out, common, dateYmd, spec);

  return out;
}

// --- Scenarios ----------------------------------------------------------------

const SCHEDULE_4: Schedule = { availableDays: [1, 3, 5, 6], sessionsPerWeek: 4 };
const SCHEDULE_5: Schedule = {
  availableDays: [0, 1, 3, 5, 6],
  sessionsPerWeek: 5,
};

const SCENARIOS: Array<{ name: string; inputs: BuildFiveKPlanInputs }> = [
  {
    name: "12-week plan, Sunday race",
    inputs: {
      planStartYmd: "2026-06-01",
      raceYmd: "2026-08-30", // Sunday
      currentKm: 30,
      schedule: SCHEDULE_5,
      locale: "fr",
      targetTimeSeconds: 21 * 60,
    },
  },
  {
    name: "Thursday race (short 4-day taper)",
    inputs: {
      planStartYmd: "2026-06-01",
      raceYmd: "2026-09-03", // Thursday
      currentKm: 25,
      schedule: SCHEDULE_4,
      locale: "en",
      targetTimeSeconds: 23 * 60,
    },
  },
  {
    name: "compressed sub-6-week plan, mid-week start",
    inputs: {
      planStartYmd: "2026-06-04", // Thursday → partial first week
      raceYmd: "2026-07-05", // Sunday, ~4.5 weeks out
      currentKm: 20,
      schedule: SCHEDULE_4,
      locale: "fr",
      vdot: computeVdot(5000, 24 * 60),
    },
  },
];

describe("buildFiveKPlan — equivalence with the former generate orchestration", () => {
  for (const { name, inputs } of SCENARIOS) {
    it(`persisted workouts match the oracle: ${name}`, () => {
      const trace = buildFiveKPlan(inputs);
      const persisted: EmittedWorkout[] = [
        ...trace.weeks.flatMap((wk) => wk.sessions),
        ...trace.taper.sessions,
      ]
        .filter((s) => !s.dropped && s.structure)
        .map((s) => ({
          dateYmd: s.dateYmd,
          type: s.spec.type,
          name: s.workoutName ?? "",
          structure: s.structure,
        }));

      expect(persisted).toEqual(oracle(inputs));
    });
  }
});

describe("buildFiveKPlan — trace integrity", () => {
  it("every dropped session carries a reason, every kept one a structure", () => {
    const trace = buildFiveKPlan(SCENARIOS[2]!.inputs); // mid-week start → drops
    const all = [
      ...trace.weeks.flatMap((wk) => wk.sessions),
      ...trace.taper.sessions,
    ];
    for (const s of all) {
      if (s.dropped) {
        expect(s.dropReason).toBeDefined();
        expect(s.structure).toBeUndefined();
      } else {
        expect(s.dropReason).toBeUndefined();
        expect(s.structure).toBeDefined();
        expect(s.workoutName).toBeTruthy();
      }
    }
  });

  it("a mid-week plan start drops the partial week's pre-start sessions", () => {
    // 2026-06-04 is a Thursday; sessions on Mon–Wed of that grid week fall before
    // the plan start and must be flagged, not silently missing.
    const trace = buildFiveKPlan(SCENARIOS[2]!.inputs);
    const dropped = trace.weeks
      .flatMap((wk) => wk.sessions)
      .filter((s) => s.dropReason === "before-plan-start");
    expect(dropped.length).toBeGreaterThan(0);
    expect(dropped.every((s) => s.dateYmd < "2026-06-04")).toBe(true);
  });

  it("block layout matches createBlocks5K's date math (clamped to plan start)", () => {
    const trace = buildFiveKPlan(SCENARIOS[0]!.inputs);
    // Pre-taper blocks end on a Sunday; taper ends on race day.
    const taper = trace.blocks.find((b) => b.type === "taper");
    expect(taper?.endYmd).toBe("2026-08-30");
    for (const b of trace.blocks) {
      expect(b.startYmd >= trace.inputs.planStartYmd).toBe(true);
    }
  });
});

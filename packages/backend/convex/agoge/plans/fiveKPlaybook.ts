/**
 * The 5K **playbook**: every *coaching decision* in the 5K plan generator, lifted
 * out of `fiveK.ts` into one readable, typed data object. This is the "Tier A"
 * layer — what a (non-developer) running coach would want to read and, later,
 * tune: which sessions a week contains at each weekly frequency, the rep counts /
 * recoveries / distances of each session, and the taper composition rules.
 *
 * The *engine* (`fiveK.ts`) stays code: it READS this object and applies the
 * structural algorithms a coach should not have to touch (recovery spacing,
 * date math, pace scaling — "Tier C"). Separating the two means:
 *   - the coaching logic lives in one place a coach can review;
 *   - 10K / Half / Marathon become sibling playbooks over the same engine;
 *   - the values can eventually be made editable without an engine rewrite.
 *
 * ⚠️ NO convex runtime imports. Like `buildFiveKPlan.ts`, this file is pure data
 * and is bundled into the admin browser (the read-only Playbook view imports
 * `FIVE_K_PLAYBOOK` directly). Keep it Convex-free.
 *
 * Every value here is transcribed verbatim from the former hardcoded constants
 * and switch statements in `fiveK.ts` — this object changes *where* the data
 * lives, never *what* it is. The plans it produces are byte-identical.
 */

// ---------------------------------------------------------------------------
// Role templates — the serializable, coach-readable mirror of the engine's
// internal `Role5K`. A composition is a list of these.
// ---------------------------------------------------------------------------

/**
 * Whether an easy run carries strides ("lignes droites"):
 * - "always"    → strides every week
 * - "never"     → never
 * - "alt-weeks" → every other week (the former `altStrides = week % 2 === 0`)
 */
export type StridesRule = "always" | "never" | "alt-weeks";

export type RoleTemplate =
  | { kind: "easy"; strides: StridesRule }
  | { kind: "sv1_long" }
  | { kind: "sv2" }
  | { kind: "vma_short" }
  | { kind: "vma_long" }
  | { kind: "mixed" }
  | { kind: "race_pace_5k" }
  /**
   * Late-build's alternating quality slot. The engine resolves it per week to
   * VMA longue (even late-week) ↔ Mixte (odd), using `inLate = max(0, week-2)`.
   * Encoded as a sentinel because the choice depends on the week index, which a
   * static table can't carry.
   */
  | { kind: "build_late_alt" };

/**
 * A phase's session composition. Slots 1–5 are explicit; `overflow` reproduces
 * the former `default:` (6+) branches: `lead` templates, then `slots − padBase`
 * plain easies, then `trail` templates — order preserved element-for-element.
 */
export type Composition = {
  bySlots: { [slots: number]: RoleTemplate[] };
  overflow: {
    /** Plain-easy count at N slots is `slots − padBase`. */
    padBase: number;
    /** Templates emitted BEFORE the plain-easy padding. */
    lead: RoleTemplate[];
    /** Templates emitted AFTER the plain-easy padding. */
    trail: RoleTemplate[];
  };
};

export type FiveKCompositions = {
  base: Composition;
  /** Build, weekIndexInPhase < 2 (construction-début). */
  buildEarly: Composition;
  /** Build, weekIndexInPhase >= 2 (construction-fin); uses `build_late_alt`. */
  buildLate: Composition;
  /** Peak (spécifique). */
  peak: Composition;
};

// ---------------------------------------------------------------------------
// Session banks — one difficulty-ordered bag of workouts per quality session
// type. The engine (`fiveK.ts`) draws ONE entry per week via `selectBankIndex`
// (athlete level slides a window into the bank; plan progress walks upward
// within it), replacing the former single fixed spec + volume-conditional rep
// bump. Each bank is ordered easiest → hardest (the coach's given order, with
// non-uniform pyramids/ladders/mixed-distance sets removed and count-ranges
// baked to a single value). Per-entry recoveries are time-based @ E pace.
// ---------------------------------------------------------------------------

/** One workout in a session bank. Uniform-rep shapes only (for now). */
export type BankEntry =
  // Time-based interval blocks. SV1 long (@ SV1) and SV2 (@ T).
  | { kind: "time"; reps: number; workSec: number; recoverySec: number }
  // Distance-based intervals @ I (VMA courte / longue).
  | { kind: "dist"; reps: number; repDistanceM: number; recoverySec: number }
  // Distance intervals run at the explicit 5K race pace (allure spé, rappel).
  | { kind: "paced"; reps: number; repDistanceM: number; recoverySec: number }
  // Mixte: a time block @ T (SV2) → bridge → a distance block @ I (VMA courte).
  | {
      kind: "mixte";
      first: { reps: number; workSec: number; recoverySec: number };
      bridgeSec: number;
      second: { reps: number; repDistanceM: number; recoverySec: number };
    };

/** Difficulty-ordered banks, one per quality session type. */
export type FiveKBanks = {
  sv1Long: BankEntry[];
  sv2: BankEntry[];
  vmaShort: BankEntry[];
  vmaLong: BankEntry[];
  mixed: BankEntry[];
  racePace: BankEntry[];
  /** Taper "rappel d'allure" tune-up. */
  rappel: BankEntry[];
};

export type FiveKConstants = {
  durationsSec: {
    easyMin: number;
    easyMax: number;
    /** Race-eve shakeout — short and fixed. */
    shakeout: number;
    warmupMin: number;
    warmupMax: number;
    cooldownMin: number;
    cooldownMax: number;
  };
};

// ---------------------------------------------------------------------------
// Taper composition rules.
// ---------------------------------------------------------------------------

export type FiveKTaperRules = {
  /** Race-eve shakeout only for athletes training ≥ this many days/week. */
  shakeoutMinSessionsPerWeek: number;
  /** Tune-up lands on a scheduled day this many days before the race. */
  tuneUpWindowDaysBeforeRace: { lo: number; hi: number };
  /** Race-week training budget = `sessionsPerWeek − raceWeekBudgetOffset`. */
  raceWeekBudgetOffset: number;
  /**
   * Taper length in days from the race's ISO day-of-week (0=Mon…6=Sun):
   * `raceDow <= earlyWeekCutoffDow ? raceDow + earlyAddend : raceDow + lateAddend`.
   */
  taperDays: {
    earlyWeekCutoffDow: number;
    earlyAddend: number;
    lateAddend: number;
  };
};

export type FiveKPlaybook = {
  compositions: FiveKCompositions;
  constants: FiveKConstants;
  /** Difficulty-ordered workout banks, drawn from per week by the engine. */
  banks: FiveKBanks;
  taper: FiveKTaperRules;
};

// ---------------------------------------------------------------------------
// The populated playbook.
// ---------------------------------------------------------------------------

/** minutes → seconds; erases at runtime, keeps the literal readable. */
const min = (m: number): number => m * 60;

const easy = (strides: StridesRule): RoleTemplate => ({ kind: "easy", strides });

// Bank-entry builders — keep the difficulty lists below readable (reps × work,
// recovery in seconds @ E). They erase to plain object literals at build.
const time = (reps: number, workSec: number, recoverySec: number): BankEntry => ({
  kind: "time",
  reps,
  workSec,
  recoverySec,
});
const dist = (
  reps: number,
  repDistanceM: number,
  recoverySec: number,
): BankEntry => ({ kind: "dist", reps, repDistanceM, recoverySec });
const paced = (
  reps: number,
  repDistanceM: number,
  recoverySec: number,
): BankEntry => ({ kind: "paced", reps, repDistanceM, recoverySec });
const mixte = (
  first: { reps: number; workSec: number; recoverySec: number },
  bridgeSec: number,
  second: { reps: number; repDistanceM: number; recoverySec: number },
): BankEntry => ({ kind: "mixte", first, bridgeSec, second });

export const FIVE_K_PLAYBOOK: FiveKPlaybook = {
  compositions: {
    // Base: EF (+strides) + VMA courte every week + SV1 long. No long at 2/week.
    base: {
      bySlots: {
        1: [{ kind: "sv1_long" }],
        2: [easy("always"), { kind: "vma_short" }],
        3: [easy("alt-weeks"), { kind: "vma_short" }, { kind: "sv1_long" }],
        4: [easy("never"), easy("always"), { kind: "vma_short" }, { kind: "sv1_long" }],
        5: [
          easy("always"),
          easy("never"),
          easy("never"),
          { kind: "vma_short" },
          { kind: "sv1_long" },
        ],
      },
      // 6+: two strides-easies, the rest plain, + VMA + SV1 long.
      overflow: {
        padBase: 4,
        lead: [easy("always"), easy("always")],
        trail: [{ kind: "vma_short" }, { kind: "sv1_long" }],
      },
    },

    // Construction-début (build weeks 0–1): introduces SV2 alongside VMA short.
    buildEarly: {
      bySlots: {
        1: [{ kind: "sv1_long" }],
        2: [easy("always"), { kind: "sv2" }],
        3: [easy("alt-weeks"), { kind: "vma_short" }, { kind: "sv1_long" }],
        4: [easy("never"), easy("always"), { kind: "vma_short" }, { kind: "sv2" }],
        5: [
          easy("always"),
          easy("never"),
          { kind: "sv2" },
          { kind: "vma_short" },
          { kind: "sv1_long" },
        ],
      },
      // 6+: VMA + SV2 + SV1 long, one strides-easy, the rest plain.
      overflow: {
        padBase: 4,
        lead: [easy("always")],
        trail: [{ kind: "vma_short" }, { kind: "sv2" }, { kind: "sv1_long" }],
      },
    },

    // Construction-fin (build week ≥ 2): EF + SV2 + SV1 long, with one
    // alternating quality slot — VMA longue ↔ Mixte (resolved per week).
    buildLate: {
      bySlots: {
        1: [{ kind: "sv1_long" }],
        2: [easy("always"), { kind: "build_late_alt" }],
        3: [easy("alt-weeks"), { kind: "build_late_alt" }, { kind: "sv1_long" }],
        4: [easy("never"), easy("always"), { kind: "build_late_alt" }, { kind: "sv2" }],
        5: [
          easy("always"),
          easy("never"),
          { kind: "build_late_alt" },
          { kind: "sv2" },
          { kind: "sv1_long" },
        ],
      },
      overflow: {
        padBase: 4,
        lead: [easy("always")],
        trail: [{ kind: "build_late_alt" }, { kind: "sv2" }, { kind: "sv1_long" }],
      },
    },

    // Spécifique (peak): easy runs + 5K race-pace spé only. No SV2, no SV1 long.
    peak: {
      bySlots: {
        1: [{ kind: "race_pace_5k" }],
        2: [easy("always"), { kind: "race_pace_5k" }],
        3: [easy("always"), { kind: "race_pace_5k" }, easy("never")],
        4: [easy("never"), easy("always"), easy("always"), { kind: "race_pace_5k" }],
      },
      // 5+: 1 strides-easy, (slots − 3) plain easies, 2 race-pace spé.
      overflow: {
        padBase: 3,
        lead: [easy("always")],
        trail: [{ kind: "race_pace_5k" }, { kind: "race_pace_5k" }],
      },
    },
  },

  constants: {
    durationsSec: {
      easyMin: min(30),
      easyMax: min(50),
      shakeout: min(20),
      warmupMin: min(15),
      warmupMax: min(20),
      cooldownMin: min(5),
      cooldownMax: min(10),
    },
  },

  // Difficulty-ordered workout banks (easiest → hardest), transcribed from the
  // coach's templates. Non-uniform entries (pyramids, ladders, mixed-distance
  // sets) are dropped for now; count-ranges are baked to a single value. The
  // engine draws one entry per week (see `selectBankIndex` in fiveK.ts).
  banks: {
    // SV1 long run — time blocks @ SV1 (aerobic threshold). Dropped: 12/10/8/6.
    sv1Long: [
      time(3, min(6), 90),
      time(3, min(7), 120),
      time(4, min(6), 90),
      time(5, min(5), 90),
      time(4, min(7), 120),
      time(6, min(5), 90),
      time(3, min(10), 150),
      time(4, min(8), 120),
      time(2, min(15), 150),
      time(5, min(7), 120),
      time(2, min(20), 150),
    ],
    // SV2 threshold — time blocks @ T. Dropped: 3/5/8/5/3, 10/8/6, 12/10/8.
    sv2: [
      time(5, min(3), 90),
      time(4, min(4), 120),
      time(3, min(5), 120),
      time(5, min(4), 120),
      time(4, min(5), 120),
      time(3, min(6), 150),
      time(3, min(7), 150),
      time(4, min(6), 150),
      time(3, min(8), 180),
      time(2, min(12), 180),
      time(5, min(6), 150),
      time(4, min(8), 180),
      time(3, min(10), 180),
      time(6, min(6), 150),
      time(3, min(12), 180),
    ],
    // VMA courte — short distance reps @ I. Ranges baked (coach examples).
    // Dropped: mixed-distance sets and the 4×1min + 6×30s entry.
    vmaShort: [
      dist(12, 200, 60),
      dist(11, 300, 60),
      dist(9, 400, 75),
    ],
    // VMA longue — long distance reps @ I. Dropped: all pyramids, 3×600+3×800.
    vmaLong: [
      dist(5, 600, 105),
      dist(5, 800, 135),
      dist(6, 600, 105),
      dist(6, 800, 135),
      dist(7, 600, 105),
      dist(7, 800, 150),
      dist(8, 600, 105),
      dist(8, 800, 150),
    ],
    // Mixte — SV2 time block @ T → bridge → VMA-courte distance block @ I.
    // Second-block counts baked. Dropped: 2×6min + (3–4×400 + 3–4×300).
    mixed: [
      mixte({ reps: 1, workSec: min(10), recoverySec: 0 }, 180, { reps: 6, repDistanceM: 300, recoverySec: 60 }),
      mixte({ reps: 1, workSec: min(8), recoverySec: 0 }, 180, { reps: 5, repDistanceM: 400, recoverySec: 75 }),
      mixte({ reps: 1, workSec: min(12), recoverySec: 0 }, 180, { reps: 8, repDistanceM: 300, recoverySec: 60 }),
      mixte({ reps: 2, workSec: min(6), recoverySec: 120 }, 180, { reps: 5, repDistanceM: 400, recoverySec: 75 }),
      mixte({ reps: 3, workSec: min(5), recoverySec: 120 }, 240, { reps: 8, repDistanceM: 300, recoverySec: 60 }),
      mixte({ reps: 2, workSec: min(5), recoverySec: 120 }, 180, { reps: 6, repDistanceM: 400, recoverySec: 75 }),
      mixte({ reps: 2, workSec: min(8), recoverySec: 150 }, 180, { reps: 6, repDistanceM: 300, recoverySec: 60 }),
      mixte({ reps: 2, workSec: min(10), recoverySec: 240 }, 240, { reps: 6, repDistanceM: 400, recoverySec: 75 }),
      mixte({ reps: 1, workSec: min(15), recoverySec: 0 }, 180, { reps: 8, repDistanceM: 300, recoverySec: 60 }),
    ],
    // Allure spé — distance reps @ 5K race pace. Range baked (6–8×800 → 7).
    // Dropped: 1500/1200/1000/800, 3×(1000+500), 4×800+4×400.
    racePace: [
      paced(7, 800, 105),
      paced(5, 1000, 120),
      paced(8, 600, 75),
    ],
    // Rappel d'allure (taper tune-up) — distance reps @ 5K race pace.
    // Dropped: 4×500+2×400, 1000+800+600, 2×800+2×400, 3×600+2×400.
    rappel: [
      paced(4, 600, 105),
      paced(3, 800, 120),
      paced(5, 500, 90),
      paced(4, 700, 105),
    ],
  },

  taper: {
    shakeoutMinSessionsPerWeek: 4,
    tuneUpWindowDaysBeforeRace: { lo: 4, hi: 5 },
    raceWeekBudgetOffset: 1,
    taperDays: { earlyWeekCutoffDow: 2, earlyAddend: 8, lateAddend: 1 },
  },
};

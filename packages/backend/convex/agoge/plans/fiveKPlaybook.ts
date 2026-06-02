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
// Numeric session constants (former top-of-file consts + inline rep counts).
// ---------------------------------------------------------------------------

/** Volume-conditional rep count: `weekKm >= hiThreshold * peakKm ? hi : lo`. */
export type RepCount = { hi: number; lo: number; hiThreshold: number };

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
  /** Time-based recoveries between reps within a block (@ E pace). */
  recoveriesSec: {
    sv2: number;
    vmaLong: number;
    vmaShort: number;
    racePace: number;
    /** Between the SV2 block and the VMA-short block in a Mixte session. */
    mixedBridge: number;
  };
  /** Long run with SV1-pace blocks: `reps × (workSec @ SV1 + recoverySec @ E)`. */
  sv1Block: { workSec: number; recoverySec: number; reps: number };
  repDistancesM: {
    vmaShort: number;
    vmaLong: number;
    racePace: number;
    sv2: number;
  };
  reps: {
    sv2: RepCount;
    vmaShort: RepCount;
    vmaLong: RepCount;
    /** Fixed. */
    racePace: number;
    /** Fixed (taper tune-up). */
    taperTuneUp: number;
  };
  /** Mixte: `first` block (@ T) → bridge → `second` block (@ I). */
  mixed: {
    first: { reps: number; repDistanceM: number };
    second: { reps: number; repDistanceM: number };
  };
  /** Taper tune-up "rappel d'allure": reps @ 5K pace (count lives in `reps`). */
  taperTuneUp: { repDistanceM: number };
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
  taper: FiveKTaperRules;
};

// ---------------------------------------------------------------------------
// The populated playbook.
// ---------------------------------------------------------------------------

/** minutes → seconds; erases at runtime, keeps the literal readable. */
const min = (m: number): number => m * 60;

const easy = (strides: StridesRule): RoleTemplate => ({ kind: "easy", strides });

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
    recoveriesSec: {
      sv2: 120, // 2 min @ E
      vmaLong: 90, // 1 min 30 @ E
      vmaShort: 60, // 1 min @ E
      racePace: 90, // 1 min 30 @ E
      mixedBridge: 180, // 3 min between SV2 block and VMA short block
    },
    sv1Block: { workSec: min(8), recoverySec: min(3), reps: 3 },
    repDistancesM: { vmaShort: 300, vmaLong: 800, racePace: 800, sv2: 1200 },
    reps: {
      sv2: { hi: 5, lo: 4, hiThreshold: 0.7 },
      vmaShort: { hi: 12, lo: 8, hiThreshold: 0.7 },
      vmaLong: { hi: 6, lo: 5, hiThreshold: 0.7 },
      racePace: 7,
      taperTuneUp: 3,
    },
    mixed: {
      first: { reps: 3, repDistanceM: 1000 },
      second: { reps: 4, repDistanceM: 400 },
    },
    taperTuneUp: { repDistanceM: 400 },
  },

  taper: {
    shakeoutMinSessionsPerWeek: 4,
    tuneUpWindowDaysBeforeRace: { lo: 4, hi: 5 },
    raceWeekBudgetOffset: 1,
    taperDays: { earlyWeekCutoffDow: 2, earlyAddend: 8, lateAddend: 1 },
  },
};

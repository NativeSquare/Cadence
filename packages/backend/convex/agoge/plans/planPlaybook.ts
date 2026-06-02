/**
 * The **playbook** types — the distance-agnostic, coach-readable description of a
 * race plan's coaching decisions: which sessions a week contains at each weekly
 * frequency, the rep counts / recoveries / distances of each session, and the
 * taper composition rules. `FIVE_K_PLAYBOOK` (5K) and `TEN_K_PLAYBOOK` (10K) are
 * sibling instances of `Playbook`; the engine (`planEngine.ts`) READS a playbook
 * and applies the structural algorithms a coach should not have to touch
 * (recovery spacing, date math, pace scaling).
 *
 * This file was lifted out of `fiveKPlaybook.ts` so 10K / Half / Marathon can be
 * sibling playbooks over the same types and engine.
 *
 * ⚠️ NO convex runtime imports. Like `buildPlan.ts`, this file is pure data/types
 * and is bundled into the admin browser (the read-only Playbook view imports a
 * concrete playbook directly). Keep it Convex-free.
 */

// ---------------------------------------------------------------------------
// Role templates — the serializable, coach-readable mirror of the engine's
// internal `PlanRole`. A composition is a list of these.
// ---------------------------------------------------------------------------

/**
 * Whether an easy run carries strides ("lignes droites"):
 * - "always"    → strides every week
 * - "never"     → never
 * - "alt-weeks" → every other week (the former `altStrides = week % 2 === 0`)
 */
export type StridesRule = "always" | "never" | "alt-weeks";

/**
 * Which race-pace bank a `race_pace` role draws from:
 * - "moderate" → sub-threshold race-pace work (10K "fin construction", reps ≤ 1.5km)
 * - "big"      → the peak race-specific session (5K spécifique, 10K "pics")
 */
export type RacePaceBankId = "moderate" | "big";

export type RoleTemplate =
  | { kind: "easy"; strides: StridesRule }
  | { kind: "sv1_long" }
  | { kind: "sv2" }
  | { kind: "vma_short" }
  | { kind: "vma_long" }
  | { kind: "mixed" }
  | { kind: "race_pace"; bank: RacePaceBankId }
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

export type Compositions = {
  base: Composition;
  /** Build, weekIndexInPhase < 2 (construction-début). */
  buildEarly: Composition;
  /** Build, weekIndexInPhase >= 2 (construction-fin); may use `build_late_alt`. */
  buildLate: Composition;
  /** Peak (spécifique / pics). */
  peak: Composition;
};

// ---------------------------------------------------------------------------
// Session banks — one difficulty-ordered bag of workouts per quality session
// type. The engine (`planEngine.ts`) draws ONE entry per week via
// `selectBankIndex` (athlete level slides a window into the bank; plan progress
// walks upward within it). Each bank is ordered easiest → hardest. Per-entry
// recoveries are time-based @ E pace.
// ---------------------------------------------------------------------------

/** One workout in a session bank. Uniform-rep shapes only. */
export type BankEntry =
  // Time-based interval blocks. SV1 long (@ SV1) and SV2 (@ T).
  | { kind: "time"; reps: number; workSec: number; recoverySec: number }
  // Distance-based intervals @ I (VMA courte / longue).
  | { kind: "dist"; reps: number; repDistanceM: number; recoverySec: number }
  // Distance intervals run at the explicit race pace (allure spé, rappel).
  | { kind: "paced"; reps: number; repDistanceM: number; recoverySec: number }
  // Mixte: a time block @ T (SV2) → bridge → a distance block @ I (VMA courte).
  | {
      kind: "mixte";
      first: { reps: number; workSec: number; recoverySec: number };
      bridgeSec: number;
      second: { reps: number; repDistanceM: number; recoverySec: number };
    };

/** Difficulty-ordered banks, one per quality session type. */
export type Banks = {
  sv1Long: BankEntry[];
  sv2: BankEntry[];
  vmaShort: BankEntry[];
  vmaLong: BankEntry[];
  mixed: BankEntry[];
  /**
   * Race-pace work, keyed by bank id. "big" is the peak race-specific session
   * (every distance uses it); "moderate" is sub-threshold race-pace work used by
   * 10K's "fin construction" (5K leaves it empty — it never draws moderate).
   */
  racePace: Record<RacePaceBankId, BankEntry[]>;
  /** Taper "rappel d'allure" tune-up. */
  rappel: BankEntry[];
};

export type PlanConstants = {
  durationsSec: {
    easyMin: number;
    easyMax: number;
    /** Race-eve shakeout — short and fixed. */
    shakeout: number;
    warmupMin: number;
    warmupMax: number;
    /**
     * Optional longer warmup band for the weekend long run (SV1 long), used to
     * add volume there without lengthening every easy day. When omitted, the
     * long run uses the default warmup band like every other session.
     */
    longRunWarmupMin?: number;
    longRunWarmupMax?: number;
    cooldownMin: number;
    cooldownMax: number;
  };
};

// ---------------------------------------------------------------------------
// Taper composition rules.
// ---------------------------------------------------------------------------

export type TaperRules = {
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

export type Playbook = {
  compositions: Compositions;
  constants: PlanConstants;
  /** Difficulty-ordered workout banks, drawn from per week by the engine. */
  banks: Banks;
  taper: TaperRules;
};

// ---------------------------------------------------------------------------
// Builder helpers — keep the playbook literals readable. They erase to plain
// object literals at build. Shared by every concrete playbook (5K, 10K, …).
// ---------------------------------------------------------------------------

/** minutes → seconds. */
export const min = (m: number): number => m * 60;

export const easy = (strides: StridesRule): RoleTemplate => ({
  kind: "easy",
  strides,
});

export const time = (
  reps: number,
  workSec: number,
  recoverySec: number,
): BankEntry => ({ kind: "time", reps, workSec, recoverySec });

export const dist = (
  reps: number,
  repDistanceM: number,
  recoverySec: number,
): BankEntry => ({ kind: "dist", reps, repDistanceM, recoverySec });

export const paced = (
  reps: number,
  repDistanceM: number,
  recoverySec: number,
): BankEntry => ({ kind: "paced", reps, repDistanceM, recoverySec });

export const mixte = (
  first: { reps: number; workSec: number; recoverySec: number },
  bridgeSec: number,
  second: { reps: number; repDistanceM: number; recoverySec: number },
): BankEntry => ({ kind: "mixte", first, bridgeSec, second });

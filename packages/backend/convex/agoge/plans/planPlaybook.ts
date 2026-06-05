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

// `import type` erases at build, so `convex/values` never leaks into the
// admin browser bundle (see file header).
import type { BlockType } from "@nativesquare/agoge/schema";

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

/**
 * Which SV2 (threshold) bank a `sv2` role draws from. Omitted → the default
 * `sv2` bank (5K/10K time blocks; the half-marathon's short distance reps). The
 * half-marathon's "début construction" sets `"buildEarly"` to draw its own
 * time-block menu (`Banks.sv2BuildEarly`) instead — coach Mathieu Bert's
 * early-build SV2 sessions are time-based (4×6min…), not the short distance reps.
 */
export type Sv2BankId = "buildEarly";

/**
 * Which marathon long-run block bank a `long_race_pace` role draws from — one per
 * marathon phase. The marathon's headline session is an "endurance longue" (long
 * run) carrying time blocks at marathon race pace (AS42); each phase has its own
 * progression of block menus. Used only by the marathon playbook.
 */
export type MarathonLongBankId =
  | "buildEarly"
  | "buildLate"
  | "peak"
  | "affutage1"
  | "affutage2";

export type RoleTemplate =
  | { kind: "easy"; strides: StridesRule }
  | { kind: "sv1_long" }
  | { kind: "sv2"; bank?: Sv2BankId }
  | { kind: "vma_short" }
  | { kind: "vma_long" }
  | { kind: "mixed" }
  | { kind: "race_pace"; bank: RacePaceBankId }
  /**
   * The marathon "endurance longue" — a long run with marathon-pace (AS42) time
   * blocks inside. Draws from `Banks.marathonLong[bank]`. Placed like the long
   * run (latest hard day) and runs at the long-run warmup/cooldown bands.
   */
  | { kind: "long_race_pace"; bank: MarathonLongBankId }
  /**
   * Late-build's alternating quality slot. The engine resolves it per week to
   * VMA longue (even late-week) ↔ Mixte (odd), using `inLate = max(0, week-2)`.
   * Encoded as a sentinel because the choice depends on the week index, which a
   * static table can't carry.
   */
  | { kind: "build_late_alt" }
  /**
   * Early-build's alternating quality slot. The engine resolves it per week to
   * VMA longue (week 0) ↔ VMA courte (week 1) — the half-marathon's
   * "début construction" week-1 longue / week-2 courte progression. Like
   * `build_late_alt`, a sentinel because the choice depends on the week index.
   */
  | { kind: "build_early_alt" }
  /**
   * The marathon "début construction" alternating quality slot. Resolves to SV2
   * (even weeks 0 & 2) ↔ VMA longue (odd week 1) — coach Mathieu Bert's "1ère &
   * 3ème semaine SV2, 2ème semaine VMA longue". Distinct from `build_early_alt`
   * (VMA longue↔courte); a sentinel because the choice depends on the week index.
   */
  | { kind: "marathon_build_early_alt" };

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
  // Distance-based intervals. VMA courte / longue (@ I); also SV2 (@ T) for
  // distances whose SV2 menu is short distance reps (half-marathon 16×400m…) —
  // the engine's `sv2` role builds `dist` entries at T.
  | { kind: "dist"; reps: number; repDistanceM: number; recoverySec: number }
  // Distance intervals run at the explicit race pace (allure spé, rappel).
  | { kind: "paced"; reps: number; repDistanceM: number; recoverySec: number }
  // Time-terminated reps at the explicit race pace (allure spé "pics"
  // 3×15min / 4×10min). Time sibling of `paced`.
  | { kind: "pacedTime"; reps: number; workSec: number; recoverySec: number }
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
  /**
   * Threshold session. `time` entries → time blocks @ T (5K/10K); `dist` entries
   * → distance reps @ T (half-marathon's short-rep SV2: 16×400m…). The engine's
   * `sv2` role dispatches on the drawn entry's kind.
   */
  sv2: BankEntry[];
  /**
   * Optional secondary SV2 bank for the half-marathon's "début construction",
   * drawn when a `sv2` role carries `bank: "buildEarly"`. Time blocks @ T
   * (4×6min…) rather than the short distance reps of the default `sv2` bank.
   * Omitted by 5K/10K and by the half's other phases — they use `sv2`.
   */
  sv2BuildEarly?: BankEntry[];
  vmaShort: BankEntry[];
  vmaLong: BankEntry[];
  mixed: BankEntry[];
  /**
   * Race-pace work, keyed by bank id. "big" is the peak race-specific session
   * (every distance uses it); "moderate" is sub-threshold race-pace work used by
   * 10K's "fin construction" (5K leaves it empty — it never draws moderate).
   */
  racePace: Record<RacePaceBankId, BankEntry[]>;
  /**
   * Marathon "endurance longue" block menus, keyed by phase — the time blocks at
   * marathon race pace (AS42) embedded in the long run (6×6min…2×36min). Drawn
   * when a `long_race_pace` role carries the matching `bank`. Marathon-only;
   * omitted by every other distance.
   */
  marathonLong?: Partial<Record<MarathonLongBankId, BankEntry[]>>;
  /** Taper "rappel d'allure" tune-up. */
  rappel: BankEntry[];
};

export type PlanConstants = {
  durationsSec: {
    easyMin: number;
    easyMax: number;
    /**
     * Optional base-phase easy band. In `base`, easy runs progress by base-week
     * index from `baseEasyMin` → `baseEasyMax` (coach Mathieu Bert: "passer
     * progressivement de 40min vers 1h"), independent of weekly volume — extra
     * volume goes to the long run instead. Default to `easyMin`/`easyMax`.
     */
    baseEasyMin?: number;
    baseEasyMax?: number;
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
    /**
     * Optional longer cooldown band for the weekend long run (SV1 long), the
     * cooldown sibling of `longRunWarmupMin/Max`. Adds endurance volume to the
     * long run only. When omitted, the long run uses the default cooldown band.
     */
    longRunCooldownMin?: number;
    longRunCooldownMax?: number;
  };
};

// ---------------------------------------------------------------------------
// Taper composition rules.
// ---------------------------------------------------------------------------

/**
 * A full Mon→Sun taper week that precedes the race-week tail. Each carries its
 * own composition and volume fraction (of plan peak). The half-marathon's single
 * affûtage week is `{ composition, volumeFactor: 0.6 }`; the marathon's 3-week
 * affûtage uses two lead weeks (0.85, 0.60) before the 0.50 tail, the second
 * flagged `longRunMidWeek` (the coach pulls that long out of the week's end).
 */
export type LeadWeek = {
  composition: Composition;
  /** Week volume as a fraction of plan peak km. */
  volumeFactor: number;
  /** When set, the long run lands mid-week instead of on the latest day. */
  longRunMidWeek?: boolean;
};

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
  /**
   * Full Mon→Sun taper weeks that PRECEDE the race-week tail, each with its own
   * composition — the half-marathon's 2-week affûtage (week 1 here, week 2 is the
   * race-week tail laid out by `taperSessions`). The last `leadWeeks.length`
   * pre-taper weeks are reassigned from base/build/peak to these compositions and
   * run at reduced taper volume. Omitted (5K/10K) → the taper is the tail only.
   */
  leadWeeks?: LeadWeek[];
  /**
   * Race-week tail volume as a fraction of plan peak km. Defaults to the engine's
   * `TAPER_VOLUME_FACTOR` (0.6) when omitted. The marathon's final affûtage week
   * runs lighter (0.50).
   */
  tailVolumeFactor?: number;
};

/**
 * Structural knobs a distance may override beyond the per-phase compositions.
 * All optional — 5K/10K/half omit them and keep the engine defaults.
 */
export type PlanPhases = {
  /**
   * Number of build weeks treated as "construction-début" (buildEarly); the rest
   * are "construction-fin" (buildLate). Defaults to 2 (5K/10K/half). Marathon = 3.
   */
  buildEarlyWeeks?: number;
  /** Max build weeks in the pre-taper split. Defaults to 4. Marathon = 6 (3+3). */
  buildWeeksCap?: number;
  /**
   * Minimum sessions/week per phase — the engine raises a thinner schedule to
   * this floor (bounded by available days). Marathon = {build:3, peak:3, taper:3}
   * (coach: "quand 2 séances → passer à 3"); base keeps the athlete's count.
   */
  minSessions?: Partial<Record<BlockType, number>>;
};

export type Playbook = {
  compositions: Compositions;
  constants: PlanConstants;
  /** Difficulty-ordered workout banks, drawn from per week by the engine. */
  banks: Banks;
  taper: TaperRules;
  /** Optional structural overrides (build split, session floors). */
  phases?: PlanPhases;
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

export const pacedTime = (
  reps: number,
  workSec: number,
  recoverySec: number,
): BankEntry => ({ kind: "pacedTime", reps, workSec, recoverySec });

export const mixte = (
  first: { reps: number; workSec: number; recoverySec: number },
  bridgeSec: number,
  second: { reps: number; repDistanceM: number; recoverySec: number },
): BankEntry => ({ kind: "mixte", first, bridgeSec, second });

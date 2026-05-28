/**
 * 5K-specific weekly microcycle.
 *
 * Philosophy (per project decision):
 * - Bases:           EF×many + Seuil SV1 (long w/ M blocks) + occasional VMA courte + strides.
 * - Construction-début (build week 0–1): EF + Seuil SV2 + Seuil SV1 + VMA courte.
 * - Construction-fin  (build week 2+):
 *     - W1 (even idx-in-late): VMA longue + Seuil SV2 + long continuous EF + EFs.
 *     - W2 (odd  idx-in-late): Mixte (préfatigue) + Seuil SV1 + EFs.
 * - Spécifique (peak): 3× EF (strides++) + 1× allure spé 5K.
 * - Taper:             EFs + 1 short tune-up @ 5K pace.
 *
 * Constraints:
 * - EF duration always 30–50 min (clamped, derived from E pace).
 * - Warmup 15–20 min, cooldown 5–10 min, scaled linearly with weekKm/peakKm.
 * - Strides = 6×100m R / 100m E recovery, appended to selected easy runs.
 *   Pattern: strides on the EF immediately before a quality session.
 *
 * SV1 ≈ M pace (no separate SV1 anchor). All non-easy/long sessions surface
 * as WorkoutType `intervals`; structure variation lives in StructureSpec.
 */

import type { BlockType } from "@nativesquare/agoge/schema";
import {
  fiveKPaceMps,
  type IntensityAnchor,
  type Paces,
  pickTrainingDays,
  type Schedule,
  type SessionSpec,
  type StructureSpec,
} from "../periodization";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EASY_MIN_SEC = 30 * 60;
const EASY_MAX_SEC = 50 * 60;

const WARMUP_MIN_SEC = 15 * 60;
const WARMUP_MAX_SEC = 20 * 60;
const COOLDOWN_MIN_SEC = 5 * 60;
const COOLDOWN_MAX_SEC = 10 * 60;

// Recoveries (time-based, between reps within a block).
const SV2_RECOVERY_SEC = 120; // 2 min @ E
const VMA_LONG_RECOVERY_SEC = 90; // 1 min 30 @ E
const VMA_SHORT_RECOVERY_SEC = 60; // 1 min @ E
const RACE_PACE_RECOVERY_SEC = 90; // 1 min 30 @ E
const MIXED_BRIDGE_SEC = 180; // 3 min between SV2 block and VMA short block

// Long-run with M-pace blocks (Seuil SV1): 3×8min @ M with 3min E recovery.
const SV1_BLOCK_WORK_SEC = 8 * 60;
const SV1_BLOCK_RECOVERY_SEC = 3 * 60;
const SV1_BLOCK_REPS = 3;

// VMA courte / longue rep distances.
const VMA_SHORT_REP_M = 300;
const VMA_LONG_REP_M = 800;
const RACE_PACE_REP_M = 800;
const SV2_REP_M = 1200;

// ---------------------------------------------------------------------------
// Args + role types
// ---------------------------------------------------------------------------

export type Microcycle5KArgs = {
  phase: BlockType;
  weekIndexInPhase: number; // 0-based
  weekKm: number;
  schedule: Schedule;
  peakKm: number;
  paces?: Paces;
  vdot?: number;
};

type Role5K =
  | { kind: "easy"; addStrides: boolean }
  | { kind: "long_continuous" }
  | { kind: "sv1_long" }
  | { kind: "sv2" }
  | { kind: "vma_short" }
  | { kind: "vma_long" }
  | { kind: "mixed" }
  | { kind: "race_pace_5k" }
  | { kind: "taper_tune_up" };

function isQuality(r: Role5K): boolean {
  switch (r.kind) {
    case "sv2":
    case "vma_short":
    case "vma_long":
    case "mixed":
    case "race_pace_5k":
    case "sv1_long":
    case "taper_tune_up":
      return true;
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// Role planning per phase
// ---------------------------------------------------------------------------

/**
 * Pick the ordered role list for a phase. The order is "earliest day → latest".
 * The last slot is reserved for the weekly long (SV1 or long continuous);
 * quality work sits in the middle; EFs fill remaining slots. Strides are
 * applied as a post-pass: any EF immediately before a quality role gets them.
 */
function rolesForPhase(args: Microcycle5KArgs, slots: number): Role5K[] {
  if (slots <= 0) return [];

  const { phase, weekIndexInPhase } = args;

  let roles: Role5K[];
  switch (phase) {
    case "base":
      roles = rolesBase(slots, weekIndexInPhase);
      break;
    case "build":
      roles =
        weekIndexInPhase < 2
          ? rolesBuildEarly(slots)
          : rolesBuildLate(slots, weekIndexInPhase);
      break;
    case "peak":
      roles = rolesPeak(slots);
      break;
    case "taper":
      roles = rolesTaper(slots);
      break;
  }

  return applyStrides(roles);
}

function rolesBase(slots: number, weekIndexInPhase: number): Role5K[] {
  // Required tail: SV1 long. Optional VMA courte every other week.
  // Fill rest with EFs (later passes add strides positionally).
  const long: Role5K = { kind: "sv1_long" };
  const wantsVma = weekIndexInPhase % 2 === 1; // weeks 1, 3, 5, ... within base

  if (slots === 1) return [long];
  if (slots === 2) return [{ kind: "easy", addStrides: false }, long];
  if (slots === 3) {
    return wantsVma
      ? [{ kind: "easy", addStrides: false }, { kind: "vma_short" }, long]
      : [
          { kind: "easy", addStrides: false },
          { kind: "easy", addStrides: false },
          long,
        ];
  }
  // slots >= 4
  const easies: Role5K[] = Array.from({ length: slots - (wantsVma ? 2 : 1) }, () => ({
    kind: "easy" as const,
    addStrides: false,
  }));
  if (wantsVma) {
    // Spread: EF, EF, ..., VMA, long
    return [...easies, { kind: "vma_short" }, long];
  }
  return [...easies, long];
}

function rolesBuildEarly(slots: number): Role5K[] {
  // Target roles (in priority): sv1_long (long), sv2, vma_short, easies.
  // sessionsPerWeek = 4 → [EF, SV2, VMA short, SV1 long]
  const long: Role5K = { kind: "sv1_long" };
  if (slots === 1) return [long];
  if (slots === 2) return [{ kind: "sv2" }, long];
  if (slots === 3) return [{ kind: "sv2" }, { kind: "vma_short" }, long];
  // slots >= 4: pad easies at the front
  const easies: Role5K[] = Array.from({ length: slots - 3 }, () => ({
    kind: "easy" as const,
    addStrides: false,
  }));
  return [...easies, { kind: "sv2" }, { kind: "vma_short" }, long];
}

function rolesBuildLate(slots: number, weekIndexInPhase: number): Role5K[] {
  // W1 (even idx-in-late): VMA longue + SV2 + long continuous EF + EFs.
  // W2 (odd  idx-in-late): Mixte             + SV1 long              + EFs.
  // idx-in-late = weekIndexInPhase - 2 (since build-early was weeks 0,1).
  const inLate = Math.max(0, weekIndexInPhase - 2);
  const isW1 = inLate % 2 === 0;

  if (isW1) {
    // Two quality + one long-continuous EF (+ easies).
    const longCont: Role5K = { kind: "long_continuous" };
    if (slots === 1) return [longCont];
    if (slots === 2) return [{ kind: "vma_long" }, longCont];
    if (slots === 3) return [{ kind: "sv2" }, { kind: "vma_long" }, longCont];
    const easies: Role5K[] = Array.from({ length: slots - 3 }, () => ({
      kind: "easy" as const,
      addStrides: false,
    }));
    return [...easies, { kind: "sv2" }, { kind: "vma_long" }, longCont];
  }

  // W2: Mixte + SV1 long (SV1 doubles as the long).
  const long: Role5K = { kind: "sv1_long" };
  if (slots === 1) return [long];
  if (slots === 2) return [{ kind: "mixed" }, long];
  const easies: Role5K[] = Array.from({ length: slots - 2 }, () => ({
    kind: "easy" as const,
    addStrides: false,
  }));
  return [...easies, { kind: "mixed" }, long];
}

function rolesPeak(slots: number): Role5K[] {
  // 1 race-pace 5K session, rest EFs (strides on most via applyStrides).
  const quality: Role5K = { kind: "race_pace_5k" };
  if (slots === 1) return [quality];
  const easies: Role5K[] = Array.from({ length: slots - 1 }, () => ({
    kind: "easy" as const,
    addStrides: false,
  }));
  // Place the quality session second-to-last so the last day is recovery EF.
  if (slots === 2) return [easies[0]!, quality];
  return [...easies.slice(0, slots - 2), quality, easies[easies.length - 1]!];
}

function rolesTaper(slots: number): Role5K[] {
  // 1 short tune-up at 5K pace mid-week, rest very easy EFs.
  const tune: Role5K = { kind: "taper_tune_up" };
  if (slots === 1) return [tune];
  const easies: Role5K[] = Array.from({ length: slots - 1 }, () => ({
    kind: "easy" as const,
    addStrides: false,
  }));
  if (slots === 2) return [tune, easies[0]!];
  return [easies[0]!, tune, ...easies.slice(1)];
}

/**
 * Flip any "easy" role to "easy + strides" when the immediately-following day
 * is a quality session. Neuromuscular priming the day before hard work.
 */
function applyStrides(roles: Role5K[]): Role5K[] {
  const out = roles.map((r) => ({ ...r }));
  for (let i = 0; i < out.length - 1; i++) {
    const here = out[i]!;
    const next = out[i + 1]!;
    if (here.kind === "easy" && isQuality(next)) {
      (here as { addStrides: boolean }).addStrides = true;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Role → SessionSpec (with StructureSpec)
// ---------------------------------------------------------------------------

function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * Math.max(0, Math.min(1, t));
}

function warmupSeconds(weekKm: number, peakKm: number): number {
  const t = weekKm / Math.max(peakKm, 1);
  return Math.round(lerp(WARMUP_MIN_SEC, WARMUP_MAX_SEC, t));
}

function cooldownSeconds(weekKm: number, peakKm: number): number {
  const t = weekKm / Math.max(peakKm, 1);
  return Math.round(lerp(COOLDOWN_MIN_SEC, COOLDOWN_MAX_SEC, t));
}

/** EF duration clamped 30–50 min, scaled by weekKm/peakKm within the band. */
function easyDurationSec(weekKm: number, peakKm: number): number {
  const t = weekKm / Math.max(peakKm, 1);
  return Math.round(lerp(EASY_MIN_SEC, EASY_MAX_SEC, t));
}

function roleToSessionSpec(
  role: Role5K,
  args: Microcycle5KArgs,
  dayOfWeek: number,
): SessionSpec | null {
  const { weekKm, peakKm, paces, vdot, weekIndexInPhase } = args;
  const wu = warmupSeconds(weekKm, peakKm);
  const cd = cooldownSeconds(weekKm, peakKm);
  const ePace = paces?.E ?? 0;

  const base = {
    dayOfWeek,
    weekIndexInPhase,
  };

  // Distance approximations for the SessionSpec label (structure remains
  // the source of truth; this is used by the engine to filter <500m sessions
  // and to display rough km on cards). Compute from the structure where
  // possible; else estimate.
  const easyKm = ePace > 0 ? (ePace * easyDurationSec(weekKm, peakKm)) / 1000 : 8;

  switch (role.kind) {
    case "easy": {
      const spec: StructureSpec = {
        kind: "easy_continuous",
        durationSec: easyDurationSec(weekKm, peakKm),
        addStrides: role.addStrides,
      };
      return {
        ...base,
        type: "easy",
        intensity: "E",
        distanceKm: round1(easyKm),
        structureSpec: spec,
      };
    }
    case "long_continuous": {
      // Continuous easy long when SV1 isn't programmed this week. Duration
      // sits at the top of the easy band (50 min) regardless of weekKm —
      // it's "the long of the week" in a quality-heavy week.
      const durSec = EASY_MAX_SEC + 15 * 60; // 50 + 15 = ~65 min default
      const spec: StructureSpec = { kind: "long_continuous", durationSec: durSec };
      return {
        ...base,
        type: "long",
        intensity: "E",
        distanceKm: round1(ePace > 0 ? (ePace * durSec) / 1000 : 12),
        structureSpec: spec,
      };
    }
    case "sv1_long": {
      // Long with 3×8min @ M / 3min E. Total ≈ 33 min of structured work +
      // warmup + cooldown ≈ 60–70 min depending on volume.
      const spec: StructureSpec = {
        kind: "long_with_blocks",
        warmupSec: wu,
        cooldownSec: cd,
        reps: SV1_BLOCK_REPS,
        workDurationSec: SV1_BLOCK_WORK_SEC,
        recoveryDurationSec: SV1_BLOCK_RECOVERY_SEC,
        workIntensity: "M",
      };
      const totalSec =
        wu +
        cd +
        SV1_BLOCK_REPS * (SV1_BLOCK_WORK_SEC + SV1_BLOCK_RECOVERY_SEC);
      return {
        ...base,
        type: "long",
        intensity: "M",
        distanceKm: round1(ePace > 0 ? (ePace * totalSec) / 1000 : 12),
        structureSpec: spec,
      };
    }
    case "sv2": {
      // 4–5 × 1200m @ T, 2 min E recovery. Scale reps by volume.
      const reps = weekKm >= 0.7 * peakKm ? 5 : 4;
      const spec: StructureSpec = {
        kind: "intervals_distance",
        warmupSec: wu,
        cooldownSec: cd,
        reps,
        repDistanceM: SV2_REP_M,
        repIntensity: "T",
        recoverySec: SV2_RECOVERY_SEC,
      };
      const totalM =
        ePace * (wu + cd + reps * SV2_RECOVERY_SEC) + reps * SV2_REP_M;
      return {
        ...base,
        type: "intervals",
        intensity: "T",
        distanceKm: round1(totalM / 1000),
        structureSpec: spec,
      };
    }
    case "vma_short": {
      // 8–12 × 300m @ I, 1 min E recovery.
      const reps = weekKm >= 0.7 * peakKm ? 12 : 8;
      const spec: StructureSpec = {
        kind: "intervals_distance",
        warmupSec: wu,
        cooldownSec: cd,
        reps,
        repDistanceM: VMA_SHORT_REP_M,
        repIntensity: "I",
        recoverySec: VMA_SHORT_RECOVERY_SEC,
      };
      const totalM =
        ePace * (wu + cd + reps * VMA_SHORT_RECOVERY_SEC) +
        reps * VMA_SHORT_REP_M;
      return {
        ...base,
        type: "intervals",
        intensity: "I",
        distanceKm: round1(totalM / 1000),
        structureSpec: spec,
      };
    }
    case "vma_long": {
      // 5–6 × 800m @ I, 1 min 30 E recovery.
      const reps = weekKm >= 0.7 * peakKm ? 6 : 5;
      const spec: StructureSpec = {
        kind: "intervals_distance",
        warmupSec: wu,
        cooldownSec: cd,
        reps,
        repDistanceM: VMA_LONG_REP_M,
        repIntensity: "I",
        recoverySec: VMA_LONG_RECOVERY_SEC,
      };
      const totalM =
        ePace * (wu + cd + reps * VMA_LONG_RECOVERY_SEC) + reps * VMA_LONG_REP_M;
      return {
        ...base,
        type: "intervals",
        intensity: "I",
        distanceKm: round1(totalM / 1000),
        structureSpec: spec,
      };
    }
    case "mixed": {
      // 3×1000m @ T / 2min E,  bridge 3min E,  4×400m @ I / 1min E.
      const spec: StructureSpec = {
        kind: "mixed",
        warmupSec: wu,
        cooldownSec: cd,
        first: {
          reps: 3,
          repDistanceM: 1000,
          repIntensity: "T",
          recoverySec: SV2_RECOVERY_SEC,
        },
        second: {
          reps: 4,
          repDistanceM: 400,
          repIntensity: "I",
          recoverySec: VMA_SHORT_RECOVERY_SEC,
        },
        bridgeSec: MIXED_BRIDGE_SEC,
      };
      const totalM =
        ePace *
          (wu +
            cd +
            3 * SV2_RECOVERY_SEC +
            MIXED_BRIDGE_SEC +
            4 * VMA_SHORT_RECOVERY_SEC) +
        3 * 1000 +
        4 * 400;
      return {
        ...base,
        type: "intervals",
        intensity: "I",
        distanceKm: round1(totalM / 1000),
        structureSpec: spec,
      };
    }
    case "race_pace_5k": {
      // 7×800m @ 5K pace, 1 min 30 E recovery.
      const racePace = vdot ? fiveKPaceMps(vdot) : 0;
      const reps = 7;
      const spec: StructureSpec = {
        kind: "intervals_paced",
        warmupSec: wu,
        cooldownSec: cd,
        reps,
        repDistanceM: RACE_PACE_REP_M,
        targetPaceMps: racePace,
        recoverySec: RACE_PACE_RECOVERY_SEC,
      };
      const totalM =
        ePace * (wu + cd + reps * RACE_PACE_RECOVERY_SEC) +
        reps * RACE_PACE_REP_M;
      return {
        ...base,
        type: "intervals",
        intensity: "I",
        distanceKm: round1(totalM / 1000),
        structureSpec: spec,
      };
    }
    case "taper_tune_up": {
      // Short tune-up: 3×400m @ 5K pace, 90s recovery. Keeps the engine
      // primed without depleting glycogen pre-race.
      const racePace = vdot ? fiveKPaceMps(vdot) : 0;
      const reps = 3;
      const spec: StructureSpec = {
        kind: "intervals_paced",
        warmupSec: wu,
        cooldownSec: cd,
        reps,
        repDistanceM: 400,
        targetPaceMps: racePace,
        recoverySec: RACE_PACE_RECOVERY_SEC,
      };
      const totalM =
        ePace * (wu + cd + reps * RACE_PACE_RECOVERY_SEC) + reps * 400;
      return {
        ...base,
        type: "intervals",
        intensity: "I",
        distanceKm: round1(totalM / 1000),
        structureSpec: spec,
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Microcycle entry point
// ---------------------------------------------------------------------------

/**
 * Build the week's session list for a 5K plan. Picks days from the schedule,
 * assigns roles per phase (+ week index for build sub-phasing), maps each
 * role to a SessionSpec with an explicit StructureSpec. The engine layer
 * calls buildStructure(_, _, _, paces, spec) to materialise the structure.
 */
export function microcycle5K(args: Microcycle5KArgs): SessionSpec[] {
  const days = pickTrainingDays(args.schedule);
  if (days.length === 0) return [];
  const roles = rolesForPhase(args, days.length);

  const out: SessionSpec[] = [];
  for (let i = 0; i < roles.length; i++) {
    const role = roles[i]!;
    const dayOfWeek = days[i]!;
    const spec = roleToSessionSpec(role, args, dayOfWeek);
    if (spec) out.push(spec);
  }
  return out;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// Re-export anchor type for downstream test ergonomics.
export type { IntensityAnchor };

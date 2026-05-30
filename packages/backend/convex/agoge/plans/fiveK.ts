/**
 * 5K-specific weekly microcycle.
 *
 * Each phase has an explicit session composition per weekly frequency (2→6+),
 * matching the coaching templates. Strides ("lignes droites") are assigned
 * explicitly per template — not positionally. The composition (the role "bag")
 * is decided per phase/frequency, then `placeRoles` lays it out across the
 * athlete's available days for recovery spacing.
 *
 * Philosophy (per coaching templates):
 * - Base:           EF (+strides) + VMA courte (every week) + Seuil SV1 long.
 *                   No long at 2 sessions/week.
 * - Construction-début (build week 0–1): EF + SV2 / VMA courte / SV1 long, scaled by frequency.
 * - Construction-fin  (build week 2+): EF + SV2 + SV1 long, with one quality slot
 *   alternating VMA longue (week 1) ↔ Mixte (week 2).
 * - Spécifique (peak): easy runs + 5K race-pace sessions (7×800m @ allure course)
 *   only — no SV2, no SV1 long. Composition per weekly frequency:
 *     2: 1 easy+strides / 1 spé
 *     3: 1 easy+strides / 1 spé / 1 easy
 *     4: 1 easy / 2 easy+strides / 1 spé
 *     5: 1 easy+strides / 2 easy / 2 spé
 *     6: 1 easy+strides / 3 easy / 2 spé
 * - Taper:           rappel d'allure (3×400m @ 5K pace) + EFs + a 20-min strides
 *   shakeout pinned to the day before the race (the race itself is emitted separately).
 *
 * Constraints:
 * - EF duration 30–50 min (clamped, derived from E pace); shakeout is a fixed 20 min.
 * - Warmup 15–20 min, cooldown 5–10 min, scaled linearly with weekKm/peakKm.
 * - Strides = 6×100m R / 100m E recovery, appended to flagged easy runs.
 *
 * SV1 long blocks run at the dedicated SV1 anchor (aerobic threshold, just
 * above easy — slower than M). All non-easy/long sessions surface as
 * WorkoutType `intervals`; structure variation lives in StructureSpec.
 */

import type { BlockType } from "@nativesquare/agoge/schema";
import {
  addDaysYmd,
  daysBetweenYmd,
  fiveKPaceMps,
  type IntensityAnchor,
  isoDayOfWeek,
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

// Race-eve activation run: short and fixed, just to stay loose.
const SHAKEOUT_SEC = 20 * 60;

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

// Long-run with SV1-pace blocks (Seuil SV1): 3×8min @ SV1 with 3min E recovery.
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
  /**
   * Race ISO day-of-week (0=Mon…6=Sun). Only consulted for the peak phase: the
   * last race-pace spé must land 8–10 days before the race (see `microcycle5K`).
   * When omitted, the peak spé keeps its natural latest-day placement.
   */
  raceDow?: number;
};

type Role5K =
  | { kind: "easy"; addStrides: boolean; shakeout?: boolean }
  | { kind: "sv1_long" }
  | { kind: "sv2" }
  | { kind: "vma_short" }
  | { kind: "vma_long" }
  | { kind: "mixed" }
  | { kind: "race_pace_5k" }
  | { kind: "taper_tune_up" };

const easy = (addStrides = false): Role5K => ({ kind: "easy", addStrides });

/** Quality = anything that isn't an easy run. SV1 long is handled separately
 * by `placeRoles` (it owns the latest day), so it's excluded here. */
function isQuality(r: Role5K): boolean {
  return r.kind !== "easy" && r.kind !== "sv1_long";
}

// ---------------------------------------------------------------------------
// Role planning per phase
// ---------------------------------------------------------------------------

/**
 * Build the role "bag" for a phase at a given weekly frequency. Strides are
 * assigned explicitly per the coaching templates (not positionally). The list
 * order is irrelevant — `placeRoles` lays roles out across days for spacing.
 */
function rolesForPhase(args: Microcycle5KArgs, slots: number): Role5K[] {
  if (slots <= 0) return [];
  const { phase, weekIndexInPhase } = args;
  switch (phase) {
    case "base":
      return rolesBase(slots, weekIndexInPhase);
    case "build":
      return weekIndexInPhase < 2
        ? rolesBuildEarly(slots, weekIndexInPhase)
        : rolesBuildLate(slots, weekIndexInPhase);
    case "peak":
      return rolesPeak(slots);
    case "taper":
      // Taper is a variable-length final block (4–10 days, race-anchored) laid
      // out by `taperSessions5K` over absolute dates — never a weekly microcycle.
      return [];
  }
}

/** Base: EF (+strides) + VMA courte every week + SV1 long. No long at 2/week. */
function rolesBase(slots: number, week: number): Role5K[] {
  const altStrides = week % 2 === 0; // "6×100m une semaine sur deux"
  const vma: Role5K = { kind: "vma_short" };
  const long: Role5K = { kind: "sv1_long" };
  switch (slots) {
    case 1:
      return [long];
    case 2:
      return [easy(true), vma];
    case 3:
      return [easy(altStrides), vma, long];
    case 4:
      return [easy(), easy(true), vma, long];
    case 5:
      return [easy(true), easy(), easy(), vma, long];
    default: {
      // 6+: two strides-easies, the rest plain, + VMA + SV1 long.
      const plain = slots - 4;
      return [
        easy(true),
        easy(true),
        ...Array.from({ length: plain }, () => easy()),
        vma,
        long,
      ];
    }
  }
}

/** Construction-début (build weeks 0–1). */
function rolesBuildEarly(slots: number, week: number): Role5K[] {
  const altStrides = week % 2 === 0;
  const sv2: Role5K = { kind: "sv2" };
  const vma: Role5K = { kind: "vma_short" };
  const long: Role5K = { kind: "sv1_long" };
  switch (slots) {
    case 1:
      return [long];
    case 2:
      return [easy(true), sv2];
    case 3:
      return [easy(altStrides), vma, long];
    case 4:
      return [easy(), easy(true), vma, sv2];
    case 5:
      return [easy(true), easy(), sv2, vma, long];
    default: {
      // 6+: VMA + SV2 + SV1 long, one strides-easy, the rest plain.
      const plain = slots - 4;
      return [
        easy(true),
        ...Array.from({ length: plain }, () => easy()),
        vma,
        sv2,
        long,
      ];
    }
  }
}

/**
 * Construction-fin (build week ≥ 2): EF + SV2 + SV1 long, with one alternating
 * quality slot — VMA longue (week 1) ↔ Mixte (week 2). Peak no longer shares
 * this shape; see `rolesPeak`.
 */
function rolesFinShape(
  slots: number,
  altStrides: boolean,
  alt: Role5K,
): Role5K[] {
  const sv2: Role5K = { kind: "sv2" };
  const long: Role5K = { kind: "sv1_long" };
  switch (slots) {
    case 1:
      return [long];
    case 2:
      return [easy(true), alt];
    case 3:
      return [easy(altStrides), alt, long];
    case 4:
      return [easy(), easy(true), alt, sv2];
    case 5:
      return [easy(true), easy(), alt, sv2, long];
    default: {
      const plain = slots - 4;
      return [
        easy(true),
        ...Array.from({ length: plain }, () => easy()),
        alt,
        sv2,
        long,
      ];
    }
  }
}

function rolesBuildLate(slots: number, week: number): Role5K[] {
  const inLate = Math.max(0, week - 2);
  const alt: Role5K =
    inLate % 2 === 0 ? { kind: "vma_long" } : { kind: "mixed" };
  return rolesFinShape(slots, week % 2 === 0, alt);
}

/**
 * Spécifique (peak): easy runs + 5K race-pace spé (7×800m @ allure course) only.
 * No SV2, no SV1 long — the peak week sharpens toward the race. One race-pace
 * session up to 4 sessions/week, two from 5 onward. Strides ("lignes droites")
 * ride on a single easy each week (two strides-easies at 4 sessions).
 */
function rolesPeak(slots: number): Role5K[] {
  const rp: Role5K = { kind: "race_pace_5k" };
  switch (slots) {
    case 1:
      return [rp];
    case 2:
      return [easy(true), rp];
    case 3:
      return [easy(true), rp, easy()];
    case 4:
      return [easy(), easy(true), easy(true), rp];
    default: {
      // 5+: 1 strides-easy, (slots − 3) plain easies, 2 race-pace spé.
      const plain = slots - 3;
      return [easy(true), ...Array.from({ length: plain }, () => easy()), rp, rp];
    }
  }
}

// Taper roles are assigned over absolute calendar dates by `taperSessions5K`
// (see below), not through the weekly microcycle.

/**
 * Lay roles out across available days for recovery spacing. Weeks are Mon→Sun
 * (anchor = Monday), so "latest" means closest to Sunday — the natural end of
 * the calendar week.
 *
 * - Hard days (qualities + SV1 long) are spread evenly across the week for
 *   maximum recovery between them; the latest hard slot is Sunday-most, so the
 *   SV1 long (base/build) or a race-pace spé (peak) lands as the final hard
 *   touch before the taper. With two peak spé sessions, they spread to the
 *   first and last hard slots.
 * - Easies fill the rest.
 *
 * The latest `roles.length` days are used — drops the earliest when there are
 * more available days than roles.
 */
function placeRoles(
  roles: Role5K[],
  days: number[],
  anchor: number,
): { role: Role5K; dayOfWeek: number }[] {
  const n = roles.length;
  if (n === 0 || days.length === 0) return [];
  const offset = (d: number) => (d - anchor + 7) % 7;
  const ordered = [...days].sort((a, b) => offset(a) - offset(b));
  const slotDays = ordered.slice(Math.max(0, ordered.length - n));
  const m = slotDays.length;

  const assign: (number | undefined)[] = new Array(m).fill(undefined);
  const taken = new Array<boolean>(m).fill(false);
  const place = (slot: number, roleIdx: number) => {
    if (slot < 0 || slot >= m || taken[slot]) return;
    assign[slot] = roleIdx;
    taken[slot] = true;
  };

  // SV1 long is the latest hard day (placed last in the `hard` list below).
  const longIdx = roles.findIndex((r) => r.kind === "sv1_long");
  const qualityIdxs: number[] = [];
  const easyIdxs: number[] = [];
  roles.forEach((r, i) => {
    if (i === longIdx) return;
    if (isQuality(r)) qualityIdxs.push(i);
    else easyIdxs.push(i);
  });

  const hi = m - 1;

  // Hard days = qualities then the SV1 long (long is the latest hard day),
  // spread evenly across [0, hi] for maximum recovery between them.
  const hard = [...qualityIdxs];
  if (longIdx >= 0) hard.push(longIdx);
  if (hard.length === 1) {
    place(Math.max(0, hi), hard[0]!);
  } else if (hard.length > 1) {
    for (let k = 0; k < hard.length; k++) {
      place(Math.round((k * Math.max(0, hi)) / (hard.length - 1)), hard[k]!);
    }
  }

  // Easies fill the remaining free slots.
  let e = 0;
  for (let s = 0; s < m && e < easyIdxs.length; s++) {
    if (!taken[s]) place(s, easyIdxs[e++]!);
  }

  // Safety net: assign any unplaced role to any free slot (shouldn't trigger).
  const placedIdxs = new Set(
    assign.filter((x): x is number => x !== undefined),
  );
  let free = 0;
  roles.forEach((_, i) => {
    if (placedIdxs.has(i)) return;
    while (free < m && taken[free]) free++;
    if (free < m) {
      place(free, i);
      placedIdxs.add(i);
    }
  });

  const result: { role: Role5K; dayOfWeek: number }[] = [];
  for (let s = 0; s < m; s++) {
    const idx = assign[s];
    if (idx !== undefined) {
      result.push({ role: roles[idx]!, dayOfWeek: slotDays[s]! });
    }
  }
  return result;
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
      // Shakeout = fixed 20-min activation run the day before the race; a
      // normal easy scales 30–50 min with volume.
      const durationSec = role.shakeout
        ? SHAKEOUT_SEC
        : easyDurationSec(weekKm, peakKm);
      const spec: StructureSpec = {
        kind: "easy_continuous",
        durationSec,
        addStrides: role.addStrides,
      };
      return {
        ...base,
        type: "easy",
        intensity: "E",
        distanceKm: round1(ePace > 0 ? (ePace * durationSec) / 1000 : easyKm),
        structureSpec: spec,
      };
    }
    case "sv1_long": {
      // Long with 3×8min @ SV1 / 3min E. Total ≈ 33 min of structured work +
      // warmup + cooldown ≈ 60–70 min depending on volume.
      const spec: StructureSpec = {
        kind: "long_with_blocks",
        warmupSec: wu,
        cooldownSec: cd,
        reps: SV1_BLOCK_REPS,
        workDurationSec: SV1_BLOCK_WORK_SEC,
        recoveryDurationSec: SV1_BLOCK_RECOVERY_SEC,
        workIntensity: "SV1",
      };
      const totalSec =
        wu +
        cd +
        SV1_BLOCK_REPS * (SV1_BLOCK_WORK_SEC + SV1_BLOCK_RECOVERY_SEC);
      return {
        ...base,
        type: "long",
        intensity: "SV1",
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
 * Build the week's session list for a 5K base/build/peak week. Picks days from
 * the schedule, assigns the phase's role bag (keyed on frequency + week index),
 * lays them out across days for recovery spacing, then maps each role to a
 * SessionSpec with an explicit StructureSpec. The engine layer calls
 * buildStructure(_, _, _, paces, spec) to materialise the structure.
 *
 * Weeks are Mon→Sun, so days are ordered with Monday as the anchor and the long
 * run / quality sessions gravitate toward the end of the week (Sunday-most). The
 * taper is not a weekly microcycle — see `taperSessions5K`.
 */
export function microcycle5K(args: Microcycle5KArgs): SessionSpec[] {
  const picked = pickTrainingDays(args.schedule);
  if (picked.length === 0) return [];

  const roles = rolesForPhase(args, picked.length);
  if (roles.length === 0) return [];

  // Mon→Sun weeks: anchor on Monday so "latest" means Sunday-most.
  const MONDAY_ANCHOR = 0;

  const placed = placeRoles(roles, picked, MONDAY_ANCHOR);
  if (args.phase === "peak" && args.raceDow !== undefined) {
    relocatePeakSpe(placed, args.raceDow);
  }

  const out: SessionSpec[] = [];
  for (const { role, dayOfWeek } of placed) {
    const spec = roleToSessionSpec(role, args, dayOfWeek);
    if (spec) out.push(spec);
  }
  return out;
}

/**
 * Pull the *last* race-pace spé of the peak week into the J-8→J-10 window before
 * the race. The peak week is the Mon→Sun block ending `taperDays` before the race,
 * so a day-of-week `d` sits `taperDays + 6 − d` days out; J-8→J-10 maps to the
 * window `d ∈ [taperDays−4, taperDays−2]` (clamped to Mon..Sun). The spé swaps days
 * with whatever (usually an easy) holds the best in-window day — keeping the set of
 * training days intact. When no scheduled day falls in the window, the closest one
 * is used, preferring the later (fresher) day on ties.
 */
function relocatePeakSpe(
  placed: { role: Role5K; dayOfWeek: number }[],
  raceDow: number,
): void {
  const speIdxs = placed.flatMap((p, i) =>
    p.role.kind === "race_pace_5k" ? [i] : [],
  );
  if (speIdxs.length === 0) return;
  // The "last specific session" is the latest-day spé.
  const lastSpeIdx = speIdxs.reduce((a, b) =>
    placed[a]!.dayOfWeek >= placed[b]!.dayOfWeek ? a : b,
  );

  const taperDays = taperDaysForRaceDow(raceDow);
  const lo = Math.max(0, taperDays - 4);
  const hi = Math.min(6, taperDays - 2);
  const dist = (d: number) => (d < lo ? lo - d : d > hi ? d - hi : 0);

  const targetIdx = placed.reduce((best, p, i) => {
    const db = dist(p.dayOfWeek);
    const bestDb = dist(placed[best]!.dayOfWeek);
    if (db !== bestDb) return db < bestDb ? i : best;
    // Tie: prefer the later (fresher) day within/near the window.
    return p.dayOfWeek > placed[best]!.dayOfWeek ? i : best;
  }, 0);

  const tmp = placed[lastSpeIdx]!.dayOfWeek;
  placed[lastSpeIdx]!.dayOfWeek = placed[targetIdx]!.dayOfWeek;
  placed[targetIdx]!.dayOfWeek = tmp;
}

// ---------------------------------------------------------------------------
// Monday-aligned grid + taper layout
// ---------------------------------------------------------------------------

/**
 * Taper length in days as a function of the race's ISO day-of-week (0=Mon…6=Sun).
 *
 * Every base/build/peak block runs Mon→Sun; the taper is the variable tail that
 * carries the plan to race day:
 * - Sun (6):           7 days — the taper *is* the race-week (race on Sunday).
 * - Mon/Tue/Wed (0–2): 8/9/10 days — extended back into the previous week, since
 *   the race sits just after a Sunday and a 1–3 day taper would be too short.
 * - Thu/Fri/Sat (3–5): 4/5/6 days — shortened to the start of the race-week, so
 *   we don't append a near-empty extra week before the race.
 *
 * In every case the taper opens on a Monday (so the preceding peak block still
 * ends on a Sunday).
 */
export function taperDaysForRaceDow(raceDow: number): number {
  return raceDow <= 2 ? raceDow + 8 : raceDow + 1;
}

/**
 * Pick the date from `pool` whose distance-before-race lands in [loDays, hiDays];
 * if none qualifies, the closest one to that window. Ties prefer the earlier day
 * (more recovery before the race). Returns undefined for an empty pool.
 */
function pickDayNearWindow(
  pool: string[],
  loDays: number,
  hiDays: number,
  raceYmd: string,
): string | undefined {
  if (pool.length === 0) return undefined;
  const dist = (d: string) => {
    const db = daysBetweenYmd(d, raceYmd);
    return db < loDays ? loDays - db : db > hiDays ? db - hiDays : 0;
  };
  return [...pool].sort((a, b) => {
    const da = dist(a);
    const dbb = dist(b);
    if (da !== dbb) return da - dbb;
    // Tie: prefer the earlier day (larger days-before-race).
    return daysBetweenYmd(b, raceYmd) - daysBetweenYmd(a, raceYmd);
  })[0];
}

export type FiveKGrid = {
  /** Monday of the plan-start week. Week rows are addDaysYmd(gridStartYmd, 7·w). */
  gridStartYmd: string;
  /** Monday opening the taper, clamped to never precede the plan start. */
  taperStartYmd: string;
  /** Taper length in days (4–10), pre-clamp. */
  taperDays: number;
  /** Count of full Mon→Sun weeks available for base/build/peak before the taper. */
  preTaperWeeks: number;
};

/**
 * Resolve the Mon→Sun week grid for a 5K plan from its start date and race date.
 * `gridStartYmd` (Monday of the start week) anchors every week row; the first
 * row may be partial when the plan starts mid-week (the engine's date guard
 * drops pre-start days). The taper occupies the final `taperDays`.
 */
export function fiveKGrid(planStartYmd: string, raceYmd: string): FiveKGrid {
  const taperDays = taperDaysForRaceDow(isoDayOfWeek(raceYmd));
  // taperDays − 1 days before the race is always a Monday.
  const taperStartRaw = addDaysYmd(raceYmd, -(taperDays - 1));
  const gridStartYmd = addDaysYmd(planStartYmd, -isoDayOfWeek(planStartYmd));
  const preTaperWeeks = Math.max(
    0,
    Math.round(daysBetweenYmd(gridStartYmd, taperStartRaw) / 7),
  );
  const taperStartYmd =
    taperStartRaw < planStartYmd ? planStartYmd : taperStartRaw;
  return { gridStartYmd, taperStartYmd, taperDays, preTaperWeeks };
}

export type TaperSessions5KArgs = {
  /** First day of the taper (a Monday, unless clamped to the plan start). */
  taperStartYmd: string;
  /** Race day (YYYY-MM-DD). The taper covers [taperStartYmd, raceYmd). */
  raceYmd: string;
  /** Reduced taper volume — drives EF duration + warmup/cooldown scaling. */
  weekKm: number;
  peakKm: number;
  schedule: Schedule;
  paces?: Paces;
  vdot?: number;
};

/**
 * Lay out the taper across absolute calendar dates in [taperStartYmd, raceYmd).
 *
 * - A 20-min strides shakeout is pinned to race-eve for athletes training ≥4
 *   days/week (it stays loose without depleting glycogen).
 * - One "rappel d'allure" tune-up (3×400 @ 5K pace) lands on the latest
 *   scheduled day that still leaves ≥2 days before the race.
 * - Easies fill the remaining scheduled days.
 *
 * Returns each session with its absolute date so the engine can place it without
 * a weekly day-of-week mapping (the taper may straddle two calendar weeks).
 */
export function taperSessions5K(
  args: TaperSessions5KArgs,
): { spec: SessionSpec; dateYmd: string }[] {
  const { taperStartYmd, raceYmd, schedule } = args;

  const dates: string[] = [];
  for (let d = taperStartYmd; d < raceYmd; d = addDaysYmd(d, 1)) dates.push(d);
  if (dates.length === 0) return [];

  const availDays = new Set(
    [...new Set(schedule.availableDays)].filter((x) => x >= 0 && x <= 6),
  );
  const eve = addDaysYmd(raceYmd, -1);

  // The race itself is one of the athlete's weekly sessions, so training in the
  // race's calendar week is capped to sessionsPerWeek − 1 (the race is the Nth).
  // An extended taper can straddle two calendar weeks; days in the earlier week
  // hold no race and keep the normal budget, so only race-week days are gated.
  const raceWeekMonday = addDaysYmd(raceYmd, -isoDayOfWeek(raceYmd));
  const raceWeekBudget = Math.max(0, schedule.sessionsPerWeek - 1);
  let raceWeekUsed = 0;

  const placed: { role: Role5K; dateYmd: string }[] = [];
  const used = new Set<string>();

  // Place a role unless it would push the race week past its budget. Earlier
  // taper-week days are always allowed; race-week days are gated. Callers run in
  // priority order (shakeout → tune-up → easies), so the budget drops the
  // lowest-priority sessions first — and since easies arrive in ascending date
  // order, the ones nearest the race are shed, leaving more rest before race day.
  const tryPlace = (role: Role5K, dateYmd: string): boolean => {
    if (dateYmd >= raceWeekMonday) {
      if (raceWeekUsed >= raceWeekBudget) return false;
      raceWeekUsed += 1;
    }
    placed.push({ role, dateYmd });
    used.add(dateYmd);
    return true;
  };

  // Race-eve shakeout (≥4 sessions/week only — lower-volume athletes just rest).
  if (schedule.sessionsPerWeek >= 4 && eve >= taperStartYmd) {
    tryPlace({ kind: "easy", addStrides: true, shakeout: true }, eve);
  }

  // Scheduled training days inside the window (eve already spoken for).
  const pool = dates.filter((d) => availDays.has(isoDayOfWeek(d)) && !used.has(d));

  // Rappel d'allure: a scheduled day in the J-5→J-4 window; if the athlete trains
  // on neither, the closest scheduled day to that window, preferring more recovery
  // (the earlier day) on ties so a quality touch never drifts too close to the race.
  // Note: for a Thursday race the 4-day taper only reaches J-3, so the window sits
  // in the peak week and this falls back to the latest taper day (J-3).
  const tuneDate = pickDayNearWindow(pool, 4, 5, raceYmd);
  if (tuneDate) {
    tryPlace({ kind: "taper_tune_up" }, tuneDate);
  }

  // Easies fill what's left, up to the race-week budget.
  for (const d of pool) {
    if (used.has(d)) continue;
    tryPlace(easy(false), d);
  }

  return placed
    .sort((a, b) => (a.dateYmd < b.dateYmd ? -1 : 1))
    .flatMap(({ role, dateYmd }) => {
      const spec = roleToSessionSpec(
        role,
        {
          phase: "taper",
          weekIndexInPhase: 0,
          weekKm: args.weekKm,
          peakKm: args.peakKm,
          schedule,
          paces: args.paces,
          vdot: args.vdot,
        },
        isoDayOfWeek(dateYmd),
      );
      return spec ? [{ spec, dateYmd }] : [];
    });
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// Re-export anchor type for downstream test ergonomics.
export type { IntensityAnchor };

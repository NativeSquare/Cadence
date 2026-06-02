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
import {
  type BankEntry,
  type Composition,
  FIVE_K_PLAYBOOK as PB,
  type RoleTemplate,
  type StridesRule,
} from "./fiveKPlaybook";

// Every coaching constant and per-phase session composition now lives in the
// playbook (`PB`, see fiveKPlaybook.ts). This file is the *engine*: it reads
// `PB` and applies the structural algorithms a coach should not have to touch —
// recovery spacing (`placeRoles`), date math (`fiveKGrid`), and pace/duration
// scaling (the `lerp` helpers). Moving the data out changes nothing the plans
// produce; the values below are read straight from `PB`.

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
  /**
   * Global plan progress in [0,1] (0 = first pre-taper week, 1 = the peak week /
   * taper). Drives which entry the quality-session banks draw — together with
   * the athlete's level (VDOT), workouts get harder as the race approaches.
   * Defaults to 0 when omitted.
   */
  planProgress?: number;
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
 * Build the role "bag" for a phase at a given weekly frequency by expanding the
 * playbook's composition for that phase. Strides and the late-build alternating
 * quality slot are resolved against the week index here (see `templateToRole`).
 * The list order is irrelevant — `placeRoles` lays roles out across days for
 * spacing.
 */
function rolesForPhase(args: Microcycle5KArgs, slots: number): Role5K[] {
  if (slots <= 0) return [];
  const { phase, weekIndexInPhase: week } = args;
  switch (phase) {
    case "base":
      return expandComposition(PB.compositions.base, slots, week);
    case "build":
      return expandComposition(
        week < 2 ? PB.compositions.buildEarly : PB.compositions.buildLate,
        slots,
        week,
      );
    case "peak":
      return expandComposition(PB.compositions.peak, slots, week);
    case "taper":
      // Taper is a variable-length final block (4–10 days, race-anchored) laid
      // out by `taperSessions5K` over absolute dates — never a weekly microcycle.
      return [];
  }
}

/** Resolve a playbook strides rule against the (0-based) week index in phase. */
function resolveStrides(rule: StridesRule, week: number): boolean {
  return rule === "always" ? true : rule === "never" ? false : week % 2 === 0;
}

/** Turn a playbook role template into the engine's internal `Role5K`. */
function templateToRole(t: RoleTemplate, week: number): Role5K {
  switch (t.kind) {
    case "easy":
      return { kind: "easy", addStrides: resolveStrides(t.strides, week) };
    case "build_late_alt": {
      // Late build alternates VMA longue (even late-week) ↔ Mixte (odd), keyed
      // off `inLate = max(0, week − 2)` — the −2 offset must be preserved.
      const inLate = Math.max(0, week - 2);
      return inLate % 2 === 0 ? { kind: "vma_long" } : { kind: "mixed" };
    }
    case "sv1_long":
      return { kind: "sv1_long" };
    case "sv2":
      return { kind: "sv2" };
    case "vma_short":
      return { kind: "vma_short" };
    case "vma_long":
      return { kind: "vma_long" };
    case "mixed":
      return { kind: "mixed" };
    case "race_pace_5k":
      return { kind: "race_pace_5k" };
  }
}

/**
 * Expand a phase composition at a given weekly frequency into a role bag. Slots
 * 1–5 are explicit; 6+ falls to the `overflow` rule (`lead` templates, then
 * `slots − padBase` plain easies, then `trail`), reproducing the former
 * `default:` branches element-for-element.
 */
function expandComposition(
  c: Composition,
  slots: number,
  week: number,
): Role5K[] {
  const templates: RoleTemplate[] = c.bySlots[slots] ?? [
    ...c.overflow.lead,
    ...Array.from(
      { length: slots - c.overflow.padBase },
      (): RoleTemplate => ({ kind: "easy", strides: "never" }),
    ),
    ...c.overflow.trail,
  ];
  return templates.map((t) => templateToRole(t, week));
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
  const d = PB.constants.durationsSec;
  return Math.round(lerp(d.warmupMin, d.warmupMax, t));
}

function cooldownSeconds(weekKm: number, peakKm: number): number {
  const t = weekKm / Math.max(peakKm, 1);
  const d = PB.constants.durationsSec;
  return Math.round(lerp(d.cooldownMin, d.cooldownMax, t));
}

/** EF duration clamped 30–50 min, scaled by weekKm/peakKm within the band. */
function easyDurationSec(weekKm: number, peakKm: number): number {
  const t = weekKm / Math.max(peakKm, 1);
  const d = PB.constants.durationsSec;
  return Math.round(lerp(d.easyMin, d.easyMax, t));
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/**
 * Map an athlete's VDOT to a difficulty level in [0,1] (35 → 0, 60 → 1). Used to
 * slide the bank-selection window: fitter athletes start higher in each bank.
 * Falls back to the middle when VDOT is unknown.
 */
function levelFromVdot(vdot?: number): number {
  return vdot === undefined ? 0.5 : clamp01((vdot - 35) / 25);
}

/**
 * Pick an entry from a difficulty-ordered session bank. The athlete's `level`
 * slides a window (half the bank, rounded up) along the bank; plan `progress`
 * walks upward within that window. Result: fitter athletes draw harder
 * workouts, and within a window every athlete ramps as the race nears.
 */
export function selectBankIndex(
  len: number,
  level: number,
  progress: number,
): number {
  if (len <= 1) return 0;
  const windowSize = Math.max(1, Math.ceil(len / 2));
  const start = Math.round(clamp01(level) * (len - windowSize));
  const within = Math.round(clamp01(progress) * (windowSize - 1));
  return Math.min(len - 1, start + within);
}

/** Draw the week's entry from a bank, keyed on the athlete's level + progress. */
function pickEntry(bank: BankEntry[], args: Microcycle5KArgs): BankEntry {
  const idx = selectBankIndex(
    bank.length,
    levelFromVdot(args.vdot),
    clamp01(args.planProgress ?? 0),
  );
  return bank[idx]!;
}

type TimeEntry = Extract<BankEntry, { kind: "time" }>;
type DistEntry = Extract<BankEntry, { kind: "dist" }>;
type PacedEntry = Extract<BankEntry, { kind: "paced" }>;
type MixteEntry = Extract<BankEntry, { kind: "mixte" }>;

/** km estimate for a session label/guard. Structure stays the source of truth. */
type Built = { spec: StructureSpec; distanceKm: number };

/** Time-based interval blocks (SV1 long @ SV1, SV2 @ T) → `long_with_blocks`. */
function buildTime(
  e: TimeEntry,
  wu: number,
  cd: number,
  ePace: number,
  workIntensity: IntensityAnchor,
): Built {
  const spec: StructureSpec = {
    kind: "long_with_blocks",
    warmupSec: wu,
    cooldownSec: cd,
    reps: e.reps,
    workDurationSec: e.workSec,
    recoveryDurationSec: e.recoverySec,
    workIntensity,
  };
  const totalSec = wu + cd + e.reps * (e.workSec + e.recoverySec);
  return { spec, distanceKm: round1(ePace > 0 ? (ePace * totalSec) / 1000 : 12) };
}

/** Distance intervals @ a training anchor (VMA courte/longue @ I). */
function buildDist(
  e: DistEntry,
  wu: number,
  cd: number,
  ePace: number,
  repIntensity: IntensityAnchor,
): Built {
  const spec: StructureSpec = {
    kind: "intervals_distance",
    warmupSec: wu,
    cooldownSec: cd,
    reps: e.reps,
    repDistanceM: e.repDistanceM,
    repIntensity,
    recoverySec: e.recoverySec,
  };
  const totalM =
    ePace * (wu + cd + e.reps * e.recoverySec) + e.reps * e.repDistanceM;
  return { spec, distanceKm: round1(totalM / 1000) };
}

/** Distance intervals at an explicit pace (allure spé, taper rappel @ 5K pace). */
function buildPaced(
  e: PacedEntry,
  wu: number,
  cd: number,
  ePace: number,
  targetPaceMps: number,
): Built {
  const spec: StructureSpec = {
    kind: "intervals_paced",
    warmupSec: wu,
    cooldownSec: cd,
    reps: e.reps,
    repDistanceM: e.repDistanceM,
    targetPaceMps,
    recoverySec: e.recoverySec,
  };
  const totalM =
    ePace * (wu + cd + e.reps * e.recoverySec) + e.reps * e.repDistanceM;
  return { spec, distanceKm: round1(totalM / 1000) };
}

/** Mixte: a time block @ T (SV2) → bridge → a distance block @ I (VMA courte). */
function buildMixte(
  e: MixteEntry,
  wu: number,
  cd: number,
  ePace: number,
  tPace: number,
): Built {
  const { first, second, bridgeSec } = e;
  const spec: StructureSpec = {
    kind: "mixed",
    warmupSec: wu,
    cooldownSec: cd,
    first: {
      reps: first.reps,
      workDurationSec: first.workSec,
      repIntensity: "T",
      recoverySec: first.recoverySec,
    },
    second: {
      reps: second.reps,
      repDistanceM: second.repDistanceM,
      repIntensity: "I",
      recoverySec: second.recoverySec,
    },
    bridgeSec,
  };
  // First block runs at T pace; everything else (recoveries, bridge) at E.
  const firstWorkM = (tPace > 0 ? tPace : ePace) * first.reps * first.workSec;
  const totalM =
    ePace *
      (wu +
        cd +
        first.reps * first.recoverySec +
        bridgeSec +
        second.reps * second.recoverySec) +
    firstWorkM +
    second.reps * second.repDistanceM;
  return { spec, distanceKm: round1(totalM / 1000) };
}

function roleToSessionSpec(
  role: Role5K,
  args: Microcycle5KArgs,
  dayOfWeek: number,
): SessionSpec | null {
  const C = PB.constants;
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
        ? C.durationsSec.shakeout
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
      // Long run with SV1-pace time blocks. Drawn from the SV1 bank by level +
      // plan progress (e.g. 3×6min easiest → 2×20min hardest).
      const e = pickEntry(PB.banks.sv1Long, args);
      if (e.kind !== "time") return null;
      const { spec, distanceKm } = buildTime(e, wu, cd, ePace, "SV1");
      return { ...base, type: "long", intensity: "SV1", distanceKm, structureSpec: spec };
    }
    case "sv2": {
      // Threshold time blocks @ T (e.g. 5×3min → 3×12min), drawn from the bank.
      const e = pickEntry(PB.banks.sv2, args);
      if (e.kind !== "time") return null;
      const { spec, distanceKm } = buildTime(e, wu, cd, ePace, "T");
      return { ...base, type: "intervals", intensity: "T", distanceKm, structureSpec: spec };
    }
    case "vma_short": {
      // Short VO₂max distance reps @ I (200–400m), drawn from the bank.
      const e = pickEntry(PB.banks.vmaShort, args);
      if (e.kind !== "dist") return null;
      const { spec, distanceKm } = buildDist(e, wu, cd, ePace, "I");
      return { ...base, type: "intervals", intensity: "I", distanceKm, structureSpec: spec };
    }
    case "vma_long": {
      // Long VO₂max distance reps @ I (600–800m), drawn from the bank.
      const e = pickEntry(PB.banks.vmaLong, args);
      if (e.kind !== "dist") return null;
      const { spec, distanceKm } = buildDist(e, wu, cd, ePace, "I");
      return { ...base, type: "intervals", intensity: "I", distanceKm, structureSpec: spec };
    }
    case "mixed": {
      // SV2 time block @ T → bridge → VMA-courte distance block @ I.
      const e = pickEntry(PB.banks.mixed, args);
      if (e.kind !== "mixte") return null;
      const { spec, distanceKm } = buildMixte(e, wu, cd, ePace, paces?.T ?? 0);
      return { ...base, type: "intervals", intensity: "I", distanceKm, structureSpec: spec };
    }
    case "race_pace_5k": {
      // Allure spé: distance reps at the 5K race pace, drawn from the bank.
      const e = pickEntry(PB.banks.racePace, args);
      if (e.kind !== "paced") return null;
      const racePace = vdot ? fiveKPaceMps(vdot) : 0;
      const { spec, distanceKm } = buildPaced(e, wu, cd, ePace, racePace);
      return { ...base, type: "intervals", intensity: "I", distanceKm, structureSpec: spec };
    }
    case "taper_tune_up": {
      // Rappel d'allure: a single tune-up at 5K pace. Drawn from the rappel bank
      // by level (progress is pinned to 1 by the taper — it's the plan's end).
      const e = pickEntry(PB.banks.rappel, args);
      if (e.kind !== "paced") return null;
      const racePace = vdot ? fiveKPaceMps(vdot) : 0;
      const { spec, distanceKm } = buildPaced(e, wu, cd, ePace, racePace);
      return { ...base, type: "intervals", intensity: "I", distanceKm, structureSpec: spec };
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
  const t = PB.taper.taperDays;
  return raceDow <= t.earlyWeekCutoffDow
    ? raceDow + t.earlyAddend
    : raceDow + t.lateAddend;
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
  const raceWeekBudget = Math.max(
    0,
    schedule.sessionsPerWeek - PB.taper.raceWeekBudgetOffset,
  );
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
  if (
    schedule.sessionsPerWeek >= PB.taper.shakeoutMinSessionsPerWeek &&
    eve >= taperStartYmd
  ) {
    tryPlace({ kind: "easy", addStrides: true, shakeout: true }, eve);
  }

  // Scheduled training days inside the window (eve already spoken for).
  const pool = dates.filter((d) => availDays.has(isoDayOfWeek(d)) && !used.has(d));

  // Rappel d'allure: a scheduled day in the J-5→J-4 window; if the athlete trains
  // on neither, the closest scheduled day to that window, preferring more recovery
  // (the earlier day) on ties so a quality touch never drifts too close to the race.
  // Note: for a Thursday race the 4-day taper only reaches J-3, so the window sits
  // in the peak week and this falls back to the latest taper day (J-3).
  const tuneWindow = PB.taper.tuneUpWindowDaysBeforeRace;
  const tuneDate = pickDayNearWindow(pool, tuneWindow.lo, tuneWindow.hi, raceYmd);
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
          // The taper is the plan's end: draw the tune-up from the top of the
          // level-windowed rappel bank.
          planProgress: 1,
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

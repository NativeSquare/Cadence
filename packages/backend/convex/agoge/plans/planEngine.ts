/**
 * Distance-agnostic weekly microcycle + taper engine. Driven by a `Playbook`
 * (the coaching data — compositions, banks, durations, taper rules) plus a
 * `racePaceMps` function (how to turn a VDOT into the race pace for this
 * distance). `fiveK.ts` and `tenK.ts` are thin adapters that bind a concrete
 * playbook + race-pace function and re-export the named entry points.
 *
 * Each phase has an explicit session composition per weekly frequency (2→6+),
 * matching the coaching templates. Strides ("lignes droites") are assigned
 * explicitly per template — not positionally. The composition (the role "bag")
 * is decided per phase/frequency, then `placeRoles` lays it out across the
 * athlete's available days for recovery spacing.
 *
 * Philosophy (per coaching templates):
 * - Base:           EF (+strides) + VMA courte (every week) + Seuil SV1 long.
 * - Construction-début (build week 0–1): EF + SV2 / VMA / SV1 long, scaled by frequency.
 * - Construction-fin  (build week 2+): EF + quality + SV1 long. 5K uses an
 *   alternating VMA longue ↔ Mixte slot; 10K uses race-pace (moderate) + VMA courte.
 * - Spécifique (peak): easy runs + the race-specific session (race_pace "big") only.
 * - Taper:           rappel d'allure + EFs + a 20-min strides shakeout pinned to
 *   the day before the race (the race itself is emitted separately).
 *
 * Constraints:
 * - EF duration clamped between the playbook's easyMin/easyMax (derived from E pace);
 *   shakeout is a fixed 20 min.
 * - Warmup scaled within the playbook's band (long runs may use a wider band),
 *   cooldown scaled within its band, both linearly with weekKm/peakKm.
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
  type IntensityAnchor,
  isoDayOfWeek,
  type Paces,
  pickTrainingDays,
  type Schedule,
  type SessionSpec,
  type StructureSpec,
} from "../periodization";
import type {
  BankEntry,
  Composition,
  MarathonLongBankId,
  Playbook,
  RacePaceBankId,
  RoleTemplate,
  StridesRule,
  Sv2BankId,
} from "./planPlaybook";

// ---------------------------------------------------------------------------
// Engine spec — what binds the generic engine to a concrete distance.
// ---------------------------------------------------------------------------

export type PlanEngineSpec = {
  /** The coaching data for this distance (5K / 10K / …). */
  playbook: Playbook;
  /** VDOT → race pace (m/s) for this distance's race-pace and rappel sessions. */
  racePaceMps: (vdot: number) => number;
};

// ---------------------------------------------------------------------------
// Plan-scoped memory — the cross-week state that lets a plan progress and vary
// (coach Mathieu Bert's rules). Created fresh per `buildPlan` call (so the build
// stays deterministic: same inputs → same plan) and threaded into every
// `microcycle` / `taperSessions` call, mutating as sessions are emitted.
// ---------------------------------------------------------------------------

export type PlanMemory = {
  /**
   * Bank id → the set of entry indices already drawn this plan. Session
   * selection prefers never-used entries (R4: "ne jamais utiliser 2 fois la même
   * séance"), falling back to reuse only when a bank is exhausted.
   */
  usedBankIdx: Map<string, Set<number>>;
  /**
   * The `round1` km already assigned to an easy run this plan. New easies are
   * nudged off a collision so no two share an exact distance (R4: "jamais 2 fois
   * 8,2 km").
   */
  usedEasyKm: Set<number>;
  /** Previous week's long-run km — caps week-over-week growth at +10% (R1). */
  prevLongKm?: number;
};

export const newPlanMemory = (): PlanMemory => ({
  usedBankIdx: new Map(),
  usedEasyKm: new Set(),
});

// ---------------------------------------------------------------------------
// Args + role types
// ---------------------------------------------------------------------------

export type MicrocycleArgs = {
  phase: BlockType;
  weekIndexInPhase: number; // 0-based
  weekKm: number;
  schedule: Schedule;
  peakKm: number;
  paces?: Paces;
  vdot?: number;
  /**
   * Race ISO day-of-week (0=Mon…6=Sun). Only consulted for the peak phase: the
   * last race-pace session must land 8–10 days before the race (see `microcycle`).
   * When omitted, the peak session keeps its natural latest-day placement.
   */
  raceDow?: number;
  /**
   * Global plan progress in [0,1] (0 = first pre-taper week, 1 = the peak week /
   * taper). Drives which entry the quality-session banks draw — together with
   * the athlete's level (VDOT), workouts get harder as the race approaches.
   * Defaults to 0 when omitted.
   */
  planProgress?: number;
  /**
   * The previous week's last hard day-of-week (0=Mon…6=Sun), or undefined for the
   * first week. Threaded across the Mon→Sun boundary so `placeRoles` keeps a
   * recovery gap — e.g. a Sunday SV1 long must not be followed by a Monday
   * quality. See `minHardDowAfter` / `lastHardDow`.
   */
  prevLastHardDow?: number;
  /**
   * When set, this composition is expanded directly instead of switching on
   * `phase` — used by `buildPlan` to lay out the taper's `leadWeeks` (the
   * half-marathon's affûtage week 1) as a normal Mon→Sun microcycle.
   */
  compositionOverride?: Composition;
  /**
   * When set, the long run lands mid-week instead of on the latest day — the
   * marathon's affûtage week 2 (`leadWeeks[1].longRunMidWeek`).
   */
  longRunMidWeek?: boolean;
  /**
   * Cross-week plan memory (bank-entry dedup, easy-distance uniqueness, long-run
   * smoothing). Threaded by `buildPlan`; undefined → no dedup/smoothing (each
   * week independent, the pre-rules behaviour).
   */
  memory?: PlanMemory;
  /**
   * Number of weeks in the `base` phase, so the base easy ramp (40→60min) can
   * progress by base-week index rather than `weekKm/peakKm` (R3). Undefined →
   * the global volume-ratio scaling.
   */
  baseWeeks?: number;
  /**
   * This week's target long-run km — a smooth, ≤10%/week progressive curve
   * computed by `buildPlan` (R1). The long-run builder flexes its endurance
   * lead-in toward this. Undefined → emergent long-run distance (pre-rules).
   */
  longRunTargetKm?: number;
};

type PlanRole =
  | { kind: "easy"; addStrides: boolean; shakeout?: boolean }
  | { kind: "sv1_long" }
  | { kind: "sv2"; bank?: Sv2BankId }
  | { kind: "vma_short" }
  | { kind: "vma_long" }
  | { kind: "mixed" }
  | { kind: "race_pace"; bank: RacePaceBankId }
  | { kind: "long_race_pace"; bank: MarathonLongBankId }
  | { kind: "taper_tune_up" };

/**
 * The week's "long run" — the latest hard day, placed separately by `placeRoles`.
 * Covers both the SV1 long (5K/10K/half) and the marathon's race-pace long run.
 */
function isLongRunRole(r: PlanRole): boolean {
  return r.kind === "sv1_long" || r.kind === "long_race_pace";
}

const easyRole = (addStrides = false): PlanRole => ({
  kind: "easy",
  addStrides,
});

/**
 * Raise a schedule's `sessionsPerWeek` to a phase floor (e.g. marathon's "quand
 * 2 séances → passer à 3"), bounded by the athlete's available-day count so we
 * never ask for more days than exist. A `min` of undefined leaves it untouched.
 */
function floorSchedule(schedule: Schedule, min: number | undefined): Schedule {
  if (min === undefined) return schedule;
  const available = new Set(
    schedule.availableDays.filter((d) => d >= 0 && d <= 6),
  ).size;
  const target = Math.min(Math.max(schedule.sessionsPerWeek, min), available);
  return target === schedule.sessionsPerWeek
    ? schedule
    : { ...schedule, sessionsPerWeek: target };
}

/** Quality = anything that isn't an easy run. The long run is handled separately
 * by `placeRoles` (it owns the latest day), so it's excluded here. */
function isQuality(r: PlanRole): boolean {
  return r.kind !== "easy" && !isLongRunRole(r);
}

/**
 * The earliest day-of-week (0=Mon…6=Sun) a hard session may occupy this week so
 * it sits ≥2 days after the previous week's last hard day, measured across the
 * Mon→Sun boundary. A day `d` this week is `d + 7 − prevLastHardDow` days after
 * that hard, so the gap ≥ 2 requires `d ≥ prevLastHardDow − 5`. Only a Sunday
 * predecessor (6 → Monday forbidden) actually constrains placement; everything
 * earlier yields ≤ 0 (no constraint). Undefined predecessor → 0.
 */
function minHardDowAfter(prevLastHardDow: number | undefined): number {
  if (prevLastHardDow === undefined) return 0;
  return Math.max(0, prevLastHardDow - 5);
}

/**
 * The latest day-of-week (0=Mon…6=Sun) among this week's hard sessions (anything
 * that isn't an easy run), or undefined when the week is all easy. Threaded into
 * the next week's microcycle as `prevLastHardDow` to preserve the cross-boundary
 * recovery gap.
 */
export function lastHardDow(sessions: SessionSpec[]): number | undefined {
  return sessions.reduce<number | undefined>(
    (latest, s) =>
      s.type !== "easy" && (latest === undefined || s.dayOfWeek > latest)
        ? s.dayOfWeek
        : latest,
    undefined,
  );
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
function rolesForPhase(
  pb: Playbook,
  args: MicrocycleArgs,
  slots: number,
): PlanRole[] {
  if (slots <= 0) return [];
  const { phase, weekIndexInPhase: week } = args;
  // A leadWeek (taper week 1) supplies its own composition, expanded directly.
  if (args.compositionOverride) {
    return expandComposition(args.compositionOverride, slots, week);
  }
  switch (phase) {
    case "base":
      return expandComposition(pb.compositions.base, slots, week);
    case "build": {
      // Construction-début (buildEarly) covers the first `buildEarlyWeeks` build
      // weeks (default 2; marathon 3), construction-fin (buildLate) the rest.
      const earlyWeeks = pb.phases?.buildEarlyWeeks ?? 2;
      return expandComposition(
        week < earlyWeeks ? pb.compositions.buildEarly : pb.compositions.buildLate,
        slots,
        week,
      );
    }
    case "peak":
      return expandComposition(pb.compositions.peak, slots, week);
    case "taper":
      // Taper is a variable-length final block (4–10 days, race-anchored) laid
      // out by `taperSessions` over absolute dates — never a weekly microcycle.
      return [];
  }
}

/** Resolve a playbook strides rule against the (0-based) week index in phase. */
function resolveStrides(rule: StridesRule, week: number): boolean {
  return rule === "always" ? true : rule === "never" ? false : week % 2 === 0;
}

/** Turn a playbook role template into the engine's internal `PlanRole`. */
function templateToRole(t: RoleTemplate, week: number): PlanRole {
  switch (t.kind) {
    case "easy":
      return { kind: "easy", addStrides: resolveStrides(t.strides, week) };
    case "build_late_alt": {
      // Late build alternates VMA longue (even late-week) ↔ Mixte (odd), keyed
      // off `inLate = max(0, week − 2)` — the −2 offset must be preserved.
      const inLate = Math.max(0, week - 2);
      return inLate % 2 === 0 ? { kind: "vma_long" } : { kind: "mixed" };
    }
    case "build_early_alt":
      // Early build alternates VMA longue (week 0) ↔ VMA courte (week 1) — the
      // half-marathon's "début construction" longue-then-courte progression.
      return week % 2 === 0 ? { kind: "vma_long" } : { kind: "vma_short" };
    case "marathon_build_early_alt":
      // Marathon "début construction" alternates SV2 (even weeks 0 & 2) ↔ VMA
      // longue (odd week 1) — coach: 1ère & 3ème semaine SV2, 2ème VMA longue.
      return week % 2 === 0 ? { kind: "sv2" } : { kind: "vma_long" };
    case "sv1_long":
      return { kind: "sv1_long" };
    case "long_race_pace":
      return { kind: "long_race_pace", bank: t.bank };
    case "sv2":
      return { kind: "sv2", bank: t.bank };
    case "vma_short":
      return { kind: "vma_short" };
    case "vma_long":
      return { kind: "vma_long" };
    case "mixed":
      return { kind: "mixed" };
    case "race_pace":
      return { kind: "race_pace", bank: t.bank };
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
): PlanRole[] {
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

// Taper roles are assigned over absolute calendar dates by `taperSessions`
// (see below), not through the weekly microcycle.

/**
 * Lay roles out across available days for recovery spacing. Weeks are Mon→Sun
 * (anchor = Monday), so "latest" means closest to Sunday — the natural end of
 * the calendar week.
 *
 * - Hard days (qualities + SV1 long) are spread evenly across the week for
 *   maximum recovery between them; the latest hard slot is Sunday-most, so the
 *   SV1 long (base/build) or a race-pace session (peak) lands as the final hard
 *   touch before the taper. With two peak sessions, they spread to the first
 *   and last hard slots.
 * - Easies fill the rest.
 *
 * The latest `roles.length` days are used — drops the earliest when there are
 * more available days than roles.
 */
function placeRoles(
  roles: PlanRole[],
  days: number[],
  anchor: number,
  minFirstHardDay = 0,
  longRunMidWeek = false,
): { role: PlanRole; dayOfWeek: number }[] {
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

  // The long run is the latest hard day (placed last in the `hard` list below),
  // unless `longRunMidWeek` pulls it into the week's middle (marathon affûtage 2).
  const longIdx = roles.findIndex(isLongRunRole);
  const qualityIdxs: number[] = [];
  const easyIdxs: number[] = [];
  roles.forEach((r, i) => {
    if (i === longIdx) return;
    if (isQuality(r)) qualityIdxs.push(i);
    else easyIdxs.push(i);
  });

  const hi = m - 1;

  // Earliest slot whose day-of-week clears the cross-boundary recovery gap (so a
  // Sunday hard last week doesn't get a Monday hard this week). 0 in the common
  // case (no constraint, or the earliest day already clears it). Falls back to 0
  // if no slot qualifies, so the week is never left without hard days.
  let lo = 0;
  while (lo < m && slotDays[lo]! < minFirstHardDay) lo++;
  if (lo > hi) lo = 0;

  if (longRunMidWeek && longIdx >= 0) {
    // Marathon affûtage week 2: the long sits mid-week (≈the 2nd session), not on
    // the latest day. Place it at slot 1 (or 0 in a tiny week), then seat the
    // remaining qualities on the later slots with ≥2-day gaps; easies fill.
    const longSlot = Math.min(1, hi);
    place(longSlot, longIdx);
    let lastDay = slotDays[longSlot]!;
    let qi = 0;
    for (let s = longSlot + 1; s < m && qi < qualityIdxs.length; s++) {
      if (taken[s]) continue;
      const d = slotDays[s]!;
      if (d - lastDay < 2) continue;
      place(s, qualityIdxs[qi]!);
      lastDay = d;
      qi++;
    }
  } else if (lo === 0) {
    // Unconstrained: hard days (qualities then the long run, the latest hard day)
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
  } else {
    // Seam active (only after a Sunday hard with Monday in the schedule): keep the
    // SV1 long on the latest day and pack the remaining hard toward the front from
    // `lo`, each ≥2 days after the previous and ≥2 before the long. Even-spreading
    // into a shortened range would crowd the long (e.g. Sat+Sun); front-packing
    // preserves the ≥2-day gaps. Any quality the gap rule can't seat falls to the
    // safety net below.
    const longDay = longIdx >= 0 ? slotDays[hi]! : undefined;
    if (longIdx >= 0) place(hi, longIdx);
    let lastDay = Number.NEGATIVE_INFINITY;
    let qi = 0;
    for (let s = lo; s < m && qi < qualityIdxs.length; s++) {
      if (taken[s]) continue;
      const d = slotDays[s]!;
      if (d - lastDay < 2) continue;
      if (longDay !== undefined && longDay - d < 2) break;
      place(s, qualityIdxs[qi]!);
      lastDay = d;
      qi++;
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

  const result: { role: PlanRole; dayOfWeek: number }[] = [];
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

/**
 * Warmup seconds scaled by weekKm/peakKm. Long runs (`isLongRun`) use the
 * playbook's wider long-run band when present — the lever for adding endurance
 * volume to the weekend long run without lengthening every easy day; every other
 * session uses the default band.
 */
function warmupSeconds(
  pb: Playbook,
  weekKm: number,
  peakKm: number,
  isLongRun = false,
): number {
  const t = weekKm / Math.max(peakKm, 1);
  const d = pb.constants.durationsSec;
  const lo =
    isLongRun && d.longRunWarmupMin !== undefined
      ? d.longRunWarmupMin
      : d.warmupMin;
  const hi =
    isLongRun && d.longRunWarmupMax !== undefined
      ? d.longRunWarmupMax
      : d.warmupMax;
  return Math.round(lerp(lo, hi, t));
}

/**
 * Cooldown seconds scaled by weekKm/peakKm. Long runs (`isLongRun`) use the
 * playbook's wider long-run cooldown band when present (the cooldown sibling of
 * `warmupSeconds`'s long-run band); every other session uses the default band.
 */
function cooldownSeconds(
  pb: Playbook,
  weekKm: number,
  peakKm: number,
  isLongRun = false,
): number {
  const t = weekKm / Math.max(peakKm, 1);
  const d = pb.constants.durationsSec;
  const lo =
    isLongRun && d.longRunCooldownMin !== undefined
      ? d.longRunCooldownMin
      : d.cooldownMin;
  const hi =
    isLongRun && d.longRunCooldownMax !== undefined
      ? d.longRunCooldownMax
      : d.cooldownMax;
  return Math.round(lerp(lo, hi, t));
}

/**
 * EF duration within the playbook band. In `base`, it ramps by base-week index
 * from `baseEasyMin` → `baseEasyMax` (~40min → 1h) regardless of weekly volume —
 * extra base volume is routed to the long run, not the easies (coach Mathieu
 * Bert, R3). Every other phase scales the band by `weekKm/peakKm` as before.
 */
function easyDurationSec(pb: Playbook, args: MicrocycleArgs): number {
  const d = pb.constants.durationsSec;
  if (args.phase === "base") {
    const lo = d.baseEasyMin ?? d.easyMin;
    const hi = d.baseEasyMax ?? d.easyMax;
    const bw = args.baseWeeks ?? 1;
    // Ramp by base-week index; a 1-week (or unknown-length) base starts gentle.
    const t = bw <= 1 ? 0 : (args.weekIndexInPhase ?? 0) / (bw - 1);
    return Math.round(lerp(lo, hi, clamp01(t)));
  }
  const t = args.weekKm / Math.max(args.peakKm, 1);
  return Math.round(lerp(d.easyMin, d.easyMax, t));
}

/**
 * The full legitimate easy-duration band, spanning both the volume-scaled band
 * (easyMin/Max) and the base ramp band (baseEasyMin/Max). Used to bound the
 * easy-variety spread + uniqueness nudge so they stay within sanctioned easy
 * durations.
 */
function easyBand(pb: Playbook): { min: number; max: number } {
  const d = pb.constants.durationsSec;
  return {
    min: Math.min(d.easyMin, d.baseEasyMin ?? d.easyMin),
    max: Math.max(d.easyMax, d.baseEasyMax ?? d.easyMax),
  };
}

/** Re-stamp an easy session's duration + km label together (km tracks duration). */
function setEasyDuration(s: SessionSpec, ePace: number, durSec: number): void {
  const d = Math.max(15 * 60, Math.round(durSec));
  if (s.structureSpec?.kind === "easy_continuous") {
    s.structureSpec.durationSec = d;
  }
  s.distanceKm = round1((ePace * d) / 1000);
}

/**
 * Vary a group of easy runs so no two are alike and the plan never repeats an
 * easy distance (coach Mathieu Bert: "jamais 2 easy de la même durée/distance";
 * "jamais 2 fois 8,2 km"). The group is spread symmetrically around its own mean
 * — one shorter, one longer, so the total volume is preserved — then each is
 * nudged off any distance already used elsewhere in the plan. Mutates in place.
 */
function diversifyEasies(
  easies: SessionSpec[],
  ePace: number,
  band: { min: number; max: number },
  memory: PlanMemory | undefined,
): void {
  if (ePace <= 0 || easies.length === 0) return;
  const SPREAD_STEP = 5 * 60; // 5 min between consecutive easies in a week
  const NUDGE = 20; // seconds per uniqueness nudge (~0.1 km at easy pace)
  // Strides ("lignes droites") add a fixed 6×(100m + 100m) = 1.2 km to the
  // *displayed* distance, so the uniqueness key must include them — else a
  // strided and a plain easy can collide on the card even at different durations.
  const STRIDES_M = 1200;
  const n = easies.length;

  const durOf = (s: SessionSpec): number =>
    s.structureSpec?.kind === "easy_continuous"
      ? s.structureSpec.durationSec
      : 0;
  const stridesM = (s: SessionSpec): number =>
    s.structureSpec?.kind === "easy_continuous" && s.structureSpec.addStrides
      ? STRIDES_M
      : 0;
  /** The km the athlete sees for this easy (footing + any strides). */
  const labelKm = (s: SessionSpec, durSec: number): number =>
    round1((ePace * durSec + stridesM(s)) / 1000);
  const meanSec = easies.reduce((sum, e) => sum + durOf(e), 0) / n;

  // 1) Volume-preserving spread around the mean, clamped to the easy band.
  easies.forEach((e, i) => {
    const offset = (i - (n - 1) / 2) * SPREAD_STEP;
    const dur = Math.min(band.max, Math.max(band.min, meanSec + offset));
    setEasyDuration(e, ePace, dur);
  });

  // 2) Nudge each off a distance already claimed in the plan. Step by ~one 0.1km
  // bucket of duration and search outward (alternating shorter/longer) for a free
  // bucket, staying inside the legitimate easy band — so the nudge never makes an
  // easy run un-easy. A duplicate is accepted only when the whole band is full.
  if (!memory) return;
  const bucketSec = Math.max(NUDGE, Math.round(100 / ePace)); // ≈ 0.1 km
  const maxSteps = Math.ceil((band.max - band.min) / bucketSec) + 1;
  for (const e of easies) {
    let dur = durOf(e);
    let km = labelKm(e, dur);
    if (memory.usedEasyKm.has(km)) {
      for (let k = 1; k <= maxSteps * 2; k++) {
        const delta = (k % 2 === 1 ? 1 : -1) * bucketSec * Math.ceil(k / 2);
        const cand = Math.min(band.max, Math.max(band.min, dur + delta));
        const candKm = labelKm(e, cand);
        if (!memory.usedEasyKm.has(candKm)) {
          dur = cand;
          km = candKm;
          break;
        }
      }
      setEasyDuration(e, ePace, dur);
    }
    memory.usedEasyKm.add(km);
  }
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

/**
 * Pick an index near `preferred` that hasn't been drawn from `bankKey` yet,
 * scanning outward and preferring the harder (upward) direction on ties. When
 * the bank is exhausted (every index used), `preferred` is reused. Records the
 * chosen index in memory. With no memory, returns `preferred` unchanged.
 */
function chooseUnusedIndex(
  len: number,
  preferred: number,
  bankKey: string,
  memory: PlanMemory | undefined,
): number {
  if (!memory || len <= 1) return preferred;
  let used = memory.usedBankIdx.get(bankKey);
  if (!used) {
    used = new Set<number>();
    memory.usedBankIdx.set(bankKey, used);
  }
  let chosen = preferred;
  if (used.has(preferred)) {
    for (let d = 1; d < len; d++) {
      const up = preferred + d;
      if (up < len && !used.has(up)) {
        chosen = up;
        break;
      }
      const down = preferred - d;
      if (down >= 0 && !used.has(down)) {
        chosen = down;
        break;
      }
    }
  }
  used.add(chosen);
  return chosen;
}

/**
 * Draw the week's entry from a bank, keyed on the athlete's level + progress,
 * then nudged off any already-used index so the same session isn't repeated
 * while a fresh one remains (R4). `bankKey` identifies the bank in plan memory.
 */
function pickEntry(
  bank: BankEntry[],
  args: MicrocycleArgs,
  bankKey: string,
): BankEntry {
  const preferred = selectBankIndex(
    bank.length,
    levelFromVdot(args.vdot),
    clamp01(args.planProgress ?? 0),
  );
  const idx = chooseUnusedIndex(bank.length, preferred, bankKey, args.memory);
  return bank[idx]!;
}

type TimeEntry = Extract<BankEntry, { kind: "time" }>;
type DistEntry = Extract<BankEntry, { kind: "dist" }>;
type PacedEntry = Extract<BankEntry, { kind: "paced" }>;
type PacedTimeEntry = Extract<BankEntry, { kind: "pacedTime" }>;
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
  return {
    spec,
    distanceKm: round1(ePace > 0 ? (ePace * totalSec) / 1000 : 12),
  };
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

/** Distance intervals at an explicit pace (allure spé, taper rappel @ race pace). */
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

/** Time-terminated reps at an explicit pace (allure spé "pics" 3×15min / 4×10min). */
function buildPacedTime(
  e: PacedTimeEntry,
  wu: number,
  cd: number,
  ePace: number,
  targetPaceMps: number,
): Built {
  const spec: StructureSpec = {
    kind: "intervals_paced_time",
    warmupSec: wu,
    cooldownSec: cd,
    reps: e.reps,
    workDurationSec: e.workSec,
    targetPaceMps,
    recoverySec: e.recoverySec,
  };
  // Work runs at race pace; warmup/cooldown/recoveries at E.
  const pace = targetPaceMps > 0 ? targetPaceMps : ePace;
  const totalM =
    pace * e.reps * e.workSec + ePace * (wu + cd + e.reps * e.recoverySec);
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

/**
 * Smooth the long run (coach Mathieu Bert, R1): it must never grow more than
 * 10%/week, and should progress steadily toward its target distances. Given the
 * emergent long-run distance (work blocks at their pace, the easy-pace lead-in +
 * recoveries at E), this fits the easy-pace **lead-in** (warmup + cooldown — the
 * endurance-volume lever) so the realised distance lands within
 * `[prev, prev × 1.10]` through base/build/peak (`progressive`), or merely under
 * the +10% cap in the taper. Returns the fitted warmup/cooldown + final km and
 * records it as the new `prevLongKm`.
 */
function fitLongRun(
  workDistM: number,
  recTotalSec: number,
  wu: number,
  cd: number,
  ePace: number,
  progressive: boolean,
  memory: PlanMemory | undefined,
): { wu: number; cd: number; km: number } {
  const realKm = (w: number, c: number) =>
    (ePace * (w + c + recTotalSec) + workDistM) / 1000;
  const emergentKm = realKm(wu, cd);

  let targetKm = emergentKm;
  const prev = memory?.prevLongKm;
  if (prev !== undefined) {
    const cap = prev * 1.1;
    const floor = progressive ? prev : 0;
    targetKm = Math.min(cap, Math.max(floor, emergentKm));
  }

  let nwu = wu;
  let ncd = cd;
  if (ePace > 0 && Math.abs(targetKm - emergentKm) > 1e-9 && wu + cd > 0) {
    const neededLeadSec = Math.max(
      0,
      (targetKm * 1000 - ePace * recTotalSec - workDistM) / ePace,
    );
    // Bound the lead-in to ≤2× its emergent size so flexing up to hold the long
    // run on a cutback week never yields an absurd warmup.
    const scale = Math.min(2, neededLeadSec / (wu + cd));
    nwu = Math.round(wu * scale);
    ncd = Math.round(cd * scale);
  }

  const km = round1(realKm(nwu, ncd));
  if (memory) memory.prevLongKm = km;
  return { wu: nwu, cd: ncd, km };
}

function roleToSessionSpec(
  spec: PlanEngineSpec,
  role: PlanRole,
  args: MicrocycleArgs,
  dayOfWeek: number,
): SessionSpec | null {
  const pb = spec.playbook;
  const C = pb.constants;
  const { weekKm, peakKm, paces, vdot, weekIndexInPhase } = args;
  const wu = warmupSeconds(pb, weekKm, peakKm);
  const cd = cooldownSeconds(pb, weekKm, peakKm);
  const ePace = paces?.E ?? 0;

  const base = {
    dayOfWeek,
    weekIndexInPhase,
  };

  // Distance approximations for the SessionSpec label (structure remains
  // the source of truth; this is used by the engine to filter <500m sessions
  // and to display rough km on cards). Compute from the structure where
  // possible; else estimate.
  const easyKm =
    ePace > 0 ? (ePace * easyDurationSec(pb, args)) / 1000 : 8;

  switch (role.kind) {
    case "easy": {
      // Shakeout = fixed 20-min activation run the day before the race; a
      // normal easy scales within the playbook band with volume.
      const durationSec = role.shakeout
        ? C.durationsSec.shakeout
        : easyDurationSec(pb, args);
      const structureSpec: StructureSpec = {
        kind: "easy_continuous",
        durationSec,
        addStrides: role.addStrides,
      };
      return {
        ...base,
        type: "easy",
        intensity: "E",
        distanceKm: round1(ePace > 0 ? (ePace * durationSec) / 1000 : easyKm),
        structureSpec,
      };
    }
    case "sv1_long": {
      // Long run with SV1-pace time blocks. Drawn from the SV1 bank by level +
      // plan progress (e.g. 3×6min easiest → 2×20min hardest). The long run uses
      // the wider warmup band (the endurance lead-in) when the playbook sets one.
      const e = pickEntry(pb.banks.sv1Long, args, "sv1Long");
      if (e.kind !== "time") return null;
      const baseWu = warmupSeconds(pb, weekKm, peakKm, true);
      const baseCd = cooldownSeconds(pb, weekKm, peakKm, true);
      // Work runs at SV1; lead-in + recoveries at E — match `summarizeStructure`
      // so the smoothing acts on the distance the athlete actually sees.
      const sv1Pace = paces?.SV1 ?? ePace;
      const fit = fitLongRun(
        (sv1Pace > 0 ? sv1Pace : ePace) * e.reps * e.workSec,
        e.reps * e.recoverySec,
        baseWu,
        baseCd,
        ePace,
        args.phase !== "taper",
        args.memory,
      );
      const { spec: structureSpec } = buildTime(e, fit.wu, fit.cd, ePace, "SV1");
      return {
        ...base,
        type: "long",
        intensity: "SV1",
        distanceKm: fit.km,
        structureSpec,
      };
    }
    case "long_race_pace": {
      // Marathon "endurance longue": a long run with marathon-pace (AS42) TIME
      // blocks inside (6×6min…2×36min), recoveries at easy footing. Uses the
      // long-run warmup/cooldown bands (the endurance lead-in/out) and the
      // explicit marathon race pace. Drawn from the phase's `marathonLong` bank.
      const bank = pb.banks.marathonLong?.[role.bank] ?? [];
      if (bank.length === 0) return null;
      const e = pickEntry(bank, args, `marathonLong.${role.bank}`);
      if (e.kind !== "pacedTime") return null;
      const racePace = vdot ? spec.racePaceMps(vdot) : 0;
      const baseWu = warmupSeconds(pb, weekKm, peakKm, true);
      const baseCd = cooldownSeconds(pb, weekKm, peakKm, true);
      // Work at marathon race pace (AS42); lead-in + recoveries at E.
      const fit = fitLongRun(
        (racePace > 0 ? racePace : ePace) * e.reps * e.workSec,
        e.reps * e.recoverySec,
        baseWu,
        baseCd,
        ePace,
        args.phase !== "taper",
        args.memory,
      );
      const { spec: structureSpec } = buildPacedTime(
        e,
        fit.wu,
        fit.cd,
        ePace,
        racePace,
      );
      return {
        ...base,
        type: "long",
        intensity: "M",
        distanceKm: fit.km,
        structureSpec,
      };
    }
    case "sv2": {
      // Threshold session @ T, drawn from the bank. `time` entries → time blocks
      // (5×3min → 3×12min); `dist` entries → distance reps (half-marathon's
      // short-rep SV2: 16×400m…). Both run at the T (threshold) anchor. A role
      // tagged `bank: "buildEarly"` draws the half's time-block early-build menu
      // (`sv2BuildEarly`) when present; everything else uses the default `sv2`.
      const useBuildEarly = role.bank === "buildEarly" && pb.banks.sv2BuildEarly;
      const bank = useBuildEarly ? pb.banks.sv2BuildEarly! : pb.banks.sv2;
      const e = pickEntry(bank, args, useBuildEarly ? "sv2BuildEarly" : "sv2");
      const built =
        e.kind === "time"
          ? buildTime(e, wu, cd, ePace, "T")
          : e.kind === "dist"
            ? buildDist(e, wu, cd, ePace, "T")
            : null;
      if (!built) return null;
      return {
        ...base,
        type: "threshold",
        intensity: "T",
        distanceKm: built.distanceKm,
        structureSpec: built.spec,
      };
    }
    case "vma_short": {
      // Short VO₂max distance reps @ I (200–400m), drawn from the bank.
      const e = pickEntry(pb.banks.vmaShort, args, "vmaShort");
      if (e.kind !== "dist") return null;
      const { spec: structureSpec, distanceKm } = buildDist(
        e,
        wu,
        cd,
        ePace,
        "I",
      );
      return {
        ...base,
        type: "intervals",
        intensity: "I",
        distanceKm,
        structureSpec,
      };
    }
    case "vma_long": {
      // Long VO₂max distance reps @ I (600–800m), drawn from the bank.
      const e = pickEntry(pb.banks.vmaLong, args, "vmaLong");
      if (e.kind !== "dist") return null;
      const { spec: structureSpec, distanceKm } = buildDist(
        e,
        wu,
        cd,
        ePace,
        "I",
      );
      return {
        ...base,
        type: "intervals",
        intensity: "I",
        distanceKm,
        structureSpec,
      };
    }
    case "mixed": {
      // SV2 time block @ T → bridge → VMA-courte distance block @ I.
      const e = pickEntry(pb.banks.mixed, args, "mixed");
      if (e.kind !== "mixte") return null;
      const { spec: structureSpec, distanceKm } = buildMixte(
        e,
        wu,
        cd,
        ePace,
        paces?.T ?? 0,
      );
      return {
        ...base,
        type: "intervals",
        intensity: "I",
        distanceKm,
        structureSpec,
      };
    }
    case "race_pace": {
      // Allure spé: reps at the race pace, drawn from the role's bank ("moderate"
      // for sub-threshold work, "big" for the peak session). `paced` entries are
      // distance reps; `pacedTime` entries are time reps (the "pics" 3×15min…).
      const e = pickEntry(
        pb.banks.racePace[role.bank],
        args,
        `racePace.${role.bank}`,
      );
      const racePace = vdot ? spec.racePaceMps(vdot) : 0;
      const built =
        e.kind === "paced"
          ? buildPaced(e, wu, cd, ePace, racePace)
          : e.kind === "pacedTime"
            ? buildPacedTime(e, wu, cd, ePace, racePace)
            : null;
      if (!built) return null;
      return {
        ...base,
        type: "race_pace",
        intensity: "I",
        distanceKm: built.distanceKm,
        structureSpec: built.spec,
      };
    }
    case "taper_tune_up": {
      // Rappel d'allure: a single tune-up at race pace. Drawn from the rappel bank
      // by level (progress is pinned to 1 by the taper — it's the plan's end).
      // Supports both distance (`paced`) and time (`pacedTime`) reps.
      const e = pickEntry(pb.banks.rappel, args, "rappel");
      const racePace = vdot ? spec.racePaceMps(vdot) : 0;
      const built =
        e.kind === "paced"
          ? buildPaced(e, wu, cd, ePace, racePace)
          : e.kind === "pacedTime"
            ? buildPacedTime(e, wu, cd, ePace, racePace)
            : null;
      if (!built) return null;
      return {
        ...base,
        type: "race_pace",
        intensity: "I",
        distanceKm: built.distanceKm,
        structureSpec: built.spec,
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Microcycle entry point
// ---------------------------------------------------------------------------

/**
 * Build the week's session list for a base/build/peak week. Picks days from
 * the schedule, assigns the phase's role bag (keyed on frequency + week index),
 * lays them out across days for recovery spacing, then maps each role to a
 * SessionSpec with an explicit StructureSpec. The engine layer calls
 * buildStructure(_, _, _, paces, spec) to materialise the structure.
 *
 * Weeks are Mon→Sun, so days are ordered with Monday as the anchor and the long
 * run / quality sessions gravitate toward the end of the week (Sunday-most). The
 * taper is not a weekly microcycle — see `taperSessions`.
 */
export function microcycle(
  spec: PlanEngineSpec,
  args: MicrocycleArgs,
): SessionSpec[] {
  // Raise a thin schedule to the phase's session floor (marathon: build/peak/
  // taper → ≥3). Bounded by available days; base/other distances keep their count.
  const schedule = floorSchedule(
    args.schedule,
    spec.playbook.phases?.minSessions?.[args.phase],
  );
  const picked = pickTrainingDays(schedule);
  if (picked.length === 0) return [];

  const roles = rolesForPhase(spec.playbook, { ...args, schedule }, picked.length);
  if (roles.length === 0) return [];

  // Mon→Sun weeks: anchor on Monday so "latest" means Sunday-most.
  const MONDAY_ANCHOR = 0;

  const placed = placeRoles(
    roles,
    picked,
    MONDAY_ANCHOR,
    minHardDowAfter(args.prevLastHardDow),
    args.longRunMidWeek ?? false,
  );
  if (args.phase === "peak" && args.raceDow !== undefined) {
    relocatePeakSpe(spec, placed, args.raceDow);
  }

  const out: SessionSpec[] = [];
  for (const { role, dayOfWeek } of placed) {
    const sessionSpec = roleToSessionSpec(spec, role, args, dayOfWeek);
    if (sessionSpec) out.push(sessionSpec);
  }

  // Vary the week's easy runs (length spread + plan-wide distance uniqueness).
  diversifyEasies(
    out.filter(
      (s) => s.type === "easy" && s.structureSpec?.kind === "easy_continuous",
    ),
    args.paces?.E ?? 0,
    easyBand(spec.playbook),
    args.memory,
  );
  return out;
}

/**
 * Pull the *last* race-pace session of the peak week into the J-8→J-10 window
 * before the race. The peak week is the Mon→Sun block ending `taperDays` before
 * the race, so a day-of-week `d` sits `taperDays + 6 − d` days out; J-8→J-10 maps
 * to the window `d ∈ [taperDays−4, taperDays−2]` (clamped to Mon..Sun). The session
 * swaps days with whatever (usually an easy) holds the best in-window day —
 * keeping the set of training days intact. When no scheduled day falls in the
 * window, the closest one is used, preferring the later (fresher) day on ties.
 */
function relocatePeakSpe(
  spec: PlanEngineSpec,
  placed: { role: PlanRole; dayOfWeek: number }[],
  raceDow: number,
): void {
  const speIdxs = placed.flatMap((p, i) =>
    p.role.kind === "race_pace" ? [i] : [],
  );
  if (speIdxs.length === 0) return;
  // The "last specific session" is the latest-day race-pace session.
  const lastSpeIdx = speIdxs.reduce((a, b) =>
    placed[a]!.dayOfWeek >= placed[b]!.dayOfWeek ? a : b,
  );

  const taperDays = taperDaysForRaceDow(spec, raceDow);
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
 * Taper length in days as a function of the race's ISO day-of-week (0=Mon…6=Sun),
 * read from the playbook's taper rules.
 *
 * Every base/build/peak block runs Mon→Sun; the taper is the variable tail that
 * carries the plan to race day. With the default rules:
 * - Sun (6):           7 days — the taper *is* the race-week (race on Sunday).
 * - Mon/Tue/Wed (0–2): 8/9/10 days — extended back into the previous week, since
 *   the race sits just after a Sunday and a 1–3 day taper would be too short.
 * - Thu/Fri/Sat (3–5): 4/5/6 days — shortened to the start of the race-week, so
 *   we don't append a near-empty extra week before the race.
 *
 * In every case the taper opens on a Monday (so the preceding peak block still
 * ends on a Sunday).
 */
export function taperDaysForRaceDow(
  spec: PlanEngineSpec,
  raceDow: number,
): number {
  const t = spec.playbook.taper.taperDays;
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

export type PlanGrid = {
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
 * Resolve the Mon→Sun week grid for a plan from its start date and race date.
 * `gridStartYmd` (Monday of the start week) anchors every week row; the first
 * row may be partial when the plan starts mid-week (the engine's date guard
 * drops pre-start days). The taper occupies the final `taperDays`.
 */
export function planGrid(
  spec: PlanEngineSpec,
  planStartYmd: string,
  raceYmd: string,
): PlanGrid {
  const taperDays = taperDaysForRaceDow(spec, isoDayOfWeek(raceYmd));
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

export type TaperSessionsArgs = {
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
  /** Cross-week plan memory — taper sessions share the plan's dedup/uniqueness. */
  memory?: PlanMemory;
};

/**
 * Lay out the taper across absolute calendar dates in [taperStartYmd, raceYmd).
 *
 * - A 20-min strides shakeout is pinned to race-eve for athletes training ≥ the
 *   playbook's shakeout threshold (it stays loose without depleting glycogen).
 * - One "rappel d'allure" tune-up lands on the latest scheduled day that still
 *   leaves enough days before the race (playbook tune-up window).
 * - Easies fill the remaining scheduled days.
 *
 * Returns each session with its absolute date so the engine can place it without
 * a weekly day-of-week mapping (the taper may straddle two calendar weeks).
 */
export function taperSessions(
  spec: PlanEngineSpec,
  args: TaperSessionsArgs,
): { spec: SessionSpec; dateYmd: string }[] {
  const pb = spec.playbook;
  const { taperStartYmd, raceYmd } = args;
  // Apply the taper session floor (marathon: race week → ≥3) before budgeting.
  const schedule = floorSchedule(
    args.schedule,
    pb.phases?.minSessions?.taper,
  );

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
    schedule.sessionsPerWeek - pb.taper.raceWeekBudgetOffset,
  );
  let raceWeekUsed = 0;

  const placed: { role: PlanRole; dateYmd: string }[] = [];
  const used = new Set<string>();

  // Place a role unless it would push the race week past its budget. Earlier
  // taper-week days are always allowed; race-week days are gated. Callers run in
  // priority order (shakeout → tune-up → easies), so the budget drops the
  // lowest-priority sessions first — and since easies arrive in ascending date
  // order, the ones nearest the race are shed, leaving more rest before race day.
  const tryPlace = (role: PlanRole, dateYmd: string): boolean => {
    if (dateYmd >= raceWeekMonday) {
      if (raceWeekUsed >= raceWeekBudget) return false;
      raceWeekUsed += 1;
    }
    placed.push({ role, dateYmd });
    used.add(dateYmd);
    return true;
  };

  // Race-eve shakeout (≥ threshold sessions/week only — lower-volume athletes rest).
  if (
    schedule.sessionsPerWeek >= pb.taper.shakeoutMinSessionsPerWeek &&
    eve >= taperStartYmd
  ) {
    tryPlace({ kind: "easy", addStrides: true, shakeout: true }, eve);
  }

  // Scheduled training days inside the window (eve already spoken for).
  const pool = dates.filter(
    (d) => availDays.has(isoDayOfWeek(d)) && !used.has(d),
  );

  // Rappel d'allure: a scheduled day in the playbook tune-up window; if the athlete
  // trains on neither, the closest scheduled day to that window, preferring more
  // recovery (the earlier day) on ties so a quality touch never drifts too close
  // to the race.
  const tuneWindow = pb.taper.tuneUpWindowDaysBeforeRace;
  const tuneDate = pickDayNearWindow(
    pool,
    tuneWindow.lo,
    tuneWindow.hi,
    raceYmd,
  );
  if (tuneDate) {
    tryPlace({ kind: "taper_tune_up" }, tuneDate);
  }

  // Easies fill what's left, up to the race-week budget.
  for (const d of pool) {
    if (used.has(d)) continue;
    tryPlace(easyRole(false), d);
  }

  const built = placed
    .sort((a, b) => (a.dateYmd < b.dateYmd ? -1 : 1))
    .flatMap(({ role, dateYmd }) => {
      const sessionSpec = roleToSessionSpec(
        spec,
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
          memory: args.memory,
        },
        isoDayOfWeek(dateYmd),
      );
      return sessionSpec ? [{ spec: sessionSpec, dateYmd }] : [];
    });

  // Vary the taper's easy runs too (R2): one shorter, one longer, distinct
  // distances — but never the fixed race-eve shakeout (it stays a 20-min loosener).
  const d = pb.constants.durationsSec;
  diversifyEasies(
    built
      .map((b) => b.spec)
      .filter(
        (s) =>
          s.type === "easy" &&
          s.structureSpec?.kind === "easy_continuous" &&
          s.structureSpec.durationSec !== d.shakeout,
      ),
    args.paces?.E ?? 0,
    easyBand(pb),
    args.memory,
  );

  return built;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// Re-export anchor type for downstream test ergonomics.
export type { IntensityAnchor };

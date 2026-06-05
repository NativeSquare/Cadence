/**
 * The marathon (42,195 km) **playbook** — sibling of `fiveKPlaybook.ts`,
 * `tenKPlaybook.ts` and `halfMarathonPlaybook.ts` over the same `Playbook` types
 * and `planEngine` engine. Encodes coach Mathieu Bert's marathon periodisation.
 *
 * Periodisation (mapped onto the shared base/build/peak/taper blocks):
 * - base ("période générale"):  the half-marathon base reused (EF + VMA courte +
 *                               SV1 long) with even wider long-run bands
 *                               (20→35 min warmup / 10→25 min cooldown) — the
 *                               marathon endurance-volume lever.
 * - build early ("début construction", 3 weeks): EF + an alternating SV2 ↔ VMA
 *                               longue slot (S1 & S3 SV2, S2 VMA longue) + the
 *                               headline **endurance longue with AS42 blocks**
 *                               (`long_race_pace` bank `buildEarly`).
 * - build late ("fin construction", 3 weeks): EF + SV2 + endurance longue with
 *                               bigger AS42 blocks (bank `buildLate`).
 * - peak ("spécifique / pics", 1 week): EF + SV2 + the biggest endurance longue
 *                               (bank `peak`).
 * - taper ("affûtage", 3 weeks): two `leadWeeks` Mon→Sun microcycles — affûtage 1
 *                               (85 % volume, endurance longue bank `affutage1` +
 *                               VMA longue) and affûtage 2 (60 %, endurance longue
 *                               bank `affutage2` mid-week + VMA courte) — then the
 *                               race-week tail (50 %: rappel d'allure = easy + 2 km
 *                               AS42, EFs, race-eve strides shakeout).
 *
 * The "endurance longue" is the marathon's signature session: a long run (`long`)
 * with TIME blocks at marathon race pace (AS42), recoveries at easy footing, run
 * at the long-run warmup/cooldown bands. All AS42 blocks the coach lists are
 * time-based → `pacedTime` entries. Uniform-rep shapes only (count-ranges baked to
 * a single value; composite / interval-mix sets the schema can't carry dropped).
 *
 * SV2 = the 10K time-block threshold menu; VMA courte/longue = distance reps @ I.
 *
 * Build is 6 weeks (3 + 3) and the session floor is 3 for build/peak/taper
 * ("quand 2 séances → passer à 3") — see `phases`.
 *
 * ⚠️ NO convex runtime imports — pure data, bundled into the admin browser.
 */

import {
  type Composition,
  dist,
  easy,
  min,
  paced,
  pacedTime,
  type Playbook,
  time,
} from "./planPlaybook";

// Affûtage week 1 (85 % volume) — endurance longue (bank `affutage1`) + VMA longue
// + EFs. Laid out as a full Mon→Sun microcycle via `taper.leadWeeks[0]`.
const AFFUTAGE_WEEK_1: Composition = {
  bySlots: {
    2: [easy("never"), { kind: "long_race_pace", bank: "affutage1" }],
    3: [
      easy("never"),
      easy("never"),
      { kind: "long_race_pace", bank: "affutage1" },
    ],
    4: [
      easy("never"),
      easy("never"),
      { kind: "long_race_pace", bank: "affutage1" },
      { kind: "vma_long" },
    ],
    5: [
      easy("always"),
      easy("never"),
      easy("never"),
      { kind: "long_race_pace", bank: "affutage1" },
      { kind: "vma_long" },
    ],
  },
  // 6+: 1 strides-easy, (slots − 3) plain easies, endurance longue + VMA longue.
  overflow: {
    padBase: 3,
    lead: [easy("always")],
    trail: [
      { kind: "long_race_pace", bank: "affutage1" },
      { kind: "vma_long" },
    ],
  },
};

// Affûtage week 2 (60 % volume, long run pulled mid-week via `longRunMidWeek`) —
// endurance longue (bank `affutage2`) + VMA courte. The coach deliberately drops a
// session at higher frequencies for rest, so the 5- and 6-slot rows emit one fewer
// role than slots (`placeRoles` uses the latest N days → the earliest is rested).
const AFFUTAGE_WEEK_2: Composition = {
  bySlots: {
    2: [easy("never"), { kind: "long_race_pace", bank: "affutage2" }],
    3: [
      easy("never"),
      easy("never"),
      { kind: "long_race_pace", bank: "affutage2" },
    ],
    4: [
      easy("never"),
      easy("never"),
      easy("never"),
      { kind: "long_race_pace", bank: "affutage2" },
    ],
    // 5 scheduled days → only 4 sessions (coach: "pas de 5ème séance car repos").
    5: [
      easy("never"),
      easy("never"),
      { kind: "long_race_pace", bank: "affutage2" },
      { kind: "vma_short" },
    ],
    // 6 scheduled days → only 5 sessions (coach: "pas de 6ème séance car repos").
    6: [
      easy("never"),
      easy("never"),
      easy("never"),
      { kind: "long_race_pace", bank: "affutage2" },
      { kind: "vma_short" },
    ],
  },
  overflow: {
    padBase: 3,
    lead: [easy("never")],
    trail: [
      { kind: "long_race_pace", bank: "affutage2" },
      { kind: "vma_short" },
    ],
  },
};

export const MARATHON_PLAYBOOK: Playbook = {
  compositions: {
    // Période générale — the half-marathon base (EF + VMA courte + SV1 long), the
    // long run carrying the marathon's wide warmup/cooldown bands (see constants).
    base: {
      bySlots: {
        1: [{ kind: "sv1_long" }],
        2: [easy("always"), { kind: "sv1_long" }],
        3: [easy("never"), { kind: "vma_short" }, { kind: "sv1_long" }],
        4: [
          easy("never"),
          easy("always"),
          { kind: "vma_short" },
          { kind: "sv1_long" },
        ],
        5: [
          easy("always"),
          easy("never"),
          easy("never"),
          { kind: "vma_short" },
          { kind: "sv1_long" },
        ],
      },
      overflow: {
        padBase: 4,
        lead: [easy("always"), easy("always")],
        trail: [{ kind: "vma_short" }, { kind: "sv1_long" }],
      },
    },

    // Début construction (build weeks 0–2): EF + `marathon_build_early_alt`
    // (SV2 weeks 0 & 2 ↔ VMA longue week 1) + endurance longue (bank `buildEarly`).
    buildEarly: {
      bySlots: {
        2: [
          { kind: "marathon_build_early_alt" },
          { kind: "long_race_pace", bank: "buildEarly" },
        ],
        3: [
          easy("never"),
          { kind: "marathon_build_early_alt" },
          { kind: "long_race_pace", bank: "buildEarly" },
        ],
        4: [
          easy("never"),
          easy("never"),
          { kind: "marathon_build_early_alt" },
          { kind: "long_race_pace", bank: "buildEarly" },
        ],
        5: [
          easy("always"),
          easy("never"),
          easy("never"),
          { kind: "marathon_build_early_alt" },
          { kind: "long_race_pace", bank: "buildEarly" },
        ],
      },
      // 6+: 1 strides-easy, (slots − 3) plain easies, alt slot + endurance longue.
      overflow: {
        padBase: 3,
        lead: [easy("always")],
        trail: [
          { kind: "marathon_build_early_alt" },
          { kind: "long_race_pace", bank: "buildEarly" },
        ],
      },
    },

    // Fin construction (build weeks 3–5): EF + SV2 + endurance longue (`buildLate`).
    buildLate: {
      bySlots: {
        2: [{ kind: "sv2" }, { kind: "long_race_pace", bank: "buildLate" }],
        3: [
          easy("never"),
          { kind: "sv2" },
          { kind: "long_race_pace", bank: "buildLate" },
        ],
        4: [
          easy("never"),
          easy("never"),
          { kind: "sv2" },
          { kind: "long_race_pace", bank: "buildLate" },
        ],
        5: [
          easy("always"),
          easy("never"),
          easy("never"),
          { kind: "sv2" },
          { kind: "long_race_pace", bank: "buildLate" },
        ],
      },
      overflow: {
        padBase: 3,
        lead: [easy("always")],
        trail: [{ kind: "sv2" }, { kind: "long_race_pace", bank: "buildLate" }],
      },
    },

    // Spécifique (peak / pics): EF + SV2 + the biggest endurance longue (`peak`).
    peak: {
      bySlots: {
        2: [{ kind: "sv2" }, { kind: "long_race_pace", bank: "peak" }],
        3: [
          easy("never"),
          { kind: "sv2" },
          { kind: "long_race_pace", bank: "peak" },
        ],
        4: [
          easy("never"),
          easy("never"),
          { kind: "sv2" },
          { kind: "long_race_pace", bank: "peak" },
        ],
        5: [
          easy("always"),
          easy("never"),
          easy("never"),
          { kind: "sv2" },
          { kind: "long_race_pace", bank: "peak" },
        ],
      },
      overflow: {
        padBase: 3,
        lead: [easy("always")],
        trail: [{ kind: "sv2" }, { kind: "long_race_pace", bank: "peak" }],
      },
    },
  },

  constants: {
    durationsSec: {
      // EF spans the marathon range (50 min → 1h30) via weekKm/peakKm scaling.
      easyMin: min(50),
      easyMax: min(90),
      // Base: easy runs progress 50min → 1h10 by base-week index (coach Mathieu
      // Bert's "40min→1h", scaled up for the marathon) — base volume growth goes
      // to the long run, not the easies.
      baseEasyMin: min(50),
      baseEasyMax: min(70),
      shakeout: min(20),
      warmupMin: min(15),
      warmupMax: min(20),
      // Long runs (SV1 long + endurance longue): the marathon's wide endurance
      // bands — 20→35 min warmup / 10→25 min cooldown (coach's volume lever).
      longRunWarmupMin: min(20),
      longRunWarmupMax: min(35),
      cooldownMin: min(5),
      cooldownMax: min(10),
      longRunCooldownMin: min(10),
      longRunCooldownMax: min(25),
    },
  },

  // Difficulty-ordered banks (easiest → hardest), uniform-rep entries only.
  banks: {
    // SV1 long run (base) — time blocks @ SV1 (the half/10K menu; the marathon's
    // extra length comes from the wider warmup/cooldown bands, not bigger blocks).
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
    // SV2 threshold — the 10K time-block menu @ T (coach: "SV2 comme la prépa 10km",
    // continued through fin construction + spécifique). Dropped: the per-rep ladders.
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
    ],
    // VMA courte — short distance reps @ I (base + affûtage 2). Ranges baked;
    // composite sets (2×200/3×400/2×300, the 3×1min+6×30s) dropped.
    vmaShort: [dist(9, 200, 60), dist(7, 300, 60), dist(6, 400, 75)],
    // VMA longue — long distance reps @ I (début construction S2 + affûtage 1).
    // Ranges baked to a single value, ordered by rep distance.
    vmaLong: [
      dist(7, 500, 105),
      dist(6, 600, 105),
      dist(6, 700, 120),
      dist(5, 800, 135),
    ],
    // Mixte — unused; empty to satisfy the shared `Banks` shape.
    mixed: [],
    // Race-pace intervals — the marathon embeds its race-pace work in the long run
    // (`marathonLong`), so the generic moderate/big banks stay empty.
    racePace: { moderate: [], big: [] },
    // Endurance longue AS42 blocks, one bank per phase — TIME reps @ marathon pace
    // (AS42), recoveries at easy footing. Ordered easiest → hardest by block length.
    // Count-ranges baked (e.g. 5–6×8min → 6×8min); composite series dropped.
    marathonLong: {
      // Début construction: 6×6min … 2×20min.
      buildEarly: [
        pacedTime(6, min(6), 90),
        pacedTime(6, min(7), 90),
        pacedTime(6, min(8), 90),
        pacedTime(5, min(9), 90),
        pacedTime(4, min(10), 120),
        pacedTime(4, 750, 180), // 4×12'30
        pacedTime(3, min(15), 180),
        pacedTime(2, min(20), 180),
      ],
      // Fin construction: 5×12min … 2×30min.
      buildLate: [
        pacedTime(5, min(12), 180),
        pacedTime(4, min(13), 180),
        pacedTime(5, min(14), 240),
        pacedTime(4, min(15), 180),
        pacedTime(3, min(20), 180),
        pacedTime(3, min(22), 240),
        pacedTime(2, min(30), 240),
      ],
      // Spécifique: 4×20min … 2×36min — the race-specific peak blocks.
      peak: [
        pacedTime(4, min(20), 240),
        pacedTime(3, min(25), 240),
        pacedTime(3, min(28), 240),
        pacedTime(2, min(36), 240),
      ],
      // Affûtage 1 (85 %): 5×10min … 2×20min.
      affutage1: [
        pacedTime(5, min(10), 180),
        pacedTime(4, 750, 180), // 4×12'30
        pacedTime(3, min(15), 240),
        pacedTime(2, min(20), 240),
      ],
      // Affûtage 2 (60 %): the shortest sharpening blocks, 3×5min … 1×15min.
      affutage2: [
        pacedTime(3, min(5), 240),
        pacedTime(2, min(7), 240),
        pacedTime(2, min(8), 240),
        pacedTime(1, min(15), 240),
      ],
    },
    // Rappel d'allure (affûtage week 3 tail) — "easy avec juste 2 km AS42".
    rappel: [paced(1, 2000, 60)],
  },

  // Affûtage = 3 weeks: two lead weeks (Mon→Sun microcycles) at 85 % / 60 % of
  // peak, then the race-week tail at 50 % (laid out by `taperSessions`). Affûtage 2
  // pulls its long run mid-week.
  taper: {
    shakeoutMinSessionsPerWeek: 4,
    tuneUpWindowDaysBeforeRace: { lo: 4, hi: 5 },
    raceWeekBudgetOffset: 1,
    taperDays: { earlyWeekCutoffDow: 2, earlyAddend: 8, lateAddend: 1 },
    leadWeeks: [
      { composition: AFFUTAGE_WEEK_1, volumeFactor: 0.85 },
      { composition: AFFUTAGE_WEEK_2, volumeFactor: 0.6, longRunMidWeek: true },
    ],
    tailVolumeFactor: 0.5,
  },

  // Build is 6 weeks (3 début + 3 fin); the session floor is 3 for build/peak/
  // taper ("quand 2 séances → passer à 3"). Base keeps the athlete's own count.
  phases: {
    buildEarlyWeeks: 3,
    buildWeeksCap: 6,
    minSessions: { build: 3, peak: 3, taper: 3 },
  },
};

/**
 * The half-marathon (semi / 21,1 km) **playbook** — sibling of `fiveKPlaybook.ts`
 * and `tenKPlaybook.ts` over the same `Playbook` types and `planEngine` engine.
 * Encodes coach Mathieu Bert's half-marathon periodisation.
 *
 * Periodisation (mapped onto the shared base/build/peak/taper blocks):
 * - base ("période générale"):       EF (+strides) + VMA courte + SV1 long every
 *                                     week. The long run carries the wider warmup
 *                                     (20–30 min) + cooldown (10–15 min) bands —
 *                                     the lever for half-marathon endurance volume.
 * - build early ("début construction", build week 0–1): EF + SV2 + SV1 long, with a
 *                                     `build_early_alt` VMA slot (longue week 0 ↔
 *                                     courte week 1) appearing at higher frequencies.
 *                                     Its SV2 draws the dedicated TIME-block bank
 *                                     (`sv2BuildEarly`: 4×6min…), not the short
 *                                     distance reps the other phases use.
 * - build late ("fin construction", build week 2+): EF (lengthening toward ~1h05) +
 *                                     allure spé AS21 (moderate, distance reps) + SV2.
 * - peak ("spécifique / pics"):       EF + the big race-specific allure spé (time
 *                                     reps: 3×15min / 4–5×10min) + SV2.
 * - taper ("affûtage", 2 weeks):      week 1 is a `leadWeeks` Mon→Sun microcycle
 *                                     (SV2 short reps + EF + easy SV1 long); week 2
 *                                     is the race-week tail (rappel + EFs + a
 *                                     race-eve strides shakeout).
 *
 * Half-marathon SV2 is short DISTANCE reps @ threshold (16×400m…), so the `sv2`
 * bank holds `dist` entries (the engine builds them at T) — except in "début
 * construction", whose SV2 is TIME blocks from `sv2BuildEarly` (4×6min…). The
 * peak allure spé is
 * TIME-based (`pacedTime`); fin-construction / rappel allure spé is distance-based
 * (`paced`). Compound / nested sets the structure schema can't represent
 * (600m+300m, 2000m+10×400m, 3×[8×300m], the 3000-2000-2000-2000-1000 ladder) are
 * dropped; count-ranges are baked to a single value — uniform-rep shapes only.
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

// Affûtage week 1 — laid out as a full Mon→Sun microcycle via `taper.leadWeeks`.
// SV2 short reps + EF + an easy SV1 long (the engine's reduced taper volume keeps
// it light). Race-week (week 2) is the tail produced by `taperSessions`.
const AFFUTAGE_WEEK_1: Composition = {
  bySlots: {
    2: [easy("always"), { kind: "sv2" }],
    3: [easy("always"), { kind: "sv2" }, easy("never")],
    4: [easy("always"), easy("never"), easy("never"), { kind: "sv2" }],
    5: [
      easy("always"),
      easy("never"),
      easy("never"),
      { kind: "sv1_long" },
      { kind: "sv2" },
    ],
  },
  // 6+: 1 strides-easy, (slots − 3) plain easies, SV1 long + SV2.
  overflow: {
    padBase: 3,
    lead: [easy("always")],
    trail: [{ kind: "sv1_long" }, { kind: "sv2" }],
  },
};

export const HALF_MARATHON_PLAYBOOK: Playbook = {
  compositions: {
    // Période générale: EF (+strides) + VMA courte + SV1 long. The long run is
    // present from 2 sessions/week up (half-marathon endurance priority).
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
      // 6+: two strides-easies, the rest plain, + VMA courte + SV1 long.
      overflow: {
        padBase: 4,
        lead: [easy("always"), easy("always")],
        trail: [{ kind: "vma_short" }, { kind: "sv1_long" }],
      },
    },

    // Début construction (build weeks 0–1): EF + SV2 + SV1 long. The VMA slot
    // (`build_early_alt`: longue week 0 ↔ courte week 1) appears at 5+ sessions.
    buildEarly: {
      bySlots: {
        1: [{ kind: "sv1_long" }],
        2: [easy("always"), { kind: "sv2", bank: "buildEarly" }],
        3: [
          easy("always"),
          { kind: "sv2", bank: "buildEarly" },
          { kind: "sv1_long" },
        ],
        4: [
          easy("never"),
          easy("always"),
          { kind: "sv2", bank: "buildEarly" },
          { kind: "sv1_long" },
        ],
        5: [
          easy("always"),
          easy("never"),
          { kind: "sv2", bank: "buildEarly" },
          { kind: "build_early_alt" },
          { kind: "sv1_long" },
        ],
      },
      // 6+: 1 strides-easy, (slots − 4) plain easies, VMA (alt) + SV2 + SV1 long.
      overflow: {
        padBase: 4,
        lead: [easy("always")],
        trail: [
          { kind: "build_early_alt" },
          { kind: "sv2", bank: "buildEarly" },
          { kind: "sv1_long" },
        ],
      },
    },

    // Fin construction (build week ≥ 2): EF + allure spé AS21 (moderate) + SV2.
    // Allure spé is the week's headline quality; the long run gives way to it.
    buildLate: {
      bySlots: {
        2: [easy("always"), { kind: "race_pace", bank: "moderate" }],
        3: [
          easy("always"),
          { kind: "race_pace", bank: "moderate" },
          easy("never"),
        ],
        4: [
          easy("always"),
          easy("never"),
          { kind: "race_pace", bank: "moderate" },
          { kind: "sv2" },
        ],
        5: [
          easy("always"),
          easy("never"),
          easy("never"),
          { kind: "race_pace", bank: "moderate" },
          { kind: "sv2" },
        ],
      },
      // 6+: 1 strides-easy, (slots − 3) plain easies, allure spé + SV2.
      overflow: {
        padBase: 3,
        lead: [easy("always")],
        trail: [{ kind: "race_pace", bank: "moderate" }, { kind: "sv2" }],
      },
    },

    // Spécifique (peak / pics): EF + the big race-specific allure spé (time reps)
    // + SV2.
    peak: {
      bySlots: {
        2: [easy("always"), { kind: "race_pace", bank: "big" }],
        3: [easy("always"), { kind: "race_pace", bank: "big" }, easy("never")],
        4: [
          easy("always"),
          easy("never"),
          { kind: "race_pace", bank: "big" },
          { kind: "sv2" },
        ],
        5: [
          easy("always"),
          easy("never"),
          easy("never"),
          { kind: "race_pace", bank: "big" },
          { kind: "sv2" },
        ],
      },
      // 6+: 1 strides-easy, (slots − 3) plain easies, allure spé (big) + SV2.
      overflow: {
        padBase: 3,
        lead: [easy("always")],
        trail: [{ kind: "race_pace", bank: "big" }, { kind: "sv2" }],
      },
    },
  },

  constants: {
    durationsSec: {
      // EF progresses toward ~1h05 in late phases via the weekKm/peakKm scaling.
      easyMin: min(35),
      easyMax: min(65),
      shakeout: min(20),
      warmupMin: min(15),
      warmupMax: min(20),
      // Long weekend run only: 20–30 min warmup + 10–15 min cooldown — the
      // half-marathon endurance-volume lever (coach: more volume on long sorties).
      longRunWarmupMin: min(20),
      longRunWarmupMax: min(30),
      cooldownMin: min(5),
      cooldownMax: min(10),
      longRunCooldownMin: min(10),
      longRunCooldownMax: min(15),
    },
  },

  // Difficulty-ordered banks (easiest → hardest), uniform-rep entries only.
  banks: {
    // SV1 long run — time blocks @ SV1 (same progression as 10K; the longer half
    // long run comes from the wider warmup/cooldown bands, not bigger blocks).
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
    // SV2 — short DISTANCE reps @ T (threshold), the half's "SV2 sur courtes
    // distances". Dropped: 600+300, 2000+10×400, 3×[8×300]. Ranges baked.
    // Used by fin construction, spécifique, and the affûtage lead week.
    sv2: [
      dist(16, 400, 45),
      dist(14, 500, 60),
      dist(10, 600, 75),
      dist(12, 600, 75),
      dist(8, 800, 75),
      dist(10, 800, 75),
    ],
    // SV2 "début construction" — TIME blocks @ T, coach Mathieu Bert's
    // early-build threshold menu. Drawn only when a `sv2` role carries
    // `bank: "buildEarly"` (the buildEarly composition). Listed in the coach's
    // intended difficulty progression. Dropped (non-uniform, schema can't carry
    // a per-rep ladder): 3-5-8-5-3, 10-8-6, 12-10-8.
    sv2BuildEarly: [
      time(4, min(6), 150), // 4×6min, récup 2'30
      time(3, min(8), 180), // 3×8min, récup 3'
      time(2, min(12), 180), // 2×12min, récup 3'
      time(5, min(6), 150), // 5×6min, récup 2'30
      time(4, min(8), 180), // 4×8min, récup 3'
      time(3, min(10), 180), // 3×10min, récup 3'
      time(6, min(6), 150), // 6×6min, récup 2'30
      time(3, min(12), 180), // 3×12min, récup 3'
    ],
    // VMA courte — short distance reps @ I (the "400m allure intervalle" of
    // début-construction week 2 + the base VMA).
    vmaShort: [dist(12, 200, 60), dist(11, 300, 60), dist(10, 400, 75)],
    // Mixte — unused (no alternating build-late slot); empty to satisfy `Banks`.
    mixed: [],
    // VMA longue — long distance reps @ I (the "VMA longue, allure threshold" of
    // début-construction week 1).
    vmaLong: [
      dist(6, 600, 105),
      dist(6, 800, 135),
      dist(7, 600, 105),
      dist(7, 800, 150),
      dist(8, 600, 105),
      dist(8, 800, 150),
    ],
    // Allure spé @ half-marathon (AS21) race pace.
    racePace: {
      // Fin construction — distance reps. Dropped: the 3000-2000-2000-2000-1000
      // ladder; count-ranges baked (9–12×1000 → 10, 4–6×2000 → 5).
      moderate: [
        paced(10, 1000, 75),
        paced(5, 2000, 120),
        paced(3, 3000, 135),
        paced(2, 4000, 180),
      ],
      // Pics — the big race-specific session, TIME reps (3×15min / 4–5×10min).
      big: [
        pacedTime(4, min(10), 135),
        pacedTime(5, min(10), 135),
        pacedTime(3, min(15), 165),
      ],
    },
    // Rappel d'allure (affûtage week 2 tail) @ AS21. Dropped the compound
    // 2000m+3×400m / 2000m+(2–3×1000m); ranges baked.
    rappel: [paced(7, 600, 90), paced(6, 800, 105), paced(5, 1000, 120)],
  },

  // Affûtage = 2 weeks: leadWeeks[0] is week 1 (a Mon→Sun microcycle), the
  // race-week tail (these rules, shared with 10K) is week 2.
  taper: {
    shakeoutMinSessionsPerWeek: 4,
    tuneUpWindowDaysBeforeRace: { lo: 4, hi: 5 },
    raceWeekBudgetOffset: 1,
    taperDays: { earlyWeekCutoffDow: 2, earlyAddend: 8, lateAddend: 1 },
    leadWeeks: [AFFUTAGE_WEEK_1],
  },
};

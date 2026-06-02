/**
 * The 10K **playbook** — sibling of `fiveKPlaybook.ts` over the same `Playbook`
 * types and `planEngine` engine. Holds every 10K coaching decision: which
 * sessions a week contains at each weekly frequency, the rep counts / recoveries
 * / distances of each session, and the taper rules.
 *
 * Periodisation (mapped onto the shared base/build/peak/taper blocks):
 * - base ("bases"):                identical to the 5K base — EF (+strides) +
 *                                  VMA courte every week + SV1 long.
 * - build early ("début construction", build week 0–1): EF + SV2 / VMA longue /
 *                                  SV1 long, scaled by frequency.
 * - build late ("fin construction", build week 2+): EF + allure spé (moderate,
 *                                  reps ≤ 1.5 km) + VMA courte + SV1 long.
 * - peak ("pics"):                 EF + the big race-specific allure spé session
 *                                  + an easy VMA (VMA courte bank).
 * - taper ("affûtage"):            same variable-day taper as 5K (rappel +
 *                                  EFs + a race-eve shakeout).
 *
 * Difficulty banks keep uniform-rep shapes only — pyramids / ladders /
 * mixed-distance sets from the coach's lists are dropped (the engine has no
 * sequence structure), and count-ranges are baked to a single value.
 *
 * Volume vs 5K: the long weekend run (SV1 long) gets a wider warmup band
 * (15–30 min instead of 15–20) — the lever for more endurance volume there
 * without lengthening the daily easy runs (EF stays 30–50 min).
 *
 * ⚠️ NO convex runtime imports — pure data, bundled into the admin browser.
 */

import { dist, easy, min, paced, type Playbook, time } from "./planPlaybook";

export const TEN_K_PLAYBOOK: Playbook = {
  compositions: {
    // Base: identical to 5K — EF (+strides) + VMA courte every week + SV1 long.
    base: {
      bySlots: {
        1: [{ kind: "sv1_long" }],
        2: [easy("always"), { kind: "vma_short" }],
        3: [easy("alt-weeks"), { kind: "vma_short" }, { kind: "sv1_long" }],
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

    // Construction-début (build weeks 0–1): SV2 + VMA longue + SV1 long.
    buildEarly: {
      bySlots: {
        1: [{ kind: "sv1_long" }],
        2: [easy("always"), { kind: "sv2" }],
        3: [easy("alt-weeks"), { kind: "vma_long" }, { kind: "sv1_long" }],
        4: [
          easy("never"),
          easy("always"),
          { kind: "vma_long" },
          { kind: "sv2" },
        ],
        5: [
          easy("always"),
          easy("never"),
          { kind: "sv2" },
          { kind: "vma_long" },
          { kind: "sv1_long" },
        ],
      },
      // 6+: VMA longue + SV2 + SV1 long, one strides-easy, the rest plain.
      overflow: {
        padBase: 4,
        lead: [easy("always")],
        trail: [{ kind: "vma_long" }, { kind: "sv2" }, { kind: "sv1_long" }],
      },
    },

    // Construction-fin (build week ≥ 2): allure spé (moderate) + VMA courte +
    // SV1 long. Allure spé is the week's headline quality.
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
          { kind: "vma_short" },
        ],
        5: [
          easy("always"),
          easy("never"),
          easy("never"),
          { kind: "race_pace", bank: "moderate" },
          { kind: "vma_short" },
        ],
      },
      // 6+: 1 strides-easy, (slots − 3) plain easies, allure spé + VMA courte.
      overflow: {
        padBase: 3,
        lead: [easy("always")],
        trail: [{ kind: "race_pace", bank: "moderate" }, { kind: "vma_short" }],
      },
    },

    // Spécifique (peak / pics): the big race-specific allure spé + easy VMA.
    peak: {
      bySlots: {
        2: [easy("always"), { kind: "race_pace", bank: "big" }],
        3: [easy("always"), { kind: "race_pace", bank: "big" }, easy("never")],
        4: [
          easy("never"),
          easy("always"),
          easy("always"),
          { kind: "race_pace", bank: "big" },
        ],
      },
      // 5+: 1 strides-easy, (slots − 3) plain easies, allure spé (big) + VMA.
      overflow: {
        padBase: 3,
        lead: [easy("always")],
        trail: [{ kind: "race_pace", bank: "big" }, { kind: "vma_short" }],
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
      // Long weekend run only: 15–30 min warmup (the endurance lead-in) — adds
      // volume there without lengthening the daily easies.
      longRunWarmupMin: min(15),
      longRunWarmupMax: min(30),
      cooldownMin: min(5),
      cooldownMax: min(10),
    },
  },

  // Difficulty-ordered banks (easiest → hardest), uniform-rep entries only.
  banks: {
    // SV1 long run — time blocks @ SV1. Same progression as 5K (the longer 10K
    // weekend run comes from the wider warmup band, not bigger blocks).
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
    // VMA courte — short distance reps @ I. Same as 5K (also used as the easy
    // VMA in fin construction / pics).
    vmaShort: [dist(12, 200, 60), dist(11, 300, 60), dist(9, 400, 75)],
    // Mixte — unused by 10K (no alternating build-late slot); kept empty to
    // satisfy the shared `Banks` shape.
    mixed: [],
    // VMA longue — long distance reps @ I. Dropped: all pyramids, 3×600+3×800.
    vmaLong: [
      dist(6, 600, 105),
      dist(6, 800, 135),
      dist(7, 600, 105),
      dist(7, 800, 150),
      dist(8, 600, 105),
      dist(8, 800, 150),
    ],
    // Allure spé @ 10K race pace.
    racePace: {
      // Fin construction — "pas trop dur", reps ≤ 1.5 km. Dropped: all ladders.
      moderate: [paced(5, 1000, 105), paced(4, 1500, 120)],
      // Pics — the big race-specific session. Dropped: all ladders.
      big: [paced(7, 1000, 105), paced(4, 1500, 105), paced(3, 2000, 120)],
    },
    // Rappel d'allure (taper tune-up) @ 10K race pace. Dropped: ladders, the
    // time-based 4×3min (the paced bank is distance-based).
    rappel: [paced(5, 600, 90), paced(4, 1000, 120)],
  },

  // Same taper shape as 5K: variable 4–10 day tail, race-anchored.
  taper: {
    shakeoutMinSessionsPerWeek: 4,
    tuneUpWindowDaysBeforeRace: { lo: 4, hi: 5 },
    raceWeekBudgetOffset: 1,
    taperDays: { earlyWeekCutoffDow: 2, earlyAddend: 8, lateAddend: 1 },
  },
};

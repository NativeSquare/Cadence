/**
 * 5K Template (Story 6.5 - Task 2.2)
 *
 * Template for 5K race training plans (6-10 weeks).
 * Emphasizes speed development and VO2max work.
 */

import type { PlanTemplate } from "./types";

export const fiveKTemplate: PlanTemplate = {
  id: "5k-standard",
  name: "5K - Standard",
  goalType: "5k",
  periodizationModel: "linear",

  // Duration constraints
  minWeeks: 6,
  maxWeeks: 10,
  recommendedWeeks: 8,

  // Phase distribution
  phases: [
    {
      name: "Base",
      percentOfPlan: 0.3,
      focus: "Aerobic foundation and running economy",
      intensityRange: [40, 55],
    },
    {
      name: "Speed Development",
      percentOfPlan: 0.4,
      focus: "VO2max intervals and race-pace work",
      intensityRange: [60, 80],
    },
    {
      name: "Race Prep",
      percentOfPlan: 0.2,
      focus: "Race simulation and sharpening",
      intensityRange: [65, 85],
    },
    {
      name: "Taper",
      percentOfPlan: 0.1,
      focus: "Freshness while maintaining speed",
      intensityRange: [50, 70],
    },
  ],

  weeklyStructure: {
    keySessions: 2,
    easyRuns: 3,
    restDays: 1,
    keySessionTypes: ["intervals", "tempo"],
  },

  volumeGuidelines: {
    startPercentOfPeak: 0.7,
    peakWeekNumber: -2,
    taperReduction: 0.6,
    taperWeeks: 1,
  },

  experienceModifiers: {
    beginner: { volumeMultiplier: 0.8, intensityMultiplier: 0.85 },
    returning: { volumeMultiplier: 0.9, intensityMultiplier: 0.9 },
    casual: { volumeMultiplier: 1.0, intensityMultiplier: 1.0 },
    serious: { volumeMultiplier: 1.1, intensityMultiplier: 1.1 },
  },
};

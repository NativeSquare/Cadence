/**
 * 10K Template (Story 6.5 - Task 2.2)
 *
 * Template for 10K race training plans (8-12 weeks).
 * Balances speed work with threshold development.
 */

import type { PlanTemplate } from "./types";

export const tenKTemplate: PlanTemplate = {
  id: "10k-standard",
  name: "10K - Standard",
  goalType: "10k",
  periodizationModel: "linear",

  // Duration constraints
  minWeeks: 8,
  maxWeeks: 12,
  recommendedWeeks: 10,

  // Phase distribution
  phases: [
    {
      name: "Base",
      percentOfPlan: 0.3,
      focus: "Aerobic foundation and endurance building",
      intensityRange: [40, 55],
    },
    {
      name: "Strength",
      percentOfPlan: 0.3,
      focus: "Tempo work and lactate threshold development",
      intensityRange: [55, 70],
    },
    {
      name: "Speed",
      percentOfPlan: 0.25,
      focus: "Race-pace intervals and race simulation",
      intensityRange: [65, 80],
    },
    {
      name: "Taper",
      percentOfPlan: 0.15,
      focus: "Freshness with maintained sharpness",
      intensityRange: [50, 65],
    },
  ],

  weeklyStructure: {
    keySessions: 2,
    easyRuns: 3,
    restDays: 1,
    keySessionTypes: ["tempo", "intervals"],
  },

  volumeGuidelines: {
    startPercentOfPeak: 0.65,
    peakWeekNumber: -2,
    taperReduction: 0.55,
    taperWeeks: 1,
  },

  experienceModifiers: {
    beginner: { volumeMultiplier: 0.8, intensityMultiplier: 0.85 },
    returning: { volumeMultiplier: 0.9, intensityMultiplier: 0.9 },
    casual: { volumeMultiplier: 1.0, intensityMultiplier: 1.0 },
    serious: { volumeMultiplier: 1.1, intensityMultiplier: 1.05 },
  },
};

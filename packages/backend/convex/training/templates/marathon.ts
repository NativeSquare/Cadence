/**
 * Marathon Template (Story 6.5 - Task 2.2)
 *
 * Template for marathon training plans (14-20 weeks).
 * Emphasizes endurance with careful volume progression.
 */

import type { PlanTemplate } from "./types";

export const marathonTemplate: PlanTemplate = {
  id: "marathon-standard",
  name: "Marathon - Standard",
  goalType: "marathon",
  periodizationModel: "linear",

  // Duration constraints
  minWeeks: 14,
  maxWeeks: 20,
  recommendedWeeks: 16,

  // Phase distribution
  phases: [
    {
      name: "Base",
      percentOfPlan: 0.3, // ~5 weeks in 16-week plan
      focus: "Building aerobic foundation and long run endurance",
      intensityRange: [35, 50],
    },
    {
      name: "Build",
      percentOfPlan: 0.3, // ~5 weeks
      focus: "Increasing volume and introducing marathon-pace work",
      intensityRange: [50, 65],
    },
    {
      name: "Peak",
      percentOfPlan: 0.2, // ~3 weeks
      focus: "Maximum volume with race simulation long runs",
      intensityRange: [55, 70],
    },
    {
      name: "Taper",
      percentOfPlan: 0.2, // ~3 weeks
      focus: "Gradual volume reduction while maintaining fitness",
      intensityRange: [45, 60],
    },
  ],

  weeklyStructure: {
    keySessions: 2,
    easyRuns: 3,
    restDays: 1,
    keySessionTypes: ["tempo", "long_run"],
  },

  volumeGuidelines: {
    startPercentOfPeak: 0.55, // Start lower due to high peak volumes
    peakWeekNumber: -4, // Peak 4 weeks before race
    taperReduction: 0.4, // Significant taper
    taperWeeks: 3,
  },

  experienceModifiers: {
    beginner: { volumeMultiplier: 0.75, intensityMultiplier: 0.8 },
    returning: { volumeMultiplier: 0.85, intensityMultiplier: 0.9 },
    casual: { volumeMultiplier: 1.0, intensityMultiplier: 1.0 },
    serious: { volumeMultiplier: 1.15, intensityMultiplier: 1.05 },
  },
};

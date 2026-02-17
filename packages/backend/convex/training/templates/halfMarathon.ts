/**
 * Half Marathon Template (Story 6.5 - Task 2.2)
 *
 * Template for half marathon training plans (10-16 weeks).
 * Uses traditional linear periodization with emphasis on threshold work.
 */

import type { PlanTemplate } from "./types";

export const halfMarathonTemplate: PlanTemplate = {
  id: "half-marathon-standard",
  name: "Half Marathon - Standard",
  goalType: "half_marathon",
  periodizationModel: "linear",

  // Duration constraints
  minWeeks: 10,
  maxWeeks: 16,
  recommendedWeeks: 12,

  // Phase distribution (Base → Build → Peak → Taper)
  phases: [
    {
      name: "Base",
      percentOfPlan: 0.33, // ~4 weeks in 12-week plan
      focus: "Building aerobic foundation and running economy",
      intensityRange: [40, 55],
    },
    {
      name: "Build",
      percentOfPlan: 0.33, // ~4 weeks
      focus: "Developing lactate threshold and race-specific fitness",
      intensityRange: [55, 70],
    },
    {
      name: "Peak",
      percentOfPlan: 0.17, // ~2 weeks
      focus: "Sharpening with race-pace work and maintaining fitness",
      intensityRange: [65, 80],
    },
    {
      name: "Taper",
      percentOfPlan: 0.17, // ~2 weeks
      focus: "Recovery and freshness while maintaining sharpness",
      intensityRange: [50, 65],
    },
  ],

  // Weekly structure
  weeklyStructure: {
    keySessions: 2,
    easyRuns: 3,
    restDays: 1,
    keySessionTypes: ["tempo", "intervals"],
  },

  // Volume guidelines
  volumeGuidelines: {
    startPercentOfPeak: 0.6, // Start at 60% of peak
    peakWeekNumber: -3, // Peak 3 weeks before end
    taperReduction: 0.5, // Reduce to 50% during taper
    taperWeeks: 2,
  },

  // Experience modifiers
  experienceModifiers: {
    beginner: { volumeMultiplier: 0.8, intensityMultiplier: 0.85 },
    returning: { volumeMultiplier: 0.9, intensityMultiplier: 0.9 },
    casual: { volumeMultiplier: 1.0, intensityMultiplier: 1.0 },
    serious: { volumeMultiplier: 1.1, intensityMultiplier: 1.05 },
  },
};

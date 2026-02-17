/**
 * Base Building Template (Story 6.5 - Task 2.2)
 *
 * Template for general fitness and base building plans (6-12 weeks).
 * Focuses on aerobic development without race-specific demands.
 */

import type { PlanTemplate } from "./types";

export const baseBuildingTemplate: PlanTemplate = {
  id: "base-building-standard",
  name: "Base Building - Standard",
  goalType: "base_building",
  periodizationModel: "linear",

  // Duration constraints
  minWeeks: 6,
  maxWeeks: 12,
  recommendedWeeks: 8,

  // Phase distribution (Foundation → Development → Consolidation)
  phases: [
    {
      name: "Foundation",
      percentOfPlan: 0.4, // ~3-4 weeks
      focus: "Establishing consistent running habit and basic aerobic fitness",
      intensityRange: [35, 50],
    },
    {
      name: "Development",
      percentOfPlan: 0.4, // ~3-4 weeks
      focus: "Building volume and introducing variety",
      intensityRange: [45, 60],
    },
    {
      name: "Consolidation",
      percentOfPlan: 0.2, // ~1-2 weeks
      focus: "Maintaining gains and preparing for next phase",
      intensityRange: [40, 55],
    },
  ],

  // Weekly structure (lighter than race-specific plans)
  weeklyStructure: {
    keySessions: 1,
    easyRuns: 3,
    restDays: 2,
    keySessionTypes: ["tempo", "fartlek"],
  },

  // Volume guidelines (more conservative)
  volumeGuidelines: {
    startPercentOfPeak: 0.7, // Start at 70% of peak
    peakWeekNumber: -2, // Peak 2 weeks before end
    taperReduction: 0.7, // Light taper, reduce to 70%
    taperWeeks: 1,
  },

  // Experience modifiers (more conservative for base building)
  experienceModifiers: {
    beginner: { volumeMultiplier: 0.7, intensityMultiplier: 0.8 },
    returning: { volumeMultiplier: 0.85, intensityMultiplier: 0.9 },
    casual: { volumeMultiplier: 1.0, intensityMultiplier: 1.0 },
    serious: { volumeMultiplier: 1.1, intensityMultiplier: 1.0 },
  },
};

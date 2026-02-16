/**
 * Plan Template Types (Story 6.5 - Task 2)
 *
 * Templates define the structure of a training plan for a specific goal type.
 * Each template specifies phases, volume guidelines, and experience modifiers.
 */

/**
 * Goal types supported by templates
 */
export type GoalType = "5k" | "10k" | "half_marathon" | "marathon" | "base_building";

/**
 * Phase names for periodization
 */
export type PhaseName = "base" | "build" | "peak" | "taper" | "race";

/**
 * Experience levels for modifiers
 */
export type ExperienceLevel = "beginner" | "returning" | "casual" | "serious";

/**
 * A phase within a training plan
 */
export interface PlanPhase {
  /** Phase name for display */
  name: string;
  /** Percentage of total plan duration (0-1) */
  percentOfPlan: number;
  /** Focus area for this phase */
  focus: string;
  /** Intensity range for this phase (0-100 scale) */
  intensityRange: [number, number];
}

/**
 * Weekly structure template
 */
export interface WeeklyStructure {
  /** Number of quality/key sessions per week */
  keySessions: number;
  /** Number of easy runs per week */
  easyRuns: number;
  /** Number of rest days per week */
  restDays: number;
  /** Types of key sessions (e.g., ["tempo", "intervals", "long_run"]) */
  keySessionTypes: string[];
}

/**
 * Volume guidelines for the plan
 */
export interface VolumeGuidelines {
  /** Starting volume as percentage of peak (0-1) */
  startPercentOfPeak: number;
  /** Which week number has peak volume (negative = from end) */
  peakWeekNumber: number;
  /** Volume reduction during taper as percentage (0-1) */
  taperReduction: number;
  /** Number of taper weeks */
  taperWeeks: number;
}

/**
 * Experience-based modifiers
 */
export interface ExperienceModifier {
  /** Volume multiplier for this experience level */
  volumeMultiplier: number;
  /** Intensity multiplier for this experience level */
  intensityMultiplier: number;
}

/**
 * Complete plan template definition
 */
export interface PlanTemplate {
  /** Unique identifier for the template */
  id: string;
  /** Display name */
  name: string;
  /** Goal type this template is for */
  goalType: GoalType;
  /** Periodization model name (e.g., "linear", "block", "reverse") */
  periodizationModel: string;

  /** Duration constraints */
  minWeeks: number;
  maxWeeks: number;
  recommendedWeeks: number;

  /** Phase distribution */
  phases: PlanPhase[];

  /** Weekly structure */
  weeklyStructure: WeeklyStructure;

  /** Volume guidelines */
  volumeGuidelines: VolumeGuidelines;

  /** Experience-based modifiers */
  experienceModifiers: Record<ExperienceLevel, ExperienceModifier>;
}

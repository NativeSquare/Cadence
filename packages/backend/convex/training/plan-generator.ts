/**
 * Plan Generator Core (Story 6.5)
 *
 * PURE CALCULATION MODULE - Does NOT write to database.
 * Combines Runner Object + Knowledge Base + Safeguards to create personalized,
 * grounded, and safe training plans.
 *
 * Reference: architecture-backend-v2.md#Module-3-Plan-Generator
 * Interface: PlanGenerator.generate(runner) → Plan + Sessions + Audit
 */

import type { Doc, Id } from "../_generated/dataModel";
import type {
  Decision,
  SafeguardApplication,
  SeasonView,
  WeeklyPlanItem,
  RunnerSnapshot,
  ProfileRadarItem,
} from "../table/trainingPlans";
import type { PlannedSession, StructureSegment } from "../table/plannedSessions";
import type {
  Decision as SafeguardDecision,
  RunnerContext as SafeguardRunnerContext,
  ValidationResult,
} from "../safeguards/check";
import { checkSafeguards } from "../safeguards/check";
import { selectTemplate, type PlanTemplate } from "./templates";

// =============================================================================
// Constants
// =============================================================================

export const GENERATOR_VERSION = "1.0.0";

/**
 * Pace zones type - matches runners.currentState.paceZones schema
 * Defined explicitly to avoid TypeScript inference issues with Convex schemas
 */
export interface PaceZones {
  easy?: string;
  marathon?: string;
  threshold?: string;
  interval?: string;
  repetition?: string;
}

/** Radar chart axes for runner profile visualization */
const RADAR_AXES = [
  { key: "endurance", label: "Endurance" },
  { key: "speed", label: "Speed" },
  { key: "recovery", label: "Recovery" },
  { key: "consistency", label: "Consistency" },
  { key: "injuryRisk", label: "Injury Risk" },
  { key: "raceReady", label: "Race Ready" },
] as const;

/** Days of week for session scheduling */
const DAYS_OF_WEEK = [
  { full: "monday", short: "Mon" },
  { full: "tuesday", short: "Tue" },
  { full: "wednesday", short: "Wed" },
  { full: "thursday", short: "Thu" },
  { full: "friday", short: "Fri" },
  { full: "saturday", short: "Sat" },
  { full: "sunday", short: "Sun" },
] as const;

/** MS in a day */
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// =============================================================================
// Types (AC: 9 - Module Isolation)
// =============================================================================

/**
 * Goal types supported by the plan generator
 */
export type GoalType = "5k" | "10k" | "half_marathon" | "marathon" | "base_building";

/**
 * Knowledge Base query context
 */
export interface KBQueryContext {
  tags?: string[];
  category?: "physiology" | "training_principles" | "periodization" | "recovery" | "injury_prevention" | "nutrition" | "mental";
  runnerContext?: {
    experience?: string;
    goalType?: string;
    injuries?: string[];
  };
}

/**
 * Knowledge Base entry (simplified for plan generator)
 */
export interface KBEntry {
  id: string;
  title: string;
  content: string;
  summary: string;
  confidence: "established" | "well_supported" | "emerging" | "experimental";
  applicableGoals?: string[];
  tags: string[];
}

/**
 * Input to the plan generator - everything needed to create a plan.
 * PURE FUNCTION - receives all dependencies as parameters.
 */
export interface PlanGeneratorInput {
  /** Runner profile (complete, passed in - NOT queried) */
  runner: Doc<"runners">;

  /** Goal parameters */
  goalType: GoalType;
  targetDate?: number; // Unix timestamp ms
  targetTime?: number; // Target finish time in seconds
  durationWeeks: number; // How long the plan should be

  /** Interfaces (functions, NOT direct DB access) */
  queryKnowledgeBase: (context: KBQueryContext) => Promise<KBEntry[]>;
  getSafeguards: () => Promise<Doc<"safeguards">[]>;

  /** Optional: LLM for season view synthesis */
  generateCoachSummary?: (context: CoachSummaryContext) => Promise<string>;
}

/**
 * Context for LLM coach summary generation
 */
export interface CoachSummaryContext {
  goalType: GoalType;
  durationWeeks: number;
  runnerExperience: string;
  keyDecisions: string[];
  risks: string[];
}

/**
 * Load parameters calculated from KB + runner state
 */
export interface LoadParameters {
  baseVolumeKm: number;
  peakVolumeKm: number;
  weeklyIncreasePercent: number;
  startingIntensity: number;
  peakIntensity: number;
}

/**
 * A modifier applied to load parameters
 */
export interface AppliedModifier {
  type: "injury" | "age" | "experience" | "recovery";
  description: string;
  originalValue: number;
  modifiedValue: number;
  field: string;
  kbReference?: string;
}

/**
 * Complete output from plan generation
 */
export interface PlanGeneratorOutput {
  /** The plan (matches trainingPlans schema, minus DB-generated fields) */
  plan: Omit<Doc<"trainingPlans">, "_id" | "_creationTime">;

  /** Sessions to create (matches plannedSessions schema, minus DB-generated fields) */
  sessions: Omit<PlannedSession, "_id" | "_creationTime" | "planId">[];

  /** Generation metadata */
  generatedAt: number;
  generatorVersion: string;
}

// =============================================================================
// Internal Types
// =============================================================================

interface GenerationContext {
  input: PlanGeneratorInput;
  template: PlanTemplate;
  loadParams: LoadParameters;
  modifiers: AppliedModifier[];
  decisions: Decision[];
  safeguardApplications: SafeguardApplication[];
  kbReferences: Map<string, KBEntry>;
}

// =============================================================================
// Main Entry Point (AC: 9)
// =============================================================================

/**
 * Generate a complete training plan.
 *
 * PURE FUNCTION - does NOT access database directly.
 * All dependencies are passed in as parameters.
 *
 * Steps:
 * 1. Template selection (AC: 1)
 * 2. Load parameter calculation (AC: 2)
 * 3. Modifier application (AC: 3)
 * 4. Safeguard validation (AC: 4)
 * 5. Week-by-week generation (AC: 5)
 * 6. Session generation (AC: 6)
 * 7. Season view synthesis (AC: 7)
 * 8. Runner snapshot (AC: 8)
 * 9. Return complete plan (AC: 10)
 *
 * @param input - PlanGeneratorInput with runner, goal, and interfaces
 * @returns PlanGeneratorOutput with complete plan and sessions
 */
export async function generatePlan(
  input: PlanGeneratorInput
): Promise<PlanGeneratorOutput> {
  const generatedAt = Date.now();

  // Initialize context for tracking decisions and references
  const context: GenerationContext = {
    input,
    template: null!, // Set in step 1
    loadParams: null!, // Set in step 2
    modifiers: [],
    decisions: [],
    safeguardApplications: [],
    kbReferences: new Map(),
  };

  // 1. Template Selection (AC: 1)
  context.template = await selectTemplateWithDecision(context);

  // 2. Load Parameter Calculation (AC: 2)
  context.loadParams = await calculateLoadParameters(context);

  // 3. Modifier Application (AC: 3)
  await applyModifiers(context);

  // 4. Safeguard Validation (AC: 4)
  await validateWithSafeguards(context);

  // 5. Week-by-Week Generation (AC: 5)
  const weeklyPlan = generateWeeklyPlan(context);

  // 6. Session Generation (AC: 6)
  const sessions = generateSessions(context, weeklyPlan);

  // 7. Season View Synthesis (AC: 7)
  const seasonView = await synthesizeSeasonView(context, weeklyPlan);

  // 8. Runner Snapshot (AC: 8)
  const runnerSnapshot = captureRunnerSnapshot(context);

  // 9. Assemble Complete Plan (AC: 10)
  const startDate = generatedAt;
  const endDate = startDate + input.durationWeeks * 7 * MS_PER_DAY;

  const plan: Omit<Doc<"trainingPlans">, "_id" | "_creationTime"> = {
    runnerId: input.runner._id,
    userId: input.runner.userId,

    // Plan metadata
    name: `${formatGoalType(input.goalType)} - ${input.durationWeeks} Week Plan`,
    goalType: input.goalType,
    targetDate: input.targetDate,
    targetTime: input.targetTime,
    startDate,
    endDate,
    durationWeeks: input.durationWeeks,
    status: "draft",

    // Zoom Level 1: Season View
    seasonView,

    // Zoom Level 2: Weekly Plan
    weeklyPlan,

    // Runner Snapshot
    runnerSnapshot,

    // Generation metadata
    templateId: context.template.id,
    periodizationModel: context.template.periodizationModel,
    phases: context.template.phases.map((p, i) => ({
      name: p.name,
      startWeek: calculatePhaseStartWeek(context.template, i, input.durationWeeks),
      endWeek: calculatePhaseEndWeek(context.template, i, input.durationWeeks),
      focus: p.focus,
    })),
    loadParameters: {
      startingVolume: context.loadParams.baseVolumeKm,
      peakVolume: context.loadParams.peakVolumeKm,
      weeklyIncrease: context.loadParams.weeklyIncreasePercent,
      estimatedVdot: input.runner.currentState?.estimatedVdot,
    },
    targetPaces: extractPaceZones(input.runner),

    // Audit trail (AC: 10)
    decisions: context.decisions,
    safeguardApplications: context.safeguardApplications,

    // Timestamps
    generatedAt,
    generatorVersion: GENERATOR_VERSION,
    createdAt: generatedAt,
    updatedAt: generatedAt,
  };

  return {
    plan,
    sessions,
    generatedAt,
    generatorVersion: GENERATOR_VERSION,
  };
}

// =============================================================================
// Step 1: Template Selection (AC: 1)
// =============================================================================

async function selectTemplateWithDecision(context: GenerationContext): Promise<PlanTemplate> {
  const { input } = context;
  const template = selectTemplate(input.goalType, input.durationWeeks);

  // Log decision
  context.decisions.push({
    category: "template_selection",
    decision: `Selected template: ${template.name}`,
    reasoning: `Goal type ${input.goalType} with ${input.durationWeeks} weeks duration matches ${template.name}. ` +
      `Template supports ${template.minWeeks}-${template.maxWeeks} weeks, recommended ${template.recommendedWeeks}.`,
    alternatives: [],
  });

  return template;
}

// =============================================================================
// Step 2: Load Parameter Calculation (AC: 2)
// =============================================================================

async function calculateLoadParameters(context: GenerationContext): Promise<LoadParameters> {
  const { input, template, decisions } = context;
  const runner = input.runner;

  // Query KB for volume principles
  const volumeKB = await input.queryKnowledgeBase({
    tags: ["volume_progression", "10_percent_rule"],
    category: "training_principles",
    runnerContext: {
      experience: runner.running?.experienceLevel,
      goalType: input.goalType,
    },
  });

  // Store KB references
  for (const entry of volumeKB) {
    context.kbReferences.set(entry.id, entry);
  }

  // Get current fitness from runner's currentState (from Inference Engine)
  const currentVolume = runner.currentState?.last28DaysAvgVolume ?? runner.running?.currentVolume ?? 20;
  const experienceLevel = runner.running?.experienceLevel ?? "beginner";

  // Calculate base and peak volumes using template guidelines
  const experienceMod = template.experienceModifiers[experienceLevel as keyof typeof template.experienceModifiers]
    ?? template.experienceModifiers.beginner;

  // Base volume: Start at current volume or slightly higher
  const baseVolumeKm = Math.round(currentVolume * 1.0 * experienceMod.volumeMultiplier);

  // Peak volume: Based on goal type and experience
  const peakMultiplier = getPeakVolumeMultiplier(input.goalType, experienceLevel);
  const peakVolumeKm = Math.round(baseVolumeKm * peakMultiplier);

  // Weekly increase: 8-10% is typical, adjust for experience
  const weeklyIncreasePercent = experienceLevel === "beginner" ? 0.07 : 0.08;

  // Intensity scaling
  const startingIntensity = template.phases[0].intensityRange[0];
  const peakIntensity = Math.max(...template.phases.map(p => p.intensityRange[1]));

  const loadParams: LoadParameters = {
    baseVolumeKm,
    peakVolumeKm,
    weeklyIncreasePercent,
    startingIntensity,
    peakIntensity,
  };

  // Log decision with KB references
  decisions.push({
    category: "load_parameters",
    decision: `Base: ${baseVolumeKm}km, Peak: ${peakVolumeKm}km, Weekly increase: ${Math.round(weeklyIncreasePercent * 100)}%`,
    reasoning: `Based on current volume of ${currentVolume}km/week and ${experienceLevel} experience level. ` +
      `Applied ${experienceMod.volumeMultiplier}x volume multiplier from template.`,
    knowledgeBaseRefs: volumeKB.map(e => e.id),
  });

  return loadParams;
}

function getPeakVolumeMultiplier(goalType: GoalType, experience: string): number {
  const multipliers: Record<GoalType, Record<string, number>> = {
    "5k": { beginner: 1.3, returning: 1.4, casual: 1.5, serious: 1.6 },
    "10k": { beginner: 1.4, returning: 1.5, casual: 1.6, serious: 1.8 },
    "half_marathon": { beginner: 1.5, returning: 1.6, casual: 1.8, serious: 2.0 },
    "marathon": { beginner: 1.8, returning: 2.0, casual: 2.2, serious: 2.5 },
    "base_building": { beginner: 1.3, returning: 1.4, casual: 1.5, serious: 1.6 },
  };
  return multipliers[goalType][experience] ?? 1.5;
}

// =============================================================================
// Step 3: Modifier Application (AC: 3)
// =============================================================================

async function applyModifiers(context: GenerationContext): Promise<void> {
  const { input, loadParams, decisions, modifiers } = context;
  const runner = input.runner;

  // 3.1 Injury History Modifiers
  if (runner.health?.pastInjuries?.length) {
    const injuryKB = await input.queryKnowledgeBase({
      tags: ["injury_prevention", "return_to_running"],
      category: "injury_prevention",
      runnerContext: {
        injuries: runner.health.pastInjuries,
      },
    });

    for (const entry of injuryKB) {
      context.kbReferences.set(entry.id, entry);
    }

    // Reduce weekly increase for runners with injury history
    const originalIncrease = loadParams.weeklyIncreasePercent;
    loadParams.weeklyIncreasePercent = Math.min(loadParams.weeklyIncreasePercent, 0.07);

    if (originalIncrease !== loadParams.weeklyIncreasePercent) {
      modifiers.push({
        type: "injury",
        description: `Reduced volume progression due to injury history: ${runner.health.pastInjuries.join(", ")}`,
        originalValue: originalIncrease,
        modifiedValue: loadParams.weeklyIncreasePercent,
        field: "weeklyIncreasePercent",
        kbReference: injuryKB[0]?.id,
      });
    }
  }

  // 3.2 Age Modifiers (recovery requirements)
  const age = runner.physical?.age;
  if (age && age > 45) {
    const ageKB = await input.queryKnowledgeBase({
      tags: ["masters_running", "recovery"],
      category: "recovery",
    });

    for (const entry of ageKB) {
      context.kbReferences.set(entry.id, entry);
    }

    // Reduce peak volume for older runners
    const originalPeak = loadParams.peakVolumeKm;
    const ageReduction = age > 60 ? 0.85 : age > 50 ? 0.9 : 0.95;
    loadParams.peakVolumeKm = Math.round(loadParams.peakVolumeKm * ageReduction);

    modifiers.push({
      type: "age",
      description: `Adjusted peak volume for age ${age} (increased recovery needs)`,
      originalValue: originalPeak,
      modifiedValue: loadParams.peakVolumeKm,
      field: "peakVolumeKm",
      kbReference: ageKB[0]?.id,
    });
  }

  // 3.3 Experience Modifiers (beginner = more conservative)
  const experience = runner.running?.experienceLevel;
  if (experience === "beginner") {
    const originalPeak = loadParams.peakVolumeKm;
    loadParams.peakVolumeKm = Math.round(loadParams.peakVolumeKm * 0.9);

    modifiers.push({
      type: "experience",
      description: "Reduced peak volume for beginner runner (conservative approach)",
      originalValue: originalPeak,
      modifiedValue: loadParams.peakVolumeKm,
      field: "peakVolumeKm",
    });
  }

  // 3.4 Recovery Style Modifiers
  if (runner.health?.recoveryStyle === "slow") {
    const originalIncrease = loadParams.weeklyIncreasePercent;
    loadParams.weeklyIncreasePercent = Math.min(loadParams.weeklyIncreasePercent, 0.06);

    modifiers.push({
      type: "recovery",
      description: "Reduced progression rate for slow recovery pattern",
      originalValue: originalIncrease,
      modifiedValue: loadParams.weeklyIncreasePercent,
      field: "weeklyIncreasePercent",
    });
  }

  // Log all modifications
  if (modifiers.length > 0) {
    decisions.push({
      category: "modifier_application",
      decision: `Applied ${modifiers.length} modifiers to load parameters`,
      reasoning: modifiers.map(m => m.description).join("; "),
      knowledgeBaseRefs: modifiers.filter(m => m.kbReference).map(m => m.kbReference!),
    });
  }
}

// =============================================================================
// Step 4: Safeguard Validation (AC: 4)
// =============================================================================

async function validateWithSafeguards(context: GenerationContext): Promise<void> {
  const { input, loadParams, decisions, safeguardApplications } = context;
  const runner = input.runner;

  // Get safeguards
  const safeguards = await input.getSafeguards();

  // Build decisions to check
  const decisionsToCheck: SafeguardDecision[] = [
    { field: "weeklyVolumeIncrease", proposedValue: loadParams.weeklyIncreasePercent },
    { field: "peakVolume", proposedValue: loadParams.peakVolumeKm },
    { field: "baseVolume", proposedValue: loadParams.baseVolumeKm },
  ];

  // Build runner context
  const runnerContext: SafeguardRunnerContext = {
    experienceLevel: runner.running?.experienceLevel ?? "beginner",
    age: runner.physical?.age,
    hasInjuryHistory: (runner.health?.pastInjuries?.length ?? 0) > 0,
    injuryTypes: runner.health?.pastInjuries,
    currentPhase: "base",
  };

  // Check safeguards
  const result = checkSafeguards(safeguards, decisionsToCheck, runnerContext);

  // Process violations (hard limits)
  for (const violation of result.violations) {
    safeguardApplications.push({
      safeguardId: violation.safeguardId,
      applied: true,
      reason: violation.message,
    });

    // Hard limit violation - this should HALT plan generation
    decisions.push({
      category: "safeguard_violation",
      decision: `BLOCKED: ${violation.field} = ${violation.proposedValue}`,
      reasoning: violation.message,
    });
  }

  // Process adjustments (soft limits auto-corrected)
  for (const adjustment of result.adjustments) {
    safeguardApplications.push({
      safeguardId: adjustment.safeguardId,
      applied: true,
      originalValue: adjustment.originalValue as number,
      adjustedValue: adjustment.adjustedValue as number,
      reason: adjustment.message,
    });

    // Apply adjustment to load params
    if (adjustment.field === "weeklyVolumeIncrease") {
      loadParams.weeklyIncreasePercent = adjustment.adjustedValue as number;
    } else if (adjustment.field === "peakVolume") {
      loadParams.peakVolumeKm = adjustment.adjustedValue as number;
    } else if (adjustment.field === "baseVolume") {
      loadParams.baseVolumeKm = adjustment.adjustedValue as number;
    }

    decisions.push({
      category: "safeguard_adjustment",
      decision: `Adjusted ${adjustment.field}: ${adjustment.originalValue} → ${adjustment.adjustedValue}`,
      reasoning: adjustment.message,
    });
  }

  // Process warnings
  for (const warning of result.warnings) {
    safeguardApplications.push({
      safeguardId: warning.safeguardId,
      applied: false,
      reason: warning.message,
    });
  }

  // Throw if hard violations exist
  if (!result.isValid) {
    throw new Error(
      `Plan generation blocked by safeguards: ${result.violations.map(v => v.message).join("; ")}`
    );
  }
}

// =============================================================================
// Step 5: Week-by-Week Generation (AC: 5)
// =============================================================================

function generateWeeklyPlan(context: GenerationContext): WeeklyPlanItem[] {
  const { input, template, loadParams } = context;
  const weeks: WeeklyPlanItem[] = [];

  const startDate = Date.now();
  const totalWeeks = input.durationWeeks;

  // Calculate recovery week pattern (every 3-4 weeks)
  const recoveryWeekInterval = totalWeeks <= 8 ? 4 : 3;

  for (let weekNum = 1; weekNum <= totalWeeks; weekNum++) {
    const weekStartDate = startDate + (weekNum - 1) * 7 * MS_PER_DAY;
    const weekEndDate = weekStartDate + 6 * MS_PER_DAY;

    // Determine phase for this week
    const phase = getPhaseForWeek(template, weekNum, totalWeeks);

    // Is this a recovery week?
    const isRecoveryWeek = weekNum % recoveryWeekInterval === 0 && weekNum < totalWeeks - 2;

    // Is this taper period?
    const isTaper = weekNum > totalWeeks - template.volumeGuidelines.taperWeeks;

    // Calculate volume for this week
    const volumeKm = calculateWeekVolume(
      loadParams,
      weekNum,
      totalWeeks,
      isRecoveryWeek,
      isTaper,
      template
    );

    // Calculate previous week volume for change percent
    const prevVolumeKm = weekNum > 1
      ? weeks[weekNum - 2].volumeKm
      : loadParams.baseVolumeKm;
    const volumeChangePercent = prevVolumeKm > 0
      ? Math.round(((volumeKm - prevVolumeKm) / prevVolumeKm) * 100)
      : 0;

    // Calculate intensity score
    const intensityScore = calculateWeekIntensity(phase, isRecoveryWeek, isTaper);

    // Determine week label
    let weekLabel: string | undefined;
    if (isRecoveryWeek) weekLabel = "Recovery";
    if (isTaper) weekLabel = "Taper";
    if (weekNum === totalWeeks && input.targetDate) weekLabel = "Race";

    // Session distribution
    const keySessions = isRecoveryWeek ? 1 : isTaper && weekNum === totalWeeks ? 0 : 2;
    const easyRuns = isRecoveryWeek ? 2 : isTaper ? 2 : 3;
    const restDays = 7 - keySessions - easyRuns - 1; // -1 for long run

    weeks.push({
      weekNumber: weekNum,
      weekStartDate,
      weekEndDate,
      phaseName: phase.name,
      phaseWeekNumber: getPhaseWeekNumber(template, weekNum, totalWeeks),
      volumeKm,
      intensityScore,
      isRecoveryWeek,
      weekLabel,
      keySessions,
      easyRuns,
      restDays: Math.max(1, restDays),
      weekFocus: isRecoveryWeek ? "Recovery and adaptation" : phase.focus,
      weekJustification: generateWeekJustification(
        weekNum,
        totalWeeks,
        phase,
        isRecoveryWeek,
        isTaper,
        volumeChangePercent
      ),
      volumeChangePercent,
    });
  }

  return weeks;
}

function getPhaseForWeek(
  template: PlanTemplate,
  weekNum: number,
  totalWeeks: number
): PlanTemplate["phases"][0] {
  let cumulativeWeeks = 0;
  for (const phase of template.phases) {
    const phaseWeeks = Math.round(phase.percentOfPlan * totalWeeks);
    cumulativeWeeks += phaseWeeks;
    if (weekNum <= cumulativeWeeks) {
      return phase;
    }
  }
  return template.phases[template.phases.length - 1];
}

function getPhaseWeekNumber(
  template: PlanTemplate,
  weekNum: number,
  totalWeeks: number
): number {
  let cumulativeWeeks = 0;
  for (const phase of template.phases) {
    const phaseWeeks = Math.round(phase.percentOfPlan * totalWeeks);
    if (weekNum <= cumulativeWeeks + phaseWeeks) {
      return weekNum - cumulativeWeeks;
    }
    cumulativeWeeks += phaseWeeks;
  }
  return 1;
}

function calculateWeekVolume(
  loadParams: LoadParameters,
  weekNum: number,
  totalWeeks: number,
  isRecoveryWeek: boolean,
  isTaper: boolean,
  template: PlanTemplate
): number {
  const { baseVolumeKm, peakVolumeKm, weeklyIncreasePercent } = loadParams;

  // Recovery week: reduce by 30-40%
  if (isRecoveryWeek) {
    const baseVolume = baseVolumeKm * Math.pow(1 + weeklyIncreasePercent, weekNum - 1);
    return Math.round(baseVolume * 0.65);
  }

  // Taper: progressive reduction
  if (isTaper) {
    const taperWeeks = template.volumeGuidelines.taperWeeks;
    const taperProgress = (totalWeeks - weekNum) / taperWeeks;
    const taperVolume = peakVolumeKm * (template.volumeGuidelines.taperReduction +
      (1 - template.volumeGuidelines.taperReduction) * taperProgress);
    return Math.round(taperVolume);
  }

  // Normal progression
  const progressedVolume = baseVolumeKm * Math.pow(1 + weeklyIncreasePercent, weekNum - 1);
  return Math.round(Math.min(progressedVolume, peakVolumeKm));
}

function calculateWeekIntensity(
  phase: PlanTemplate["phases"][0],
  isRecoveryWeek: boolean,
  isTaper: boolean
): number {
  if (isRecoveryWeek) {
    return Math.round(phase.intensityRange[0] * 0.7);
  }
  if (isTaper) {
    return Math.round((phase.intensityRange[0] + phase.intensityRange[1]) / 2 * 0.8);
  }
  return Math.round((phase.intensityRange[0] + phase.intensityRange[1]) / 2);
}

function generateWeekJustification(
  weekNum: number,
  totalWeeks: number,
  phase: PlanTemplate["phases"][0],
  isRecoveryWeek: boolean,
  isTaper: boolean,
  volumeChangePercent: number
): string {
  if (isRecoveryWeek) {
    return `Recovery week to allow adaptation from previous training block. Volume reduced to promote recovery while maintaining fitness.`;
  }
  if (isTaper) {
    const weeksToRace = totalWeeks - weekNum;
    return `Taper period - ${weeksToRace} weeks to race. Reducing volume while maintaining intensity to arrive fresh and ready.`;
  }
  if (weekNum === 1) {
    return `First week establishes baseline. Focus on ${phase.focus.toLowerCase()} with conservative volume to assess current fitness.`;
  }

  const changeDirection = volumeChangePercent > 0 ? "increase" : volumeChangePercent < 0 ? "decrease" : "maintenance";
  return `${phase.name} phase, week ${weekNum}. Volume ${changeDirection} of ${Math.abs(volumeChangePercent)}% supports ${phase.focus.toLowerCase()}.`;
}

// =============================================================================
// Step 6: Session Generation (AC: 6)
// =============================================================================

function generateSessions(
  context: GenerationContext,
  weeklyPlan: WeeklyPlanItem[]
): Omit<PlannedSession, "_id" | "_creationTime" | "planId">[] {
  const { input, template, kbReferences, safeguardApplications } = context;
  const sessions: Omit<PlannedSession, "_id" | "_creationTime" | "planId">[] = [];
  const runner = input.runner;

  // Get blocked days from runner schedule
  const blockedDays = new Set(runner.schedule?.blockedDays?.map(d => d.toLowerCase()) ?? []);

  // Get target paces from runner's current state
  const paces = extractPaceZones(runner);

  for (const week of weeklyPlan) {
    const weekSessions = generateWeekSessions(
      week,
      template,
      runner,
      blockedDays,
      paces,
      kbReferences,
      safeguardApplications
    );
    sessions.push(...weekSessions);
  }

  return sessions;
}

/**
 * Assign sessions to days with optimal spacing.
 * Key sessions should have at least 1 easy/rest day between them.
 */
function assignSessionsToDays(
  sessionTypes: string[],
  availableDays: { full: string; short: string }[]
): Map<number, string> {
  const assignments = new Map<number, string>();

  // Separate key and non-key sessions
  const keySessions = sessionTypes.filter(t => ["tempo", "intervals", "long_run"].includes(t));
  const easySessions = sessionTypes.filter(t => t === "easy");

  // Strategy: Spread key sessions across the week with gaps
  // Ideal spacing: Mon=easy, Tue=key, Wed=easy, Thu=key, Fri=easy, Sat=long, Sun=rest
  const keyDayIndices: number[] = [];

  if (keySessions.length === 1) {
    // Single key session: place in middle of week
    keyDayIndices.push(Math.floor(availableDays.length / 2));
  } else if (keySessions.length === 2) {
    // Two key sessions: spread with gap
    const gap = Math.floor(availableDays.length / 3);
    keyDayIndices.push(gap);
    keyDayIndices.push(Math.min(availableDays.length - 1, gap * 2 + 1));
  } else if (keySessions.length >= 3) {
    // Three+ key sessions: spread evenly, long run typically on weekend
    const gap = Math.floor(availableDays.length / (keySessions.length + 1));
    for (let i = 0; i < keySessions.length; i++) {
      keyDayIndices.push(Math.min(availableDays.length - 1, (i + 1) * gap));
    }
    // Move long run to last available day (typically weekend)
    const longRunIndex = keySessions.indexOf("long_run");
    if (longRunIndex >= 0) {
      keyDayIndices[longRunIndex] = availableDays.length - 1;
    }
  }

  // Assign key sessions to their indices
  for (let i = 0; i < keySessions.length; i++) {
    if (keyDayIndices[i] !== undefined) {
      assignments.set(keyDayIndices[i], keySessions[i]);
    }
  }

  // Fill remaining days with easy sessions
  let easyIndex = 0;
  for (let i = 0; i < availableDays.length && easyIndex < easySessions.length; i++) {
    if (!assignments.has(i)) {
      assignments.set(i, easySessions[easyIndex]);
      easyIndex++;
    }
  }

  return assignments;
}

function generateWeekSessions(
  week: WeeklyPlanItem,
  template: PlanTemplate,
  runner: Doc<"runners">,
  blockedDays: Set<string>,
  paces: PaceZones | undefined,
  kbReferences: Map<string, KBEntry>,
  safeguardApplications: SafeguardApplication[]
): Omit<PlannedSession, "_id" | "_creationTime" | "planId">[] {
  const sessions: Omit<PlannedSession, "_id" | "_creationTime" | "planId">[] = [];

  // Determine available days
  const availableDays = DAYS_OF_WEEK.filter(d => !blockedDays.has(d.full));

  // Session allocation based on week type
  const sessionTypes = getSessionTypesForWeek(week, template);

  // Assign sessions with optimal spacing (key sessions spread apart)
  const dayAssignments = assignSessionsToDays(sessionTypes, availableDays);

  // Create sessions based on assignments
  const assignedDayIndices = Array.from(dayAssignments.keys()).sort((a, b) => a - b);

  for (const dayIdx of assignedDayIndices) {
    const sessionType = dayAssignments.get(dayIdx)!;
    const day = availableDays[dayIdx];
    const dayOfWeekIdx = DAYS_OF_WEEK.findIndex(d => d.full === day.full);
    const scheduledDate = week.weekStartDate + dayOfWeekIdx * MS_PER_DAY;

    const session = createSession(
      week,
      day,
      scheduledDate,
      sessionType,
      runner,
      paces,
      kbReferences,
      safeguardApplications
    );
    sessions.push(session);
  }

  // Add rest days for unassigned available days
  for (let i = 0; i < availableDays.length; i++) {
    if (!dayAssignments.has(i)) {
      const day = availableDays[i];
      const dayOfWeekIdx = DAYS_OF_WEEK.findIndex(d => d.full === day.full);
      const scheduledDate = week.weekStartDate + dayOfWeekIdx * MS_PER_DAY;

      sessions.push(createRestDay(week, day, scheduledDate, runner._id));
    }
  }

  return sessions;
}

function getSessionTypesForWeek(
  week: WeeklyPlanItem,
  template: PlanTemplate
): string[] {
  const types: string[] = [];

  // Add key sessions
  const keyTypes = template.weeklyStructure.keySessionTypes;
  for (let i = 0; i < week.keySessions; i++) {
    types.push(keyTypes[i % keyTypes.length]);
  }

  // Add long run (if not recovery week)
  if (!week.isRecoveryWeek) {
    types.push("long_run");
  }

  // Add easy runs
  for (let i = 0; i < week.easyRuns; i++) {
    types.push("easy");
  }

  return types;
}

function createSession(
  week: WeeklyPlanItem,
  day: typeof DAYS_OF_WEEK[number],
  scheduledDate: number,
  sessionType: string,
  runner: Doc<"runners">,
  paces: PaceZones | undefined,
  kbReferences: Map<string, KBEntry>,
  safeguardApplications: SafeguardApplication[]
): Omit<PlannedSession, "_id" | "_creationTime" | "planId"> {
  const isKeySession = ["tempo", "intervals", "long_run"].includes(sessionType);
  const sessionConfig = getSessionConfig(sessionType, week, paces);

  // Get KB references for this session type
  const relatedKBIds = Array.from(kbReferences.entries())
    .filter(([_, entry]) => entry.tags.some(t =>
      t.toLowerCase().includes(sessionType) ||
      t.toLowerCase().includes(sessionConfig.physiologicalTarget)
    ))
    .map(([id]) => id)
    .slice(0, 3);

  // Get related safeguard IDs
  const relatedSafeguardIds = safeguardApplications
    .filter(s => s.applied)
    .map(s => s.safeguardId)
    .slice(0, 3);

  return {
    runnerId: runner._id,
    weekNumber: week.weekNumber,
    dayOfWeek: day.full,
    dayOfWeekShort: day.short,
    scheduledDate,

    sessionType,
    sessionTypeDisplay: formatSessionType(sessionType),
    isKeySession,
    isRestDay: false,

    targetDurationSeconds: sessionConfig.durationSeconds,
    targetDurationDisplay: formatDuration(sessionConfig.durationSeconds),
    effortLevel: sessionConfig.effortLevel,
    effortDisplay: `${sessionConfig.effortLevel}/10`,

    targetPaceMin: sessionConfig.paceMin,
    targetPaceMax: sessionConfig.paceMax,
    targetPaceDisplay: sessionConfig.paceMin && sessionConfig.paceMax
      ? `${sessionConfig.paceMin}-${sessionConfig.paceMax}`
      : undefined,

    description: sessionConfig.description,
    structureDisplay: sessionConfig.structureDisplay,

    justification: sessionConfig.justification,
    physiologicalTarget: sessionConfig.physiologicalTarget,
    placementRationale: `Scheduled on ${day.full} to allow adequate recovery between key sessions.`,
    keyPoints: sessionConfig.keyPoints,
    relatedKnowledgeIds: relatedKBIds,
    relatedSafeguardIds,

    isMoveable: !isKeySession,
    canBeSplit: sessionType === "easy" && sessionConfig.durationSeconds > 3600,

    status: "scheduled",
    colorTheme: isKeySession ? "lime" : "gray",
  };
}

function createRestDay(
  week: WeeklyPlanItem,
  day: typeof DAYS_OF_WEEK[number],
  scheduledDate: number,
  runnerId: Id<"runners">
): Omit<PlannedSession, "_id" | "_creationTime" | "planId"> {
  return {
    runnerId,
    weekNumber: week.weekNumber,
    dayOfWeek: day.full,
    dayOfWeekShort: day.short,
    scheduledDate,

    sessionType: "rest",
    sessionTypeDisplay: "Rest",
    isKeySession: false,
    isRestDay: true,

    targetDurationDisplay: "-",
    effortLevel: 0, // Explicit 0 for rest days
    effortDisplay: "0/10",

    description: "Rest day - focus on recovery",

    justification: "Rest days are essential for adaptation. The body repairs and strengthens during recovery.",
    physiologicalTarget: "recovery",

    isMoveable: true,
    status: "scheduled",
    colorTheme: "gray",
  };
}

interface SessionConfig {
  durationSeconds: number;
  effortLevel: number;
  paceMin?: string;
  paceMax?: string;
  description: string;
  structureDisplay?: string;
  justification: string;
  physiologicalTarget: string;
  keyPoints: string[];
}

/**
 * Calculate runner's easy pace in minutes per km.
 * Falls back to 6 min/km if pace data unavailable.
 */
function getRunnerEasyPaceMinutes(paces: PaceZones | undefined): number {
  if (!paces?.easy) return 6; // Default 6 min/km

  // Parse pace string like "5:40" or "5:40-6:00"
  const paceStr = paces.easy.split("-")[0]; // Take faster end if range
  const match = paceStr.match(/(\d+):(\d+)/);
  if (!match) return 6;

  return parseInt(match[1]) + parseInt(match[2]) / 60;
}

/**
 * Calculate session duration scaling factor based on week progression.
 * Earlier weeks = shorter sessions, peak weeks = longer sessions.
 */
function getWeekProgressionFactor(week: WeeklyPlanItem, isRecovery: boolean): number {
  if (isRecovery) return 0.7; // Recovery weeks: 70% duration

  // Scale from 0.85 (early weeks) to 1.0 (peak weeks)
  // volumeKm acts as proxy for progression
  const intensityFactor = Math.min(1.0, 0.85 + (week.intensityScore / 100) * 0.15);
  return intensityFactor;
}

function getSessionConfig(
  sessionType: string,
  week: WeeklyPlanItem,
  paces: PaceZones | undefined
): SessionConfig {
  const progressionFactor = getWeekProgressionFactor(week, week.isRecoveryWeek);
  const easyPaceMinutes = getRunnerEasyPaceMinutes(paces);

  switch (sessionType) {
    case "tempo": {
      // Base: 50 min, scales with progression (42-50 min range)
      const baseDuration = 50 * 60;
      const scaledDuration = Math.round(baseDuration * progressionFactor);
      const tempoMinutes = Math.round((scaledDuration - 20 * 60) / 60); // Subtract warm-up/cool-down

      return {
        durationSeconds: scaledDuration,
        effortLevel: week.isRecoveryWeek ? 6 : 7,
        paceMin: paces?.threshold?.split("-")[0],
        paceMax: paces?.threshold?.split("-")[1] ?? paces?.threshold,
        description: "Tempo run at threshold pace",
        structureDisplay: `10 min warm-up → ${tempoMinutes} min tempo → 10 min cool-down`,
        justification: "Tempo runs improve lactate threshold, allowing you to sustain faster paces for longer.",
        physiologicalTarget: "lactate_threshold",
        keyPoints: ["Start conservatively", "Find a rhythm", "Controlled breathing"],
      };
    }

    case "intervals": {
      // Base: 45 min, scales with progression (38-45 min range)
      const baseDuration = 45 * 60;
      const scaledDuration = Math.round(baseDuration * progressionFactor);
      // Adjust rep count based on duration (4-6 reps)
      const reps = Math.max(4, Math.min(6, Math.round((scaledDuration - 25 * 60) / (4 * 60) + 4)));

      return {
        durationSeconds: scaledDuration,
        effortLevel: week.isRecoveryWeek ? 7 : 8,
        paceMin: paces?.interval?.split("-")[0],
        paceMax: paces?.interval?.split("-")[1] ?? paces?.interval,
        description: "Interval session for VO2max development",
        structureDisplay: `15 min warm-up → ${reps}x800m with 400m jog recovery → 10 min cool-down`,
        justification: "Intervals at VO2max pace improve oxygen utilization and running economy.",
        physiologicalTarget: "vo2max",
        keyPoints: ["Hit target pace from first rep", "Full recovery between reps", "Maintain form throughout"],
      };
    }

    case "long_run": {
      // Calculate long run distance as ~35% of weekly volume
      const longRunKm = week.volumeKm * 0.35;
      // Use runner's actual easy pace for duration estimate
      const longRunMinutes = Math.round(longRunKm * easyPaceMinutes);

      return {
        durationSeconds: longRunMinutes * 60,
        effortLevel: week.isRecoveryWeek ? 4 : 5,
        paceMin: paces?.easy?.split("-")[0],
        paceMax: paces?.easy?.split("-")[1] ?? paces?.easy,
        description: "Long run for endurance building",
        justification: "Long runs build aerobic endurance and teach the body to burn fat efficiently.",
        physiologicalTarget: "aerobic_base",
        keyPoints: ["Start slow", "Stay hydrated", "Conversational pace"],
      };
    }

    case "easy":
    default: {
      // Base: 40 min, scales with progression (34-40 min range)
      const baseDuration = 40 * 60;
      const scaledDuration = Math.round(baseDuration * progressionFactor);

      return {
        durationSeconds: scaledDuration,
        effortLevel: week.isRecoveryWeek ? 3 : 4,
        paceMin: paces?.easy?.split("-")[0],
        paceMax: paces?.easy?.split("-")[1] ?? paces?.easy,
        description: "Easy run for recovery and base building",
        justification: "Easy runs build aerobic base without adding stress. Most training should be at this intensity.",
        physiologicalTarget: "aerobic_base",
        keyPoints: ["Truly easy pace", "Enjoy the run", "Build consistency"],
      };
    }
  }
}

// =============================================================================
// Step 7: Season View Synthesis (AC: 7)
// =============================================================================

async function synthesizeSeasonView(
  context: GenerationContext,
  weeklyPlan: WeeklyPlanItem[]
): Promise<SeasonView> {
  const { input, template, decisions, loadParams, modifiers } = context;

  // Extract key milestones from weekly plan
  const keyMilestones = extractKeyMilestones(weeklyPlan, input.durationWeeks);

  // Identify risks from runner profile
  const identifiedRisks = identifyRisks(input.runner, loadParams, modifiers);

  // Calculate expected outcomes
  const expectedOutcomes = calculateExpectedOutcomes(input, weeklyPlan);

  // Generate coach summary (use LLM if available, otherwise generate programmatically)
  let coachSummary: string;
  if (input.generateCoachSummary) {
    coachSummary = await input.generateCoachSummary({
      goalType: input.goalType,
      durationWeeks: input.durationWeeks,
      runnerExperience: input.runner.running?.experienceLevel ?? "beginner",
      keyDecisions: decisions.map(d => d.decision),
      risks: identifiedRisks.map(r => r.risk),
    });
  } else {
    coachSummary = generateProgrammaticSummary(input, weeklyPlan, loadParams);
  }

  return {
    coachSummary,
    periodizationJustification: `Using ${template.periodizationModel} periodization with ${template.phases.length} phases: ` +
      template.phases.map(p => p.name).join(" → ") + ".",
    volumeStrategyJustification: `Starting at ${loadParams.baseVolumeKm}km/week and building to ${loadParams.peakVolumeKm}km/week ` +
      `with ${Math.round(loadParams.weeklyIncreasePercent * 100)}% weekly progression.`,
    keyMilestones,
    identifiedRisks,
    expectedOutcomes,
  };
}

function extractKeyMilestones(
  weeklyPlan: WeeklyPlanItem[],
  totalWeeks: number
): SeasonView["keyMilestones"] {
  const milestones: SeasonView["keyMilestones"] = [];

  // First key session milestone
  const firstKeyWeek = weeklyPlan.find(w => w.keySessions > 0 && !w.isRecoveryWeek);
  if (firstKeyWeek) {
    milestones.push({
      weekNumber: firstKeyWeek.weekNumber,
      milestone: "First quality session",
      significance: "Testing baseline fitness and establishing training response",
    });
  }

  // Peak volume week
  const peakWeek = weeklyPlan.reduce((max, w) =>
    w.volumeKm > max.volumeKm ? w : max, weeklyPlan[0]);
  milestones.push({
    weekNumber: peakWeek.weekNumber,
    milestone: "Peak volume week",
    significance: `Highest training load at ${peakWeek.volumeKm}km - maximum fitness building`,
  });

  // Start of taper
  const taperStart = weeklyPlan.find(w => w.weekLabel === "Taper");
  if (taperStart) {
    milestones.push({
      weekNumber: taperStart.weekNumber,
      milestone: "Taper begins",
      significance: "Volume reduction begins - focus shifts to freshness",
    });
  }

  // Race week (if applicable)
  const raceWeek = weeklyPlan.find(w => w.weekLabel === "Race");
  if (raceWeek) {
    milestones.push({
      weekNumber: raceWeek.weekNumber,
      milestone: "Race day",
      significance: "Goal event - time to execute",
    });
  }

  return milestones.sort((a, b) => a.weekNumber - b.weekNumber);
}

function identifyRisks(
  runner: Doc<"runners">,
  loadParams: LoadParameters,
  modifiers: AppliedModifier[]
): SeasonView["identifiedRisks"] {
  const risks: SeasonView["identifiedRisks"] = [];

  // Injury history risk
  if (runner.health?.pastInjuries?.length) {
    risks.push({
      risk: `Previous injury history: ${runner.health.pastInjuries.join(", ")}`,
      mitigation: "Conservative volume progression limited to 7%, extra recovery emphasis",
      monitoringSignals: ["Pain or discomfort in previously injured areas", "Unusual fatigue", "Form breakdown"],
    });
  }

  // Age-related recovery risk
  if (runner.physical?.age && runner.physical.age > 45) {
    risks.push({
      risk: "Increased recovery needs due to age",
      mitigation: "Peak volume reduced, adequate rest days scheduled",
      monitoringSignals: ["Persistent fatigue", "Elevated resting HR", "Sleep disruption"],
    });
  }

  // High stress risk
  if (runner.health?.stressLevel === "high" || runner.health?.stressLevel === "survival") {
    risks.push({
      risk: "High life stress may impact recovery",
      mitigation: "Flexible scheduling, permission to reduce intensity on high-stress days",
      monitoringSignals: ["Motivation decline", "Missed sessions", "Chronic fatigue"],
    });
  }

  // Volume jump risk
  const volumeIncrease = (loadParams.peakVolumeKm - loadParams.baseVolumeKm) / loadParams.baseVolumeKm;
  if (volumeIncrease > 0.5) {
    risks.push({
      risk: "Significant volume increase during plan",
      mitigation: "Gradual progression with recovery weeks, volume capped at safe limits",
      monitoringSignals: ["Leg heaviness", "Decreased performance", "Persistent soreness"],
    });
  }

  return risks;
}

function calculateExpectedOutcomes(
  input: PlanGeneratorInput,
  weeklyPlan: WeeklyPlanItem[]
): SeasonView["expectedOutcomes"] {
  const runner = input.runner;
  const experience = runner.running?.experienceLevel ?? "beginner";

  // Confidence based on data quality and experience
  let confidenceLevel = 70;
  if (runner.currentState?.dataQuality === "high") confidenceLevel += 10;
  if (runner.currentState?.dataQuality === "low") confidenceLevel -= 15;
  if (experience === "serious") confidenceLevel += 10;
  if (experience === "beginner") confidenceLevel -= 10;

  confidenceLevel = Math.max(40, Math.min(90, confidenceLevel));

  return {
    primaryGoal: `Complete ${formatGoalType(input.goalType)}` +
      (input.targetTime ? ` in target time` : " successfully"),
    confidenceLevel,
    confidenceReason: `Based on ${runner.currentState?.dataQuality ?? "limited"} training history data and ${experience} experience level.`,
    secondaryOutcomes: [
      "Improved aerobic fitness",
      "Better pacing awareness",
      "Increased training consistency",
      experience === "beginner" ? "Foundation for future training" : "Maintained injury-free status",
    ],
  };
}

function generateProgrammaticSummary(
  input: PlanGeneratorInput,
  weeklyPlan: WeeklyPlanItem[],
  loadParams: LoadParameters
): string {
  const goalDisplay = formatGoalType(input.goalType);
  const experience = input.runner.running?.experienceLevel ?? "beginner";

  return `This ${input.durationWeeks}-week ${goalDisplay} plan is designed for a ${experience} runner. ` +
    `You'll build from ${loadParams.baseVolumeKm}km to ${loadParams.peakVolumeKm}km per week, ` +
    `with recovery weeks every 3-4 weeks to ensure proper adaptation. ` +
    `Trust the process and listen to your body.`;
}

// =============================================================================
// Step 8: Runner Snapshot (AC: 8)
// =============================================================================

function captureRunnerSnapshot(context: GenerationContext): RunnerSnapshot {
  const { input, modifiers } = context;
  const runner = input.runner;

  // Calculate profile radar
  const profileRadar = calculateProfileRadar(runner);

  // Extract plan influencers
  const planInfluencers: string[] = [];
  if (runner.running?.experienceLevel) {
    planInfluencers.push(`${runner.running.experienceLevel} experience level`);
  }
  if (runner.health?.pastInjuries?.length) {
    planInfluencers.push(`Injury history: ${runner.health.pastInjuries.join(", ")}`);
  }
  if (runner.physical?.age && runner.physical.age > 45) {
    planInfluencers.push(`Age ${runner.physical.age} (recovery considerations)`);
  }
  if (modifiers.length > 0) {
    planInfluencers.push(...modifiers.map(m => m.description));
  }

  // Fitness indicators
  const fitnessIndicators = {
    estimatedVdot: runner.currentState?.estimatedVdot,
    recentVolume: runner.currentState?.last28DaysAvgVolume,
    consistencyScore: calculateConsistencyFromRunner(runner),
  };

  return {
    capturedAt: Date.now(),
    profileRadar,
    fitnessIndicators,
    planInfluencers,
  };
}

function calculateProfileRadar(runner: Doc<"runners">): ProfileRadarItem[] {
  const currentState = runner.currentState;

  return RADAR_AXES.map(axis => {
    let value = 50; // Default middle value
    let uncertain = true;

    switch (axis.key) {
      case "endurance":
        if (currentState?.chronicTrainingLoad) {
          value = Math.min(100, currentState.chronicTrainingLoad);
          uncertain = false;
        }
        break;

      case "speed":
        if (currentState?.estimatedVdot) {
          // VDOT 30-60 maps to 20-80 on our scale
          value = Math.min(100, Math.max(0, (currentState.estimatedVdot - 30) * 2 + 20));
          uncertain = false;
        }
        break;

      case "recovery":
        if (currentState?.readinessScore) {
          value = currentState.readinessScore;
          uncertain = false;
        }
        break;

      case "consistency":
        const consistency = calculateConsistencyFromRunner(runner);
        if (consistency !== undefined) {
          value = consistency;
          uncertain = false;
        }
        break;

      case "injuryRisk":
        // Inverted - lower risk = higher value
        if (currentState?.injuryRiskLevel) {
          const riskMap = { low: 85, moderate: 60, elevated: 35, high: 15 };
          value = riskMap[currentState.injuryRiskLevel];
          uncertain = false;
        }
        break;

      case "raceReady":
        // Composite of TSB and readiness
        if (currentState?.trainingStressBalance !== undefined && currentState?.readinessScore) {
          const tsbScore = Math.min(100, Math.max(0, currentState.trainingStressBalance + 50));
          value = Math.round((tsbScore + currentState.readinessScore) / 2);
          uncertain = false;
        }
        break;
    }

    return { label: axis.label, value, uncertain };
  });
}

function calculateConsistencyFromRunner(runner: Doc<"runners">): number | undefined {
  // Use inferred consistency or current state
  if (runner.currentState?.dataQuality) {
    const qualityMap = { high: 85, medium: 65, low: 40, insufficient: 20 };
    return qualityMap[runner.currentState.dataQuality];
  }
  if (runner.inferred?.volumeConsistency !== undefined) {
    // Lower variance = higher consistency (invert)
    return Math.max(0, 100 - runner.inferred.volumeConsistency);
  }
  return undefined;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Extract pace zones from runner's currentState safely.
 * Works around TypeScript's incomplete inference of Convex schema types.
 */
function extractPaceZones(runner: Doc<"runners">): PaceZones | undefined {
  const currentState = runner.currentState as
    | (typeof runner.currentState & { paceZones?: PaceZones })
    | undefined;
  return currentState?.paceZones;
}

function formatGoalType(goalType: GoalType): string {
  const displayNames: Record<GoalType, string> = {
    "5k": "5K",
    "10k": "10K",
    "half_marathon": "Half Marathon",
    "marathon": "Marathon",
    "base_building": "Base Building",
  };
  return displayNames[goalType];
}

function formatSessionType(sessionType: string): string {
  const displayNames: Record<string, string> = {
    tempo: "Tempo",
    intervals: "Intervals",
    long_run: "Long Run",
    easy: "Easy",
    recovery: "Recovery",
    rest: "Rest",
    race: "Race",
  };
  return displayNames[sessionType] ?? sessionType.charAt(0).toUpperCase() + sessionType.slice(1);
}

function formatDuration(seconds: number | undefined): string {
  if (!seconds) return "-";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
}

function calculatePhaseStartWeek(template: PlanTemplate, phaseIndex: number, totalWeeks: number): number {
  let cumulativeWeeks = 0;
  for (let i = 0; i < phaseIndex; i++) {
    cumulativeWeeks += Math.round(template.phases[i].percentOfPlan * totalWeeks);
  }
  return cumulativeWeeks + 1;
}

function calculatePhaseEndWeek(template: PlanTemplate, phaseIndex: number, totalWeeks: number): number {
  let cumulativeWeeks = 0;
  for (let i = 0; i <= phaseIndex; i++) {
    cumulativeWeeks += Math.round(template.phases[i].percentOfPlan * totalWeeks);
  }
  return cumulativeWeeks;
}

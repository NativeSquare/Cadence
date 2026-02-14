/**
 * Runner Object Type Definitions
 * Matches UX V6 Runner Object Model specification
 */

// =============================================================================
// Identity Section
// =============================================================================

export interface RunnerIdentity {
  name: string;
  nameConfirmed: boolean;
}

// =============================================================================
// Physical Profile
// =============================================================================

export interface RunnerPhysical {
  age?: number;
  weight?: number;
  height?: number;
}

// =============================================================================
// Running Profile
// =============================================================================

export type ExperienceLevel = "beginner" | "returning" | "casual" | "serious";
export type TrainingConsistency = "high" | "moderate" | "low";

export interface RunnerRunning {
  experienceLevel?: ExperienceLevel;
  monthsRunning?: number;
  currentFrequency?: number; // Days per week
  currentVolume?: number; // Weekly km
  easyPace?: string; // Format: "5:40/km"
  longestRecentRun?: number;
  trainingConsistency?: TrainingConsistency;
}

// =============================================================================
// Goals
// =============================================================================

export type GoalType =
  | "race"
  | "speed"
  | "base_building"
  | "return_to_fitness"
  | "general_health";

export interface RunnerGoals {
  goalType?: GoalType;
  raceDistance?: number;
  raceDate?: number; // Unix timestamp
  targetTime?: number; // Duration in seconds
  targetPace?: string;
  targetVolume?: number;
}

// =============================================================================
// Schedule & Life
// =============================================================================

export type PreferredTime = "morning" | "midday" | "evening" | "varies";

export interface RunnerSchedule {
  availableDays?: number;
  blockedDays?: string[]; // ["monday", "wednesday"]
  preferredTime?: PreferredTime;
  calendarConnected?: boolean;
}

// =============================================================================
// Health & Risk
// =============================================================================

export type RecoveryStyle = "quick" | "slow" | "push_through" | "no_injuries";
export type SleepQuality = "solid" | "inconsistent" | "poor";
export type StressLevel = "low" | "moderate" | "high" | "survival";

export interface RunnerHealth {
  pastInjuries?: string[]; // ["shin_splints", "itbs", "plantar"]
  currentPain?: string[];
  recoveryStyle?: RecoveryStyle;
  sleepQuality?: SleepQuality;
  stressLevel?: StressLevel;
}

// =============================================================================
// Coaching Preferences
// =============================================================================

export type CoachingVoice =
  | "tough_love"
  | "encouraging"
  | "analytical"
  | "minimalist";
export type DataOrientation = "data_driven" | "curious" | "feel_based";

export interface RunnerCoaching {
  coachingVoice?: CoachingVoice;
  dataOrientation?: DataOrientation;
  biggestChallenge?: string;
  skipTriggers?: string[];
}

// =============================================================================
// Data Connections
// =============================================================================

export type WearableType =
  | "garmin"
  | "coros"
  | "apple_watch"
  | "polar"
  | "none";

export interface RunnerConnections {
  stravaConnected: boolean;
  wearableConnected: boolean;
  wearableType?: WearableType;
  calendarConnected: boolean;
}

// =============================================================================
// Inferred Data (from wearable analysis)
// =============================================================================

export type TrainingLoadTrend =
  | "building"
  | "maintaining"
  | "declining"
  | "erratic";

export interface RunnerInferred {
  avgWeeklyVolume?: number;
  volumeConsistency?: number; // % variance
  easyPaceActual?: string;
  longRunPattern?: string;
  restDayFrequency?: number;
  trainingLoadTrend?: TrainingLoadTrend;
  estimatedFitness?: number;
  injuryRiskFactors?: string[];
}

// =============================================================================
// Conversation State (meta-tracking)
// =============================================================================

export type ConversationPhase =
  | "intro"
  | "data_bridge"
  | "profile"
  | "goals"
  | "schedule"
  | "health"
  | "coaching"
  | "analysis";

export interface RunnerConversationState {
  dataCompleteness: number; // 0-100 percentage
  readyForPlan: boolean;
  currentPhase: ConversationPhase;
  fieldsToConfirm: string[];
  fieldsMissing: string[];
}

// =============================================================================
// Full Runner Object
// =============================================================================

export interface Runner {
  _id: string;
  _creationTime: number;
  userId: string;
  identity: RunnerIdentity;
  physical?: RunnerPhysical;
  running?: RunnerRunning;
  goals?: RunnerGoals;
  schedule?: RunnerSchedule;
  health?: RunnerHealth;
  coaching?: RunnerCoaching;
  connections: RunnerConnections;
  inferred?: RunnerInferred;
  conversationState: RunnerConversationState;
}

// =============================================================================
// Input Types for Mutations
// =============================================================================

export interface CreateRunnerInput {
  identity?: RunnerIdentity;
  connections?: RunnerConnections;
  conversationState?: RunnerConversationState;
}

export interface UpdateRunnerInput {
  identity?: RunnerIdentity;
  physical?: RunnerPhysical;
  running?: RunnerRunning;
  goals?: RunnerGoals;
  schedule?: RunnerSchedule;
  health?: RunnerHealth;
  coaching?: RunnerCoaching;
  connections?: RunnerConnections;
  inferred?: RunnerInferred;
  conversationState?: RunnerConversationState;
}

// =============================================================================
// Helper: Initial Runner State
// =============================================================================

export const initialRunnerConnections: RunnerConnections = {
  stravaConnected: false,
  wearableConnected: false,
  calendarConnected: false,
};

export const initialConversationState: RunnerConversationState = {
  dataCompleteness: 0,
  readyForPlan: false,
  currentPhase: "intro",
  fieldsToConfirm: [],
  fieldsMissing: [],
};

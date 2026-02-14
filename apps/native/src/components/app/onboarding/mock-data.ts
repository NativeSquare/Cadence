/**
 * Mock data for OnboardingFlowMock component.
 *
 * Provides consistent mock data for all visualization screens.
 * Exports both DATA and NO DATA path variants where applicable.
 *
 * Source: Story 3.5 - Task 6 (AC#5)
 */

// =============================================================================
// Runner Profile (RadarChart)
// =============================================================================

export const mockRunnerProfile = {
  data: {
    endurance: 72,
    speed: 65,
    recovery: 48, // flagged low
    consistency: 85,
    injuryRisk: 62, // elevated
    raceReady: 70,
  },
  noData: {
    endurance: 65, // uncertain
    speed: null, // unknown
    recovery: 55,
    consistency: null, // unknown
    injuryRisk: 70, // higher uncertainty
    raceReady: 50,
  },
};

// =============================================================================
// Training Plan (ProgressionChart)
// =============================================================================

export interface WeekData {
  volume: number;
  intensity: number;
  isRecovery: boolean;
}

export const mockTrainingPlan: WeekData[] = [
  { volume: 30, intensity: 4, isRecovery: false },
  { volume: 34, intensity: 5, isRecovery: false },
  { volume: 38, intensity: 5, isRecovery: false },
  { volume: 28, intensity: 3, isRecovery: true }, // recovery
  { volume: 40, intensity: 6, isRecovery: false },
  { volume: 44, intensity: 6, isRecovery: false },
  { volume: 32, intensity: 4, isRecovery: true }, // recovery
  { volume: 46, intensity: 7, isRecovery: false },
  { volume: 48, intensity: 7, isRecovery: false },
  { volume: 20, intensity: 2, isRecovery: true }, // race week
];

// =============================================================================
// Weekly Schedule (CalendarWidget)
// =============================================================================

export interface DayData {
  day: string;
  type: string;
  duration: number | null;
  isKey?: boolean;
  isRest?: boolean;
}

export const mockWeeklySchedule: DayData[] = [
  { day: "Mon", type: "Tempo", duration: 45, isKey: true },
  { day: "Tue", type: "Easy", duration: 35, isKey: false },
  { day: "Wed", type: "Intervals", duration: 50, isKey: true },
  { day: "Thu", type: "Rest", duration: null, isRest: true },
  { day: "Fri", type: "Easy", duration: 40, isKey: false },
  { day: "Sat", type: "Rest", duration: null, isRest: true },
  { day: "Sun", type: "Long Run", duration: 75, isKey: true },
];

// =============================================================================
// Projection (Verdict)
// =============================================================================

export const mockProjection = {
  data: {
    timeRange: ["1:43", "1:46"] as [string, string],
    confidence: 75,
    range: "±90s",
  },
  noData: {
    timeRange: ["1:40", "1:52"] as [string, string],
    confidence: 50,
    range: "±6 min",
    explanation:
      "This range is wide on purpose — it'll narrow after your first training week.",
  },
};

// =============================================================================
// Decision Audit
// =============================================================================

export interface Decision {
  question: string;
  answer: string;
}

export const mockDecisions: Decision[] = [
  {
    question: "Why 8% volume cap instead of 10%?",
    answer:
      'Shin splint history + "push through" recovery = higher risk. Conservative loading.',
  },
  {
    question: "Why two rest days?",
    answer: "Only 3 rest days last month = recovery debt. One isn't enough.",
  },
  {
    question: "Why slow down easy pace?",
    answer:
      "Current 5:40 is above aerobic threshold. True recovery requires actually recovering.",
  },
];

// =============================================================================
// Coach Messages (Path-dependent)
// =============================================================================

export const coachMessages = {
  radar: {
    data: "Strong consistency and endurance base. Recovery discipline is where we'll focus. By race day, this chart should look different.",
    noData:
      "The orange markers are estimates — they'll sharpen after your first week of logged runs.",
  },
  progression: {
    data: "I've mapped 10 weeks of progressive volume. Recovery weeks every 3-4 weeks. Your body will adapt.",
    noData:
      "This is a starting framework. It'll adjust as I learn your actual recovery patterns.",
  },
  calendar: {
    data: "Here's week one. Three key sessions, two easy days, two rest days.",
    noData:
      "Here's a conservative first week. We'll calibrate intensity as we go.",
  },
  verdict: {
    intro: {
      data: "So here's where I think you land.",
      noData: "Based on what you've told me, here's my best estimate.",
    },
    followup: {
      data: "The sub-1:45 isn't the ceiling — it's the floor.",
      noData:
        "The first two weeks are calibration. After that, I'll know you.",
    },
  },
};

// =============================================================================
// Flow Progress Mapping
// =============================================================================

/**
 * Maps screen index to approximate progress percentage.
 * Total 13 screens (0-12).
 */
export const screenProgressMap: Record<number, number> = {
  0: 5, // Welcome
  1: 12, // Wearable
  2: 20, // SelfReport
  3: 30, // Goals
  4: 40, // Health
  5: 50, // Style
  6: 60, // OpenQuestion
  7: 70, // Transition
  8: 75, // Radar
  9: 82, // Progression
  10: 88, // Calendar
  11: 95, // Verdict
  12: 100, // Paywall
};

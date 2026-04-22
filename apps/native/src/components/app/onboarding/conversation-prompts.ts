/**
 * Mock data for conversation flow screens.
 * Provides realistic simulated responses for UI validation.
 *
 * Source: Story 2.12 - AC#21
 */

// =============================================================================
// Types
// =============================================================================

export interface MockSelfReportData {
  weeklyVolume: "<20" | "20-40" | "40-60" | "60+" | "unsure";
  daysPerWeek: 2 | 3 | 4 | 5 | 6 | 7;
  longestRun: "<10" | "10-15" | "15-20" | "20+";
}

export interface MockGoalsData {
  goalType: "race" | "speed" | "volume" | "comeback" | "health" | "other";
  raceDistance?: "5k" | "10k" | "half" | "marathon" | "ultra";
  raceDate?: string;
  freeformGoal?: string;
}

export interface MockHealthData {
  injuries: ("shins" | "itband" | "plantar" | "knee" | "achilles" | "none")[];
  recoveryStyle?: "quick" | "slow" | "push";
}

export interface MockStyleData {
  coachingStyle: "tough" | "encouraging" | "analytical" | "minimalist";
  biggestChallenge: "consistency" | "pacing" | "time" | "stuck";
}

// =============================================================================
// Coach Prompts
// =============================================================================

export const COACH_PROMPTS = {
  selfReport: {
    intro:
      "No worries — I can work with what you tell me. A few quick questions to understand where you're at.",
    weeklyVolume: "How many kilometers do you typically run per week?",
    daysPerWeek: "How many days per week do you usually run?",
    longestRun: "What's your longest recent run?",
    completion: "Got it. That gives me a good baseline to work with.",
  },
  goals: {
    intro: "What are you working toward?",
    raceDistance: "What distance?",
    raceDate: "When's the race?",
    freeformAck: "Interesting goal. Let me factor that in.",
  },
  health: {
    intro:
      "Quick health check — have you dealt with any of these in the past?",
    recoveryStyle: "When injuries happen, how do you typically recover?",
    pushThroughWarning:
      "Noted. I'll keep an eye on that — sometimes pushing through makes things worse.",
  },
  style: {
    intro: "Almost there. How do you like to be coached?",
    challenge: "What's your biggest challenge right now?",
  },
  openQuestion: {
    intro: "Anything else you want me to know?",
    skipAck: "Perfect. I've got everything I need.",
    freeformAck: "Thanks for sharing that. Added to your profile.",
  },
} as const;

// =============================================================================
// Choice Options
// =============================================================================

export const SELF_REPORT_OPTIONS = {
  weeklyVolume: [
    { value: "<20", label: "Less than 20km" },
    { value: "20-40", label: "20-40km" },
    { value: "40-60", label: "40-60km" },
    { value: "60+", label: "60km+" },
    { value: "unsure", label: "I'm not sure" },
  ],
  daysPerWeek: [2, 3, 4, 5, 6, 7] as const,
  longestRun: [
    { value: "<10", label: "Less than 10km" },
    { value: "10-15", label: "10-15km" },
    { value: "15-20", label: "15-20km" },
    { value: "20+", label: "20km+" },
  ],
} as const;

export const GOALS_OPTIONS = {
  goalType: [
    { value: "race", label: "Training for a race" },
    { value: "speed", label: "Getting faster" },
    { value: "volume", label: "Building mileage" },
    { value: "comeback", label: "Getting back in shape" },
    { value: "health", label: "General health" },
    { value: "other", label: "Something else — let me explain" },
  ],
  raceDistance: [
    { value: "5k", label: "5K" },
    { value: "10k", label: "10K" },
    { value: "half", label: "Half Marathon" },
    { value: "marathon", label: "Marathon" },
    { value: "ultra", label: "Ultra" },
  ],
} as const;

export const HEALTH_OPTIONS = {
  injuries: [
    { value: "shins", label: "Shin splints" },
    { value: "itband", label: "IT band" },
    { value: "plantar", label: "Plantar fasciitis" },
    { value: "knee", label: "Knee pain" },
    { value: "achilles", label: "Achilles issues" },
    { value: "none", label: "None" },
  ],
  recoveryStyle: [
    { value: "quick", label: "Bounce back quick", desc: "Usually heal fast" },
    { value: "slow", label: "Takes a while", desc: "Need time to recover" },
    {
      value: "push",
      label: "Push through",
      desc: "Keep going despite discomfort",
      flagged: true,
    },
  ],
} as const;

export const STYLE_OPTIONS = {
  coachingStyle: [
    { value: "tough", label: "Tough love", desc: "Tell it like it is" },
    {
      value: "encouraging",
      label: "Encouraging",
      desc: "Positive reinforcement",
    },
    { value: "analytical", label: "Analytical", desc: "Data and numbers" },
    { value: "minimalist", label: "Minimalist", desc: "Just the essentials" },
  ],
  biggestChallenge: [
    { value: "consistency", label: "Consistency", desc: "Sticking to a plan" },
    { value: "pacing", label: "Pacing", desc: "Running the right speeds" },
    { value: "time", label: "Time", desc: "Finding time to train" },
    { value: "stuck", label: "Stuck", desc: "Not making progress" },
  ],
} as const;

export const OPEN_QUESTION_PILLS = [
  "No, that covers it",
  "One more thing...",
] as const;

// =============================================================================
// Progress Milestones
// =============================================================================

export const PROGRESS_MILESTONES = {
  afterSelfReport: 40,
  afterGoals: 55,
  afterHealth: 70,
  afterStyle: 85,
  afterOpenQuestion: 95,
} as const;

// =============================================================================
// Mock Delays (simulate network)
// =============================================================================

export const MOCK_DELAYS = {
  /** Delay before coach starts streaming */
  coachStreamDelay: 400,
  /** Delay before choices appear after streaming */
  choicesDelay: 200,
  /** Delay between screen transitions */
  transitionDelay: 300,
} as const;

// =============================================================================
// Default Mock Data (for testing)
// =============================================================================

export const mockSelfReportData: MockSelfReportData = {
  weeklyVolume: "20-40",
  daysPerWeek: 4,
  longestRun: "15-20",
};

export const mockGoalsData: MockGoalsData = {
  goalType: "race",
  raceDistance: "half",
  raceDate: "2026-06-15",
};

export const mockHealthData: MockHealthData = {
  injuries: ["shins", "knee"],
  recoveryStyle: "slow",
};

export const mockStyleData: MockStyleData = {
  coachingStyle: "analytical",
  biggestChallenge: "pacing",
};

// =============================================================================
// Mock MiniAnalysis Extractions
// =============================================================================

export const mockMiniAnalysisExtractions = {
  raceGoal: "Half Marathon in June",
  timeline: "~4 months",
  injuryFlags: ["Shin splint history noted"],
};

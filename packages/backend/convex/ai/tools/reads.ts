import { tool } from "ai";
import { z } from "zod";

/**
 * Read Tool Registry for AI Coach
 *
 * These tools fetch data server-side during the streaming loop and return
 * structured results to the LLM. Unlike UI/action tools (which have no
 * `execute` function), read tools MUST have an `execute` closure that is
 * wired in `http_action.ts` where the Convex `ctx` is available.
 *
 * The definitions here provide the schema and description only.
 * The `execute` function is attached at runtime inside the httpAction.
 *
 * Source: Story 11.1 - AC#1
 */

// =============================================================================
// Read Runner Profile
// =============================================================================

export const readRunnerProfile = tool({
  description:
    "Fetch the current runner's full profile including identity (name), physical stats (age, weight, height, max HR, resting HR), running profile (experience, frequency, volume, easy pace), goals (goal type, race distance, target time, race date), schedule (available days, blocked days, preferred time), health (past injuries, current pain, recovery style, sleep, stress), coaching preferences (voice, data orientation, challenges), inferred metrics (avg weekly volume, training load trend, estimated fitness, injury risk factors), and currentState (ATL, CTL, TSB, readiness score, injury risk level, HR zones, pace zones, volume trends, latest biometrics, data quality). Use when the runner asks about their fitness, zones, metrics, risk factors, or current training state.",
  inputSchema: z.object({}),
});

// =============================================================================
// Read Planned Sessions (Story 11.2)
// =============================================================================

export const readPlannedSessions = tool({
  description:
    "Look up the runner's planned training sessions. Use when the user asks about their schedule, upcoming sessions, what's planned for a specific day/week, or before proposing plan changes. Returns session details including type, duration, effort, pace targets, date, status, and coaching justification.",
  inputSchema: z.object({
    weekNumber: z
      .number()
      .optional()
      .describe("Filter by plan week number (e.g., 3 for week 3)"),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO date format YYYY-MM-DD")
      .optional()
      .describe("Start of date range as ISO date string, e.g. '2026-04-06'. Must be YYYY-MM-DD format."),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO date format YYYY-MM-DD")
      .optional()
      .describe("End of date range as ISO date string, e.g. '2026-04-12'. Must be YYYY-MM-DD format."),
    status: z
      .enum(["scheduled", "completed", "skipped", "modified", "rescheduled"])
      .optional()
      .describe("Filter by session status"),
  }),
});

// =============================================================================
// Read Training Plan (Story 11.3)
// =============================================================================

export const readTrainingPlan = tool({
  description:
    "Read the authenticated runner's active training plan. Returns plan metadata, season view, weekly plan structure, runner snapshot, and computed current week/phase. Use when the user asks about their overall plan, training phases, goals, or when you need plan context to make intelligent session modification proposals.",
  inputSchema: z.object({}),
});

// =============================================================================
// Export
// =============================================================================

export const readTools = {
  readRunnerProfile,
  readPlannedSessions,
  readTrainingPlan,
};

import { tool } from "ai";
import { z } from "zod";

/**
 * Action Tool Registry for AI Coach
 *
 * These tools let the LLM propose real mutations (reschedule, modify, swap, skip)
 * that render as confirmation cards in the chat UI. They produce proposals only —
 * execution happens via frontend-triggered Convex mutations after user confirmation.
 */

// =============================================================================
// Reschedule Session
// =============================================================================

export const proposeRescheduleSession = tool({
  description:
    "Propose moving a session to a different date. Use when the runner asks to reschedule, or when you notice a scheduling conflict. The runner will see a confirmation card and can accept or reject.",
  inputSchema: z.object({
    sessionId: z.string().describe("The Convex ID of the session to reschedule"),
    sessionName: z.string().describe("Human-readable session name, e.g. 'Tempo'"),
    sessionType: z.string().describe("Session type, e.g. 'tempo', 'easy', 'long_run'"),
    currentDate: z.string().describe("Current scheduled date as ISO string, e.g. '2026-04-03'"),
    currentDayOfWeek: z.string().describe("Current day of week, e.g. 'Thursday'"),
    proposedDate: z.string().describe("Proposed new date as ISO string, e.g. '2026-04-04'"),
    proposedDayOfWeek: z.string().describe("Proposed day of week, e.g. 'Friday'"),
    duration: z.string().describe("Session duration display, e.g. '50 min'"),
    reason: z.string().describe("Clear explanation of why this change is recommended"),
    impact: z
      .string()
      .optional()
      .describe("Any impact on other sessions or the weekly plan"),
  }),
  execute: async () => ({ proposed: true }),
});

// =============================================================================
// Modify Session
// =============================================================================

export const proposeModifySession = tool({
  description:
    "Propose changing session details (type, duration, effort, pace targets, etc.). Use when the runner asks to adjust a workout, or when you recommend a modification based on their condition. The runner will see a diff view and can accept or reject.",
  inputSchema: z.object({
    sessionId: z.string().describe("The Convex ID of the session to modify"),
    sessionName: z.string().describe("Human-readable session name, e.g. 'Tempo'"),
    changes: z
      .array(
        z.object({
          field: z.string().describe("The field being changed, e.g. 'targetDurationSeconds'"),
          fieldLabel: z.string().describe("Human-readable label, e.g. 'Duration'"),
          oldValue: z.string().describe("Current value for display, e.g. '50 min'"),
          newValue: z.string().describe("Proposed value for display, e.g. '40 min'"),
        })
      )
      .describe("List of fields to change with before/after values"),
    reason: z.string().describe("Clear explanation of why this modification is recommended"),
  }),
  execute: async () => ({ proposed: true }),
});

// =============================================================================
// Swap Sessions
// =============================================================================

export const proposeSwapSessions = tool({
  description:
    "Propose swapping two sessions' dates. Use when reordering sessions within a week makes more sense than rescheduling one. The runner will see both sessions and can accept or reject the swap.",
  inputSchema: z.object({
    sessionA: z.object({
      sessionId: z.string().describe("Convex ID of the first session"),
      sessionName: z.string().describe("Name of the first session, e.g. 'Tempo'"),
      sessionType: z.string().describe("Type of the first session"),
      date: z.string().describe("Current date of the first session (ISO)"),
      dayOfWeek: z.string().describe("Day of week for the first session"),
      duration: z.string().describe("Duration display for the first session"),
    }),
    sessionB: z.object({
      sessionId: z.string().describe("Convex ID of the second session"),
      sessionName: z.string().describe("Name of the second session, e.g. 'Easy'"),
      sessionType: z.string().describe("Type of the second session"),
      date: z.string().describe("Current date of the second session (ISO)"),
      dayOfWeek: z.string().describe("Day of week for the second session"),
      duration: z.string().describe("Duration display for the second session"),
    }),
    reason: z.string().describe("Clear explanation of why swapping is recommended"),
  }),
  execute: async () => ({ proposed: true }),
});

// =============================================================================
// Skip Session
// =============================================================================

export const proposeSkipSession = tool({
  description:
    "Propose skipping a session. Use when the runner needs extra rest, has a conflict, or when skipping is the safest choice. The runner will see the session details and reason, and can accept or reject.",
  inputSchema: z.object({
    sessionId: z.string().describe("The Convex ID of the session to skip"),
    sessionName: z.string().describe("Human-readable session name, e.g. 'Intervals'"),
    sessionType: z.string().describe("Session type, e.g. 'intervals'"),
    date: z.string().describe("Scheduled date as ISO string"),
    dayOfWeek: z.string().describe("Day of week, e.g. 'Wednesday'"),
    duration: z.string().describe("Duration display, e.g. '45 min'"),
    reason: z.string().describe("Clear explanation of why skipping is recommended"),
    alternative: z
      .string()
      .optional()
      .describe("Optional alternative suggestion, e.g. 'Light 20min walk instead'"),
  }),
  execute: async () => ({ proposed: true }),
});

// =============================================================================
// Export
// =============================================================================

export const actionTools = {
  proposeRescheduleSession,
  proposeModifySession,
  proposeSwapSessions,
  proposeSkipSession,
};

import { tool } from "ai";
import { z } from "zod";

/**
 * Read Tool Registry for AI Coach.
 *
 * Tool schemas only — the execute closure is wired in http_action.ts where
 * the Convex ctx is available. Data lives in the Agoge component; Cadence
 * exposes it via `api.plan.reads.*` queries the AI calls through here.
 */

export const readAthleteProfile = tool({
  description:
    "Fetch the current athlete's agoge profile (name, sex, DOB, weight, height, max HR, resting HR, threshold pace/HR) plus derived state (ATL, CTL, TSB, 7d/28d volumes, activity counts, volume change WoW). Use when the runner asks about their fitness, zones, or current training state.",
  inputSchema: z.object({}),
});

export const readUpcomingWorkouts = tool({
  description:
    "Look up the athlete's scheduled workouts in a date range. Use when the user asks about their schedule, upcoming sessions, or before proposing plan changes. Returns workout details: name, description, status, target duration/distance, scheduled date.",
  inputSchema: z.object({
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO date format YYYY-MM-DD")
      .optional()
      .describe("Start date (YYYY-MM-DD). Defaults to today if omitted."),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO date format YYYY-MM-DD")
      .optional()
      .describe("End date (YYYY-MM-DD). Defaults to 14 days out if omitted."),
    status: z
      .enum(["planned", "completed", "skipped", "missed"])
      .optional()
      .describe("Filter by workout status"),
  }),
});

export const readActivePlan = tool({
  description:
    "Read the authenticated athlete's active agoge plan. Returns plan metadata (name, dates, methodology) and free-form notes written by the plan generator at creation time (coach summary, periodization rationale, key milestones). Use before discussing phases, goals, or proposing plan-wide changes.",
  inputSchema: z.object({}),
});

export const readTools = {
  readAthleteProfile,
  readUpcomingWorkouts,
  readActivePlan,
};

/**
 * Reading tools — auto-execute, no user approval.
 *
 * Every entry in this object MUST be created with `needsApproval: false`.
 * The coach has no writing tools; plan changes go through the deterministic
 * Engine or the athlete's own UI.
 *
 * The coach's reads cover two domains:
 *  - Agoge (training state): plan, blocks, workouts, athlete profile.
 *  - Soma (health signals): sleep, daily summary, body, nutrition, menstruation,
 *    profile, connections.
 *
 * Each tool is a thin wrapper over an existing public query — Agoge wrappers
 * (which handle auth) for training data, Soma component primitives (passed the
 * agent's ctx.userId) for health data.
 */

import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { api, components } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";

const dateRangeFields = {
  startDate: z
    .string()
    .optional()
    .describe("UTC ISO 8601 lower bound, inclusive."),
  endDate: z
    .string()
    .optional()
    .describe("UTC ISO 8601 upper bound, inclusive."),
};

const timeRangeFields = {
  startTime: z
    .string()
    .optional()
    .describe("UTC ISO 8601 lower bound, inclusive."),
  endTime: z
    .string()
    .optional()
    .describe("UTC ISO 8601 upper bound, inclusive."),
  order: z
    .enum(["asc", "desc"])
    .optional()
    .describe("Sort order. Defaults to 'desc' (newest first)."),
  limit: z
    .number()
    .int()
    .positive()
    .max(200)
    .optional()
    .describe("Max records to return. Caller should keep this small."),
};

export const readingTools = {
  // ---------------------------------------------------------------------------
  // Agoge — training state
  // ---------------------------------------------------------------------------

  getAthlete: createTool({
    description:
      "Read the current athlete's Agoge profile (sex, DOB, weight, height, " +
      "experience, injury status). Use to ground recommendations in the " +
      "athlete's stable attributes.",
    inputSchema: z.object({}),
    needsApproval: false,
    execute: async (ctx): Promise<unknown> => {
      return await ctx.runQuery(api.agoge.athletes.getAthlete, {});
    },
  }),

  getAthletePlan: createTool({
    description:
      "Read the athlete's currently active training plan joined with its " +
      "target A-priority race. Returns `{ plan, race }` where the plan's " +
      "effective end date is `race.date`, or null if the athlete has no " +
      "current plan (planless state — no upcoming A-race).",
    inputSchema: z.object({}),
    needsApproval: false,
    execute: async (ctx): Promise<unknown> => {
      return await ctx.runQuery(api.agoge.plans.getAthletePlan, {});
    },
  }),

  listBlocks: createTool({
    description:
      "List all training blocks (base, build, peak, taper, etc.) in the " +
      "athlete's active plan, in order. Use to understand the periodization " +
      "structure before modifying workouts.",
    inputSchema: z.object({}),
    needsApproval: false,
    execute: async (ctx): Promise<unknown> => {
      return await ctx.runQuery(
        api.agoge.blocks.listBlocksForActiveAthletePlan,
        {},
      );
    },
  }),

  getBlock: createTool({
    description:
      "Read a single training block by id. Returns null if the block is " +
      "not owned by the current athlete.",
    inputSchema: z.object({
      blockId: z.string().describe("The Agoge block id."),
    }),
    needsApproval: false,
    execute: async (ctx, { blockId }): Promise<unknown> => {
      return await ctx.runQuery(api.agoge.blocks.getBlock, { blockId });
    },
  }),

  listWorkouts: createTool({
    description:
      "List the athlete's workouts in a date range, with planned and " +
      "completed faces merged. Use to inspect the upcoming week, review " +
      "recent training load, or find the workout to modify.",
    inputSchema: z.object(dateRangeFields),
    needsApproval: false,
    execute: async (ctx, { startDate, endDate }): Promise<unknown> => {
      return await ctx.runQuery(api.agoge.workouts.listWorkouts, {
        startDate,
        endDate,
      });
    },
  }),

  listWorkoutsByBlock: createTool({
    description:
      "List all workouts inside a single training block. Use to understand " +
      "what's already scheduled inside a block before making changes.",
    inputSchema: z.object({
      blockId: z.string().describe("The Agoge block id."),
    }),
    needsApproval: false,
    execute: async (ctx, { blockId }): Promise<unknown> => {
      return await ctx.runQuery(api.agoge.workouts.listWorkoutsByBlock, {
        blockId,
      });
    },
  }),

  getWorkout: createTool({
    description:
      "Read a single workout by id, with its block, plan, and provider " +
      "sync refs. Use before proposing an edit so you can reference the " +
      "current state.",
    inputSchema: z.object({
      workoutId: z.string().describe("The Agoge workout id."),
    }),
    needsApproval: false,
    execute: async (ctx, { workoutId }): Promise<unknown> => {
      return await ctx.runQuery(api.agoge.workouts.getWorkout, { workoutId });
    },
  }),

  // ---------------------------------------------------------------------------
  // Soma — health signals
  // ---------------------------------------------------------------------------

  readSleep: createTool({
    description:
      "Read sleep records for the current user (duration breakdown by " +
      "stage, heart rate, respiration, sleep score). Use to assess " +
      "recovery before adjusting training load.",
    inputSchema: z.object(timeRangeFields),
    needsApproval: false,
    execute: async (ctx, args): Promise<unknown> => {
      if (!ctx.userId) return [];
      return await ctx.runQuery(components.soma.public.listSleep, {
        userId: ctx.userId,
        ...args,
      });
    },
  }),

  readDailySummary: createTool({
    description:
      "Read daily summary records — the kitchen-sink health metric: HRV, " +
      "resting HR, body battery, stress, steps, calories, intensity " +
      "minutes. Primary signal for assessing the athlete's day-to-day " +
      "readiness.",
    inputSchema: z.object(timeRangeFields),
    needsApproval: false,
    execute: async (ctx, args): Promise<unknown> => {
      if (!ctx.userId) return [];
      return await ctx.runQuery(components.soma.public.listDaily, {
        userId: ctx.userId,
        ...args,
      });
    },
  }),

  readNutrition: createTool({
    description:
      "Read nutrition records (calories, macros) for the current user. " +
      "Provider-dependent and often sparse — only useful when athletes log " +
      "food.",
    inputSchema: z.object(timeRangeFields),
    needsApproval: false,
    execute: async (ctx, args): Promise<unknown> => {
      if (!ctx.userId) return [];
      return await ctx.runQuery(components.soma.public.listNutrition, {
        userId: ctx.userId,
        ...args,
      });
    },
  }),

  readMenstruation: createTool({
    description:
      "Read menstruation cycle records (cycle, flow, symptoms). Use when " +
      "the athlete is tracking and asks for cycle-aware training advice.",
    inputSchema: z.object(timeRangeFields),
    needsApproval: false,
    execute: async (ctx, args): Promise<unknown> => {
      if (!ctx.userId) return [];
      return await ctx.runQuery(components.soma.public.listMenstruation, {
        userId: ctx.userId,
        ...args,
      });
    },
  }),

  readConnections: createTool({
    description:
      "List the user's provider connections (Garmin, Strava, HealthKit) " +
      "with embedded data-freshness stats per table. Use to know if a " +
      "signal is stale before basing advice on it.",
    inputSchema: z.object({}),
    needsApproval: false,
    execute: async (ctx): Promise<unknown> => {
      return await ctx.runQuery(api.soma.index.listConnections, {});
    },
  }),

  // ---------------------------------------------------------------------------
  // Journal — the runner's qualitative spine (voice debriefs + decisions)
  // ---------------------------------------------------------------------------

  listJournalEntries: createTool({
    description:
      "Scan the runner's post-session journal entries in a date range. " +
      "Returns COMPACT rows — the LLM-extracted `derived` signals (RPE, pain, " +
      "sleep, stress, motivation, effort, mood, concern tier), the logged " +
      "decision (go/ease), dayKey, workoutId, and entryId — but NOT the " +
      "transcript. Use this to find which sessions are worth opening, then " +
      "call getJournalEntry for the runner's actual words. Set decisionOnly " +
      "to list only sessions where the runner made a keep/ease call.",
    inputSchema: z.object({
      ...dateRangeFields,
      decisionOnly: z
        .boolean()
        .optional()
        .describe("Only entries where the runner logged a keep/ease decision."),
    }),
    needsApproval: false,
    execute: async (ctx, args): Promise<unknown> => {
      return await ctx.runQuery(api.table.journalEntry.listEntries, args);
    },
  }),

  getJournalEntry: createTool({
    description:
      "Read one journal entry in full, including its transcript (the runner's " +
      "actual words) and a playable audio URL. Use after listJournalEntries " +
      "to ground restitution in what the runner literally said at a similar " +
      "moment.",
    inputSchema: z.object({
      entryId: z.string().describe("The journalEntry id from listJournalEntries."),
    }),
    needsApproval: false,
    execute: async (ctx, { entryId }): Promise<unknown> => {
      return await ctx.runQuery(api.table.journalEntry.getEntry, {
        entryId: entryId as Id<"journalEntry">,
      });
    },
  }),
};

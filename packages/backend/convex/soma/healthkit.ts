/**
 * Apple HealthKit - sync and disconnect via Soma
 *
 * HealthKit data lives on the device; the native app parses samples into
 * Soma's raw HK types and streams them up via per-type mutations. Each
 * mutation is a thin passthrough to Soma — Cadence strips `userId` from
 * the arg validator and derives it from the auth session instead of
 * trusting the client.
 *
 * Why per-type (not a single `syncAll`): Convex enforces a per-array
 * validator limit of 8192 items. 90 days of HealthKit samples easily
 * exceed that for a single type, so the client chunks each array and
 * calls the matching per-type mutation multiple times.
 */

import {
  syncActivitiesArgs,
  syncSleepArgs,
  syncBodyArgs,
  syncDailyArgs,
  syncDailyFromSummaryArgs,
  syncNutritionArgs,
  syncMenstruationArgs,
  syncAthleteArgs,
} from "@nativesquare/soma/healthkit";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, type MutationCtx } from "../_generated/server";
import { soma } from "./index";

// ─── Auth helper ───────────────────────────────────────────────────────────

async function requireUserId(ctx: MutationCtx): Promise<string> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ConvexError({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  }
  return userId as unknown as string;
}

// Each per-type arg validator from Soma includes `userId`. We strip it —
// Cadence derives `userId` from auth rather than trusting the client.
const { userId: _a, ...activitiesClientArgs } = syncActivitiesArgs;
const { userId: _s, ...sleepClientArgs } = syncSleepArgs;
const { userId: _b, ...bodyClientArgs } = syncBodyArgs;
const { userId: _d, ...dailyClientArgs } = syncDailyArgs;
const { userId: _ds, ...dailyFromSummaryClientArgs } = syncDailyFromSummaryArgs;
const { userId: _n, ...nutritionClientArgs } = syncNutritionArgs;
const { userId: _m, ...menstruationClientArgs } = syncMenstruationArgs;
const { userId: _at, ...athleteClientArgs } = syncAthleteArgs;

// ─── Connect ───────────────────────────────────────────────────────────────

/**
 * Register (or re-activate) the HealthKit connection for this user without
 * uploading any data. Called immediately after the user grants the iOS
 * permission sheet so the UI can show "Connected" before the background
 * sync finishes.
 */
export const connect = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    return await soma.healthkit.connect(ctx, { userId });
  },
});

// ─── Disconnect ────────────────────────────────────────────────────────────

export const disconnect = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    await soma.healthkit.disconnect(ctx, { userId });
    return null;
  },
});

// ─── Per-type sync mutations ───────────────────────────────────────────────

export const syncActivities = mutation({
  args: activitiesClientArgs,
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return await soma.healthkit.syncActivities(ctx, { ...args, userId });
  },
});

export const syncSleep = mutation({
  args: sleepClientArgs,
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return await soma.healthkit.syncSleep(ctx, { ...args, userId });
  },
});

export const syncBody = mutation({
  args: bodyClientArgs,
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return await soma.healthkit.syncBody(ctx, { ...args, userId });
  },
});

export const syncDaily = mutation({
  args: dailyClientArgs,
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return await soma.healthkit.syncDaily(ctx, { ...args, userId });
  },
});

export const syncDailyFromSummary = mutation({
  args: dailyFromSummaryClientArgs,
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return await soma.healthkit.syncDailyFromSummary(ctx, { ...args, userId });
  },
});

export const syncNutrition = mutation({
  args: nutritionClientArgs,
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return await soma.healthkit.syncNutrition(ctx, { ...args, userId });
  },
});

export const syncMenstruation = mutation({
  args: menstruationClientArgs,
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return await soma.healthkit.syncMenstruation(ctx, { ...args, userId });
  },
});

export const syncAthlete = mutation({
  args: athleteClientArgs,
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return await soma.healthkit.syncAthlete(ctx, { ...args, userId });
  },
});

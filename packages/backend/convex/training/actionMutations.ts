/**
 * Coach Action Mutations
 *
 * Convex mutations that execute AI coach proposals after user confirmation.
 * Each mutation validates auth, runner ownership, session state, and staleness
 * before applying changes. Called directly by the frontend when the user
 * accepts an ActionCard.
 */

import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

// =============================================================================
// Helpers
// =============================================================================

const DAYS_FULL = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** Check if two timestamps fall on the same calendar date (UTC) */
function isSameDay(tsA: number, tsB: number): boolean {
  const a = new Date(tsA);
  const b = new Date(tsB);
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

/** Get authenticated runner or throw */
async function getAuthenticatedRunner(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ConvexError({ code: "UNAUTHORIZED", message: "Must be authenticated" });
  }

  const runner = await ctx.db
    .query("runners")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .first();

  if (!runner) {
    throw new ConvexError({ code: "RUNNER_NOT_FOUND", message: "Runner profile not found" });
  }

  return runner;
}

/** Get session and verify ownership, throw if invalid state */
async function getOwnedSession(ctx: any, sessionId: any, runnerId: any) {
  const session = await ctx.db.get(sessionId);
  if (!session || session.runnerId !== runnerId) {
    throw new ConvexError({ code: "NOT_FOUND", message: "Session not found" });
  }

  if (session.status === "completed") {
    throw new ConvexError({
      code: "INVALID_STATE",
      message: "Cannot modify a completed session",
    });
  }

  return session;
}

// =============================================================================
// Reschedule Session
// =============================================================================

export const rescheduleSession = mutation({
  args: {
    sessionId: v.id("plannedSessions"),
    newDate: v.number(), // Unix timestamp ms
    expectedCurrentDate: v.number(), // For staleness check
    reason: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const runner = await getAuthenticatedRunner(ctx);
    const session = await getOwnedSession(ctx, args.sessionId, runner._id);

    // Staleness check: verify the session is still on the expected day
    if (!isSameDay(session.scheduledDate, args.expectedCurrentDate)) {
      return {
        success: false,
        error: "This session has been modified since the proposal was made. Ask Coach for a new suggestion.",
      };
    }

    // Build the new timestamp: take the target date but preserve the
    // time-of-day from the original session so we don't shift it to midnight
    const origDate = new Date(session.scheduledDate);
    const targetDate = new Date(args.newDate);
    targetDate.setUTCHours(origDate.getUTCHours(), origDate.getUTCMinutes(), origDate.getUTCSeconds(), origDate.getUTCMilliseconds());
    const newTimestamp = targetDate.getTime();

    // Derive day fields from the new date
    const dayIdx = targetDate.getUTCDay();
    const dayOfWeek = DAYS_FULL[dayIdx];
    const dayOfWeekShort = DAYS_SHORT[dayIdx];

    await ctx.db.patch(args.sessionId, {
      scheduledDate: newTimestamp,
      dayOfWeek,
      dayOfWeekShort,
      status: "rescheduled" as const,
      modificationNotes: `Rescheduled by coach: ${args.reason}`,
    });

    return { success: true };
  },
});

// =============================================================================
// Modify Session
// =============================================================================

export const modifySession = mutation({
  args: {
    sessionId: v.id("plannedSessions"),
    changes: v.object({
      sessionType: v.optional(v.string()),
      sessionTypeDisplay: v.optional(v.string()),
      targetDurationSeconds: v.optional(v.number()),
      targetDurationDisplay: v.optional(v.string()),
      targetDistanceMeters: v.optional(v.number()),
      effortLevel: v.optional(v.number()),
      effortDisplay: v.optional(v.string()),
      targetPaceMin: v.optional(v.string()),
      targetPaceMax: v.optional(v.string()),
      targetPaceDisplay: v.optional(v.string()),
      targetHeartRateZone: v.optional(v.number()),
      description: v.optional(v.string()),
      structureDisplay: v.optional(v.string()),
    }),
    reason: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const runner = await getAuthenticatedRunner(ctx);
    await getOwnedSession(ctx, args.sessionId, runner._id);

    // Build patch from provided changes (only non-undefined fields)
    const patch: Record<string, any> = {};
    for (const [key, value] of Object.entries(args.changes)) {
      if (value !== undefined) {
        patch[key] = value;
      }
    }

    if (Object.keys(patch).length === 0) {
      return { success: false, error: "No changes provided" };
    }

    patch.status = "modified";
    patch.modificationNotes = `Modified by coach: ${args.reason}`;

    await ctx.db.patch(args.sessionId, patch);

    return { success: true };
  },
});

// =============================================================================
// Swap Sessions
// =============================================================================

export const swapSessions = mutation({
  args: {
    sessionAId: v.id("plannedSessions"),
    sessionBId: v.id("plannedSessions"),
    expectedDateA: v.number(), // Staleness check
    expectedDateB: v.number(), // Staleness check
    reason: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const runner = await getAuthenticatedRunner(ctx);
    const sessionA = await getOwnedSession(ctx, args.sessionAId, runner._id);
    const sessionB = await getOwnedSession(ctx, args.sessionBId, runner._id);

    // Staleness check (day-level — the LLM only knows date strings, not exact timestamps)
    if (!isSameDay(sessionA.scheduledDate, args.expectedDateA) || !isSameDay(sessionB.scheduledDate, args.expectedDateB)) {
      return {
        success: false,
        error: "One or both sessions have changed since the proposal. Ask Coach for a new suggestion.",
      };
    }

    // Swap date-related fields
    await ctx.db.patch(args.sessionAId, {
      scheduledDate: sessionB.scheduledDate,
      dayOfWeek: sessionB.dayOfWeek,
      dayOfWeekShort: sessionB.dayOfWeekShort,
      modificationNotes: `Swapped with ${sessionB.sessionTypeDisplay} by coach: ${args.reason}`,
    });

    await ctx.db.patch(args.sessionBId, {
      scheduledDate: sessionA.scheduledDate,
      dayOfWeek: sessionA.dayOfWeek,
      dayOfWeekShort: sessionA.dayOfWeekShort,
      modificationNotes: `Swapped with ${sessionA.sessionTypeDisplay} by coach: ${args.reason}`,
    });

    return { success: true };
  },
});

// =============================================================================
// Skip Session
// =============================================================================

export const skipSession = mutation({
  args: {
    sessionId: v.id("plannedSessions"),
    reason: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const runner = await getAuthenticatedRunner(ctx);
    const session = await getOwnedSession(ctx, args.sessionId, runner._id);

    if (session.status === "skipped") {
      return { success: false, error: "Session is already skipped" };
    }

    await ctx.db.patch(args.sessionId, {
      status: "skipped" as const,
      skipReason: `Skipped by coach: ${args.reason}`,
    });

    return { success: true };
  },
});

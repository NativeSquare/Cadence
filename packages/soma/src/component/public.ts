import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel.js";
import { mutation, query } from "./_generated/server.js";
import { activityValidator } from "./validators/activity.js";
import { athleteValidator } from "./validators/athlete.js";
import { bodyValidator } from "./validators/body.js";
import { dailyValidator } from "./validators/daily.js";
import { sleepValidator } from "./validators/sleep.js";
import { menstruationValidator } from "./validators/menstruation.js";
import { nutritionValidator } from "./validators/nutrition.js";
import { plannedWorkoutValidator } from "./validators/plannedWorkout.js";

// ─── Connect / Disconnect ───────────────────────────────────────────────────

/**
 * Connect a user to a wearable provider.
 *
 * Creates the connection if it doesn't exist, or re-activates it if it was
 * previously disconnected. Idempotent: calling twice is a no-op.
 */
export const connect = mutation({
  args: {
    userId: v.string(),
    provider: v.string(),
    providerUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("connections")
      .withIndex("by_userId_provider", (q) =>
        q.eq("userId", args.userId).eq("provider", args.provider),
      )
      .first();

    if (existing) {
      const patch: Partial<Doc<"connections">> = {};
      if (!existing.active) patch.active = true;
      if (args.providerUserId && !existing.providerUserId) {
        patch.providerUserId = args.providerUserId;
      }
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(existing._id, patch);
      }
      return existing._id;
    }

    return await ctx.db.insert("connections", {
      userId: args.userId,
      provider: args.provider,
      providerUserId: args.providerUserId,
      active: true,
    });
  },
});

/**
 * Disconnect a user from a wearable provider.
 *
 * Sets the connection to inactive. Does not delete synced data,
 * so re-connecting later preserves historical records.
 */
export const disconnect = mutation({
  args: {
    userId: v.string(),
    provider: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("connections")
      .withIndex("by_userId_provider", (q) =>
        q.eq("userId", args.userId).eq("provider", args.provider),
      )
      .first();

    if (!existing) {
      throw new Error(
        `No connection found for user "${args.userId}" and provider "${args.provider}"`,
      );
    }

    await ctx.db.patch(existing._id, { active: false });
    return null;
  },
});

// ─── CRUD ───────────────────────────────────────────────────────────────────

/**
 * Get a connection by its document ID.
 */
export const getConnection = query({
  args: { connectionId: v.id("connections") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.connectionId);
  },
});

/**
 * Get the connection for a specific user–provider pair.
 * Returns null if the user has never connected to that provider.
 */
export const getConnectionByProvider = query({
  args: {
    userId: v.string(),
    provider: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("connections")
      .withIndex("by_userId_provider", (q) =>
        q.eq("userId", args.userId).eq("provider", args.provider),
      )
      .first();
  },
});

/**
 * List all connections for a user (active and inactive).
 */
export const listConnections = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("connections")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

/**
 * Update a connection's mutable fields.
 */
export const updateConnection = mutation({
  args: {
    connectionId: v.id("connections"),
    providerUserId: v.optional(v.string()),
    active: v.optional(v.boolean()),
    lastDataUpdate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { connectionId, ...fields } = args;
    const existing = await ctx.db.get(connectionId);
    if (!existing) {
      throw new Error(`Connection "${connectionId}" not found`);
    }
    await ctx.db.patch(connectionId, fields);
    return null;
  },
});

/**
 * Delete a connection record entirely.
 *
 * This is a hard delete — the connection row is removed.
 * Synced health data linked to this connection is NOT cascade-deleted.
 */
export const deleteConnection = mutation({
  args: { connectionId: v.id("connections") },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      throw new Error(`Connection "${args.connectionId}" not found`);
    }
    await ctx.db.delete(connection._id);
    return null;
  },
});

// ─── Data Ingestion ──────────────────────────────────────────────────────────
// Upsert mutations for storing normalized health data.
// Each implements the dedup strategy documented in schema.ts:
//   - Activity & Sleep: connectionId + metadata.summary_id
//   - Body, Daily, Nutrition: connectionId + metadata.start_time + metadata.end_time
//   - Athlete: connectionId (one per connection)
//   - Menstruation: insert (append-only)

/**
 * Ingest an activity (workout) record.
 *
 * Upserts by `connectionId + metadata.summary_id`. If a record with the same
 * summary_id already exists for this connection, it is updated in place.
 */
export const ingestActivity = mutation({
  args: activityValidator,
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("activities")
      .withIndex("by_connectionId_summaryId", (q) =>
        q
          .eq("connectionId", args.connectionId)
          .eq("metadata.summary_id", args.metadata.summary_id),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("activities", args);
  },
});

/**
 * Ingest a sleep session record.
 *
 * Upserts by `connectionId + metadata.summary_id`. If a record with the same
 * summary_id already exists for this connection, it is updated in place.
 */
export const ingestSleep = mutation({
  args: sleepValidator,
  handler: async (ctx, args) => {
    const summaryId = args.metadata.summary_id;
    if (summaryId) {
      const existing = await ctx.db
        .query("sleep")
        .withIndex("by_connectionId_summaryId", (q) =>
          q
            .eq("connectionId", args.connectionId)
            .eq("metadata.summary_id", summaryId),
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, args);
        return existing._id;
      }
    }
    return await ctx.db.insert("sleep", args);
  },
});

/**
 * Ingest a body metrics record.
 *
 * Upserts by `connectionId + metadata.start_time + metadata.end_time`.
 */
export const ingestBody = mutation({
  args: bodyValidator,
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("body")
      .withIndex("by_connectionId_timeRange", (q) =>
        q
          .eq("connectionId", args.connectionId)
          .eq("metadata.start_time", args.metadata.start_time)
          .eq("metadata.end_time", args.metadata.end_time),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("body", args);
  },
});

/**
 * Ingest a daily activity summary record.
 *
 * Upserts by `connectionId + metadata.start_time + metadata.end_time`.
 */
export const ingestDaily = mutation({
  args: dailyValidator,
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("daily")
      .withIndex("by_connectionId_timeRange", (q) =>
        q
          .eq("connectionId", args.connectionId)
          .eq("metadata.start_time", args.metadata.start_time)
          .eq("metadata.end_time", args.metadata.end_time),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("daily", args);
  },
});

/**
 * Ingest a nutrition record.
 *
 * Upserts by `connectionId + metadata.start_time + metadata.end_time`.
 */
export const ingestNutrition = mutation({
  args: nutritionValidator,
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("nutrition")
      .withIndex("by_connectionId_timeRange", (q) =>
        q
          .eq("connectionId", args.connectionId)
          .eq("metadata.start_time", args.metadata.start_time)
          .eq("metadata.end_time", args.metadata.end_time),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("nutrition", args);
  },
});

/**
 * Ingest a menstruation record.
 *
 * Append-only — each call inserts a new document.
 */
export const ingestMenstruation = mutation({
  args: menstruationValidator,
  handler: async (ctx, args) => {
    return await ctx.db.insert("menstruation", args);
  },
});

/**
 * Ingest an athlete (user profile) record.
 *
 * Upserts by `connectionId` — one athlete record per connection.
 */
export const ingestAthlete = mutation({
  args: athleteValidator,
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("athletes")
      .withIndex("by_connectionId", (q) =>
        q.eq("connectionId", args.connectionId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("athletes", args);
  },
});

// ─── Data Queries ────────────────────────────────────────────────────────────
// Query functions for reading normalized health data.
// Each table exposes a list (collect-all) and paginate (cursor-based) variant.
// Tables with a by_userId_startTime index support optional time-range filtering.

const timeRangeArgs = {
  userId: v.string(),
  startTime: v.optional(v.string()),
  endTime: v.optional(v.string()),
};

const listTimeRangeArgs = {
  ...timeRangeArgs,
  order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  limit: v.optional(v.number()),
};

const paginateTimeRangeArgs = {
  ...timeRangeArgs,
  paginationOpts: paginationOptsValidator,
};

// ── Activities ──────────────────────────────────────────────────────────────

/**
 * List activity records for a user, optionally filtered by time range.
 *
 * @param args.userId - The host app's user identifier
 * @param args.startTime - Optional ISO-8601 lower bound (inclusive) on metadata.start_time
 * @param args.endTime - Optional ISO-8601 upper bound (inclusive) on metadata.start_time
 * @param args.order - Sort order: "asc" or "desc" (default: "desc", newest first)
 * @param args.limit - Optional max number of results to return
 */
export const listActivities = query({
  args: listTimeRangeArgs,
  handler: async (ctx, args) => {
    const q = ctx.db
      .query("activities")
      .withIndex("by_userId_startTime", (q) => {
        const base = q.eq("userId", args.userId);
        if (args.startTime !== undefined && args.endTime !== undefined) {
          return base
            .gte("metadata.start_time", args.startTime)
            .lte("metadata.start_time", args.endTime);
        }
        if (args.startTime !== undefined) {
          return base.gte("metadata.start_time", args.startTime);
        }
        if (args.endTime !== undefined) {
          return base.lte("metadata.start_time", args.endTime);
        }
        return base;
      })
      .order(args.order ?? "desc");
    return args.limit ? await q.take(args.limit) : await q.collect();
  },
});

/**
 * Paginate activity records for a user, optionally filtered by time range.
 *
 * Returns `{ page, isDone, continueCursor }` for cursor-based pagination.
 */
export const paginateActivities = query({
  args: paginateTimeRangeArgs,
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activities")
      .withIndex("by_userId_startTime", (q) => {
        const base = q.eq("userId", args.userId);
        if (args.startTime !== undefined && args.endTime !== undefined) {
          return base
            .gte("metadata.start_time", args.startTime)
            .lte("metadata.start_time", args.endTime);
        }
        if (args.startTime !== undefined) {
          return base.gte("metadata.start_time", args.startTime);
        }
        if (args.endTime !== undefined) {
          return base.lte("metadata.start_time", args.endTime);
        }
        return base;
      })
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

// ── Sleep ───────────────────────────────────────────────────────────────────

/**
 * List sleep records for a user, optionally filtered by time range.
 *
 * @param args.userId - The host app's user identifier
 * @param args.startTime - Optional ISO-8601 lower bound (inclusive) on metadata.start_time
 * @param args.endTime - Optional ISO-8601 upper bound (inclusive) on metadata.start_time
 * @param args.order - Sort order: "asc" or "desc" (default: "desc", newest first)
 * @param args.limit - Optional max number of results to return
 */
export const listSleep = query({
  args: listTimeRangeArgs,
  handler: async (ctx, args) => {
    const q = ctx.db
      .query("sleep")
      .withIndex("by_userId_startTime", (q) => {
        const base = q.eq("userId", args.userId);
        if (args.startTime !== undefined && args.endTime !== undefined) {
          return base
            .gte("metadata.start_time", args.startTime)
            .lte("metadata.start_time", args.endTime);
        }
        if (args.startTime !== undefined) {
          return base.gte("metadata.start_time", args.startTime);
        }
        if (args.endTime !== undefined) {
          return base.lte("metadata.start_time", args.endTime);
        }
        return base;
      })
      .order(args.order ?? "desc");
    return args.limit ? await q.take(args.limit) : await q.collect();
  },
});

/**
 * Paginate sleep records for a user, optionally filtered by time range.
 *
 * Returns `{ page, isDone, continueCursor }` for cursor-based pagination.
 */
export const paginateSleep = query({
  args: paginateTimeRangeArgs,
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sleep")
      .withIndex("by_userId_startTime", (q) => {
        const base = q.eq("userId", args.userId);
        if (args.startTime !== undefined && args.endTime !== undefined) {
          return base
            .gte("metadata.start_time", args.startTime)
            .lte("metadata.start_time", args.endTime);
        }
        if (args.startTime !== undefined) {
          return base.gte("metadata.start_time", args.startTime);
        }
        if (args.endTime !== undefined) {
          return base.lte("metadata.start_time", args.endTime);
        }
        return base;
      })
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

// ── Body ────────────────────────────────────────────────────────────────────

/**
 * List body metrics records for a user, optionally filtered by time range.
 *
 * @param args.userId - The host app's user identifier
 * @param args.startTime - Optional ISO-8601 lower bound (inclusive) on metadata.start_time
 * @param args.endTime - Optional ISO-8601 upper bound (inclusive) on metadata.start_time
 * @param args.order - Sort order: "asc" or "desc" (default: "desc", newest first)
 * @param args.limit - Optional max number of results to return
 */
export const listBody = query({
  args: listTimeRangeArgs,
  handler: async (ctx, args) => {
    const q = ctx.db
      .query("body")
      .withIndex("by_userId_startTime", (q) => {
        const base = q.eq("userId", args.userId);
        if (args.startTime !== undefined && args.endTime !== undefined) {
          return base
            .gte("metadata.start_time", args.startTime)
            .lte("metadata.start_time", args.endTime);
        }
        if (args.startTime !== undefined) {
          return base.gte("metadata.start_time", args.startTime);
        }
        if (args.endTime !== undefined) {
          return base.lte("metadata.start_time", args.endTime);
        }
        return base;
      })
      .order(args.order ?? "desc");
    return args.limit ? await q.take(args.limit) : await q.collect();
  },
});

/**
 * Paginate body metrics records for a user, optionally filtered by time range.
 *
 * Returns `{ page, isDone, continueCursor }` for cursor-based pagination.
 */
export const paginateBody = query({
  args: paginateTimeRangeArgs,
  handler: async (ctx, args) => {
    return await ctx.db
      .query("body")
      .withIndex("by_userId_startTime", (q) => {
        const base = q.eq("userId", args.userId);
        if (args.startTime !== undefined && args.endTime !== undefined) {
          return base
            .gte("metadata.start_time", args.startTime)
            .lte("metadata.start_time", args.endTime);
        }
        if (args.startTime !== undefined) {
          return base.gte("metadata.start_time", args.startTime);
        }
        if (args.endTime !== undefined) {
          return base.lte("metadata.start_time", args.endTime);
        }
        return base;
      })
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

// ── Daily ───────────────────────────────────────────────────────────────────

/**
 * List daily activity summary records for a user, optionally filtered by time range.
 *
 * @param args.userId - The host app's user identifier
 * @param args.startTime - Optional ISO-8601 lower bound (inclusive) on metadata.start_time
 * @param args.endTime - Optional ISO-8601 upper bound (inclusive) on metadata.start_time
 * @param args.order - Sort order: "asc" or "desc" (default: "desc", newest first)
 * @param args.limit - Optional max number of results to return
 */
export const listDaily = query({
  args: listTimeRangeArgs,
  handler: async (ctx, args) => {
    const q = ctx.db
      .query("daily")
      .withIndex("by_userId_startTime", (q) => {
        const base = q.eq("userId", args.userId);
        if (args.startTime !== undefined && args.endTime !== undefined) {
          return base
            .gte("metadata.start_time", args.startTime)
            .lte("metadata.start_time", args.endTime);
        }
        if (args.startTime !== undefined) {
          return base.gte("metadata.start_time", args.startTime);
        }
        if (args.endTime !== undefined) {
          return base.lte("metadata.start_time", args.endTime);
        }
        return base;
      })
      .order(args.order ?? "desc");
    return args.limit ? await q.take(args.limit) : await q.collect();
  },
});

/**
 * Paginate daily activity summary records for a user, optionally filtered by time range.
 *
 * Returns `{ page, isDone, continueCursor }` for cursor-based pagination.
 */
export const paginateDaily = query({
  args: paginateTimeRangeArgs,
  handler: async (ctx, args) => {
    return await ctx.db
      .query("daily")
      .withIndex("by_userId_startTime", (q) => {
        const base = q.eq("userId", args.userId);
        if (args.startTime !== undefined && args.endTime !== undefined) {
          return base
            .gte("metadata.start_time", args.startTime)
            .lte("metadata.start_time", args.endTime);
        }
        if (args.startTime !== undefined) {
          return base.gte("metadata.start_time", args.startTime);
        }
        if (args.endTime !== undefined) {
          return base.lte("metadata.start_time", args.endTime);
        }
        return base;
      })
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

// ── Nutrition ───────────────────────────────────────────────────────────────

/**
 * List nutrition records for a user, optionally filtered by time range.
 *
 * @param args.userId - The host app's user identifier
 * @param args.startTime - Optional ISO-8601 lower bound (inclusive) on metadata.start_time
 * @param args.endTime - Optional ISO-8601 upper bound (inclusive) on metadata.start_time
 * @param args.order - Sort order: "asc" or "desc" (default: "desc", newest first)
 * @param args.limit - Optional max number of results to return
 */
export const listNutrition = query({
  args: listTimeRangeArgs,
  handler: async (ctx, args) => {
    const q = ctx.db
      .query("nutrition")
      .withIndex("by_userId_startTime", (q) => {
        const base = q.eq("userId", args.userId);
        if (args.startTime !== undefined && args.endTime !== undefined) {
          return base
            .gte("metadata.start_time", args.startTime)
            .lte("metadata.start_time", args.endTime);
        }
        if (args.startTime !== undefined) {
          return base.gte("metadata.start_time", args.startTime);
        }
        if (args.endTime !== undefined) {
          return base.lte("metadata.start_time", args.endTime);
        }
        return base;
      })
      .order(args.order ?? "desc");
    return args.limit ? await q.take(args.limit) : await q.collect();
  },
});

/**
 * Paginate nutrition records for a user, optionally filtered by time range.
 *
 * Returns `{ page, isDone, continueCursor }` for cursor-based pagination.
 */
export const paginateNutrition = query({
  args: paginateTimeRangeArgs,
  handler: async (ctx, args) => {
    return await ctx.db
      .query("nutrition")
      .withIndex("by_userId_startTime", (q) => {
        const base = q.eq("userId", args.userId);
        if (args.startTime !== undefined && args.endTime !== undefined) {
          return base
            .gte("metadata.start_time", args.startTime)
            .lte("metadata.start_time", args.endTime);
        }
        if (args.startTime !== undefined) {
          return base.gte("metadata.start_time", args.startTime);
        }
        if (args.endTime !== undefined) {
          return base.lte("metadata.start_time", args.endTime);
        }
        return base;
      })
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

// ── Menstruation ────────────────────────────────────────────────────────────

/**
 * List menstruation records for a user, optionally filtered by time range.
 *
 * @param args.userId - The host app's user identifier
 * @param args.startTime - Optional ISO-8601 lower bound (inclusive) on metadata.start_time
 * @param args.endTime - Optional ISO-8601 upper bound (inclusive) on metadata.start_time
 * @param args.order - Sort order: "asc" or "desc" (default: "desc", newest first)
 * @param args.limit - Optional max number of results to return
 */
export const listMenstruation = query({
  args: listTimeRangeArgs,
  handler: async (ctx, args) => {
    const q = ctx.db
      .query("menstruation")
      .withIndex("by_userId_startTime", (q) => {
        const base = q.eq("userId", args.userId);
        if (args.startTime !== undefined && args.endTime !== undefined) {
          return base
            .gte("metadata.start_time", args.startTime)
            .lte("metadata.start_time", args.endTime);
        }
        if (args.startTime !== undefined) {
          return base.gte("metadata.start_time", args.startTime);
        }
        if (args.endTime !== undefined) {
          return base.lte("metadata.start_time", args.endTime);
        }
        return base;
      })
      .order(args.order ?? "desc");
    return args.limit ? await q.take(args.limit) : await q.collect();
  },
});

/**
 * Paginate menstruation records for a user, optionally filtered by time range.
 *
 * Returns `{ page, isDone, continueCursor }` for cursor-based pagination.
 */
export const paginateMenstruation = query({
  args: paginateTimeRangeArgs,
  handler: async (ctx, args) => {
    return await ctx.db
      .query("menstruation")
      .withIndex("by_userId_startTime", (q) => {
        const base = q.eq("userId", args.userId);
        if (args.startTime !== undefined && args.endTime !== undefined) {
          return base
            .gte("metadata.start_time", args.startTime)
            .lte("metadata.start_time", args.endTime);
        }
        if (args.startTime !== undefined) {
          return base.gte("metadata.start_time", args.startTime);
        }
        if (args.endTime !== undefined) {
          return base.lte("metadata.start_time", args.endTime);
        }
        return base;
      })
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

// ── Planned Workouts ────────────────────────────────────────────────────────

/**
 * Ingest a planned workout record.
 *
 * Upserts by `connectionId + metadata.id` when an id is present.
 * Falls back to insert if no id is provided.
 */
export const ingestPlannedWorkout = mutation({
  args: plannedWorkoutValidator,
  handler: async (ctx, args) => {
    const metadataId = args.metadata.id;
    if (metadataId) {
      const results = await ctx.db
        .query("plannedWorkouts")
        .withIndex("by_connectionId", (q) =>
          q.eq("connectionId", args.connectionId),
        )
        .collect();
      const existing = results.find((r) => r.metadata.id === metadataId);

      if (existing) {
        await ctx.db.patch(existing._id, args);
        return existing._id;
      }
    }
    return await ctx.db.insert("plannedWorkouts", args);
  },
});

/**
 * List planned workout records for a user, optionally filtered by planned date range.
 *
 * @param args.userId - The host app's user identifier
 * @param args.startDate - Optional lower bound (inclusive) on metadata.planned_date (YYYY-MM-DD)
 * @param args.endDate - Optional upper bound (inclusive) on metadata.planned_date (YYYY-MM-DD)
 * @param args.order - Sort order: "asc" or "desc" (default: "desc")
 * @param args.limit - Optional max number of results to return
 */
export const listPlannedWorkouts = query({
  args: {
    userId: v.string(),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const q = ctx.db
      .query("plannedWorkouts")
      .withIndex("by_userId_plannedDate", (q) => {
        const base = q.eq("userId", args.userId);
        if (args.startDate !== undefined && args.endDate !== undefined) {
          return base
            .gte("metadata.planned_date", args.startDate)
            .lte("metadata.planned_date", args.endDate);
        }
        if (args.startDate !== undefined) {
          return base.gte("metadata.planned_date", args.startDate);
        }
        if (args.endDate !== undefined) {
          return base.lte("metadata.planned_date", args.endDate);
        }
        return base;
      })
      .order(args.order ?? "desc");
    return args.limit ? await q.take(args.limit) : await q.collect();
  },
});

/**
 * Paginate planned workout records for a user, optionally filtered by planned date range.
 *
 * Returns `{ page, isDone, continueCursor }` for cursor-based pagination.
 */
export const paginatePlannedWorkouts = query({
  args: {
    userId: v.string(),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("plannedWorkouts")
      .withIndex("by_userId_plannedDate", (q) => {
        const base = q.eq("userId", args.userId);
        if (args.startDate !== undefined && args.endDate !== undefined) {
          return base
            .gte("metadata.planned_date", args.startDate)
            .lte("metadata.planned_date", args.endDate);
        }
        if (args.startDate !== undefined) {
          return base.gte("metadata.planned_date", args.startDate);
        }
        if (args.endDate !== undefined) {
          return base.lte("metadata.planned_date", args.endDate);
        }
        return base;
      })
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

/**
 * Delete a planned workout by document ID.
 */
export const deletePlannedWorkout = mutation({
  args: { plannedWorkoutId: v.id("plannedWorkouts") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.plannedWorkoutId);
    if (!existing) {
      throw new Error(
        `Planned workout "${args.plannedWorkoutId}" not found`,
      );
    }
    await ctx.db.delete(existing._id);
    return null;
  },
});

/**
 * Get a single planned workout by document ID.
 */
export const getPlannedWorkout = query({
  args: { plannedWorkoutId: v.id("plannedWorkouts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.plannedWorkoutId);
  },
});

// ── Athletes ────────────────────────────────────────────────────────────────

/**
 * List all athlete profiles for a user.
 *
 * Athletes are one-per-connection, so the result set is typically small.
 *
 * @param args.userId - The host app's user identifier
 */
export const listAthletes = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("athletes")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

/**
 * Get the athlete profile for a user from a specific connection.
 *
 * Returns null if no athlete record exists for this connection.
 *
 * @param args.connectionId - The connection document ID
 */
export const getAthlete = query({
  args: { connectionId: v.id("connections") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("athletes")
      .withIndex("by_connectionId", (q) =>
        q.eq("connectionId", args.connectionId),
      )
      .first();
  },
});

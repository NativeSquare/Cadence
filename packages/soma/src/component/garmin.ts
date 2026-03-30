// ─── Garmin Component Actions ────────────────────────────────────────────────
// Public actions that handle the full Garmin OAuth 2.0 PKCE + sync lifecycle.
// The host app calls these through the Soma class, which threads the
// credentials automatically from env vars or constructor config.
//
// Internal mutations manage the providerTokens table (token CRUD).

import { v } from "convex/values";
import { anyApi } from "convex/server";
import {
  action,
  internalMutation,
  internalQuery,
} from "./_generated/server.js";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  buildAuthUrl,
  exchangeCode,
  refreshToken,
} from "../garmin/auth.js";
import { GarminClient } from "../garmin/client.js";
import { transformActivity } from "../garmin/activity.js";
import { transformDaily } from "../garmin/daily.js";
import { transformSleep } from "../garmin/sleep.js";
import { transformBody } from "../garmin/body.js";
import { transformMenstruation } from "../garmin/menstruation.js";
import { transformBloodPressure } from "../garmin/bloodPressure.js";
import { transformSkinTemp } from "../garmin/skinTemp.js";
import { transformUserMetrics } from "../garmin/userMetrics.js";
import { transformHRV } from "../garmin/hrv.js";
import { transformStressDetails } from "../garmin/stressDetails.js";
import { transformPulseOx } from "../garmin/pulseOx.js";
import { transformRespiration } from "../garmin/respiration.js";
import { transformPlannedWorkoutToGarmin } from "../garmin/plannedWorkout.js";

// Use anyApi to avoid circular type references between this file and _generated/api.ts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const publicApi: any = anyApi;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const internalApi: any = anyApi;

// Default sync window: last 30 days
const DEFAULT_SYNC_DAYS = 30;

// Shared synced counter validator for all sync actions
const syncedValidator = v.object({
  activities: v.number(),
  dailies: v.number(),
  sleep: v.number(),
  body: v.number(),
  menstruation: v.number(),
  bloodPressures: v.number(),
  skinTemp: v.number(),
  userMetrics: v.number(),
  hrv: v.number(),
  stressDetails: v.number(),
  pulseOx: v.number(),
  respiration: v.number(),
});

// Refresh buffer: refresh tokens 10 minutes before expiry
const REFRESH_BUFFER_SECONDS = 600;

// ─── Internal Pending OAuth CRUD ─────────────────────────────────────────────
// Temporary storage for in-progress Garmin OAuth 2.0 PKCE flows.
// Bridges getGarminAuthUrl and completeGarminOAuth.

export const storePendingOAuth = internalMutation({
  args: {
    provider: v.string(),
    state: v.string(),
    codeVerifier: v.string(),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("pendingOAuth", {
      ...args,
      createdAt: Date.now(),
    });
    return null;
  },
});

export const getPendingOAuth = internalQuery({
  args: { state: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("pendingOAuth"),
      _creationTime: v.number(),
      provider: v.string(),
      state: v.string(),
      codeVerifier: v.string(),
      userId: v.string(),
      createdAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pendingOAuth")
      .withIndex("by_state", (q) => q.eq("state", args.state))
      .first();
  },
});

export const deletePendingOAuth = internalMutation({
  args: { state: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const pending = await ctx.db
      .query("pendingOAuth")
      .withIndex("by_state", (q) => q.eq("state", args.state))
      .first();
    if (pending) {
      await ctx.db.delete(pending._id);
    }
    return null;
  },
});

// ─── Internal Token CRUD ─────────────────────────────────────────────────────

/**
 * Store OAuth 2.0 tokens for a Garmin connection.
 * Upserts by connectionId — one token record per connection.
 */
export const storeTokens = internalMutation({
  args: {
    connectionId: v.id("connections"),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("providerTokens")
      .withIndex("by_connectionId", (q) =>
        q.eq("connectionId", args.connectionId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
      });
      return null;
    }

    await ctx.db.insert("providerTokens", {
      connectionId: args.connectionId,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      expiresAt: args.expiresAt,
    });
    return null;
  },
});

/**
 * Get stored tokens for a connection.
 */
export const getTokens = internalQuery({
  args: { connectionId: v.id("connections") },
  returns: v.union(
    v.object({
      _id: v.id("providerTokens"),
      _creationTime: v.number(),
      connectionId: v.id("connections"),
      accessToken: v.string(),
      refreshToken: v.optional(v.string()),
      expiresAt: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("providerTokens")
      .withIndex("by_connectionId", (q) =>
        q.eq("connectionId", args.connectionId),
      )
      .first();
  },
});

/**
 * Delete stored tokens for a connection.
 */
export const deleteTokens = internalMutation({
  args: { connectionId: v.id("connections") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("providerTokens")
      .withIndex("by_connectionId", (q) =>
        q.eq("connectionId", args.connectionId),
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});

// ─── Public Actions ──────────────────────────────────────────────────────────

/**
 * Generate a Garmin OAuth 2.0 authorization URL with PKCE.
 *
 * If `userId` is provided, the PKCE code verifier and state are stored in the
 * component's `pendingOAuth` table so that `completeGarminOAuth` can look
 * them up automatically when the callback fires. This is the recommended
 * flow when using `registerRoutes`.
 *
 * If `userId` is omitted, the host app must store the returned `codeVerifier`
 * itself and pass it to `connectGarmin` manually.
 */
export const getGarminAuthUrl = action({
  args: {
    clientId: v.string(),
    redirectUri: v.optional(v.string()),
    userId: v.optional(v.string()),
  },
  returns: v.object({
    authUrl: v.string(),
    state: v.string(),
    codeVerifier: v.string(),
  }),
  handler: async (ctx, args) => {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateState();

    const authUrl = buildAuthUrl({
      clientId: args.clientId,
      codeChallenge,
      redirectUri: args.redirectUri,
      state,
    });

    if (args.userId) {
      await ctx.runMutation(internalApi.garmin.storePendingOAuth, {
        provider: "GARMIN",
        state,
        codeVerifier,
        userId: args.userId,
      });
    }

    return { authUrl, state, codeVerifier };
  },
});

/**
 * Exchange an authorization code for tokens + initial sync.
 *
 * Used in the manual flow where the host app stores the code verifier
 * and handles the callback itself.
 */
export const connectGarmin = action({
  args: {
    userId: v.string(),
    clientId: v.string(),
    clientSecret: v.string(),
    code: v.string(),
    codeVerifier: v.string(),
    redirectUri: v.optional(v.string()),
  },
  returns: v.object({
    connectionId: v.string(),
    synced: syncedValidator,
    errors: v.array(
      v.object({ type: v.string(), id: v.string(), error: v.string() }),
    ),
  }),
  handler: async (ctx, args) => {
    const tokenResult = await exchangeCode({
      clientId: args.clientId,
      clientSecret: args.clientSecret,
      code: args.code,
      codeVerifier: args.codeVerifier,
      redirectUri: args.redirectUri,
    });

    const connectionId = await ctx.runMutation(publicApi.public.connect, {
      userId: args.userId,
      provider: "GARMIN",
    });

    const expiresAt = Math.floor(Date.now() / 1000) + tokenResult.expires_in;
    await ctx.runMutation(internalApi.garmin.storeTokens, {
      connectionId,
      accessToken: tokenResult.access_token,
      refreshToken: tokenResult.refresh_token,
      expiresAt,
    });

    const client = new GarminClient({
      accessToken: tokenResult.access_token,
    });

    // Best-effort: resolve Garmin user ID for webhook mapping
    const garminUserId = await client.getUserId();
    if (garminUserId) {
      await ctx.runMutation(publicApi.public.updateConnection, {
        connectionId,
        providerUserId: garminUserId,
      });
    }

    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - DEFAULT_SYNC_DAYS * 86400;
    const timeRange = {
      uploadStartTimeInSeconds: thirtyDaysAgo,
      uploadEndTimeInSeconds: now,
    };

    const result = await syncAllTypes(ctx, client, {
      connectionId,
      userId: args.userId,
      timeRange,
    });

    await ctx.runMutation(publicApi.public.updateConnection, {
      connectionId,
      lastDataUpdate: new Date().toISOString(),
    });

    return {
      connectionId,
      synced: result.synced,
      errors: result.errors,
    };
  },
});

/**
 * Complete a Garmin OAuth 2.0 flow using stored pending state.
 *
 * Used by `registerRoutes` — the callback handler calls this with the
 * `code` and `state` from the redirect. The action looks up the pending
 * state (codeVerifier, userId) stored during `getGarminAuthUrl`,
 * exchanges for tokens, creates the connection, syncs data, and
 * cleans up the pending entry.
 */
export const completeGarminOAuth = action({
  args: {
    code: v.string(),
    state: v.string(),
    clientId: v.string(),
    clientSecret: v.string(),
    redirectUri: v.optional(v.string()),
  },
  returns: v.object({
    connectionId: v.string(),
    synced: syncedValidator,
    errors: v.array(
      v.object({ type: v.string(), id: v.string(), error: v.string() }),
    ),
  }),
  handler: async (ctx, args) => {
    const pending = await ctx.runQuery(internalApi.garmin.getPendingOAuth, {
      state: args.state,
    });
    if (!pending) {
      throw new Error(
        "No pending Garmin OAuth state found for this state parameter. " +
          "The authorization may have expired or was already used.",
      );
    }

    const tokenResult = await exchangeCode({
      clientId: args.clientId,
      clientSecret: args.clientSecret,
      code: args.code,
      codeVerifier: pending.codeVerifier,
      redirectUri: args.redirectUri,
    });

    await ctx.runMutation(internalApi.garmin.deletePendingOAuth, {
      state: args.state,
    });

    const connectionId = await ctx.runMutation(publicApi.public.connect, {
      userId: pending.userId,
      provider: "GARMIN",
    });

    const expiresAt = Math.floor(Date.now() / 1000) + tokenResult.expires_in;
    await ctx.runMutation(internalApi.garmin.storeTokens, {
      connectionId,
      accessToken: tokenResult.access_token,
      refreshToken: tokenResult.refresh_token,
      expiresAt,
    });

    const client = new GarminClient({
      accessToken: tokenResult.access_token,
    });

    // Best-effort: resolve Garmin user ID for webhook mapping
    const garminUserId = await client.getUserId();
    if (garminUserId) {
      await ctx.runMutation(publicApi.public.updateConnection, {
        connectionId,
        providerUserId: garminUserId,
      });
    }

    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - DEFAULT_SYNC_DAYS * 86400;
    const timeRange = {
      uploadStartTimeInSeconds: thirtyDaysAgo,
      uploadEndTimeInSeconds: now,
    };

    const result = await syncAllTypes(ctx, client, {
      connectionId,
      userId: pending.userId,
      timeRange,
    });

    await ctx.runMutation(publicApi.public.updateConnection, {
      connectionId,
      lastDataUpdate: new Date().toISOString(),
    });

    return {
      connectionId,
      synced: result.synced,
      errors: result.errors,
    };
  },
});

/**
 * Incremental Garmin sync for an already-connected user.
 *
 * Looks up the stored tokens, refreshes if expired, and syncs all data
 * types for the specified time range (defaults to last 30 days).
 */
export const syncGarmin = action({
  args: {
    userId: v.string(),
    clientId: v.string(),
    clientSecret: v.string(),
    startTimeInSeconds: v.optional(v.number()),
    endTimeInSeconds: v.optional(v.number()),
  },
  returns: v.object({
    synced: syncedValidator,
    errors: v.array(
      v.object({ type: v.string(), id: v.string(), error: v.string() }),
    ),
  }),
  handler: async (ctx, args) => {
    const connection = await ctx.runQuery(
      internalApi.private.getConnectionByProvider,
      { userId: args.userId, provider: "GARMIN" },
    );
    if (!connection) {
      throw new Error(
        `No Garmin connection found for user "${args.userId}". ` +
          "Call connectGarmin first.",
      );
    }
    if (!connection.active) {
      throw new Error(
        `Garmin connection for user "${args.userId}" is inactive. Reconnect first.`,
      );
    }

    const connectionId = connection._id;

    const tokenDoc = await ctx.runQuery(internalApi.garmin.getTokens, {
      connectionId,
    });
    if (!tokenDoc) {
      throw new Error(
        "No Garmin tokens found for this connection. " +
          "The connection may have been created before token storage was available.",
      );
    }

    let accessToken = tokenDoc.accessToken;

    // Refresh the token if it's expired or about to expire
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (
      tokenDoc.expiresAt &&
      tokenDoc.refreshToken &&
      nowSeconds >= tokenDoc.expiresAt - REFRESH_BUFFER_SECONDS
    ) {
      const refreshed = await refreshToken({
        clientId: args.clientId,
        clientSecret: args.clientSecret,
        refreshToken: tokenDoc.refreshToken,
      });

      accessToken = refreshed.access_token;
      const newExpiresAt = nowSeconds + refreshed.expires_in;
      await ctx.runMutation(internalApi.garmin.storeTokens, {
        connectionId,
        accessToken: refreshed.access_token,
        refreshToken: refreshed.refresh_token,
        expiresAt: newExpiresAt,
      });
    }

    const client = new GarminClient({ accessToken });

    // Lazy backfill: resolve Garmin user ID if missing (for webhook mapping)
    if (!connection.providerUserId) {
      const garminUserId = await client.getUserId();
      if (garminUserId) {
        await ctx.runMutation(publicApi.public.updateConnection, {
          connectionId,
          providerUserId: garminUserId,
        });
      }
    }

    const now = Math.floor(Date.now() / 1000);
    const timeRange = {
      uploadStartTimeInSeconds:
        args.startTimeInSeconds ?? now - DEFAULT_SYNC_DAYS * 86400,
      uploadEndTimeInSeconds: args.endTimeInSeconds ?? now,
    };

    const result = await syncAllTypes(ctx, client, {
      connectionId,
      userId: args.userId,
      timeRange,
    });

    await ctx.runMutation(publicApi.public.updateConnection, {
      connectionId,
      lastDataUpdate: new Date().toISOString(),
    });

    return result;
  },
});

/**
 * Disconnect a user from Garmin.
 *
 * Deregisters the user via the Garmin API (best-effort), deletes stored
 * tokens, and sets the connection to inactive.
 */
export const disconnectGarmin = action({
  args: {
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const connection = await ctx.runQuery(
      internalApi.private.getConnectionByProvider,
      { userId: args.userId, provider: "GARMIN" },
    );
    if (!connection) {
      throw new Error(
        `No Garmin connection found for user "${args.userId}".`,
      );
    }

    const connectionId = connection._id;

    // Best-effort: deregister user at Garmin
    const tokenDoc = await ctx.runQuery(internalApi.garmin.getTokens, {
      connectionId,
    });
    if (tokenDoc) {
      try {
        const client = new GarminClient({ accessToken: tokenDoc.accessToken });
        await client.deleteUserRegistration();
      } catch {
        // Deregistration is best-effort; proceed with local cleanup
      }
    }

    await ctx.runMutation(internalApi.garmin.deleteTokens, { connectionId });

    await ctx.runMutation(publicApi.public.disconnect, {
      userId: args.userId,
      provider: "GARMIN",
    });

    return null;
  },
});

// ─── Training API ────────────────────────────────────────────────────────────

/**
 * Push a planned workout from Soma's DB to Garmin Connect.
 *
 * Reads the planned workout document, transforms it to Garmin Training API V2
 * format, creates the workout at Garmin, and optionally schedules it if a
 * `planned_date` is set in the metadata.
 *
 * Returns the Garmin workout ID and schedule ID (if scheduled).
 */
export const pushPlannedWorkout = action({
  args: {
    userId: v.string(),
    clientId: v.string(),
    clientSecret: v.string(),
    plannedWorkoutId: v.string(),
    workoutProvider: v.optional(v.string()),
  },
  returns: v.object({
    garminWorkoutId: v.number(),
    garminScheduleId: v.union(v.number(), v.null()),
  }),
  handler: async (ctx, args) => {
    const connection = await ctx.runQuery(
      internalApi.private.getConnectionByProvider,
      { userId: args.userId, provider: "GARMIN" },
    );
    if (!connection) {
      throw new Error(
        `No Garmin connection found for user "${args.userId}". ` +
          "Call connectGarmin first.",
      );
    }
    if (!connection.active) {
      throw new Error(
        `Garmin connection for user "${args.userId}" is inactive. Reconnect first.`,
      );
    }

    const connectionId = connection._id;

    const tokenDoc = await ctx.runQuery(internalApi.garmin.getTokens, {
      connectionId,
    });
    if (!tokenDoc) {
      throw new Error(
        "No Garmin tokens found for this connection. " +
          "The connection may have been created before token storage was available.",
      );
    }

    // Always force-refresh the token for Training API calls to rule out
    // stale tokens (the initial sync swallows 401 errors silently).
    let accessToken = tokenDoc.accessToken;

    if (tokenDoc.refreshToken) {
      try {
        const refreshed = await refreshToken({
          clientId: args.clientId,
          clientSecret: args.clientSecret,
          refreshToken: tokenDoc.refreshToken,
        });

        accessToken = refreshed.access_token;
        const nowSeconds = Math.floor(Date.now() / 1000);
        const newExpiresAt = nowSeconds + refreshed.expires_in;
        await ctx.runMutation(internalApi.garmin.storeTokens, {
          connectionId,
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token,
          expiresAt: newExpiresAt,
        });
      } catch (refreshErr) {
        throw new Error(
          `Garmin token refresh failed: ${refreshErr instanceof Error ? refreshErr.message : String(refreshErr)}. ` +
            "The user may need to reconnect their Garmin account.",
        );
      }
    }

    const plannedWorkout = await ctx.runQuery(
      publicApi.public.getPlannedWorkout,
      { plannedWorkoutId: args.plannedWorkoutId as never },
    );
    if (!plannedWorkout) {
      throw new Error(
        `Planned workout "${args.plannedWorkoutId}" not found.`,
      );
    }

    const providerName = args.workoutProvider ?? "Soma";
    const garminWorkout = transformPlannedWorkoutToGarmin(
      plannedWorkout,
      providerName,
    );

    const client = new GarminClient({ accessToken });
    const created = await client.createWorkout(garminWorkout);

    if (!created.workoutId) {
      throw new Error("Garmin API did not return a workoutId after creation.");
    }

    let garminScheduleId: number | null = null;

    const plannedDate = plannedWorkout.metadata?.planned_date;
    if (plannedDate) {
      const schedule = await client.createSchedule(
        created.workoutId,
        plannedDate,
      );
      garminScheduleId = schedule.scheduleId ?? null;
    }

    // Store the Garmin workout/schedule IDs back on the planned workout
    // so the host app can match completed activities to planned sessions.
    await ctx.runMutation(publicApi.public.ingestPlannedWorkout, {
      ...plannedWorkout,
      _id: undefined,
      _creationTime: undefined,
      metadata: {
        ...plannedWorkout.metadata,
        provider_workout_id: String(created.workoutId),
        provider_schedule_id:
          garminScheduleId != null ? String(garminScheduleId) : undefined,
      },
    } as never);

    return {
      garminWorkoutId: created.workoutId,
      garminScheduleId,
    };
  },
});

// ─── Webhook Handlers (Push Mode) ────────────────────────────────────────────
// Each handler receives full Garmin data objects from push-mode webhooks.
// Separate actions per data type because the Garmin developer portal
// configures separate URLs per type.

const webhookResultValidator = v.object({
  processed: v.number(),
  errors: v.array(
    v.object({ type: v.string(), id: v.string(), error: v.string() }),
  ),
});

/**
 * Handle a webhook for Garmin activities (push or ping mode).
 *
 * Push mode: receives full GarminActivity objects, transforms, and ingests.
 * Ping mode: receives notifications, fetches data from the Garmin API, transforms, and ingests.
 */
export const handleGarminWebhookActivities = action({
  args: { payload: v.any() },
  returns: webhookResultValidator,
  handler: async (ctx, args) => {
    return await processWebhookDualMode(ctx, {
      items: args.payload as Array<{ userId: string; [k: string]: unknown }>,
      type: "activity",
      transform: (item) => transformActivity(item as never),
      ingest: publicApi.public.ingestActivity,
      getId: (item) =>
        (item as { summaryId?: string; activityId?: number }).summaryId ??
        String((item as { activityId?: number }).activityId ?? "unknown"),
      fetchData: (client, timeRange) => client.getActivities(timeRange),
    });
  },
});

/**
 * Handle a webhook for Garmin daily summaries (push or ping mode).
 */
export const handleGarminWebhookDailies = action({
  args: { payload: v.any() },
  returns: webhookResultValidator,
  handler: async (ctx, args) => {
    return await processWebhookDualMode(ctx, {
      items: args.payload as Array<{ userId: string; [k: string]: unknown }>,
      type: "daily",
      transform: (item) => transformDaily(item as never),
      ingest: publicApi.public.ingestDaily,
      getId: (item) =>
        (item as { summaryId?: string; calendarDate?: string }).summaryId ??
        (item as { calendarDate?: string }).calendarDate ??
        "unknown",
      fetchData: (client, timeRange) => client.getDailies(timeRange),
    });
  },
});

/**
 * Handle a webhook for Garmin sleep summaries (push or ping mode).
 */
export const handleGarminWebhookSleeps = action({
  args: { payload: v.any() },
  returns: webhookResultValidator,
  handler: async (ctx, args) => {
    return await processWebhookDualMode(ctx, {
      items: args.payload as Array<{ userId: string; [k: string]: unknown }>,
      type: "sleep",
      transform: (item) => transformSleep(item as never),
      ingest: publicApi.public.ingestSleep,
      getId: (item) =>
        (item as { summaryId?: string; calendarDate?: string }).summaryId ??
        (item as { calendarDate?: string }).calendarDate ??
        "unknown",
      fetchData: (client, timeRange) => client.getSleeps(timeRange),
    });
  },
});

/**
 * Handle a webhook for Garmin body composition summaries (push or ping mode).
 */
export const handleGarminWebhookBody = action({
  args: { payload: v.any() },
  returns: webhookResultValidator,
  handler: async (ctx, args) => {
    return await processWebhookDualMode(ctx, {
      items: args.payload as Array<{ userId: string; [k: string]: unknown }>,
      type: "body",
      transform: (item) => transformBody(item as never),
      ingest: publicApi.public.ingestBody,
      getId: (item) =>
        (item as { summaryId?: string; measurementTimeInSeconds?: number })
          .summaryId ??
        String(
          (item as { measurementTimeInSeconds?: number })
            .measurementTimeInSeconds ?? "unknown",
        ),
      fetchData: (client, timeRange) => client.getBodyCompositions(timeRange),
    });
  },
});

/**
 * Handle a webhook for Garmin menstrual cycle tracking (push or ping mode).
 */
export const handleGarminWebhookMenstruation = action({
  args: { payload: v.any() },
  returns: webhookResultValidator,
  handler: async (ctx, args) => {
    return await processWebhookDualMode(ctx, {
      items: args.payload as Array<{ userId: string; [k: string]: unknown }>,
      type: "menstruation",
      transform: (item) => transformMenstruation(item as never),
      ingest: publicApi.public.ingestMenstruation,
      getId: (item) =>
        (item as { summaryId?: string; calendarDate?: string }).summaryId ??
        (item as { calendarDate?: string }).calendarDate ??
        "unknown",
      fetchData: (client, timeRange) => client.getMenstrualCycleData(timeRange),
    });
  },
});

/**
 * Handle a webhook for Garmin blood pressure summaries (push or ping mode).
 */
export const handleGarminWebhookBloodPressures = action({
  args: { payload: v.any() },
  returns: webhookResultValidator,
  handler: async (ctx, args) => {
    return await processWebhookDualMode(ctx, {
      items: args.payload as Array<{ userId: string; [k: string]: unknown }>,
      type: "bloodPressure",
      transform: (item) => transformBloodPressure(item as never),
      ingest: publicApi.public.ingestBody,
      getId: (item) =>
        (item as { summaryId?: string; measurementTimeInSeconds?: number })
          .summaryId ??
        String(
          (item as { measurementTimeInSeconds?: number })
            .measurementTimeInSeconds ?? "unknown",
        ),
      fetchData: (client, timeRange) => client.getBloodPressures(timeRange),
    });
  },
});

/**
 * Handle a webhook for Garmin skin temperature summaries (push or ping mode).
 */
export const handleGarminWebhookSkinTemp = action({
  args: { payload: v.any() },
  returns: webhookResultValidator,
  handler: async (ctx, args) => {
    return await processWebhookDualMode(ctx, {
      items: args.payload as Array<{ userId: string; [k: string]: unknown }>,
      type: "skinTemp",
      transform: (item) => transformSkinTemp(item as never),
      ingest: publicApi.public.ingestBody,
      getId: (item) =>
        (item as { summaryId?: string; calendarDate?: string }).summaryId ??
        (item as { calendarDate?: string }).calendarDate ??
        "unknown",
      fetchData: (client, timeRange) => client.getSkinTemperature(timeRange),
    });
  },
});

/**
 * Handle a webhook for Garmin user metrics (push or ping mode).
 */
export const handleGarminWebhookUserMetrics = action({
  args: { payload: v.any() },
  returns: webhookResultValidator,
  handler: async (ctx, args) => {
    return await processWebhookDualMode(ctx, {
      items: args.payload as Array<{ userId: string; [k: string]: unknown }>,
      type: "userMetrics",
      transform: (item) => transformUserMetrics(item as never),
      ingest: publicApi.public.ingestBody,
      getId: (item) =>
        (item as { summaryId?: string; calendarDate?: string }).summaryId ??
        (item as { calendarDate?: string }).calendarDate ??
        "unknown",
      fetchData: (client, timeRange) => client.getUserMetrics(timeRange),
    });
  },
});

/**
 * Handle a webhook for Garmin HRV summaries (push or ping mode).
 * Enriches daily records with heart_rate_data.
 */
export const handleGarminWebhookHRV = action({
  args: { payload: v.any() },
  returns: webhookResultValidator,
  handler: async (ctx, args) => {
    return await processWebhookDualMode(ctx, {
      items: args.payload as Array<{ userId: string; [k: string]: unknown }>,
      type: "hrv",
      transform: (item) => {
        const record = item as { startTimeInSeconds?: number; durationInSeconds?: number };
        const data = transformHRV(item as never);
        if (!data.heart_rate_data) return null;
        return {
          metadata: {
            start_time: new Date((record.startTimeInSeconds ?? 0) * 1000).toISOString(),
            end_time: new Date(((record.startTimeInSeconds ?? 0) + (record.durationInSeconds ?? 86400)) * 1000).toISOString(),
            upload_type: 1,
          },
          heart_rate_data: data.heart_rate_data,
        };
      },
      ingest: publicApi.public.ingestDaily,
      getId: (item) =>
        (item as { summaryId?: string; calendarDate?: string }).summaryId ??
        (item as { calendarDate?: string }).calendarDate ??
        "unknown",
      fetchData: (client, timeRange) => client.getHRV(timeRange),
    });
  },
});

/**
 * Handle a webhook for Garmin stress detail summaries (push or ping mode).
 * Enriches daily records with stress_data.
 */
export const handleGarminWebhookStressDetails = action({
  args: { payload: v.any() },
  returns: webhookResultValidator,
  handler: async (ctx, args) => {
    return await processWebhookDualMode(ctx, {
      items: args.payload as Array<{ userId: string; [k: string]: unknown }>,
      type: "stressDetails",
      transform: (item) => {
        const record = item as { startTimeInSeconds?: number; durationInSeconds?: number };
        const data = transformStressDetails(item as never);
        if (!data.stress_data) return null;
        return {
          metadata: {
            start_time: new Date((record.startTimeInSeconds ?? 0) * 1000).toISOString(),
            end_time: new Date(((record.startTimeInSeconds ?? 0) + (record.durationInSeconds ?? 86400)) * 1000).toISOString(),
            upload_type: 1,
          },
          stress_data: data.stress_data,
        };
      },
      ingest: publicApi.public.ingestDaily,
      getId: (item) =>
        (item as { summaryId?: string; calendarDate?: string }).summaryId ??
        (item as { calendarDate?: string }).calendarDate ??
        "unknown",
      fetchData: (client, timeRange) => client.getStressDetails(timeRange),
    });
  },
});

/**
 * Handle a webhook for Garmin pulse oximetry (SpO2) summaries (push or ping mode).
 * Enriches daily records with oxygen_data.
 */
export const handleGarminWebhookPulseOx = action({
  args: { payload: v.any() },
  returns: webhookResultValidator,
  handler: async (ctx, args) => {
    return await processWebhookDualMode(ctx, {
      items: args.payload as Array<{ userId: string; [k: string]: unknown }>,
      type: "pulseOx",
      transform: (item) => {
        const record = item as { startTimeInSeconds?: number; durationInSeconds?: number };
        const data = transformPulseOx(item as never);
        if (!data.oxygen_data) return null;
        return {
          metadata: {
            start_time: new Date((record.startTimeInSeconds ?? 0) * 1000).toISOString(),
            end_time: new Date(((record.startTimeInSeconds ?? 0) + (record.durationInSeconds ?? 86400)) * 1000).toISOString(),
            upload_type: 1,
          },
          oxygen_data: data.oxygen_data,
        };
      },
      ingest: publicApi.public.ingestDaily,
      getId: (item) =>
        (item as { summaryId?: string; calendarDate?: string }).summaryId ??
        (item as { calendarDate?: string }).calendarDate ??
        "unknown",
      fetchData: (client, timeRange) => client.getPulseOx(timeRange),
    });
  },
});

/**
 * Handle a webhook for Garmin respiration summaries (push or ping mode).
 * Enriches daily records with respiration_data.
 */
export const handleGarminWebhookRespiration = action({
  args: { payload: v.any() },
  returns: webhookResultValidator,
  handler: async (ctx, args) => {
    return await processWebhookDualMode(ctx, {
      items: args.payload as Array<{ userId: string; [k: string]: unknown }>,
      type: "respiration",
      transform: (item) => {
        const record = item as { startTimeInSeconds?: number; durationInSeconds?: number };
        const data = transformRespiration(item as never);
        if (!data.respiration_data) return null;
        return {
          metadata: {
            start_time: new Date((record.startTimeInSeconds ?? 0) * 1000).toISOString(),
            end_time: new Date(((record.startTimeInSeconds ?? 0) + (record.durationInSeconds ?? 86400)) * 1000).toISOString(),
            upload_type: 1,
          },
          respiration_data: data.respiration_data,
        };
      },
      ingest: publicApi.public.ingestDaily,
      getId: (item) =>
        (item as { summaryId?: string }).summaryId ?? "unknown",
      fetchData: (client, timeRange) => client.getRespiration(timeRange),
    });
  },
});

// ─── Webhook Internal Helper ─────────────────────────────────────────────────

interface WebhookProcessConfig {
  items: Array<{ userId: string; [k: string]: unknown }>;
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (item: unknown) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ingest: any;
  getId: (item: unknown) => string;
}

async function processWebhookPayload(
  ctx: ActionContext,
  config: WebhookProcessConfig,
) {
  const { items, type, transform, ingest, getId } = config;

  let processed = 0;
  const errors: Array<{ type: string; id: string; error: string }> = [];

  if (!Array.isArray(items)) {
    errors.push({ type, id: "payload", error: "Expected an array payload" });
    return { processed, errors };
  }

  // Group items by Garmin userId
  const byUser = new Map<string, Array<unknown>>();
  for (const item of items) {
    const garminUserId = item.userId;
    if (!garminUserId) {
      errors.push({ type, id: getId(item), error: "Missing userId in payload item" });
      continue;
    }
    if (!byUser.has(garminUserId)) byUser.set(garminUserId, []);
    byUser.get(garminUserId)!.push(item);
  }

  // Process each Garmin user's items
  for (const [garminUserId, userItems] of byUser) {
    const connection = await ctx.runQuery(
      internalApi.private.getConnectionByProviderUserId,
      { providerUserId: garminUserId, provider: "GARMIN" },
    );

    if (!connection) {
      for (const item of userItems) {
        errors.push({
          type,
          id: getId(item),
          error: `No Soma connection found for Garmin userId "${garminUserId}"`,
        });
      }
      continue;
    }

    if (!connection.active) {
      for (const item of userItems) {
        errors.push({
          type,
          id: getId(item),
          error: `Garmin connection for userId "${garminUserId}" is inactive`,
        });
      }
      continue;
    }

    const connectionId = connection._id;
    const userId = connection.userId;

    for (const item of userItems) {
      try {
        const data = transform(item);
        if (data == null) continue; // Skip items with no transformable data
        await ctx.runMutation(ingest, {
          connectionId,
          userId,
          ...data,
        } as never);
        processed++;
      } catch (err) {
        errors.push({
          type,
          id: getId(item),
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // Update last data timestamp
    await ctx.runMutation(publicApi.public.updateConnection, {
      connectionId,
      lastDataUpdate: new Date().toISOString(),
    });
  }

  return { processed, errors };
}

// ─── Ping Mode Support ───────────────────────────────────────────────────────
// In ping mode, Garmin sends a lightweight notification instead of full data.
// The handler fetches the actual data from the Garmin API using stored tokens.

/**
 * Detect whether a webhook payload is ping mode (notification only) vs push
 * mode (full data). Ping payloads have `uploadStartTimeInSeconds` and very
 * few keys; push payloads contain the full summary object.
 */
function isPingMode(
  items: Array<{ [k: string]: unknown }>,
): boolean {
  if (items.length === 0) return false;
  const item = items[0];
  return (
    "uploadStartTimeInSeconds" in item &&
    "uploadEndTimeInSeconds" in item &&
    Object.keys(item).length <= 6
  );
}

interface WebhookDualModeConfig extends WebhookProcessConfig {
  /** Fetch full records from the Garmin API (used in ping mode only). */
  fetchData: (
    client: GarminClient,
    timeRange: { uploadStartTimeInSeconds: number; uploadEndTimeInSeconds: number },
  ) => Promise<unknown[]>;
}

/**
 * Process a webhook payload in either push or ping mode.
 *
 * - Push mode: items contain full data → transform and ingest directly.
 * - Ping mode: items are notifications → fetch data from the API, then
 *   transform and ingest.
 */
async function processWebhookDualMode(
  ctx: ActionContext,
  config: WebhookDualModeConfig,
) {
  const mode = isPingMode(config.items) ? "ping" : "push";
  console.log(
    `[garmin:webhook:${config.type}] mode=${mode} items=${config.items.length} payload:`,
    JSON.stringify(config.items, null, 2),
  );
  if (mode === "ping") {
    return await processWebhookPingPayload(ctx, config);
  }
  return await processWebhookPayload(ctx, config);
}

async function processWebhookPingPayload(
  ctx: ActionContext,
  config: WebhookDualModeConfig,
) {
  const { items, type, fetchData, transform, ingest, getId } = config;

  let processed = 0;
  const errors: Array<{ type: string; id: string; error: string }> = [];

  if (!Array.isArray(items)) {
    errors.push({ type, id: "payload", error: "Expected an array payload" });
    return { processed, errors };
  }

  // Group by Garmin userId and merge time ranges
  const byUser = new Map<
    string,
    { userAccessToken?: string; minStart: number; maxEnd: number }
  >();
  for (const item of items) {
    const garminUserId = (item as { userId?: string }).userId;
    if (!garminUserId) {
      errors.push({ type, id: "unknown", error: "Missing userId in ping notification" });
      continue;
    }
    const existing = byUser.get(garminUserId);
    const start = (item as { uploadStartTimeInSeconds?: number }).uploadStartTimeInSeconds ?? 0;
    const end = (item as { uploadEndTimeInSeconds?: number }).uploadEndTimeInSeconds ?? 0;
    const token = (item as { userAccessToken?: string }).userAccessToken;
    if (existing) {
      existing.minStart = Math.min(existing.minStart, start);
      existing.maxEnd = Math.max(existing.maxEnd, end);
      if (token && !existing.userAccessToken) existing.userAccessToken = token;
    } else {
      byUser.set(garminUserId, { userAccessToken: token, minStart: start, maxEnd: end });
    }
  }

  for (const [garminUserId, notification] of byUser) {
    const connection = await ctx.runQuery(
      internalApi.private.getConnectionByProviderUserId,
      { providerUserId: garminUserId, provider: "GARMIN" },
    );

    if (!connection) {
      errors.push({
        type,
        id: "ping",
        error: `No Soma connection found for Garmin userId "${garminUserId}"`,
      });
      continue;
    }
    if (!connection.active) {
      errors.push({
        type,
        id: "ping",
        error: `Garmin connection for userId "${garminUserId}" is inactive`,
      });
      continue;
    }

    const connectionId = connection._id;
    const userId = connection.userId;

    // Resolve a valid access token: prefer stored (with refresh), fall back to notification
    let accessToken: string | null = null;
    const tokenDoc = await ctx.runQuery(internalApi.garmin.getTokens, {
      connectionId,
    });
    if (tokenDoc) {
      accessToken = tokenDoc.accessToken;
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (
        tokenDoc.expiresAt &&
        tokenDoc.refreshToken &&
        nowSeconds >= tokenDoc.expiresAt - REFRESH_BUFFER_SECONDS
      ) {
        const clientId = process.env.GARMIN_CLIENT_ID;
        const clientSecret = process.env.GARMIN_CLIENT_SECRET;
        if (clientId && clientSecret) {
          try {
            const refreshed = await refreshToken({
              clientId,
              clientSecret,
              refreshToken: tokenDoc.refreshToken,
            });
            accessToken = refreshed.access_token;
            await ctx.runMutation(internalApi.garmin.storeTokens, {
              connectionId,
              accessToken: refreshed.access_token,
              refreshToken: refreshed.refresh_token,
              expiresAt: nowSeconds + refreshed.expires_in,
            });
          } catch {
            // Refresh failed — fall through to notification token
          }
        }
      }
    }
    if (!accessToken) {
      accessToken = notification.userAccessToken ?? null;
    }
    if (!accessToken) {
      errors.push({
        type,
        id: "ping",
        error: `No access token available for Garmin userId "${garminUserId}"`,
      });
      continue;
    }

    const client = new GarminClient({ accessToken });

    // Use the merged time range from all notifications for this user
    let { minStart, maxEnd } = notification;
    if (minStart === 0 && maxEnd === 0) {
      const now = Math.floor(Date.now() / 1000);
      minStart = now - 86400;
      maxEnd = now;
    }

    try {
      const records = await fetchData(client, {
        uploadStartTimeInSeconds: minStart,
        uploadEndTimeInSeconds: maxEnd,
      });

      for (const record of records) {
        try {
          const data = transform(record);
          if (data == null) continue;
          await ctx.runMutation(ingest, {
            connectionId,
            userId,
            ...data,
          } as never);
          processed++;
        } catch (err) {
          errors.push({
            type,
            id: getId(record),
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    } catch (err) {
      errors.push({
        type,
        id: "fetch",
        error: err instanceof Error ? err.message : String(err),
      });
    }

    await ctx.runMutation(publicApi.public.updateConnection, {
      connectionId,
      lastDataUpdate: new Date().toISOString(),
    });
  }

  return { processed, errors };
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

interface SyncAllConfig {
  connectionId: string;
  userId: string;
  timeRange: { uploadStartTimeInSeconds: number; uploadEndTimeInSeconds: number };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ActionContext = { runMutation: (ref: any, args: any) => Promise<any>; runQuery: (ref: any, args: any) => Promise<any> };

async function syncAllTypes(
  ctx: ActionContext,
  client: GarminClient,
  config: SyncAllConfig,
) {
  const { connectionId, userId, timeRange } = config;

  const synced = {
    activities: 0, dailies: 0, sleep: 0, body: 0, menstruation: 0,
    bloodPressures: 0, skinTemp: 0, userMetrics: 0,
    hrv: 0, stressDetails: 0, pulseOx: 0, respiration: 0,
  };
  const errors: Array<{ type: string; id: string; error: string }> = [];

  // ── Activities ──────────────────────────────────────────────────────────
  try {
    const activities = await client.getActivities(timeRange);
    for (const activity of activities) {
      try {
        const data = transformActivity(activity);
        await ctx.runMutation(publicApi.public.ingestActivity, {
          connectionId,
          userId,
          ...data,
        } as never);
        synced.activities++;
      } catch (err) {
        errors.push({
          type: "activity",
          id: activity.summaryId ?? String(activity.activityId),
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } catch (err) {
    errors.push({
      type: "activity",
      id: "fetch",
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // ── Dailies ─────────────────────────────────────────────────────────────
  try {
    const dailies = await client.getDailies(timeRange);
    for (const daily of dailies) {
      try {
        const data = transformDaily(daily);
        await ctx.runMutation(publicApi.public.ingestDaily, {
          connectionId,
          userId,
          ...data,
        } as never);
        synced.dailies++;
      } catch (err) {
        errors.push({
          type: "daily",
          id: daily.summaryId ?? daily.calendarDate ?? "unknown",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } catch (err) {
    errors.push({
      type: "daily",
      id: "fetch",
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // ── Sleep ───────────────────────────────────────────────────────────────
  try {
    const sleeps = await client.getSleeps(timeRange);
    for (const sleep of sleeps) {
      try {
        const data = transformSleep(sleep);
        await ctx.runMutation(publicApi.public.ingestSleep, {
          connectionId,
          userId,
          ...data,
        } as never);
        synced.sleep++;
      } catch (err) {
        errors.push({
          type: "sleep",
          id: sleep.summaryId ?? sleep.calendarDate ?? "unknown",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } catch (err) {
    errors.push({
      type: "sleep",
      id: "fetch",
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // ── Body ────────────────────────────────────────────────────────────────
  try {
    const bodyComps = await client.getBodyCompositions(timeRange);
    for (const body of bodyComps) {
      try {
        const data = transformBody(body);
        await ctx.runMutation(publicApi.public.ingestBody, {
          connectionId,
          userId,
          ...data,
        } as never);
        synced.body++;
      } catch (err) {
        errors.push({
          type: "body",
          id: body.summaryId ?? String(body.measurementTimeInSeconds),
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } catch (err) {
    errors.push({
      type: "body",
      id: "fetch",
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // ── Menstruation ────────────────────────────────────────────────────────
  try {
    const records = await client.getMenstrualCycleData(timeRange);
    for (const record of records) {
      try {
        const data = transformMenstruation(record);
        await ctx.runMutation(publicApi.public.ingestMenstruation, {
          connectionId,
          userId,
          ...data,
        } as never);
        synced.menstruation++;
      } catch (err) {
        errors.push({
          type: "menstruation",
          id: record.summaryId ?? record.periodStartDate ?? "unknown",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } catch (err) {
    errors.push({
      type: "menstruation",
      id: "fetch",
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // ── Blood Pressures (→ body) ───────────────────────────────────────────
  try {
    const bpRecords = await client.getBloodPressures(timeRange);
    for (const bp of bpRecords) {
      try {
        const data = transformBloodPressure(bp);
        await ctx.runMutation(publicApi.public.ingestBody, {
          connectionId, userId, ...data,
        } as never);
        synced.bloodPressures++;
      } catch (err) {
        errors.push({
          type: "bloodPressure",
          id: bp.summaryId ?? String(bp.measurementTimeInSeconds),
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } catch (err) {
    errors.push({ type: "bloodPressure", id: "fetch", error: err instanceof Error ? err.message : String(err) });
  }

  // ── Skin Temperature (→ body) ──────────────────────────────────────────
  try {
    const skinRecords = await client.getSkinTemperature(timeRange);
    for (const skin of skinRecords) {
      try {
        const data = transformSkinTemp(skin);
        await ctx.runMutation(publicApi.public.ingestBody, {
          connectionId, userId, ...data,
        } as never);
        synced.skinTemp++;
      } catch (err) {
        errors.push({
          type: "skinTemp",
          id: skin.summaryId ?? skin.calendarDate ?? "unknown",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } catch (err) {
    errors.push({ type: "skinTemp", id: "fetch", error: err instanceof Error ? err.message : String(err) });
  }

  // ── User Metrics (→ body) ──────────────────────────────────────────────
  try {
    const metricsRecords = await client.getUserMetrics(timeRange);
    for (const metrics of metricsRecords) {
      try {
        const data = transformUserMetrics(metrics);
        await ctx.runMutation(publicApi.public.ingestBody, {
          connectionId, userId, ...data,
        } as never);
        synced.userMetrics++;
      } catch (err) {
        errors.push({
          type: "userMetrics",
          id: metrics.summaryId ?? metrics.calendarDate ?? "unknown",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } catch (err) {
    errors.push({ type: "userMetrics", id: "fetch", error: err instanceof Error ? err.message : String(err) });
  }

  // ── HRV (enriches daily) ──────────────────────────────────────────────
  try {
    const hrvRecords = await client.getHRV(timeRange);
    for (const hrv of hrvRecords) {
      try {
        const data = transformHRV(hrv);
        if (data.heart_rate_data) {
          await ctx.runMutation(publicApi.public.ingestDaily, {
            connectionId, userId,
            metadata: {
              start_time: new Date((hrv.startTimeInSeconds ?? 0) * 1000).toISOString(),
              end_time: new Date(((hrv.startTimeInSeconds ?? 0) + (hrv.durationInSeconds ?? 86400)) * 1000).toISOString(),
              upload_type: 1,
            },
            heart_rate_data: data.heart_rate_data,
          } as never);
          synced.hrv++;
        }
      } catch (err) {
        errors.push({
          type: "hrv",
          id: hrv.summaryId ?? hrv.calendarDate ?? "unknown",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } catch (err) {
    errors.push({ type: "hrv", id: "fetch", error: err instanceof Error ? err.message : String(err) });
  }

  // ── Stress Details (enriches daily) ────────────────────────────────────
  try {
    const stressRecords = await client.getStressDetails(timeRange);
    for (const stress of stressRecords) {
      try {
        const data = transformStressDetails(stress);
        if (data.stress_data) {
          await ctx.runMutation(publicApi.public.ingestDaily, {
            connectionId, userId,
            metadata: {
              start_time: new Date((stress.startTimeInSeconds ?? 0) * 1000).toISOString(),
              end_time: new Date(((stress.startTimeInSeconds ?? 0) + (stress.durationInSeconds ?? 86400)) * 1000).toISOString(),
              upload_type: 1,
            },
            stress_data: data.stress_data,
          } as never);
          synced.stressDetails++;
        }
      } catch (err) {
        errors.push({
          type: "stressDetails",
          id: stress.summaryId ?? stress.calendarDate ?? "unknown",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } catch (err) {
    errors.push({ type: "stressDetails", id: "fetch", error: err instanceof Error ? err.message : String(err) });
  }

  // ── Pulse Ox (enriches daily) ──────────────────────────────────────────
  try {
    const pulseOxRecords = await client.getPulseOx(timeRange);
    for (const po of pulseOxRecords) {
      try {
        const data = transformPulseOx(po);
        if (data.oxygen_data) {
          await ctx.runMutation(publicApi.public.ingestDaily, {
            connectionId, userId,
            metadata: {
              start_time: new Date((po.startTimeInSeconds ?? 0) * 1000).toISOString(),
              end_time: new Date(((po.startTimeInSeconds ?? 0) + (po.durationInSeconds ?? 86400)) * 1000).toISOString(),
              upload_type: 1,
            },
            oxygen_data: data.oxygen_data,
          } as never);
          synced.pulseOx++;
        }
      } catch (err) {
        errors.push({
          type: "pulseOx",
          id: po.summaryId ?? po.calendarDate ?? "unknown",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } catch (err) {
    errors.push({ type: "pulseOx", id: "fetch", error: err instanceof Error ? err.message : String(err) });
  }

  // ── Respiration (enriches daily) ───────────────────────────────────────
  try {
    const respRecords = await client.getRespiration(timeRange);
    for (const resp of respRecords) {
      try {
        const data = transformRespiration(resp);
        if (data.respiration_data) {
          await ctx.runMutation(publicApi.public.ingestDaily, {
            connectionId, userId,
            metadata: {
              start_time: new Date((resp.startTimeInSeconds ?? 0) * 1000).toISOString(),
              end_time: new Date(((resp.startTimeInSeconds ?? 0) + (resp.durationInSeconds ?? 86400)) * 1000).toISOString(),
              upload_type: 1,
            },
            respiration_data: data.respiration_data,
          } as never);
          synced.respiration++;
        }
      } catch (err) {
        errors.push({
          type: "respiration",
          id: resp.summaryId ?? "unknown",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } catch (err) {
    errors.push({ type: "respiration", id: "fetch", error: err instanceof Error ? err.message : String(err) });
  }

  return { synced, errors };
}

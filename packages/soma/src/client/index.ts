import type { ComponentApi } from "../component/_generated/component.js";
import type { ActionCtx, MutationCtx, QueryCtx } from "./types.js";
import { httpActionGeneric, type HttpRouter } from "convex/server";
import { buildAuthUrl } from "../strava/auth.js";

export type SomaComponent = ComponentApi;

// ─── Default OAuth Callback Paths ────────────────────────────────────────────
// Used by `registerRoutes` as defaults. Override per-provider in the opts.

export const STRAVA_CALLBACK_PATH = "/api/strava/callback";
export const GARMIN_CALLBACK_PATH = "/api/garmin/callback";
export const GARMIN_WEBHOOK_BASE_PATH = "/api/garmin/webhook";

/**
 * Configuration for the Strava integration.
 *
 * If not provided to the constructor, the Soma class will attempt to
 * read `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, and `STRAVA_BASE_URL`
 * from environment variables automatically.
 */
export interface SomaStravaConfig {
  /** Your Strava application's Client ID. */
  clientId: string;
  /** Your Strava application's Client Secret. */
  clientSecret: string;
  /**
   * Base URL of the Strava API (without `/api/v3` suffix).
   * Defaults to `https://www.strava.com`.
   * Override to point at a mock server during development.
   */
  baseUrl?: string;
}

/**
 * Configuration for the Garmin integration.
 *
 * If not provided to the constructor, the Soma class will attempt to
 * read `GARMIN_CLIENT_ID` and `GARMIN_CLIENT_SECRET` from
 * environment variables automatically.
 */
export interface SomaGarminConfig {
  /** Your Garmin application's Client ID. */
  clientId: string;
  /** Your Garmin application's Client Secret. */
  clientSecret: string;
}

/**
 * Client class for the @nativesquare/soma Convex component.
 *
 * Provides a type-safe interface for managing wearable provider connections
 * and querying normalized health & fitness data.
 *
 * All capabilities are also accessible via direct component function calls:
 * `ctx.runMutation(components.soma.public.connect, { userId, provider: "GARMIN" })`
 *
 * @example
 * ```ts
 * // In your Convex function file:
 * import { Soma } from "@nativesquare/soma";
 * import { components } from "./_generated/api";
 *
 * // Zero config if env vars are set in Convex dashboard:
 * //   STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_BASE_URL (optional)
 * const soma = new Soma(components.soma);
 *
 * // Or with explicit Strava config:
 * // const soma = new Soma(components.soma, {
 * //   strava: { clientId: "...", clientSecret: "...", baseUrl: "..." },
 * // });
 *
 * // Connect a user to a provider:
 * const connectionId = await soma.connect(ctx, {
 *   userId: "user_123",
 *   provider: "GARMIN",
 * });
 *
 * // Connect via Strava (handles OAuth, token storage, and initial sync):
 * const result = await soma.connectStrava(ctx, { userId: "user_123", code: "..." });
 * ```
 */
export class Soma {
  private stravaConfig?: SomaStravaConfig;
  private garminConfig?: SomaGarminConfig;

  constructor(
    public component: SomaComponent,
    options?: { strava?: SomaStravaConfig; garmin?: SomaGarminConfig },
  ) {
    this.stravaConfig = options?.strava ?? this.readStravaEnv();
    this.garminConfig = options?.garmin ?? this.readGarminEnv();
  }

  /**
   * Read Strava config from environment variables.
   * Returns undefined if the required vars are not set.
   */
  private readStravaEnv(): SomaStravaConfig | undefined {
    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;
    if (!clientId || !clientSecret) return undefined;
    return {
      clientId,
      clientSecret,
      baseUrl: process.env.STRAVA_BASE_URL,
    };
  }

  /**
   * Get the resolved Strava config, or throw a clear error if not configured.
   */
  private requireStravaConfig(): SomaStravaConfig {
    if (!this.stravaConfig) {
      throw new Error(
        "Strava is not configured. Either set STRAVA_CLIENT_ID and " +
        "STRAVA_CLIENT_SECRET environment variables in the Convex dashboard, " +
        "or pass { strava: { clientId, clientSecret } } to the Soma constructor.",
      );
    }
    return this.stravaConfig;
  }

  /**
   * Read Garmin config from environment variables.
   * Returns undefined if the required vars are not set.
   */
  private readGarminEnv(): SomaGarminConfig | undefined {
    const clientId = process.env.GARMIN_CLIENT_ID;
    const clientSecret = process.env.GARMIN_CLIENT_SECRET;
    if (!clientId || !clientSecret) return undefined;
    return { clientId, clientSecret };
  }

  /**
   * Get the resolved Garmin config, or throw a clear error if not configured.
   */
  private requireGarminConfig(): SomaGarminConfig {
    if (!this.garminConfig) {
      throw new Error(
        "Garmin is not configured. Either set GARMIN_CLIENT_ID and " +
        "GARMIN_CLIENT_SECRET environment variables in the Convex dashboard, " +
        "or pass { garmin: { clientId, clientSecret } } to the Soma constructor.",
      );
    }
    return this.garminConfig;
  }

  // ─── Connect / Disconnect ───────────────────────────────────────────────────

  /**
   * Connect a user to a wearable provider.
   *
   * Creates the connection if it doesn't exist, or re-activates it if it was
   * previously disconnected. Idempotent — calling twice is a no-op.
   *
   * Use this when the host app has completed the provider's auth flow and
   * wants to register the connection in Soma.
   *
   * @param ctx - Mutation context from the host app
   * @param args.userId - The host app's user identifier (Clerk ID, etc.)
   * @param args.provider - The wearable provider name ("GARMIN", "FITBIT", "OURA", etc.)
   * @returns The connection document ID
   *
   * @example
   * ```ts
   * // "Connect to Garmin" button handler
   * const connectionId = await soma.connect(ctx, {
   *   userId: "user_123",
   *   provider: "GARMIN",
   * });
   * ```
   */
  async connect(
    ctx: MutationCtx,
    args: { userId: string; provider: string },
  ): Promise<string> {
    return await ctx.runMutation(this.component.public.connect, args);
  }

  /**
   * Disconnect a user from a wearable provider.
   *
   * Sets the connection to inactive. Does not delete any synced data,
   * so re-connecting later preserves historical records.
   *
   * @param ctx - Mutation context from the host app
   * @param args.userId - The host app's user identifier
   * @param args.provider - The wearable provider name
   *
   * @throws Error if no connection exists for the given user–provider pair
   *
   * @example
   * ```ts
   * // "Disconnect Garmin" button handler
   * await soma.disconnect(ctx, {
   *   userId: "user_123",
   *   provider: "GARMIN",
   * });
   * ```
   */
  async disconnect(
    ctx: MutationCtx,
    args: { userId: string; provider: string },
  ): Promise<null> {
    return await ctx.runMutation(this.component.public.disconnect, args);
  }

  // ─── Connection Queries ─────────────────────────────────────────────────────

  /**
   * Get a connection by its document ID.
   *
   * @param ctx - Query context from the host app
   * @param args.connectionId - The connection document ID
   * @returns The connection document, or null if not found
   */
  async getConnection(
    ctx: QueryCtx,
    args: { connectionId: string },
  ) {
    return await ctx.runQuery(this.component.public.getConnection, args);
  }

  /**
   * Get the connection for a specific user–provider pair.
   *
   * Useful for checking whether a user is connected to a specific provider
   * (e.g., rendering a "Connected" badge on a provider card).
   *
   * @param ctx - Query context from the host app
   * @param args.userId - The host app's user identifier
   * @param args.provider - The wearable provider name
   * @returns The connection document, or null if never connected
   *
   * @example
   * ```ts
   * const garmin = await soma.getConnectionByProvider(ctx, {
   *   userId: "user_123",
   *   provider: "GARMIN",
   * });
   * const isConnected = garmin?.active === true;
   * ```
   */
  async getConnectionByProvider(
    ctx: QueryCtx,
    args: { userId: string; provider: string },
  ) {
    return await ctx.runQuery(
      this.component.public.getConnectionByProvider,
      args,
    );
  }

  /**
   * List all connections for a user (active and inactive).
   *
   * @param ctx - Query context from the host app
   * @param args.userId - The host app's user identifier
   * @returns Array of connection documents
   *
   * @example
   * ```ts
   * const connections = await soma.listConnections(ctx, { userId: "user_123" });
   * const activeProviders = connections
   *   .filter(c => c.active)
   *   .map(c => c.provider);
   * ```
   */
  async listConnections(
    ctx: QueryCtx,
    args: { userId: string },
  ) {
    return await ctx.runQuery(this.component.public.listConnections, args);
  }

  // ─── Connection Mutations ───────────────────────────────────────────────────

  /**
   * Update a connection's mutable fields.
   *
   * @param ctx - Mutation context from the host app
   * @param args.connectionId - The connection document ID
   * @param args.active - Optional new active status
   * @param args.lastDataUpdate - Optional ISO-8601 timestamp of last data sync
   *
   * @throws Error if the connection does not exist
   */
  async updateConnection(
    ctx: MutationCtx,
    args: {
      connectionId: string;
      active?: boolean;
      lastDataUpdate?: string;
    },
  ): Promise<null> {
    return await ctx.runMutation(
      this.component.public.updateConnection,
      args,
    );
  }

  /**
   * Delete a connection record entirely.
   *
   * This is a hard delete — the connection row is removed.
   * Synced health data linked to this connection is NOT cascade-deleted.
   *
   * @param ctx - Mutation context from the host app
   * @param args.connectionId - The connection document ID
   *
   * @throws Error if the connection does not exist
   */
  async deleteConnection(
    ctx: MutationCtx,
    args: { connectionId: string },
  ): Promise<null> {
    return await ctx.runMutation(
      this.component.public.deleteConnection,
      args,
    );
  }

  // ─── Data Ingestion ─────────────────────────────────────────────────────────
  // Store normalized health data into Soma with automatic deduplication.
  // Use with transformer functions from @nativesquare/soma/healthkit:
  //
  //   import { transformWorkout } from "@nativesquare/soma/healthkit";
  //   const data = transformWorkout(hkWorkout);
  //   await soma.ingestActivity(ctx, { connectionId, userId, ...data });

  /**
   * Ingest an activity (workout) record.
   *
   * Upserts by `connectionId + metadata.summary_id` — re-ingesting the same
   * workout updates the existing record rather than creating a duplicate.
   *
   * @param ctx - Mutation context from the host app
   * @param args - Activity data including connectionId, userId, metadata, and all activity fields
   * @returns The activity document ID
   *
   * @example
   * ```ts
   * import { transformWorkout } from "@nativesquare/soma/healthkit";
   * const data = transformWorkout(hkWorkout);
   * const id = await soma.ingestActivity(ctx, { connectionId, userId, ...data });
   * ```
   */
  async ingestActivity(
    ctx: MutationCtx,
    args: IngestArgs,
  ): Promise<string> {
    return await ctx.runMutation(
      this.component.public.ingestActivity,
      args as never,
    );
  }

  /**
   * Ingest a sleep session record.
   *
   * Upserts by `connectionId + metadata.summary_id`.
   *
   * @param ctx - Mutation context from the host app
   * @param args - Sleep data including connectionId, userId, metadata, and all sleep fields
   * @returns The sleep document ID
   */
  async ingestSleep(
    ctx: MutationCtx,
    args: IngestArgs,
  ): Promise<string> {
    return await ctx.runMutation(
      this.component.public.ingestSleep,
      args as never,
    );
  }

  /**
   * Ingest a body metrics record.
   *
   * Upserts by `connectionId + metadata.start_time + metadata.end_time`.
   *
   * @param ctx - Mutation context from the host app
   * @param args - Body data including connectionId, userId, metadata, and all body fields
   * @returns The body document ID
   */
  async ingestBody(
    ctx: MutationCtx,
    args: IngestArgs,
  ): Promise<string> {
    return await ctx.runMutation(
      this.component.public.ingestBody,
      args as never,
    );
  }

  /**
   * Ingest a daily activity summary record.
   *
   * Upserts by `connectionId + metadata.start_time + metadata.end_time`.
   *
   * @param ctx - Mutation context from the host app
   * @param args - Daily data including connectionId, userId, metadata, and all daily fields
   * @returns The daily document ID
   */
  async ingestDaily(
    ctx: MutationCtx,
    args: IngestArgs,
  ): Promise<string> {
    return await ctx.runMutation(
      this.component.public.ingestDaily,
      args as never,
    );
  }

  /**
   * Ingest a nutrition record.
   *
   * Upserts by `connectionId + metadata.start_time + metadata.end_time`.
   *
   * @param ctx - Mutation context from the host app
   * @param args - Nutrition data including connectionId, userId, metadata, and all nutrition fields
   * @returns The nutrition document ID
   */
  async ingestNutrition(
    ctx: MutationCtx,
    args: IngestArgs,
  ): Promise<string> {
    return await ctx.runMutation(
      this.component.public.ingestNutrition,
      args as never,
    );
  }

  /**
   * Ingest a menstruation record.
   *
   * Append-only — each call creates a new document.
   *
   * @param ctx - Mutation context from the host app
   * @param args - Menstruation data including connectionId, userId, metadata, and menstruation fields
   * @returns The menstruation document ID
   */
  async ingestMenstruation(
    ctx: MutationCtx,
    args: IngestArgs,
  ): Promise<string> {
    return await ctx.runMutation(
      this.component.public.ingestMenstruation,
      args as never,
    );
  }

  /**
   * Ingest an athlete (user profile) record.
   *
   * Upserts by `connectionId` — one athlete record per connection.
   *
   * @param ctx - Mutation context from the host app
   * @param args - Athlete data including connectionId, userId, and profile fields
   * @returns The athlete document ID
   */
  async ingestAthlete(
    ctx: MutationCtx,
    args: IngestArgs,
  ): Promise<string> {
    return await ctx.runMutation(
      this.component.public.ingestAthlete,
      args as never,
    );
  }

  // ─── Data Queries ──────────────────────────────────────────────────────────
  // Read normalized health data from Soma with optional time-range filtering.
  //
  // Each table exposes a list (collect-all) and paginate (cursor-based) method.
  // Time-range filtering uses ISO-8601 strings on metadata.start_time.
  //
  //   // Last 7 days of activities:
  //   const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  //   const activities = await soma.listActivities(ctx, {
  //     userId: "user_123",
  //     startTime: since,
  //   });

  // ── Activities ────────────────────────────────────────────────────────────

  /**
   * List activity records for a user, optionally filtered by time range.
   *
   * @param ctx - Query context from the host app
   * @param args.userId - The host app's user identifier
   * @param args.startTime - Optional ISO-8601 lower bound (inclusive) on metadata.start_time
   * @param args.endTime - Optional ISO-8601 upper bound (inclusive) on metadata.start_time
   * @param args.order - Sort order: "asc" or "desc" (default: "desc", newest first)
   * @param args.limit - Optional max number of results to return
   *
   * @example
   * ```ts
   * // All activities for a user (newest first):
   * const all = await soma.listActivities(ctx, { userId: "user_123" });
   *
   * // Last 7 days:
   * const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
   * const recent = await soma.listActivities(ctx, {
   *   userId: "user_123",
   *   startTime: since,
   * });
   * ```
   */
  async listActivities(
    ctx: QueryCtx,
    args: ListTimeRangeArgs,
  ) {
    return await ctx.runQuery(this.component.public.listActivities, args);
  }

  /**
   * Paginate activity records for a user, optionally filtered by time range.
   *
   * Returns `{ page, isDone, continueCursor }` for cursor-based pagination.
   *
   * @param ctx - Query context from the host app
   * @param args.userId - The host app's user identifier
   * @param args.startTime - Optional ISO-8601 lower bound (inclusive)
   * @param args.endTime - Optional ISO-8601 upper bound (inclusive)
   * @param args.paginationOpts - Convex pagination options `{ numItems, cursor }`
   */
  async paginateActivities(
    ctx: QueryCtx,
    args: PaginateTimeRangeArgs,
  ) {
    return await ctx.runQuery(this.component.public.paginateActivities, args);
  }

  // ── Sleep ─────────────────────────────────────────────────────────────────

  /**
   * List sleep records for a user, optionally filtered by time range.
   *
   * @param ctx - Query context from the host app
   * @param args.userId - The host app's user identifier
   * @param args.startTime - Optional ISO-8601 lower bound (inclusive)
   * @param args.endTime - Optional ISO-8601 upper bound (inclusive)
   * @param args.order - Sort order: "asc" or "desc" (default: "desc")
   * @param args.limit - Optional max number of results
   */
  async listSleep(
    ctx: QueryCtx,
    args: ListTimeRangeArgs,
  ) {
    return await ctx.runQuery(this.component.public.listSleep, args);
  }

  /**
   * Paginate sleep records for a user, optionally filtered by time range.
   *
   * Returns `{ page, isDone, continueCursor }` for cursor-based pagination.
   */
  async paginateSleep(
    ctx: QueryCtx,
    args: PaginateTimeRangeArgs,
  ) {
    return await ctx.runQuery(this.component.public.paginateSleep, args);
  }

  // ── Body ──────────────────────────────────────────────────────────────────

  /**
   * List body metrics records for a user, optionally filtered by time range.
   *
   * @param ctx - Query context from the host app
   * @param args.userId - The host app's user identifier
   * @param args.startTime - Optional ISO-8601 lower bound (inclusive)
   * @param args.endTime - Optional ISO-8601 upper bound (inclusive)
   * @param args.order - Sort order: "asc" or "desc" (default: "desc")
   * @param args.limit - Optional max number of results
   */
  async listBody(
    ctx: QueryCtx,
    args: ListTimeRangeArgs,
  ) {
    return await ctx.runQuery(this.component.public.listBody, args);
  }

  /**
   * Paginate body metrics records for a user, optionally filtered by time range.
   *
   * Returns `{ page, isDone, continueCursor }` for cursor-based pagination.
   */
  async paginateBody(
    ctx: QueryCtx,
    args: PaginateTimeRangeArgs,
  ) {
    return await ctx.runQuery(this.component.public.paginateBody, args);
  }

  // ── Daily ─────────────────────────────────────────────────────────────────

  /**
   * List daily activity summary records for a user, optionally filtered by time range.
   *
   * @param ctx - Query context from the host app
   * @param args.userId - The host app's user identifier
   * @param args.startTime - Optional ISO-8601 lower bound (inclusive)
   * @param args.endTime - Optional ISO-8601 upper bound (inclusive)
   * @param args.order - Sort order: "asc" or "desc" (default: "desc")
   * @param args.limit - Optional max number of results
   */
  async listDaily(
    ctx: QueryCtx,
    args: ListTimeRangeArgs,
  ) {
    return await ctx.runQuery(this.component.public.listDaily, args);
  }

  /**
   * Paginate daily activity summary records for a user, optionally filtered by time range.
   *
   * Returns `{ page, isDone, continueCursor }` for cursor-based pagination.
   */
  async paginateDaily(
    ctx: QueryCtx,
    args: PaginateTimeRangeArgs,
  ) {
    return await ctx.runQuery(this.component.public.paginateDaily, args);
  }

  // ── Nutrition ─────────────────────────────────────────────────────────────

  /**
   * List nutrition records for a user, optionally filtered by time range.
   *
   * @param ctx - Query context from the host app
   * @param args.userId - The host app's user identifier
   * @param args.startTime - Optional ISO-8601 lower bound (inclusive)
   * @param args.endTime - Optional ISO-8601 upper bound (inclusive)
   * @param args.order - Sort order: "asc" or "desc" (default: "desc")
   * @param args.limit - Optional max number of results
   */
  async listNutrition(
    ctx: QueryCtx,
    args: ListTimeRangeArgs,
  ) {
    return await ctx.runQuery(this.component.public.listNutrition, args);
  }

  /**
   * Paginate nutrition records for a user, optionally filtered by time range.
   *
   * Returns `{ page, isDone, continueCursor }` for cursor-based pagination.
   */
  async paginateNutrition(
    ctx: QueryCtx,
    args: PaginateTimeRangeArgs,
  ) {
    return await ctx.runQuery(this.component.public.paginateNutrition, args);
  }

  // ── Menstruation ──────────────────────────────────────────────────────────

  /**
   * List menstruation records for a user, optionally filtered by time range.
   *
   * @param ctx - Query context from the host app
   * @param args.userId - The host app's user identifier
   * @param args.startTime - Optional ISO-8601 lower bound (inclusive)
   * @param args.endTime - Optional ISO-8601 upper bound (inclusive)
   * @param args.order - Sort order: "asc" or "desc" (default: "desc")
   * @param args.limit - Optional max number of results
   */
  async listMenstruation(
    ctx: QueryCtx,
    args: ListTimeRangeArgs,
  ) {
    return await ctx.runQuery(
      this.component.public.listMenstruation,
      args,
    );
  }

  /**
   * Paginate menstruation records for a user, optionally filtered by time range.
   *
   * Returns `{ page, isDone, continueCursor }` for cursor-based pagination.
   */
  async paginateMenstruation(
    ctx: QueryCtx,
    args: PaginateTimeRangeArgs,
  ) {
    return await ctx.runQuery(
      this.component.public.paginateMenstruation,
      args,
    );
  }

  // ── Athletes ──────────────────────────────────────────────────────────────

  /**
   * List all athlete profiles for a user.
   *
   * Athletes are one-per-connection, so the result set is typically small.
   *
   * @param ctx - Query context from the host app
   * @param args.userId - The host app's user identifier
   */
  async listAthletes(
    ctx: QueryCtx,
    args: { userId: string },
  ) {
    return await ctx.runQuery(this.component.public.listAthletes, args);
  }

  /**
   * Get the athlete profile for a specific connection.
   *
   * Returns null if no athlete record exists for this connection.
   *
   * @param ctx - Query context from the host app
   * @param args.connectionId - The connection document ID
   */
  async getAthlete(
    ctx: QueryCtx,
    args: { connectionId: string },
  ) {
    return await ctx.runQuery(this.component.public.getAthlete, args);
  }

  // ── Planned Workouts ────────────────────────────────────────────────────────

  /**
   * Ingest a planned workout record.
   *
   * Upserts by `connectionId + metadata.id` when an id is present.
   *
   * @param ctx - Mutation context from the host app
   * @param args - Planned workout data including connectionId, userId, metadata, and steps
   * @returns The planned workout document ID
   */
  async ingestPlannedWorkout(
    ctx: MutationCtx,
    args: IngestArgs,
  ): Promise<string> {
    return await ctx.runMutation(
      this.component.public.ingestPlannedWorkout,
      args as never,
    );
  }

  /**
   * List planned workout records for a user, optionally filtered by planned date range.
   *
   * @param ctx - Query context from the host app
   * @param args.userId - The host app's user identifier
   * @param args.startDate - Optional lower bound (inclusive) on metadata.planned_date (YYYY-MM-DD)
   * @param args.endDate - Optional upper bound (inclusive) on metadata.planned_date (YYYY-MM-DD)
   * @param args.order - Sort order: "asc" or "desc" (default: "desc")
   * @param args.limit - Optional max number of results to return
   */
  async listPlannedWorkouts(
    ctx: QueryCtx,
    args: {
      userId: string;
      startDate?: string;
      endDate?: string;
      order?: "asc" | "desc";
      limit?: number;
    },
  ) {
    return await ctx.runQuery(
      this.component.public.listPlannedWorkouts,
      args,
    );
  }

  /**
   * Paginate planned workout records for a user, optionally filtered by planned date range.
   *
   * Returns `{ page, isDone, continueCursor }` for cursor-based pagination.
   *
   * @param ctx - Query context from the host app
   * @param args.userId - The host app's user identifier
   * @param args.startDate - Optional lower bound (inclusive) on metadata.planned_date
   * @param args.endDate - Optional upper bound (inclusive) on metadata.planned_date
   * @param args.paginationOpts - Convex pagination options `{ numItems, cursor }`
   */
  async paginatePlannedWorkouts(
    ctx: QueryCtx,
    args: {
      userId: string;
      startDate?: string;
      endDate?: string;
      paginationOpts: { numItems: number; cursor: string | null };
    },
  ) {
    return await ctx.runQuery(
      this.component.public.paginatePlannedWorkouts,
      args,
    );
  }

  /**
   * Delete a planned workout by document ID.
   *
   * @param ctx - Mutation context from the host app
   * @param args.plannedWorkoutId - The planned workout document ID
   */
  async deletePlannedWorkout(
    ctx: MutationCtx,
    args: { plannedWorkoutId: string },
  ) {
    return await ctx.runMutation(
      this.component.public.deletePlannedWorkout,
      args as never,
    );
  }

  /**
   * Get a single planned workout by document ID.
   *
   * @param ctx - Query context from the host app
   * @param args.plannedWorkoutId - The planned workout document ID
   */
  async getPlannedWorkout(
    ctx: QueryCtx,
    args: { plannedWorkoutId: string },
  ) {
    return await ctx.runQuery(
      this.component.public.getPlannedWorkout,
      args as never,
    );
  }

  /**
   * Push a planned workout to Garmin Connect.
   *
   * Creates the workout on Garmin's Training API and optionally schedules it
   * to the user's calendar if `metadata.planned_date` is set. The workout
   * will appear on the user's Garmin device after they sync.
   *
   * @param ctx - Action context from the host app
   * @param args.userId - The host app's user identifier
   * @param args.plannedWorkoutId - The Soma planned workout document ID
   * @param args.workoutProvider - Name shown to user in Garmin Connect (default: "Soma", 20 chars max)
   * @returns `{ garminWorkoutId, garminScheduleId }`
   *
   * @example
   * ```ts
   * export const pushWorkout = action({
   *   args: { userId: v.string(), workoutId: v.string() },
   *   handler: async (ctx, { userId, workoutId }) => {
   *     return await soma.pushPlannedWorkoutToGarmin(ctx, {
   *       userId,
   *       plannedWorkoutId: workoutId,
   *     });
   *   },
   * });
   * ```
   */
  async pushPlannedWorkoutToGarmin(
    ctx: ActionCtx,
    args: {
      userId: string;
      plannedWorkoutId: string;
      workoutProvider?: string;
    },
  ) {
    const config = this.requireGarminConfig();
    return await ctx.runAction(this.component.garmin.pushPlannedWorkout, {
      ...args,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    });
  }

  // ─── Strava Integration ──────────────────────────────────────────────────────
  // High-level methods that handle OAuth, token storage, and data syncing
  // for Strava. Requires Strava credentials to be configured either via
  // environment variables or the constructor.

  /**
   * Build the Strava OAuth authorization URL.
   *
   * This is a pure computation (no DB or HTTP calls), so it doesn't need
   * a Convex context. Redirect the user to this URL to begin the OAuth flow.
   *
   * @param opts.redirectUri - The URL Strava will redirect to after authorization
   * @param opts.scope - Comma-separated Strava OAuth scopes (default: "read,activity:read_all,profile:read_all")
   * @param opts.state - Optional state parameter for CSRF protection
   * @returns The authorization URL string
   *
   * @example
   * ```ts
   * const url = soma.getStravaAuthUrl({
   *   redirectUri: "https://your-app.com/api/strava/callback",
   * });
   * ```
   */
  getStravaAuthUrl(opts: {
    redirectUri: string;
    scope?: string;
    state?: string;
  }): string {
    const config = this.requireStravaConfig();
    return buildAuthUrl({
      clientId: config.clientId,
      redirectUri: opts.redirectUri,
      scope: opts.scope,
      state: opts.state,
      baseUrl: config.baseUrl,
    });
  }

  /**
   * Handle the Strava OAuth callback.
   *
   * Exchanges the authorization code for tokens, creates/reactivates the
   * Soma connection, stores tokens securely in the component, syncs the
   * athlete profile, and syncs all activities.
   *
   * Call this from your OAuth callback endpoint after receiving the `code`
   * query parameter from Strava.
   *
   * @param ctx - Action context from the host app
   * @param args.userId - The host app's user identifier
   * @param args.code - The authorization code from the OAuth callback
   * @param args.includeStreams - Fetch detailed streams per activity (default: false)
   * @returns `{ connectionId, synced, errors }`
   *
   * @example
   * ```ts
   * export const handleStravaCallback = action({
   *   args: { userId: v.string(), code: v.string() },
   *   handler: async (ctx, { userId, code }) => {
   *     return await soma.connectStrava(ctx, { userId, code });
   *   },
   * });
   * ```
   */
  async connectStrava(
    ctx: ActionCtx,
    args: { userId: string; code: string; includeStreams?: boolean },
  ) {
    const config = this.requireStravaConfig();
    return await ctx.runAction(this.component.strava.connectStrava, {
      ...args,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      baseUrl: config.baseUrl,
    });
  }

  /**
   * Sync activities from Strava for an already-connected user.
   *
   * Automatically refreshes the access token if expired. Fetches the
   * athlete profile and activities, transforms them, and ingests into Soma.
   *
   * @param ctx - Action context from the host app
   * @param args.userId - The host app's user identifier
   * @param args.includeStreams - Fetch detailed streams per activity (default: false)
   * @param args.after - Only sync activities after this Unix epoch timestamp (for incremental sync)
   * @returns `{ synced, errors }`
   *
   * @example
   * ```ts
   * export const syncStrava = action({
   *   args: { userId: v.string() },
   *   handler: async (ctx, { userId }) => {
   *     return await soma.syncStrava(ctx, { userId, includeStreams: true });
   *   },
   * });
   * ```
   */
  async syncStrava(
    ctx: ActionCtx,
    args: { userId: string; includeStreams?: boolean; after?: number },
  ) {
    const config = this.requireStravaConfig();
    return await ctx.runAction(this.component.strava.syncStrava, {
      ...args,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      baseUrl: config.baseUrl,
    });
  }

  /**
   * Disconnect a user from Strava.
   *
   * Revokes the token at Strava (best-effort), deletes stored tokens,
   * and sets the connection to inactive.
   *
   * @param ctx - Action context from the host app
   * @param args.userId - The host app's user identifier
   *
   * @example
   * ```ts
   * export const disconnectStrava = action({
   *   args: { userId: v.string() },
   *   handler: async (ctx, { userId }) => {
   *     await soma.disconnectStrava(ctx, { userId });
   *   },
   * });
   * ```
   */
  async disconnectStrava(
    ctx: ActionCtx,
    args: { userId: string },
  ) {
    const config = this.requireStravaConfig();
    return await ctx.runAction(this.component.strava.disconnectStrava, {
      ...args,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      baseUrl: config.baseUrl,
    });
  }

  // ─── Garmin Integration ──────────────────────────────────────────────────────
  // High-level methods that handle OAuth 2.0 PKCE, token storage, and data
  // syncing for Garmin. Requires Garmin credentials to be configured either
  // via environment variables or the constructor.

  /**
   * Generate a Garmin OAuth 2.0 authorization URL with PKCE.
   *
   * Returns the `authUrl` to redirect the user to, along with the `state`
   * and `codeVerifier` used for the PKCE flow.
   *
   * If `userId` is provided, the PKCE state is stored inside the component
   * automatically, and the callback handler registered by `registerRoutes`
   * will complete the flow without further host-app intervention. This is
   * the recommended approach.
   *
   * If `userId` is omitted, the host app must store the returned
   * `codeVerifier` itself and pass it to `connectGarmin` manually.
   *
   * @param ctx - Action context from the host app
   * @param opts.redirectUri - The URL Garmin will redirect to after authorization
   * @param opts.userId - The host app's user identifier (required for `registerRoutes` flow)
   * @returns `{ authUrl, state, codeVerifier }`
   *
   * @example
   * ```ts
   * const { authUrl } = await soma.getGarminAuthUrl(ctx, {
   *   userId: "user_123",
   *   redirectUri: "https://your-app.convex.site/api/garmin/callback",
   * });
   * // Redirect user to authUrl — the callback is handled automatically
   * ```
   */
  async getGarminAuthUrl(
    ctx: ActionCtx,
    opts: { redirectUri?: string; userId?: string },
  ) {
    const config = this.requireGarminConfig();
    return await ctx.runAction(this.component.garmin.getGarminAuthUrl, {
      clientId: config.clientId,
      redirectUri: opts.redirectUri,
      userId: opts.userId,
    });
  }

  /**
   * Handle the Garmin OAuth 2.0 callback (manual flow).
   *
   * Exchanges the authorization code for tokens, creates/reactivates the
   * Soma connection, stores tokens securely, and syncs the last 30 days
   * of all data types.
   *
   * Call this from your OAuth callback endpoint after receiving the `code`
   * query parameter from Garmin.
   *
   * @param ctx - Action context from the host app
   * @param args.userId - The host app's user identifier
   * @param args.code - The authorization code from the callback
   * @param args.codeVerifier - The PKCE code verifier from Step 1
   * @param args.redirectUri - The redirect URI used in the authorization request
   * @returns `{ connectionId, synced, errors }`
   *
   * @example
   * ```ts
   * export const handleGarminCallback = action({
   *   args: {
   *     userId: v.string(),
   *     code: v.string(),
   *     codeVerifier: v.string(),
   *   },
   *   handler: async (ctx, args) => {
   *     return await soma.connectGarmin(ctx, args);
   *   },
   * });
   * ```
   */
  async connectGarmin(
    ctx: ActionCtx,
    args: {
      userId: string;
      code: string;
      codeVerifier: string;
      redirectUri?: string;
    },
  ) {
    const config = this.requireGarminConfig();
    return await ctx.runAction(this.component.garmin.connectGarmin, {
      ...args,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    });
  }

  /**
   * Complete a Garmin OAuth 2.0 flow using stored pending state.
   *
   * This is called automatically by the `registerRoutes` callback handler.
   * It looks up the pending OAuth state stored during `getGarminAuthUrl`,
   * exchanges for tokens, creates the connection, and syncs data.
   *
   * @param ctx - Action context from the host app
   * @param args.code - The authorization code from the callback query params
   * @param args.state - The state parameter from the callback query params
   * @param args.redirectUri - The redirect URI used in the authorization request
   * @returns `{ connectionId, synced, errors }`
   */
  async completeGarminOAuth(
    ctx: ActionCtx,
    args: { code: string; state: string; redirectUri?: string },
  ) {
    const config = this.requireGarminConfig();
    return await ctx.runAction(this.component.garmin.completeGarminOAuth, {
      ...args,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    });
  }

  /**
   * Sync all data types from Garmin for an already-connected user.
   *
   * Fetches activities, dailies, sleep, body composition, and menstruation
   * data for the specified time range (defaults to last 30 days).
   * Automatically refreshes expired tokens.
   *
   * @param ctx - Action context from the host app
   * @param args.userId - The host app's user identifier
   * @param args.startTimeInSeconds - Optional start of time range (Unix epoch seconds)
   * @param args.endTimeInSeconds - Optional end of time range (Unix epoch seconds)
   * @returns `{ synced, errors }`
   *
   * @example
   * ```ts
   * export const syncGarmin = action({
   *   args: { userId: v.string() },
   *   handler: async (ctx, { userId }) => {
   *     return await soma.syncGarmin(ctx, { userId });
   *   },
   * });
   * ```
   */
  async syncGarmin(
    ctx: ActionCtx,
    args: {
      userId: string;
      startTimeInSeconds?: number;
      endTimeInSeconds?: number;
    },
  ) {
    const config = this.requireGarminConfig();
    return await ctx.runAction(this.component.garmin.syncGarmin, {
      ...args,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    });
  }

  /**
   * Disconnect a user from Garmin.
   *
   * Deregisters the user at Garmin (best-effort), deletes stored tokens,
   * and sets the connection to inactive.
   *
   * @param ctx - Action context from the host app
   * @param args.userId - The host app's user identifier
   *
   * @example
   * ```ts
   * export const disconnectGarmin = action({
   *   args: { userId: v.string() },
   *   handler: async (ctx, { userId }) => {
   *     await soma.disconnectGarmin(ctx, { userId });
   *   },
   * });
   * ```
   */
  async disconnectGarmin(
    ctx: ActionCtx,
    args: { userId: string },
  ) {
    return await ctx.runAction(this.component.garmin.disconnectGarmin, args);
  }

  // ── Garmin Webhook Handlers ──────────────────────────────────────────────
  // For host apps that handle webhook routes manually instead of using
  // registerRoutes. Pass the raw JSON body from the Garmin POST request.

  /**
   * Handle a Garmin activities webhook (push mode).
   *
   * @param ctx - Convex action context
   * @param payload - The raw JSON body from Garmin's POST (array of GarminActivity)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private get garminApi(): any { return this.component.garmin; }

  async handleGarminWebhookActivities(ctx: ActionCtx, payload: unknown) {
    return await ctx.runAction(
      this.garminApi.handleGarminWebhookActivities,
      { payload },
    );
  }

  /**
   * Handle a Garmin dailies webhook (push mode).
   */
  async handleGarminWebhookDailies(ctx: ActionCtx, payload: unknown) {
    return await ctx.runAction(
      this.garminApi.handleGarminWebhookDailies,
      { payload },
    );
  }

  /**
   * Handle a Garmin sleeps webhook (push mode).
   */
  async handleGarminWebhookSleeps(ctx: ActionCtx, payload: unknown) {
    return await ctx.runAction(
      this.garminApi.handleGarminWebhookSleeps,
      { payload },
    );
  }

  /**
   * Handle a Garmin body composition webhook (push mode).
   */
  async handleGarminWebhookBody(ctx: ActionCtx, payload: unknown) {
    return await ctx.runAction(
      this.garminApi.handleGarminWebhookBody,
      { payload },
    );
  }

  /**
   * Handle a Garmin menstrual cycle tracking webhook (push mode).
   */
  async handleGarminWebhookMenstruation(ctx: ActionCtx, payload: unknown) {
    return await ctx.runAction(
      this.garminApi.handleGarminWebhookMenstruation,
      { payload },
    );
  }

  /**
   * Handle a Garmin blood pressure webhook (push mode).
   */
  async handleGarminWebhookBloodPressures(ctx: ActionCtx, payload: unknown) {
    return await ctx.runAction(
      this.garminApi.handleGarminWebhookBloodPressures,
      { payload },
    );
  }

  /**
   * Handle a Garmin skin temperature webhook (push mode).
   */
  async handleGarminWebhookSkinTemp(ctx: ActionCtx, payload: unknown) {
    return await ctx.runAction(
      this.garminApi.handleGarminWebhookSkinTemp,
      { payload },
    );
  }

  /**
   * Handle a Garmin user metrics webhook (push mode).
   */
  async handleGarminWebhookUserMetrics(ctx: ActionCtx, payload: unknown) {
    return await ctx.runAction(
      this.garminApi.handleGarminWebhookUserMetrics,
      { payload },
    );
  }

  /**
   * Handle a Garmin HRV webhook (push mode).
   */
  async handleGarminWebhookHRV(ctx: ActionCtx, payload: unknown) {
    return await ctx.runAction(
      this.garminApi.handleGarminWebhookHRV,
      { payload },
    );
  }

  /**
   * Handle a Garmin stress details webhook (push mode).
   */
  async handleGarminWebhookStressDetails(ctx: ActionCtx, payload: unknown) {
    return await ctx.runAction(
      this.garminApi.handleGarminWebhookStressDetails,
      { payload },
    );
  }

  /**
   * Handle a Garmin pulse oximetry webhook (push mode).
   */
  async handleGarminWebhookPulseOx(ctx: ActionCtx, payload: unknown) {
    return await ctx.runAction(
      this.garminApi.handleGarminWebhookPulseOx,
      { payload },
    );
  }

  /**
   * Handle a Garmin respiration webhook (push mode).
   */
  async handleGarminWebhookRespiration(ctx: ActionCtx, payload: unknown) {
    return await ctx.runAction(
      this.garminApi.handleGarminWebhookRespiration,
      { payload },
    );
  }
}

// ─── Shared Types ────────────────────────────────────────────────────────────

/**
 * Common args shape for all ingestion methods.
 *
 * Requires `connectionId` and `userId` at minimum — additional fields
 * come from the transformer output (e.g., `metadata`, `calories_data`, etc.)
 * and are validated server-side by Convex validators.
 */
type IngestArgs = {
  connectionId: string;
  userId: string;
} & Record<string, unknown>;

/**
 * Base args for time-range filtered queries.
 *
 * - `userId` is required for all health data queries.
 * - `startTime` / `endTime` are optional ISO-8601 bounds on `metadata.start_time`.
 */
type TimeRangeArgs = {
  userId: string;
  startTime?: string;
  endTime?: string;
};

/**
 * Args for list (collect-all) queries with optional ordering and limit.
 */
type ListTimeRangeArgs = TimeRangeArgs & {
  order?: "asc" | "desc";
  limit?: number;
};

/**
 * Args for paginated queries with Convex pagination options.
 */
type PaginateTimeRangeArgs = TimeRangeArgs & {
  paginationOpts: { numItems: number; cursor: string | null };
};

// ─── Route Registration ──────────────────────────────────────────────────────

/**
 * Per-provider options for `registerRoutes`.
 */
export interface StravaRouteOptions {
  /** HTTP path for the OAuth callback. @default "/api/strava/callback" */
  path?: string;
  /** Override STRAVA_CLIENT_ID env var. */
  clientId?: string;
  /** Override STRAVA_CLIENT_SECRET env var. */
  clientSecret?: string;
  /** Override STRAVA_BASE_URL env var. */
  baseUrl?: string;
  /** URL to redirect the user to after a successful connection. */
  onSuccess?: string;
}

export interface GarminWebhookRouteOptions {
  /** Base path prefix for all webhook routes. @default "/api/garmin/webhook" */
  basePath?: string;
}

export interface GarminRouteOptions {
  /** HTTP path for the OAuth callback. @default "/api/garmin/callback" */
  path?: string;
  /** Override GARMIN_CLIENT_ID env var. */
  clientId?: string;
  /** Override GARMIN_CLIENT_SECRET env var. */
  clientSecret?: string;
  /** URL to redirect the user to after a successful connection. */
  onSuccess?: string;
  /** Webhook route configuration. Set to `false` to skip webhook registration. */
  webhook?: GarminWebhookRouteOptions | false;
}

export interface RegisterRoutesOptions {
  strava?: StravaRouteOptions;
  garmin?: GarminRouteOptions;
}

/**
 * Register OAuth callback HTTP routes for Soma providers.
 *
 * Call this from your `convex/http.ts` to set up the callback endpoints
 * that Strava and Garmin redirect to after user authorization. The handlers
 * complete the OAuth exchange, create the connection, and sync data
 * automatically.
 *
 * When called with no `opts`, registers both Strava and Garmin routes with
 * default paths and credentials from environment variables. When `opts` is
 * provided, only registers routes for the providers specified.
 *
 * @param http - The Convex HTTP router from `httpRouter()`
 * @param component - The Soma component reference (`components.soma`)
 * @param opts - Optional per-provider configuration
 *
 * @example
 * ```ts
 * // convex/http.ts
 * import { httpRouter } from "convex/server";
 * import { registerRoutes } from "@nativesquare/soma";
 * import { components } from "./_generated/api";
 *
 * const http = httpRouter();
 * registerRoutes(http, components.soma);
 * export default http;
 * ```
 *
 * @example
 * ```ts
 * // With custom paths and redirect
 * registerRoutes(http, components.soma, {
 *   strava: {
 *     path: "/oauth/strava/callback",
 *     onSuccess: "https://myapp.com/settings",
 *   },
 *   garmin: {
 *     path: "/oauth/garmin/callback",
 *     onSuccess: "https://myapp.com/settings",
 *   },
 * });
 * ```
 */
export function registerRoutes(
  http: HttpRouter,
  component: SomaComponent,
  opts?: RegisterRoutesOptions,
) {
  const registerAll = opts === undefined;

  if (registerAll || opts?.strava) {
    const strava = opts?.strava ?? {};
    const path = strava.path ?? STRAVA_CALLBACK_PATH;

    http.route({
      path,
      method: "GET",
      handler: httpActionGeneric(async (ctx, request) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const userId = url.searchParams.get("state");

        if (!code) {
          return new Response("Missing authorization code", { status: 400 });
        }
        if (!userId) {
          return new Response(
            "Missing state parameter (userId). Pass the userId as the state " +
              "parameter when building the Strava auth URL.",
            { status: 400 },
          );
        }

        const clientId =
          strava.clientId ?? process.env.STRAVA_CLIENT_ID;
        const clientSecret =
          strava.clientSecret ?? process.env.STRAVA_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
          return new Response(
            "Strava credentials not configured. Set STRAVA_CLIENT_ID and " +
              "STRAVA_CLIENT_SECRET environment variables, or pass them to registerRoutes.",
            { status: 500 },
          );
        }

        try {
          await ctx.runAction(component.strava.connectStrava, {
            userId,
            code,
            clientId,
            clientSecret,
            baseUrl: strava.baseUrl ?? process.env.STRAVA_BASE_URL,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          return new Response(`Strava OAuth callback failed: ${message}`, {
            status: 500,
          });
        }

        if (strava.onSuccess) {
          return new Response(null, {
            status: 302,
            headers: { Location: strava.onSuccess },
          });
        }

        return new Response("Successfully connected to Strava!", {
          status: 200,
        });
      }),
    });
  }

  if (registerAll || opts?.garmin) {
    const garmin = opts?.garmin ?? {};
    const path = garmin.path ?? GARMIN_CALLBACK_PATH;

    http.route({
      path,
      method: "GET",
      handler: httpActionGeneric(async (ctx, request) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");

        if (!code) {
          return new Response("Missing authorization code", {
            status: 400,
          });
        }
        if (!state) {
          return new Response(
            "Missing state parameter. Ensure the state was included " +
              "when building the Garmin auth URL.",
            { status: 400 },
          );
        }

        const clientId =
          garmin.clientId ?? process.env.GARMIN_CLIENT_ID;
        const clientSecret =
          garmin.clientSecret ?? process.env.GARMIN_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
          return new Response(
            "Garmin credentials not configured. Set GARMIN_CLIENT_ID and " +
              "GARMIN_CLIENT_SECRET environment variables, or pass them to registerRoutes.",
            { status: 500 },
          );
        }

        try {
          await ctx.runAction(component.garmin.completeGarminOAuth, {
            code,
            state,
            clientId,
            clientSecret,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          return new Response(`Garmin OAuth callback failed: ${message}`, {
            status: 500,
          });
        }

        if (garmin.onSuccess) {
          return new Response(null, {
            status: 302,
            headers: { Location: garmin.onSuccess },
          });
        }

        return new Response("Successfully connected to Garmin!", {
          status: 200,
        });
      }),
    });

    // ── Garmin Webhook Routes (Push Mode) ──────────────────────────────────
    if (garmin.webhook !== false) {
      const webhookBase =
        (garmin.webhook && garmin.webhook.basePath) ?? GARMIN_WEBHOOK_BASE_PATH;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const garminApi = component.garmin as any;
      const webhookRoutes: Array<{
        suffix: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        action: any;
      }> = [
        // ACTIVITY category
        { suffix: "/activities", action: garminApi.handleGarminWebhookActivities },
        { suffix: "/activity-details", action: garminApi.handleGarminWebhookActivities },
        { suffix: "/manually-updated-activities", action: garminApi.handleGarminWebhookActivities },
        { suffix: "/move-iq", action: garminApi.handleGarminWebhookActivities },
        // HEALTH category
        { suffix: "/dailies", action: garminApi.handleGarminWebhookDailies },
        { suffix: "/sleeps", action: garminApi.handleGarminWebhookSleeps },
        { suffix: "/hrv", action: garminApi.handleGarminWebhookHRV },
        { suffix: "/stress-details", action: garminApi.handleGarminWebhookStressDetails },
        { suffix: "/pulse-ox", action: garminApi.handleGarminWebhookPulseOx },
        { suffix: "/respiration", action: garminApi.handleGarminWebhookRespiration },
        // BODY category
        { suffix: "/body", action: garminApi.handleGarminWebhookBody },
        { suffix: "/blood-pressures", action: garminApi.handleGarminWebhookBloodPressures },
        { suffix: "/skin-temp", action: garminApi.handleGarminWebhookSkinTemp },
        { suffix: "/user-metrics", action: garminApi.handleGarminWebhookUserMetrics },
        // WOMEN_HEALTH category
        { suffix: "/menstruation", action: garminApi.handleGarminWebhookMenstruation },
      ];

      for (const route of webhookRoutes) {
        http.route({
          path: `${webhookBase}${route.suffix}`,
          method: "POST",
          handler: httpActionGeneric(async (ctx, request) => {
            let payload: unknown;
            try {
              payload = await request.json();
            } catch {
              return new Response("Invalid JSON body", { status: 400 });
            }

            try {
              await ctx.runAction(route.action, { payload });
            } catch (error) {
              // Log but return 200 to prevent Garmin from retrying
              console.error(
                `Garmin webhook error (${route.suffix}):`,
                error instanceof Error ? error.message : error,
              );
            }

            return new Response("OK", { status: 200 });
          }),
        });
      }
    }
  }
}

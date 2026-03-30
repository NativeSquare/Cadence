// ─── Strava Sync Helper ──────────────────────────────────────────────────────
// High-level function that combines the Strava client, transformers,
// and Soma ingestion into a single call. Designed to be used inside a
// Convex action.

import type { Soma } from "../client/index.js";
import type { ActionCtx } from "../client/types.js";
import type { StravaClient } from "./client.js";
import { transformActivity } from "./activity.js";
import { transformAthlete } from "./athlete.js";

export interface SyncActivitiesOptions {
  /** Authenticated Strava API client. */
  client: StravaClient;
  /** Soma component instance. */
  soma: Soma;
  /** Convex action context (has runMutation for ingestion). */
  ctx: ActionCtx;
  /** The Soma connection ID for this user–Strava link. */
  connectionId: string;
  /** The host app's user identifier (e.g., Clerk user ID). */
  userId: string;
  /**
   * Only sync activities after this Unix epoch timestamp (seconds).
   * Useful for incremental sync — pass the `lastDataUpdate` timestamp.
   */
  after?: number;
  /**
   * Only sync activities before this Unix epoch timestamp (seconds).
   */
  before?: number;
  /**
   * Fetch detailed streams (heart rate, power, position, etc.) for each
   * activity. Adds one API call per activity.
   * @default false
   */
  includeStreams?: boolean;
  /**
   * Fetch lap data for each activity. Adds one API call per activity
   * (unless the detailed activity already contains laps).
   * @default false
   */
  includeLaps?: boolean;
}

export interface SyncActivitiesResult {
  /** Number of activities successfully synced. */
  synced: number;
  /** Activity IDs that failed to sync (non-fatal). */
  errors: Array<{ activityId: number; error: string }>;
}

/**
 * Sync activities from Strava into Soma.
 *
 * This function handles the full flow:
 * 1. Lists activities from the Strava API (with auto-pagination)
 * 2. Optionally fetches detailed data, streams, and laps per activity
 * 3. Transforms each activity into the Soma schema
 * 4. Ingests each activity into Soma (with automatic deduplication)
 *
 * Designed to be called from a Convex action.
 *
 * @example
 * ```ts
 * import { StravaClient, syncActivities } from "@nativesquare/soma/strava";
 * import { Soma } from "@nativesquare/soma";
 *
 * export const syncStrava = internalAction({
 *   args: { userId: v.string(), connectionId: v.string(), accessToken: v.string() },
 *   handler: async (ctx, { userId, connectionId, accessToken }) => {
 *     const client = new StravaClient({ accessToken });
 *     const soma = new Soma(components.soma);
 *
 *     const result = await syncActivities({
 *       client,
 *       soma,
 *       ctx,
 *       connectionId,
 *       userId,
 *       includeStreams: true,
 *     });
 *
 *     console.log(`Synced ${result.synced} activities`);
 *   },
 * });
 * ```
 */
export async function syncActivities(
  opts: SyncActivitiesOptions,
): Promise<SyncActivitiesResult> {
  const {
    client,
    soma,
    ctx,
    connectionId,
    userId,
    after,
    before,
    includeStreams = false,
    includeLaps = false,
  } = opts;

  const summaries = await client.listAllActivities({
    after,
    before,
  });

  let synced = 0;
  const errors: SyncActivitiesResult["errors"] = [];

  for (const summary of summaries) {
    try {
      const detailed = await client.getActivity(summary.id);

      const streams = includeStreams
        ? await client.getActivityStreams(summary.id)
        : undefined;

      const laps =
        includeLaps && (!detailed.laps || detailed.laps.length === 0)
          ? await client.getActivityLaps(summary.id)
          : undefined;

      const data = transformActivity(detailed, { streams, laps });

      await soma.ingestActivity(ctx, { connectionId, userId, ...data });
      synced++;
    } catch (err) {
      errors.push({
        activityId: summary.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { synced, errors };
}

export interface SyncAthleteOptions {
  /** Authenticated Strava API client. */
  client: StravaClient;
  /** Soma component instance. */
  soma: Soma;
  /** Convex action context. */
  ctx: ActionCtx;
  /** The Soma connection ID for this user–Strava link. */
  connectionId: string;
  /** The host app's user identifier. */
  userId: string;
}

/**
 * Sync the authenticated athlete's profile from Strava into Soma.
 *
 * @example
 * ```ts
 * await syncAthlete({ client, soma, ctx, connectionId, userId });
 * ```
 */
export async function syncAthlete(
  opts: SyncAthleteOptions,
): Promise<void> {
  const { client, soma, ctx, connectionId, userId } = opts;
  const athlete = await client.getAthlete();
  const data = transformAthlete(athlete);
  await soma.ingestAthlete(ctx, { connectionId, userId, ...data });
}

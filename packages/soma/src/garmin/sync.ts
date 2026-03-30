// ─── Garmin Sync Helpers ─────────────────────────────────────────────────────
// High-level functions that combine the Garmin client, transformers,
// and Soma ingestion. Designed to be used inside a Convex action.

import type { Soma } from "../client/index.js";
import type { ActionCtx } from "../client/types.js";
import type { GarminClient } from "./client.js";
import type { TimeRangeParams } from "./client.js";
import { transformActivity } from "./activity.js";
import { transformDaily } from "./daily.js";
import { transformSleep } from "./sleep.js";
import { transformBody } from "./body.js";
import { transformMenstruation } from "./menstruation.js";
import { transformBloodPressure } from "./bloodPressure.js";
import { transformSkinTemp } from "./skinTemp.js";
import { transformUserMetrics } from "./userMetrics.js";
import { transformHRV } from "./hrv.js";
import { transformStressDetails } from "./stressDetails.js";
import { transformPulseOx } from "./pulseOx.js";
import { transformRespiration } from "./respiration.js";

// ─── Shared Types ────────────────────────────────────────────────────────────

export interface SyncOptions {
  client: GarminClient;
  soma: Soma;
  ctx: ActionCtx;
  connectionId: string;
  userId: string;
  timeRange: TimeRangeParams;
}

export interface SyncResult {
  synced: number;
  errors: Array<{ id: string; error: string }>;
}

export interface SyncAllResult {
  activities: SyncResult;
  dailies: SyncResult;
  sleep: SyncResult;
  body: SyncResult;
  menstruation: SyncResult;
  bloodPressures: SyncResult;
  skinTemp: SyncResult;
  userMetrics: SyncResult;
  hrv: SyncResult;
  stressDetails: SyncResult;
  pulseOx: SyncResult;
  respiration: SyncResult;
}

// ─── Sync All ────────────────────────────────────────────────────────────────

/**
 * Sync all data types from Garmin for a given time range.
 *
 * Runs each sync independently so a failure in one type doesn't
 * block the others.
 */
export async function syncAll(opts: SyncOptions): Promise<SyncAllResult> {
  const [
    activities,
    dailies,
    sleep,
    body,
    menstruation,
    bloodPressures,
    skinTemp,
    userMetrics,
    hrv,
    stressDetails,
    pulseOx,
    respiration,
  ] = await Promise.all([
    syncActivities(opts),
    syncDailies(opts),
    syncSleep(opts),
    syncBody(opts),
    syncMenstruation(opts),
    syncBloodPressures(opts),
    syncSkinTemp(opts),
    syncUserMetrics(opts),
    syncHRV(opts),
    syncStressDetails(opts),
    syncPulseOx(opts),
    syncRespiration(opts),
  ]);

  return {
    activities,
    dailies,
    sleep,
    body,
    menstruation,
    bloodPressures,
    skinTemp,
    userMetrics,
    hrv,
    stressDetails,
    pulseOx,
    respiration,
  };
}

// ─── Activities ──────────────────────────────────────────────────────────────

export async function syncActivities(opts: SyncOptions): Promise<SyncResult> {
  const { client, soma, ctx, connectionId, userId, timeRange } = opts;
  let synced = 0;
  const errors: SyncResult["errors"] = [];

  try {
    const activities = await client.getActivities(timeRange);

    for (const activity of activities) {
      try {
        const data = transformActivity(activity);
        await soma.ingestActivity(ctx, { connectionId, userId, ...data });
        synced++;
      } catch (err) {
        errors.push({
          id: activity.summaryId ?? String(activity.activityId),
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } catch (err) {
    errors.push({
      id: "fetch",
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return { synced, errors };
}

// ─── Dailies ─────────────────────────────────────────────────────────────────

export async function syncDailies(opts: SyncOptions): Promise<SyncResult> {
  const { client, soma, ctx, connectionId, userId, timeRange } = opts;
  let synced = 0;
  const errors: SyncResult["errors"] = [];

  try {
    const dailies = await client.getDailies(timeRange);

    for (const daily of dailies) {
      try {
        const data = transformDaily(daily);
        await soma.ingestDaily(ctx, { connectionId, userId, ...data });
        synced++;
      } catch (err) {
        errors.push({
          id: daily.summaryId ?? daily.calendarDate ?? "unknown",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } catch (err) {
    errors.push({
      id: "fetch",
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return { synced, errors };
}

// ─── Sleep ───────────────────────────────────────────────────────────────────

export async function syncSleep(opts: SyncOptions): Promise<SyncResult> {
  const { client, soma, ctx, connectionId, userId, timeRange } = opts;
  let synced = 0;
  const errors: SyncResult["errors"] = [];

  try {
    const sleeps = await client.getSleeps(timeRange);

    for (const sleep of sleeps) {
      try {
        const data = transformSleep(sleep);
        await soma.ingestSleep(ctx, { connectionId, userId, ...data });
        synced++;
      } catch (err) {
        errors.push({
          id: sleep.summaryId ?? sleep.calendarDate ?? "unknown",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } catch (err) {
    errors.push({
      id: "fetch",
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return { synced, errors };
}

// ─── Body Composition ────────────────────────────────────────────────────────

export async function syncBody(opts: SyncOptions): Promise<SyncResult> {
  const { client, soma, ctx, connectionId, userId, timeRange } = opts;
  let synced = 0;
  const errors: SyncResult["errors"] = [];

  try {
    const bodyComps = await client.getBodyCompositions(timeRange);

    for (const body of bodyComps) {
      try {
        const data = transformBody(body);
        await soma.ingestBody(ctx, { connectionId, userId, ...data });
        synced++;
      } catch (err) {
        errors.push({
          id: body.summaryId ?? String(body.measurementTimeInSeconds),
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } catch (err) {
    errors.push({
      id: "fetch",
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return { synced, errors };
}

// ─── Menstruation ────────────────────────────────────────────────────────────

export async function syncMenstruation(
  opts: SyncOptions,
): Promise<SyncResult> {
  const { client, soma, ctx, connectionId, userId, timeRange } = opts;
  let synced = 0;
  const errors: SyncResult["errors"] = [];

  try {
    const records = await client.getMenstrualCycleData(timeRange);

    for (const record of records) {
      try {
        const data = transformMenstruation(record);
        await soma.ingestMenstruation(ctx, {
          connectionId,
          userId,
          ...data,
        });
        synced++;
      } catch (err) {
        errors.push({
          id: record.summaryId ?? record.periodStartDate ?? "unknown",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } catch (err) {
    errors.push({
      id: "fetch",
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return { synced, errors };
}

// ─── Blood Pressures ────────────────────────────────────────────────────────

export async function syncBloodPressures(
  opts: SyncOptions,
): Promise<SyncResult> {
  const { client, soma, ctx, connectionId, userId, timeRange } = opts;
  let synced = 0;
  const errors: SyncResult["errors"] = [];

  try {
    const records = await client.getBloodPressures(timeRange);

    for (const record of records) {
      try {
        const data = transformBloodPressure(record);
        await soma.ingestBody(ctx, { connectionId, userId, ...data });
        synced++;
      } catch (err) {
        errors.push({
          id: record.summaryId ?? String(record.measurementTimeInSeconds),
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } catch (err) {
    errors.push({
      id: "fetch",
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return { synced, errors };
}

// ─── Skin Temperature ───────────────────────────────────────────────────────

export async function syncSkinTemp(opts: SyncOptions): Promise<SyncResult> {
  const { client, soma, ctx, connectionId, userId, timeRange } = opts;
  let synced = 0;
  const errors: SyncResult["errors"] = [];

  try {
    const records = await client.getSkinTemperature(timeRange);

    for (const record of records) {
      try {
        const data = transformSkinTemp(record);
        await soma.ingestBody(ctx, { connectionId, userId, ...data });
        synced++;
      } catch (err) {
        errors.push({
          id: record.summaryId ?? record.calendarDate ?? "unknown",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } catch (err) {
    errors.push({
      id: "fetch",
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return { synced, errors };
}

// ─── User Metrics ───────────────────────────────────────────────────────────

export async function syncUserMetrics(opts: SyncOptions): Promise<SyncResult> {
  const { client, soma, ctx, connectionId, userId, timeRange } = opts;
  let synced = 0;
  const errors: SyncResult["errors"] = [];

  try {
    const records = await client.getUserMetrics(timeRange);

    for (const record of records) {
      try {
        const data = transformUserMetrics(record);
        await soma.ingestBody(ctx, { connectionId, userId, ...data });
        synced++;
      } catch (err) {
        errors.push({
          id: record.summaryId ?? record.calendarDate ?? "unknown",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } catch (err) {
    errors.push({
      id: "fetch",
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return { synced, errors };
}

// ─── HRV (enriches Daily) ───────────────────────────────────────────────────

export async function syncHRV(opts: SyncOptions): Promise<SyncResult> {
  const { client, soma, ctx, connectionId, userId, timeRange } = opts;
  let synced = 0;
  const errors: SyncResult["errors"] = [];

  try {
    const records = await client.getHRV(timeRange);

    for (const record of records) {
      try {
        const data = transformHRV(record);
        if (data.heart_rate_data) {
          await soma.ingestDaily(ctx, {
            connectionId,
            userId,
            metadata: {
              start_time: new Date(
                (record.startTimeInSeconds ?? 0) * 1000,
              ).toISOString(),
              end_time: new Date(
                ((record.startTimeInSeconds ?? 0) +
                  (record.durationInSeconds ?? 86400)) *
                  1000,
              ).toISOString(),
              upload_type: 1,
            },
            heart_rate_data: data.heart_rate_data,
          });
          synced++;
        }
      } catch (err) {
        errors.push({
          id: record.summaryId ?? record.calendarDate ?? "unknown",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } catch (err) {
    errors.push({
      id: "fetch",
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return { synced, errors };
}

// ─── Stress Details (enriches Daily) ────────────────────────────────────────

export async function syncStressDetails(
  opts: SyncOptions,
): Promise<SyncResult> {
  const { client, soma, ctx, connectionId, userId, timeRange } = opts;
  let synced = 0;
  const errors: SyncResult["errors"] = [];

  try {
    const records = await client.getStressDetails(timeRange);

    for (const record of records) {
      try {
        const data = transformStressDetails(record);
        if (data.stress_data) {
          await soma.ingestDaily(ctx, {
            connectionId,
            userId,
            metadata: {
              start_time: new Date(
                (record.startTimeInSeconds ?? 0) * 1000,
              ).toISOString(),
              end_time: new Date(
                ((record.startTimeInSeconds ?? 0) +
                  (record.durationInSeconds ?? 86400)) *
                  1000,
              ).toISOString(),
              upload_type: 1,
            },
            stress_data: data.stress_data,
          });
          synced++;
        }
      } catch (err) {
        errors.push({
          id: record.summaryId ?? record.calendarDate ?? "unknown",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } catch (err) {
    errors.push({
      id: "fetch",
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return { synced, errors };
}

// ─── Pulse Ox (enriches Daily) ──────────────────────────────────────────────

export async function syncPulseOx(opts: SyncOptions): Promise<SyncResult> {
  const { client, soma, ctx, connectionId, userId, timeRange } = opts;
  let synced = 0;
  const errors: SyncResult["errors"] = [];

  try {
    const records = await client.getPulseOx(timeRange);

    for (const record of records) {
      try {
        const data = transformPulseOx(record);
        if (data.oxygen_data) {
          await soma.ingestDaily(ctx, {
            connectionId,
            userId,
            metadata: {
              start_time: new Date(
                (record.startTimeInSeconds ?? 0) * 1000,
              ).toISOString(),
              end_time: new Date(
                ((record.startTimeInSeconds ?? 0) +
                  (record.durationInSeconds ?? 86400)) *
                  1000,
              ).toISOString(),
              upload_type: 1,
            },
            oxygen_data: data.oxygen_data,
          });
          synced++;
        }
      } catch (err) {
        errors.push({
          id: record.summaryId ?? record.calendarDate ?? "unknown",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } catch (err) {
    errors.push({
      id: "fetch",
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return { synced, errors };
}

// ─── Respiration (enriches Daily) ───────────────────────────────────────────

export async function syncRespiration(opts: SyncOptions): Promise<SyncResult> {
  const { client, soma, ctx, connectionId, userId, timeRange } = opts;
  let synced = 0;
  const errors: SyncResult["errors"] = [];

  try {
    const records = await client.getRespiration(timeRange);

    for (const record of records) {
      try {
        const data = transformRespiration(record);
        if (data.respiration_data) {
          await soma.ingestDaily(ctx, {
            connectionId,
            userId,
            metadata: {
              start_time: new Date(
                (record.startTimeInSeconds ?? 0) * 1000,
              ).toISOString(),
              end_time: new Date(
                ((record.startTimeInSeconds ?? 0) +
                  (record.durationInSeconds ?? 86400)) *
                  1000,
              ).toISOString(),
              upload_type: 1,
            },
            respiration_data: data.respiration_data,
          });
          synced++;
        }
      } catch (err) {
        errors.push({
          id: record.summaryId ?? "unknown",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } catch (err) {
    errors.push({
      id: "fetch",
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return { synced, errors };
}

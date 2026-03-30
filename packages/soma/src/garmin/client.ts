// ─── Garmin Health API Client ────────────────────────────────────────────────
// Uses openapi-fetch for type-safe Wellness API calls and manual fetch for
// Training API endpoints that are not covered by the OpenAPI spec.

import createClient from "openapi-fetch";
import type { Middleware } from "openapi-fetch";
import type { paths } from "./wellness-api.js";
import type {
  GarminActivity,
  GarminActivityDetail,
  GarminDailyExtended,
  GarminSleepExtended,
  GarminBodyComposition,
  GarminMenstrualCycle,
  GarminUserMetrics,
  GarminStressDetail,
  GarminSkinTemperature,
  GarminRespiration,
  GarminPulseOx,
  GarminMoveIQEvent,
  GarminHRVSummary,
  GarminHealthSnapshot,
  GarminEpoch,
  GarminBloodPressure,
  GarminSolar,
  GarminWorkout,
  GarminWorkoutSchedule,
} from "./types.js";

const DEFAULT_BASE_URL = "https://apis.garmin.com";

export interface GarminClientOptions {
  /** The user's OAuth 2.0 access token. */
  accessToken: string;
  /**
   * Base URL of the Garmin Health API.
   * @default "https://apis.garmin.com"
   */
  baseUrl?: string;
}

/**
 * A client for the Garmin Health API.
 *
 * Wellness API endpoints use openapi-fetch for type safety. Training API
 * endpoints use manual fetch since they are not part of the Wellness API spec.
 *
 * All requests are authenticated with a Bearer token. Time-range parameters
 * use Unix epoch seconds for `uploadStartTimeInSeconds` and
 * `uploadEndTimeInSeconds`.
 *
 * @example
 * ```ts
 * const client = new GarminClient({
 *   accessToken: "user_access_token",
 * });
 *
 * const dailies = await client.getDailies({
 *   uploadStartTimeInSeconds: startEpoch,
 *   uploadEndTimeInSeconds: endEpoch,
 * });
 * ```
 */
export class GarminClient {
  private readonly accessToken: string;
  private readonly baseUrl: string;
  private readonly wellness;

  constructor(opts: GarminClientOptions) {
    this.accessToken = opts.accessToken;
    this.baseUrl = (opts.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");

    const authMiddleware: Middleware = {
      async onRequest({ request }) {
        request.headers.set("Authorization", `Bearer ${opts.accessToken}`);
        request.headers.set("Accept", "application/json");
        return request;
      },
    };

    this.wellness = createClient<paths>({
      baseUrl: `${this.baseUrl}/wellness-api`,
    });
    this.wellness.use(authMiddleware);
  }

  // ─── User Identity ──────────────────────────────────────────────────────

  /**
   * Resolve the Garmin user ID for the authenticated user.
   *
   * Garmin API: `GET /wellness-api/rest/user/id`
   */
  async getUserId(): Promise<string | null> {
    const { data, error, response } = await this.wellness.GET("/rest/user/id");
    if (error) {
      throw new GarminApiError(
        `Garmin API error: ${response.status} ${response.statusText}`,
        response.status,
        JSON.stringify(error),
      );
    }
    return data?.userId ?? null;
  }

  // ─── User Permissions ─────────────────────────────────────────────────

  /**
   * Check which permissions the user has granted.
   *
   * Garmin API: `GET /wellness-api/rest/user/permissions`
   */
  async getUserPermissions(): Promise<string[]> {
    const { data, error, response } = await this.wellness.GET(
      "/rest/user/permissions",
    );
    if (error) {
      throw new GarminApiError(
        `Garmin API error: ${response.status} ${response.statusText}`,
        response.status,
        JSON.stringify(error),
      );
    }
    return data?.permissions ?? [];
  }

  // ─── Daily Summaries ──────────────────────────────────────────────────

  /**
   * Get daily wellness summaries.
   *
   * Garmin API: `GET /wellness-api/rest/dailies`
   */
  async getDailies(params: TimeRangeParams): Promise<GarminDailyExtended[]> {
    const { data, error, response } = await this.wellness.GET("/rest/dailies", {
      params: { query: timeRangeQuery(params, this.accessToken) },
    });
    if (error) {
      throw new GarminApiError(
        `Garmin API error: ${response.status} ${response.statusText}`,
        response.status,
        JSON.stringify(error),
      );
    }
    console.log("[getDailies] raw response:", JSON.stringify(data?.[0], null, 2));
    return (data ?? []) as GarminDailyExtended[];
  }

  // ─── Activities ───────────────────────────────────────────────────────

  /**
   * Get activity summaries.
   *
   * Garmin API: `GET /wellness-api/rest/activities`
   */
  async getActivities(params: TimeRangeParams): Promise<GarminActivity[]> {
    const { data, error, response } = await this.wellness.GET(
      "/rest/activities",
      {
        params: { query: timeRangeQuery(params, this.accessToken) },
      },
    );
    if (error) {
      throw new GarminApiError(
        `Garmin API error: ${response.status} ${response.statusText}`,
        response.status,
        JSON.stringify(error),
      );
    }
    return (data ?? []) as GarminActivity[];
  }

  // ─── Activity Details ─────────────────────────────────────────────────

  /**
   * Get detailed activity summaries including GPS, heart rate, and sensor data.
   *
   * Garmin API: `GET /wellness-api/rest/activityDetails`
   */
  async getActivityDetails(
    params: TimeRangeParams,
  ): Promise<GarminActivityDetail[]> {
    const { data, error, response } = await this.wellness.GET(
      "/rest/activityDetails",
      {
        params: { query: timeRangeQuery(params, this.accessToken) },
      },
    );
    if (error) {
      throw new GarminApiError(
        `Garmin API error: ${response.status} ${response.statusText}`,
        response.status,
        JSON.stringify(error),
      );
    }
    return (data ?? []) as GarminActivityDetail[];
  }

  // ─── Activity File ────────────────────────────────────────────────────

  /**
   * Download a raw activity file (FIT, TCX, or GPX).
   *
   * Garmin API: `GET /wellness-api/rest/activityFile`
   *
   * @returns The raw file as an ArrayBuffer.
   */
  async getActivityFile(id: string): Promise<ArrayBuffer> {
    const url = `${this.baseUrl}/wellness-api/rest/activityFile?id=${encodeURIComponent(id)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new GarminApiError(
        `Garmin API error: ${response.status} ${response.statusText}`,
        response.status,
        body,
      );
    }

    return response.arrayBuffer();
  }

  // ─── Sleep ────────────────────────────────────────────────────────────

  /**
   * Get sleep summaries.
   *
   * Garmin API: `GET /wellness-api/rest/sleeps`
   */
  async getSleeps(params: TimeRangeParams): Promise<GarminSleepExtended[]> {
    const { data, error, response } = await this.wellness.GET("/rest/sleeps", {
      params: { query: timeRangeQuery(params, this.accessToken) },
    });
    if (error) {
      throw new GarminApiError(
        `Garmin API error: ${response.status} ${response.statusText}`,
        response.status,
        JSON.stringify(error),
      );
    }
    return (data ?? []) as GarminSleepExtended[];
  }

  // ─── Body Composition ─────────────────────────────────────────────────

  /**
   * Get body composition summaries.
   *
   * Garmin API: `GET /wellness-api/rest/bodyComps`
   */
  async getBodyCompositions(
    params: TimeRangeParams,
  ): Promise<GarminBodyComposition[]> {
    const { data, error, response } = await this.wellness.GET(
      "/rest/bodyComps",
      {
        params: { query: timeRangeQuery(params, this.accessToken) },
      },
    );
    if (error) {
      throw new GarminApiError(
        `Garmin API error: ${response.status} ${response.statusText}`,
        response.status,
        JSON.stringify(error),
      );
    }
    return (data ?? []) as GarminBodyComposition[];
  }

  // ─── Menstrual Cycle ──────────────────────────────────────────────────

  /**
   * Get menstrual cycle tracking data.
   *
   * Garmin API: `GET /wellness-api/rest/mct`
   */
  async getMenstrualCycleData(
    params: TimeRangeParams,
  ): Promise<GarminMenstrualCycle[]> {
    const { data, error, response } = await this.wellness.GET("/rest/mct", {
      params: { query: timeRangeQuery(params, this.accessToken) },
    });
    if (error) {
      throw new GarminApiError(
        `Garmin API error: ${response.status} ${response.statusText}`,
        response.status,
        JSON.stringify(error),
      );
    }
    return (data ?? []) as GarminMenstrualCycle[];
  }

  // ─── User Metrics ─────────────────────────────────────────────────────

  /**
   * Get user metrics (VO2 max, fitness age, etc.).
   *
   * Garmin API: `GET /wellness-api/rest/userMetrics`
   */
  async getUserMetrics(
    params: TimeRangeParams,
  ): Promise<GarminUserMetrics[]> {
    const { data, error, response } = await this.wellness.GET(
      "/rest/userMetrics",
      {
        params: { query: timeRangeQuery(params, this.accessToken) },
      },
    );
    if (error) {
      throw new GarminApiError(
        `Garmin API error: ${response.status} ${response.statusText}`,
        response.status,
        JSON.stringify(error),
      );
    }
    return (data ?? []) as GarminUserMetrics[];
  }

  // ─── Stress Details ───────────────────────────────────────────────────

  /**
   * Get stress detail summaries.
   *
   * Garmin API: `GET /wellness-api/rest/stressDetails`
   */
  async getStressDetails(
    params: TimeRangeParams,
  ): Promise<GarminStressDetail[]> {
    const { data, error, response } = await this.wellness.GET(
      "/rest/stressDetails",
      {
        params: { query: timeRangeQuery(params, this.accessToken) },
      },
    );
    if (error) {
      throw new GarminApiError(
        `Garmin API error: ${response.status} ${response.statusText}`,
        response.status,
        JSON.stringify(error),
      );
    }
    return (data ?? []) as GarminStressDetail[];
  }

  // ─── Skin Temperature ─────────────────────────────────────────────────

  /**
   * Get skin temperature summaries.
   *
   * Garmin API: `GET /wellness-api/rest/skinTemp`
   */
  async getSkinTemperature(
    params: TimeRangeParams,
  ): Promise<GarminSkinTemperature[]> {
    const { data, error, response } = await this.wellness.GET(
      "/rest/skinTemp",
      {
        params: { query: timeRangeQuery(params, this.accessToken) },
      },
    );
    if (error) {
      throw new GarminApiError(
        `Garmin API error: ${response.status} ${response.statusText}`,
        response.status,
        JSON.stringify(error),
      );
    }
    return (data ?? []) as GarminSkinTemperature[];
  }

  // ─── Respiration ──────────────────────────────────────────────────────

  /**
   * Get respiration summaries.
   *
   * Garmin API: `GET /wellness-api/rest/respiration`
   */
  async getRespiration(
    params: TimeRangeParams,
  ): Promise<GarminRespiration[]> {
    const { data, error, response } = await this.wellness.GET(
      "/rest/respiration",
      {
        params: { query: timeRangeQuery(params, this.accessToken) },
      },
    );
    if (error) {
      throw new GarminApiError(
        `Garmin API error: ${response.status} ${response.statusText}`,
        response.status,
        JSON.stringify(error),
      );
    }
    return (data ?? []) as GarminRespiration[];
  }

  // ─── Pulse Ox ─────────────────────────────────────────────────────────

  /**
   * Get pulse oximetry (SpO2) summaries.
   *
   * Garmin API: `GET /wellness-api/rest/pulseOx`
   */
  async getPulseOx(params: TimeRangeParams): Promise<GarminPulseOx[]> {
    const { data, error, response } = await this.wellness.GET(
      "/rest/pulseOx",
      {
        params: { query: timeRangeQuery(params, this.accessToken) },
      },
    );
    if (error) {
      throw new GarminApiError(
        `Garmin API error: ${response.status} ${response.statusText}`,
        response.status,
        JSON.stringify(error),
      );
    }
    return (data ?? []) as GarminPulseOx[];
  }

  // ─── Move IQ ──────────────────────────────────────────────────────────

  /**
   * Get Move IQ auto-detected activity events.
   *
   * Garmin API: `GET /wellness-api/rest/moveiq`
   */
  async getMoveIQ(params: TimeRangeParams): Promise<GarminMoveIQEvent[]> {
    const { data, error, response } = await this.wellness.GET(
      "/rest/moveiq",
      {
        params: { query: timeRangeQuery(params, this.accessToken) },
      },
    );
    if (error) {
      throw new GarminApiError(
        `Garmin API error: ${response.status} ${response.statusText}`,
        response.status,
        JSON.stringify(error),
      );
    }
    return (data ?? []) as GarminMoveIQEvent[];
  }

  // ─── HRV ──────────────────────────────────────────────────────────────

  /**
   * Get heart rate variability (HRV) summaries.
   *
   * Garmin API: `GET /wellness-api/rest/hrv`
   */
  async getHRV(params: TimeRangeParams): Promise<GarminHRVSummary[]> {
    const { data, error, response } = await this.wellness.GET("/rest/hrv", {
      params: { query: timeRangeQuery(params, this.accessToken) },
    });
    if (error) {
      throw new GarminApiError(
        `Garmin API error: ${response.status} ${response.statusText}`,
        response.status,
        JSON.stringify(error),
      );
    }
    return (data ?? []) as GarminHRVSummary[];
  }

  // ─── Health Snapshot ──────────────────────────────────────────────────

  /**
   * Get health snapshot summaries.
   *
   * Garmin API: `GET /wellness-api/rest/healthSnapshot`
   */
  async getHealthSnapshot(
    params: TimeRangeParams,
  ): Promise<GarminHealthSnapshot[]> {
    const { data, error, response } = await this.wellness.GET(
      "/rest/healthSnapshot",
      {
        params: { query: timeRangeQuery(params, this.accessToken) },
      },
    );
    if (error) {
      throw new GarminApiError(
        `Garmin API error: ${response.status} ${response.statusText}`,
        response.status,
        JSON.stringify(error),
      );
    }
    return (data ?? []) as GarminHealthSnapshot[];
  }

  // ─── Epochs ───────────────────────────────────────────────────────────

  /**
   * Get epoch (15-minute interval) summaries.
   *
   * Garmin API: `GET /wellness-api/rest/epochs`
   */
  async getEpochs(params: TimeRangeParams): Promise<GarminEpoch[]> {
    const { data, error, response } = await this.wellness.GET("/rest/epochs", {
      params: { query: timeRangeQuery(params, this.accessToken) },
    });
    if (error) {
      throw new GarminApiError(
        `Garmin API error: ${response.status} ${response.statusText}`,
        response.status,
        JSON.stringify(error),
      );
    }
    return (data ?? []) as GarminEpoch[];
  }

  // ─── Blood Pressure ───────────────────────────────────────────────────

  /**
   * Get blood pressure summaries.
   *
   * Garmin API: `GET /wellness-api/rest/bloodPressures`
   */
  async getBloodPressures(
    params: TimeRangeParams,
  ): Promise<GarminBloodPressure[]> {
    const { data, error, response } = await this.wellness.GET(
      "/rest/bloodPressures",
      {
        params: { query: timeRangeQuery(params, this.accessToken) },
      },
    );
    if (error) {
      throw new GarminApiError(
        `Garmin API error: ${response.status} ${response.statusText}`,
        response.status,
        JSON.stringify(error),
      );
    }
    return (data ?? []) as GarminBloodPressure[];
  }

  // ─── Manually Updated Activities ──────────────────────────────────────

  /**
   * Get manually created or edited activities.
   *
   * Garmin API: `GET /wellness-api/rest/manuallyUpdatedActivities`
   */
  async getManuallyUpdatedActivities(
    params: TimeRangeParams,
  ): Promise<GarminActivity[]> {
    const { data, error, response } = await this.wellness.GET(
      "/rest/manuallyUpdatedActivities",
      {
        params: { query: timeRangeQuery(params, this.accessToken) },
      },
    );
    if (error) {
      throw new GarminApiError(
        `Garmin API error: ${response.status} ${response.statusText}`,
        response.status,
        JSON.stringify(error),
      );
    }
    return (data ?? []) as GarminActivity[];
  }

  // ─── Solar Intensity ──────────────────────────────────────────────────

  /**
   * Get solar intensity summaries.
   *
   * Garmin API: `GET /wellness-api/rest/solarIntensity`
   */
  async getSolarIntensity(
    params: TimeRangeParams,
  ): Promise<GarminSolar[]> {
    const { data, error, response } = await this.wellness.GET(
      "/rest/solarIntensity",
      {
        params: { query: timeRangeQuery(params, this.accessToken) },
      },
    );
    if (error) {
      throw new GarminApiError(
        `Garmin API error: ${response.status} ${response.statusText}`,
        response.status,
        JSON.stringify(error),
      );
    }
    return (data ?? []) as GarminSolar[];
  }

  // ─── Backfill ─────────────────────────────────────────────────────────

  /**
   * Request historical data backfill from Garmin.
   *
   * Garmin processes backfill requests asynchronously and delivers data
   * via the configured webhook endpoint. Maximum range: 90 days per request.
   *
   * Uses manual fetch because the spec defines individual backfill paths
   * (e.g. `/rest/backfill/dailies`) but this method accepts a dynamic
   * summaryType string.
   *
   * @param summaryType - The data type to backfill (e.g., "dailies", "activities", "sleeps", "bodyComps")
   * @param params - Time range for the backfill
   */
  async requestBackfill(
    summaryType: string,
    params: TimeRangeParams,
  ): Promise<void> {
    const query = timeRangeQuery(params, this.accessToken);
    const qs = new URLSearchParams(query).toString();
    const url = `${this.baseUrl}/wellness-api/rest/backfill/${summaryType}?${qs}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new GarminApiError(
        `Garmin API error: ${response.status} ${response.statusText}`,
        response.status,
        body,
      );
    }
  }

  // ─── User Deregistration ──────────────────────────────────────────────

  /**
   * Delete the user's registration with Garmin.
   *
   * Must be called when the user disconnects or deletes their account
   * to comply with Garmin's API requirements.
   */
  async deleteUserRegistration(): Promise<void> {
    const { error, response } = await this.wellness.DELETE(
      "/rest/user/registration",
    );

    if (error) {
      throw new GarminApiError(
        `Garmin API error: ${response.status} ${response.statusText}`,
        response.status,
        JSON.stringify(error),
      );
    }
  }

  // ─── Training API V2 ─────────────────────────────────────────────────
  // These endpoints are NOT part of the Wellness API spec, so they use
  // manual fetch.

  /**
   * Create a workout in Garmin Connect.
   *
   * Garmin API: `POST /workoutportal/workout/v2`
   * Note: uses a different base path than other Training API endpoints.
   */
  async createWorkout(workout: GarminWorkout): Promise<GarminWorkout> {
    return this.post<GarminWorkout>("/workoutportal/workout/v2", workout);
  }

  /**
   * Retrieve a workout by ID.
   *
   * Garmin API: `GET /training-api/workout/v2/{workoutId}`
   */
  async getWorkout(workoutId: number): Promise<GarminWorkout> {
    return this.get<GarminWorkout>(
      `/training-api/workout/v2/${workoutId}`,
    );
  }

  /**
   * Update a workout by ID.
   *
   * Garmin API: `PUT /training-api/workout/v2/{workoutId}`
   */
  async updateWorkout(
    workoutId: number,
    workout: GarminWorkout,
  ): Promise<GarminWorkout> {
    return this.put<GarminWorkout>(
      `/training-api/workout/v2/${workoutId}`,
      workout,
    );
  }

  /**
   * Delete a workout by ID.
   *
   * Garmin API: `DELETE /training-api/workout/v2/{workoutId}`
   */
  async deleteWorkout(workoutId: number): Promise<void> {
    await this.del(`/training-api/workout/v2/${workoutId}`);
  }

  /**
   * Schedule a workout to a specific date on the user's calendar.
   *
   * Garmin API: `POST /training-api/schedule/`
   */
  async createSchedule(
    workoutId: number,
    date: string,
  ): Promise<GarminWorkoutSchedule> {
    return this.post<GarminWorkoutSchedule>("/training-api/schedule/", {
      workoutId,
      date,
    });
  }

  /**
   * Retrieve workout schedules for a date range.
   *
   * Garmin API: `GET /training-api/schedule?startDate=...&endDate=...`
   */
  async getSchedulesByDate(
    startDate: string,
    endDate: string,
  ): Promise<GarminWorkoutSchedule[]> {
    return this.get<GarminWorkoutSchedule[]>("/training-api/schedule", {
      startDate,
      endDate,
    });
  }

  /**
   * Delete a workout schedule by ID.
   *
   * Garmin API: `DELETE /training-api/schedule/{scheduleId}`
   */
  async deleteSchedule(scheduleId: number): Promise<void> {
    await this.del(`/training-api/schedule/${scheduleId}`);
  }

  // ─── Internal (Training API helpers) ──────────────────────────────────

  private async get<T>(
    path: string,
    queryParams?: Record<string, string>,
  ): Promise<T> {
    const fullUrl = `${this.baseUrl}${path}`;
    const qs = queryParams
      ? `?${new URLSearchParams(queryParams).toString()}`
      : "";
    const requestUrl = `${fullUrl}${qs}`;

    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new GarminApiError(
        `Garmin API error: ${response.status} ${response.statusText}`,
        response.status,
        body,
      );
    }

    return (await response.json()) as T;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      const isTrainingApi =
        path.includes("/workoutportal/") || path.includes("/training-api/");
      const hint =
        isTrainingApi && response.status === 401
          ? " — Ensure the Garmin app is registered for the Training API program " +
            "and the user has WORKOUT_IMPORT permission."
          : "";
      throw new GarminApiError(
        `Garmin API error: ${response.status} ${response.statusText}${hint}`,
        response.status,
        text,
      );
    }

    return (await response.json()) as T;
  }

  private async put<T>(path: string, body: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new GarminApiError(
        `Garmin API error: ${response.status} ${response.statusText}`,
        response.status,
        text,
      );
    }

    return (await response.json()) as T;
  }

  private async del(path: string): Promise<void> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new GarminApiError(
        `Garmin API error: ${response.status} ${response.statusText}`,
        response.status,
        text,
      );
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export interface TimeRangeParams {
  /** Start of the time range as Unix epoch seconds. */
  uploadStartTimeInSeconds: number;
  /** End of the time range as Unix epoch seconds. */
  uploadEndTimeInSeconds: number;
}

function timeRangeQuery(
  params: TimeRangeParams,
  token?: string,
): { uploadStartTimeInSeconds: string; uploadEndTimeInSeconds: string; token?: string } {
  return {
    uploadStartTimeInSeconds: String(params.uploadStartTimeInSeconds),
    uploadEndTimeInSeconds: String(params.uploadEndTimeInSeconds),
    ...(token ? { token } : {}),
  };
}

// ─── Error ────────────────────────────────────────────────────────────────────

export class GarminApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`${message} — ${body}`);
    this.name = "GarminApiError";
  }
}

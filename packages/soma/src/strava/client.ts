// ─── Strava API Client ───────────────────────────────────────────────────────
// Lightweight, fetch-based client for the Strava API v3.
// No external dependencies — uses the global `fetch` available in Convex
// actions and modern runtimes.

import type {
  DetailedActivity,
  DetailedAthlete,
  Lap,
  StreamSet,
  Stream,
  SummaryActivity,
} from "./types.js";

const DEFAULT_BASE_URL = "https://www.strava.com";
const API_PREFIX = "/api/v3";

export interface StravaClientOptions {
  /** OAuth access token for the authenticated athlete. */
  accessToken: string;
  /**
   * Base URL of the Strava API (without `/api/v3` suffix).
   * Defaults to `https://www.strava.com`.
   * Override to point at a mock server during development.
   */
  baseUrl?: string;
}

/**
 * A lightweight client for the Strava API v3.
 *
 * @example
 * ```ts
 * const client = new StravaClient({
 *   accessToken: "tok_xxx",
 *   baseUrl: "https://strava-mock-server.onrender.com", // optional
 * });
 *
 * const athlete = await client.getAthlete();
 * const activities = await client.listActivities({ per_page: 50 });
 * ```
 */
export class StravaClient {
  private readonly accessToken: string;
  private readonly baseUrl: string;

  constructor(opts: StravaClientOptions) {
    this.accessToken = opts.accessToken;
    this.baseUrl = (opts.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  }

  // ─── Athlete ─────────────────────────────────────────────────────────────

  /**
   * Get the authenticated athlete's profile.
   *
   * Strava API: `GET /athlete`
   */
  async getAthlete(): Promise<DetailedAthlete> {
    return this.get<DetailedAthlete>("/athlete");
  }

  // ─── Activities ──────────────────────────────────────────────────────────

  /**
   * List the authenticated athlete's activities.
   *
   * Strava API: `GET /athlete/activities`
   *
   * @param params.before - Only return activities before this Unix epoch timestamp
   * @param params.after - Only return activities after this Unix epoch timestamp
   * @param params.page - Page number (defaults to 1)
   * @param params.per_page - Items per page (defaults to 30, max 200)
   */
  async listActivities(params?: {
    before?: number;
    after?: number;
    page?: number;
    per_page?: number;
  }): Promise<SummaryActivity[]> {
    const query = new URLSearchParams();
    if (params?.before != null) query.set("before", String(params.before));
    if (params?.after != null) query.set("after", String(params.after));
    if (params?.page != null) query.set("page", String(params.page));
    if (params?.per_page != null) query.set("per_page", String(params.per_page));

    const qs = query.toString();
    return this.get<SummaryActivity[]>(
      `/athlete/activities${qs ? `?${qs}` : ""}`,
    );
  }

  /**
   * List ALL activities for the authenticated athlete, automatically
   * paginating through all pages.
   *
   * @param params.after - Only return activities after this Unix epoch timestamp
   * @param params.before - Only return activities before this Unix epoch timestamp
   * @param params.per_page - Items per page (defaults to 200)
   */
  async listAllActivities(params?: {
    after?: number;
    before?: number;
    per_page?: number;
  }): Promise<SummaryActivity[]> {
    const perPage = params?.per_page ?? 200;
    const all: SummaryActivity[] = [];
    let page = 1;

    while (true) {
      const batch = await this.listActivities({
        after: params?.after,
        before: params?.before,
        page,
        per_page: perPage,
      });
      all.push(...batch);
      if (batch.length < perPage) break;
      page++;
    }

    return all;
  }

  /**
   * Get a detailed activity by ID.
   *
   * Strava API: `GET /activities/{id}`
   */
  async getActivity(id: number): Promise<DetailedActivity> {
    return this.get<DetailedActivity>(`/activities/${id}`);
  }

  /**
   * Get time-series streams for an activity.
   *
   * Strava API: `GET /activities/{id}/streams`
   *
   * @param id - Activity ID
   * @param keys - Stream types to request (e.g. `["heartrate", "watts", "latlng", "altitude", "time"]`)
   */
  async getActivityStreams(
    id: number,
    keys: string[] = [
      "time",
      "heartrate",
      "watts",
      "cadence",
      "latlng",
      "altitude",
      "velocity_smooth",
      "grade_smooth",
      "distance",
      "temp",
    ],
  ): Promise<StreamSet> {
    const query = new URLSearchParams({
      keys: keys.join(","),
      key_by_type: "true",
    });
    const streams = await this.get<Record<string, Stream>>(
      `/activities/${id}/streams?${query.toString()}`,
    );
    return streams as StreamSet;
  }

  /**
   * Get laps for an activity.
   *
   * Strava API: `GET /activities/{id}/laps`
   */
  async getActivityLaps(id: number): Promise<Lap[]> {
    return this.get<Lap[]>(`/activities/${id}/laps`);
  }

  // ─── Internal ────────────────────────────────────────────────────────────

  private async get<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${API_PREFIX}${path}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new StravaApiError(
        `Strava API error: ${response.status} ${response.statusText}`,
        response.status,
        body,
      );
    }

    return (await response.json()) as T;
  }
}

// ─── Error ───────────────────────────────────────────────────────────────────

export class StravaApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: string,
  ) {
    super(message);
    this.name = "StravaApiError";
  }
}

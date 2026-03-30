// ─── Strava OAuth Helpers ────────────────────────────────────────────────────
// Pure helper functions for the Strava OAuth 2.0 Authorization Code flow.
// No external dependencies — uses the global `fetch`.

import type { OAuthTokenResponse } from "./types.js";

const DEFAULT_BASE_URL = "https://www.strava.com";

// ─── Build Authorization URL ─────────────────────────────────────────────────

export interface BuildAuthUrlOptions {
  /** Your Strava application's Client ID. */
  clientId: string;
  /** The URL Strava will redirect to after authorization. */
  redirectUri: string;
  /**
   * Comma-separated Strava OAuth scopes.
   * @default "read,activity:read_all,profile:read_all"
   */
  scope?: string;
  /** Optional state parameter for CSRF protection. */
  state?: string;
  /**
   * Base URL of the Strava site.
   * @default "https://www.strava.com"
   */
  baseUrl?: string;
}

/**
 * Build the Strava OAuth authorization URL.
 *
 * Redirect the user to this URL to begin the OAuth flow. After the user
 * grants access, Strava will redirect back to `redirectUri` with a `code`
 * query parameter.
 *
 * @example
 * ```ts
 * const url = buildAuthUrl({
 *   clientId: process.env.STRAVA_CLIENT_ID!,
 *   redirectUri: "https://your-app.com/api/strava/callback",
 * });
 * // Redirect user to `url`
 * ```
 */
export function buildAuthUrl(opts: BuildAuthUrlOptions): string {
  const base = (opts.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  const params = new URLSearchParams({
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    response_type: "code",
    approval_prompt: "auto",
    scope: opts.scope ?? "read,activity:read_all,profile:read_all",
  });

  if (opts.state) {
    params.set("state", opts.state);
  }

  return `${base}/oauth/authorize?${params.toString()}`;
}

// ─── Exchange Authorization Code ─────────────────────────────────────────────

export interface ExchangeCodeOptions {
  /** Your Strava application's Client ID. */
  clientId: string;
  /** Your Strava application's Client Secret. */
  clientSecret: string;
  /** The authorization code from the OAuth callback. */
  code: string;
  /**
   * Base URL of the Strava site.
   * @default "https://www.strava.com"
   */
  baseUrl?: string;
}

/**
 * Exchange an authorization code for access and refresh tokens.
 *
 * Call this from your OAuth callback endpoint after receiving the `code`
 * query parameter from Strava.
 *
 * @returns The token response including `access_token`, `refresh_token`,
 *          `expires_at`, and the authenticated `athlete` profile.
 *
 * @example
 * ```ts
 * const tokens = await exchangeCode({
 *   clientId: process.env.STRAVA_CLIENT_ID!,
 *   clientSecret: process.env.STRAVA_CLIENT_SECRET!,
 *   code: request.query.code,
 * });
 * // Store tokens.access_token, tokens.refresh_token, tokens.expires_at
 * ```
 */
export async function exchangeCode(
  opts: ExchangeCodeOptions,
): Promise<OAuthTokenResponse> {
  const base = (opts.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  const url = `${base}/oauth/token`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: opts.clientId,
      client_secret: opts.clientSecret,
      code: opts.code,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Strava OAuth error (exchangeCode): ${response.status} ${response.statusText} — ${body}`,
    );
  }

  return (await response.json()) as OAuthTokenResponse;
}

// ─── Refresh Token ───────────────────────────────────────────────────────────

export interface RefreshTokenOptions {
  /** Your Strava application's Client ID. */
  clientId: string;
  /** Your Strava application's Client Secret. */
  clientSecret: string;
  /** The refresh token from a previous token exchange or refresh. */
  refreshToken: string;
  /**
   * Base URL of the Strava site.
   * @default "https://www.strava.com"
   */
  baseUrl?: string;
}

/**
 * Refresh an expired access token using a refresh token.
 *
 * Strava access tokens expire after ~6 hours. Call this when the
 * `expires_at` timestamp has passed to obtain a fresh access token.
 *
 * @returns A new token response with a fresh `access_token` and
 *          possibly a new `refresh_token`.
 *
 * @example
 * ```ts
 * const tokens = await refreshToken({
 *   clientId: process.env.STRAVA_CLIENT_ID!,
 *   clientSecret: process.env.STRAVA_CLIENT_SECRET!,
 *   refreshToken: storedRefreshToken,
 * });
 * // Update stored tokens
 * ```
 */
export async function refreshToken(
  opts: RefreshTokenOptions,
): Promise<OAuthTokenResponse> {
  const base = (opts.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  const url = `${base}/oauth/token`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: opts.clientId,
      client_secret: opts.clientSecret,
      refresh_token: opts.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Strava OAuth error (refreshToken): ${response.status} ${response.statusText} — ${body}`,
    );
  }

  return (await response.json()) as OAuthTokenResponse;
}

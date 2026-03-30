// ─── Garmin OAuth 2.0 PKCE Helpers ──────────────────────────────────────────
// Pure helper functions for the Garmin OAuth 2.0 PKCE flow.
// Uses the Web Crypto API for SHA-256 challenge generation and global `fetch`.

import type { GarminOAuth2TokenResponse } from "./types.js";

const AUTH_URL = "https://connect.garmin.com/oauth2Confirm";
const TOKEN_URL =
  "https://diauth.garmin.com/di-oauth2-service/oauth/token";

// ─── PKCE Helpers ───────────────────────────────────────────────────────────

const PKCE_CHARSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

/**
 * Generate a cryptographically random code verifier for PKCE.
 * Returns a 64-character string from the unreserved character set.
 */
export function generateCodeVerifier(length = 64): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => PKCE_CHARSET[b % PKCE_CHARSET.length]).join(
    "",
  );
}

/**
 * Generate a random state parameter for CSRF protection.
 */
export function generateState(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Compute the S256 code challenge from a code verifier.
 * Returns `base64url(sha256(verifier))`.
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(verifier));
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ─── Build Authorization URL ────────────────────────────────────────────────

export interface BuildAuthUrlOptions {
  /** Your Garmin application's Client ID. */
  clientId: string;
  /** The code challenge derived from the PKCE code verifier. */
  codeChallenge: string;
  /** The URL Garmin will redirect to after authorization. */
  redirectUri?: string;
  /** State parameter for CSRF protection (echoed back in the callback). */
  state?: string;
}

/**
 * Build the Garmin OAuth 2.0 authorization URL.
 *
 * Redirect the user to this URL to begin the OAuth flow. After the user
 * grants access, Garmin will redirect back to `redirectUri` with `code`
 * and `state` query parameters.
 */
export function buildAuthUrl(opts: BuildAuthUrlOptions): string {
  const params = new URLSearchParams({
    client_id: opts.clientId,
    response_type: "code",
    code_challenge: opts.codeChallenge,
    code_challenge_method: "S256",
  });

  if (opts.redirectUri) {
    params.set("redirect_uri", opts.redirectUri);
  }
  if (opts.state) {
    params.set("state", opts.state);
  }

  return `${AUTH_URL}?${params.toString()}`;
}

// ─── Exchange Authorization Code ────────────────────────────────────────────

export interface ExchangeCodeOptions {
  /** Your Garmin application's Client ID. */
  clientId: string;
  /** Your Garmin application's Client Secret. */
  clientSecret: string;
  /** The authorization code from the OAuth callback. */
  code: string;
  /** The original PKCE code verifier (generated in Step 1). */
  codeVerifier: string;
  /** The redirect URI used in the authorization request. */
  redirectUri?: string;
}

/**
 * Exchange an authorization code for access and refresh tokens.
 *
 * Call this from your OAuth callback endpoint after receiving the `code`
 * query parameter from Garmin.
 *
 * @returns The token response including `access_token`, `refresh_token`,
 *          `expires_in`, and `refresh_token_expires_in`.
 */
export async function exchangeCode(
  opts: ExchangeCodeOptions,
): Promise<GarminOAuth2TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: opts.clientId,
    client_secret: opts.clientSecret,
    code: opts.code,
    code_verifier: opts.codeVerifier,
  });

  if (opts.redirectUri) {
    body.set("redirect_uri", opts.redirectUri);
  }

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Garmin OAuth error (exchangeCode): ${response.status} ${response.statusText} — ${text}`,
    );
  }

  return (await response.json()) as GarminOAuth2TokenResponse;
}

// ─── Refresh Token ──────────────────────────────────────────────────────────

export interface RefreshTokenOptions {
  /** Your Garmin application's Client ID. */
  clientId: string;
  /** Your Garmin application's Client Secret. */
  clientSecret: string;
  /** The refresh token from a previous token exchange or refresh. */
  refreshToken: string;
}

/**
 * Refresh an expired access token using a refresh token.
 *
 * Garmin access tokens expire after ~24 hours. Call this when the token
 * is near expiry to obtain a fresh access token. A new refresh token
 * is returned each time.
 *
 * @returns A new token response with fresh `access_token` and `refresh_token`.
 */
export async function refreshToken(
  opts: RefreshTokenOptions,
): Promise<GarminOAuth2TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: opts.clientId,
    client_secret: opts.clientSecret,
    refresh_token: opts.refreshToken,
  });

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Garmin OAuth error (refreshToken): ${response.status} ${response.statusText} — ${text}`,
    );
  }

  return (await response.json()) as GarminOAuth2TokenResponse;
}

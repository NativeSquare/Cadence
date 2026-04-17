/**
 * useStravaAuth - Hook for server-side Strava OAuth via Soma.
 *
 * The native app calls the backend to generate a Strava authorization URL
 * (Soma stores pending OAuth state server-side). The URL is opened in an
 * in-app browser. After authorization, Strava redirects to the Convex
 * callback where Soma completes the token exchange and initial data sync,
 * then 302-redirects to a deep link that dismisses the browser.
 */

import { api } from "@packages/backend/convex/_generated/api";
import { openAuthSessionAsync } from "expo-web-browser";
import { useAction } from "convex/react";
import { useState } from "react";

const STRAVA_REDIRECT_URI = "cadence://oauth/strava/complete";

export function useStravaAuth() {
  const getAuthUrl = useAction(api.soma.strava.getAuthUrl);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async (): Promise<boolean> => {
    setIsConnecting(true);
    setError(null);

    try {
      const { authUrl } = await getAuthUrl();

      const result = await openAuthSessionAsync(authUrl, STRAVA_REDIRECT_URI);

      if (result.type !== "success") {
        return false;
      }

      // Deep link fired — Soma completed OAuth + sync server-side
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to connect to Strava";
      setError(message);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  return {
    connect,
    isConnecting,
    error,
  };
}

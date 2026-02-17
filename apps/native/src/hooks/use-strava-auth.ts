import { api } from "@packages/backend/convex/_generated/api";
import { APP_SLUG } from "@packages/shared";
import { openAuthSessionAsync } from "expo-web-browser";
import { useAction } from "convex/react";
import { useState } from "react";

const STRAVA_CLIENT_ID = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID;

const STRAVA_SCOPES = "activity:read_all,profile:read_all";

// Strava requires the redirect_uri to contain a host/domain that matches
// the "Authorization Callback Domain" in the Strava API settings.
// localhost is whitelisted by Strava, so we use it as the host.
const REDIRECT_URI = `${APP_SLUG}://localhost/oauth`;

type StravaAuthResult = {
  connectionId: string;
  synced: number;
};

export function useStravaAuth() {
  const connectStrava = useAction(api.integrations.strava.sync.connectStravaOAuth);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async (): Promise<StravaAuthResult | null> => {
    if (!STRAVA_CLIENT_ID) {
      setError("Strava client ID is not configured");
      return null;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Use the web authorize endpoint (not /oauth/mobile/authorize) so the
      // entire flow stays inside the in-app browser. The mobile endpoint tries
      // to open the Strava app, which bypasses openAuthSessionAsync and
      // prevents it from intercepting the redirect back to our app.
      const authUrl =
        `https://www.strava.com/oauth/authorize` +
        `?client_id=${STRAVA_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&response_type=code` +
        `&approval_prompt=auto` +
        `&scope=${STRAVA_SCOPES}`;

      // Open the Strava auth page in an in-app browser
      const result = await openAuthSessionAsync(authUrl, REDIRECT_URI);

      if (result.type !== "success") {
        // User cancelled or dismissed the auth flow
        return null;
      }

      // Extract the authorization code and scopes from the callback URL
      const url = new URL(result.url);
      const code = url.searchParams.get("code");
      const scopes = url.searchParams.get("scope") ?? undefined;

      if (!code) {
        // Check if access was denied
        const errorParam = url.searchParams.get("error");
        if (errorParam === "access_denied") {
          setError("Access was denied by the user");
        } else {
          setError("No authorization code received from Strava");
        }
        return null;
      }

      // Exchange the code for tokens and sync activities via Soma
      const connectResult = await connectStrava({ code });

      return {
        connectionId: connectResult.connectionId,
        synced: connectResult.synced,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to connect to Strava";
      setError(message);
      return null;
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

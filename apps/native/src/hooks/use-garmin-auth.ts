/**
 * useGarminAuth - Hook for Garmin OAuth 1.0a flow (Soma v0.5.0).
 *
 * Garmin uses a 3-legged OAuth 1.0a flow. With Soma's registerRoutes,
 * the token exchange, connection creation, and initial data sync are
 * handled server-side in the HTTP callback. The native app only needs to:
 * 1. Request a temporary token (server stores pending state with userId)
 * 2. Open Garmin's authorization page
 * 3. Wait for the deep-link redirect (Soma has completed the flow)
 * 4. Confirm the connection to update the runner record
 */

import { api } from "@packages/backend/convex/_generated/api";
import { APP_SLUG } from "@packages/shared";
import { GARMIN_CALLBACK_PATH } from "@nativesquare/soma";
import { openAuthSessionAsync } from "expo-web-browser";
import { useAction, useMutation } from "convex/react";
import { useState } from "react";

const DEEP_LINK_URI = `${APP_SLUG}://localhost/garmin-oauth`;

function getConvexSiteUrl(): string {
  const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("EXPO_PUBLIC_CONVEX_URL is not set");
  }
  return convexUrl.replace(".convex.cloud", ".convex.site");
}

const CALLBACK_URL = `${getConvexSiteUrl()}${GARMIN_CALLBACK_PATH}`;

export function useGarminAuth() {
  const requestToken = useAction(
    api.integrations.garmin.sync.requestGarminToken,
  );
  const confirmConnection = useMutation(
    api.integrations.garmin.sync.confirmGarminConnection,
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async (): Promise<boolean> => {
    setIsConnecting(true);
    setError(null);

    try {
      const { authUrl } = await requestToken({
        callbackUrl: CALLBACK_URL,
      });

      // Soma's registerRoutes callback handles the OAuth exchange and
      // data sync on the server, then redirects to the onSuccess deep link.
      const result = await openAuthSessionAsync(authUrl, DEEP_LINK_URI);

      if (result.type !== "success") {
        return false;
      }

      await confirmConnection();
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to connect to Garmin";
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

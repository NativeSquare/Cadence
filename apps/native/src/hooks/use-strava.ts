/**
 * useStrava - Hook for connecting to Strava via the Soma component.
 *
 * Since we're using a mock Strava server during development, the hook
 * generates a random mock authorization code and sends it to the backend.
 * The mock server's `/oauth/token` endpoint accepts any code and returns
 * one of the 3 mock athletes (token-athlete1, token-athlete2, token-athlete3).
 *
 * In production, this would be replaced with a real OAuth flow using
 * expo-auth-session to open the Strava authorization page in the browser.
 */

import { api } from "@packages/backend/convex/_generated/api";
import { useAction } from "convex/react";
import { useState, useCallback } from "react";

export type StravaSyncStatus = {
  phase: "idle" | "connecting" | "syncing" | "complete" | "error";
  message: string;
  synced?: number;
};

export type StravaResult = {
  connectionId: string;
  synced: number;
  errors: Array<{ activityId: number; error: string }>;
};

/** Mock auth codes that correspond to different test athletes on the mock server. */
const MOCK_AUTH_CODES = [
  "mock-code-athlete1",
  "mock-code-athlete2",
  "mock-code-athlete3",
];

function getRandomMockCode(): string {
  const index = Math.floor(Math.random() * MOCK_AUTH_CODES.length);
  return MOCK_AUTH_CODES[index];
}

export function useStrava() {
  const connectStravaAction = useAction(
    api.integrations.strava.sync.connectStravaOAuth,
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<StravaSyncStatus>({
    phase: "idle",
    message: "",
  });

  const connect = useCallback(async (): Promise<StravaResult | null> => {
    setIsConnecting(true);
    setError(null);
    setSyncStatus({
      phase: "connecting",
      message: "Connecting to Strava...",
    });

    try {
      // Generate a random mock auth code — the mock server will return
      // one of the 3 test athletes and their activities
      const mockCode = getRandomMockCode();

      setSyncStatus({
        phase: "syncing",
        message: "Syncing activities from Strava...",
      });

      const result = await connectStravaAction({ code: mockCode });

      setSyncStatus({
        phase: "complete",
        message: `Synced ${result.synced} activities from Strava`,
        synced: result.synced,
      });

      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to connect to Strava";
      setError(message);
      setSyncStatus({ phase: "error", message });
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [connectStravaAction]);

  return {
    connect,
    isConnecting,
    error,
    syncStatus,
  };
}

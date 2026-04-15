/**
 * useStrava - Hook for connecting to Strava via server-side OAuth (Soma v0.10.0).
 *
 * Wraps useStravaAuth with status tracking. The OAuth flow and initial
 * data sync happen server-side during the in-app browser session.
 */

import { useState, useCallback } from "react";
import { useStravaAuth } from "./use-strava-auth";

export type StravaSyncStatus = {
  phase: "idle" | "connecting" | "complete" | "error";
  message: string;
};

export function useStrava() {
  const stravaAuth = useStravaAuth();

  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<StravaSyncStatus>({
    phase: "idle",
    message: "",
  });

  const connect = useCallback(async (): Promise<boolean> => {
    setIsConnecting(true);
    setError(null);
    setSyncStatus({
      phase: "connecting",
      message: "Connecting to Strava...",
    });

    try {
      const success = await stravaAuth.connect();

      if (!success) {
        if (stravaAuth.error) {
          throw new Error(stravaAuth.error);
        }
        setSyncStatus({ phase: "idle", message: "" });
        return false;
      }

      setSyncStatus({
        phase: "complete",
        message: "Connected to Strava",
      });

      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to connect to Strava";
      setError(message);
      setSyncStatus({ phase: "error", message });
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [stravaAuth]);

  return {
    connect,
    isConnecting,
    error,
    syncStatus,
  };
}

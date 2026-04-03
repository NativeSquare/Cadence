/**
 * useGarmin - Hook for connecting to Garmin via server-side OAuth (Soma v0.9.4).
 *
 * Wraps useGarminAuth with status tracking. The OAuth flow and initial
 * data sync happen server-side during the in-app browser session.
 */

import { useState, useCallback } from "react";
import { useGarminAuth } from "./use-garmin-auth";

export type GarminSyncStatus = {
  phase: "idle" | "connecting" | "complete" | "error";
  message: string;
};

export function useGarmin() {
  const garminAuth = useGarminAuth();

  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<GarminSyncStatus>({
    phase: "idle",
    message: "",
  });

  const connect = useCallback(async (): Promise<boolean> => {
    setIsConnecting(true);
    setError(null);
    setSyncStatus({
      phase: "connecting",
      message: "Connecting to Garmin...",
    });

    try {
      const success = await garminAuth.connect();

      if (!success) {
        if (garminAuth.error) {
          throw new Error(garminAuth.error);
        }
        setSyncStatus({ phase: "idle", message: "" });
        return false;
      }

      setSyncStatus({
        phase: "complete",
        message: "Connected to Garmin",
      });

      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to connect to Garmin";
      setError(message);
      setSyncStatus({ phase: "error", message });
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [garminAuth]);

  return {
    connect,
    isConnecting,
    error,
    syncStatus,
  };
}

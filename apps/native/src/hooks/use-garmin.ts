/**
 * useGarmin - Hook for connecting to Garmin via the Soma component (v0.6.0).
 *
 * Uses the Garmin OAuth 2.0 flow via useGarminAuth. The native app
 * handles the OAuth redirect and code exchange with PKCE, then calls
 * the backend to complete the connection and initial data sync.
 */

import { useState, useCallback } from "react";
import { useGarminAuth } from "./use-garmin-auth";

export type GarminSyncStatus = {
  phase: "idle" | "connecting" | "syncing" | "complete" | "error";
  message: string;
  synced?: {
    activities: number;
    dailies: number;
    sleep: number;
    body: number;
    menstruation: number;
  };
};

export type GarminResult = {
  connectionId: string;
  synced: {
    activities: number;
    dailies: number;
    sleep: number;
    body: number;
    menstruation: number;
  };
};

function extractErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) {
    return "Failed to connect to Garmin";
  }

  const message = err.message;

  if (message.includes("Uncaught")) {
    const match = message.match(/Uncaught (\w+Error): (.+?)(?:\n|$)/);
    if (match) {
      return match[2].trim();
    }
  }

  if (message.includes("code") && message.includes("message")) {
    try {
      const parsed = JSON.parse(message);
      if (parsed.message) return parsed.message;
    } catch {
      // Not JSON, continue
    }
  }

  const firstLine = message.split("\n")[0];
  return firstLine || "Failed to connect to Garmin";
}

export function useGarmin() {
  const garminAuth = useGarminAuth();

  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<GarminSyncStatus>({
    phase: "idle",
    message: "",
  });

  const connect = useCallback(async (): Promise<GarminResult | null> => {
    setIsConnecting(true);
    setError(null);
    setSyncStatus({
      phase: "connecting",
      message: "Connecting to Garmin...",
    });

    try {
      setSyncStatus({
        phase: "syncing",
        message: "Syncing data from Garmin...",
      });

      const result = await garminAuth.connect();

      if (!result) {
        if (garminAuth.error) {
          throw new Error(garminAuth.error);
        }
        setSyncStatus({ phase: "idle", message: "" });
        return null;
      }

      const totalSynced =
        result.synced.activities +
        result.synced.dailies +
        result.synced.sleep +
        result.synced.body +
        result.synced.menstruation;

      setSyncStatus({
        phase: "complete",
        message: `Synced ${totalSynced} records from Garmin`,
        synced: result.synced,
      });

      return {
        connectionId: result.connectionId,
        synced: result.synced,
      };
    } catch (err) {
      const message = extractErrorMessage(err);
      setError(message);
      setSyncStatus({ phase: "error", message });
      return null;
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

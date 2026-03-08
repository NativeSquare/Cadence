/**
 * useGarmin - Hook for connecting to Garmin via the Soma component (v0.5.0).
 *
 * Uses the Garmin OAuth 1.0a flow via useGarminAuth. With Soma's
 * registerRoutes the token exchange and data sync happen server-side;
 * the hook only drives the browser session and confirms the connection.
 */

import { useState, useCallback } from "react";
import { useGarminAuth } from "./use-garmin-auth";

export type GarminSyncStatus = {
  phase: "idle" | "connecting" | "syncing" | "complete" | "error";
  message: string;
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

  const connect = useCallback(async (): Promise<boolean> => {
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
      const message = extractErrorMessage(err);
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

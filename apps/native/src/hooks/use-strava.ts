/**
 * useStrava - Hook for connecting to Strava via the Soma component.
 *
 * Development mode (__DEV__):
 * - Bypasses real Strava OAuth entirely
 * - Seeds mock activity data using the mock data generator (Story 4.2)
 * - Marks runner as Strava-connected
 *
 * Production mode:
 * - Uses real Strava OAuth flow via useStravaAuth hook
 */

import { api } from "@packages/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { useState, useCallback } from "react";
import { useStravaAuth } from "./use-strava-auth";

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

/**
 * Extract user-friendly error message from Convex errors.
 * Strips stack traces and technical details.
 */
function extractErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) {
    return "Failed to connect to Strava";
  }

  const message = err.message;

  // Handle Convex action errors which include "Uncaught" prefix and stack traces
  if (message.includes("Uncaught")) {
    // Extract just the error type and message
    const match = message.match(/Uncaught (\w+Error): (.+?)(?:\n|$)/);
    if (match) {
      return match[2].trim();
    }
  }

  // Handle ConvexError with code/message structure
  if (message.includes("code") && message.includes("message")) {
    try {
      const parsed = JSON.parse(message);
      if (parsed.message) return parsed.message;
    } catch {
      // Not JSON, continue
    }
  }

  // Return first line only (before any stack trace)
  const firstLine = message.split("\n")[0];
  return firstLine || "Failed to connect to Strava";
}

export function useStrava() {
  // Mock mutation for development
  const seedMockStrava = useMutation(
    api.integrations.strava.sync.seedMockStravaData,
  );

  // Real auth for production
  const stravaAuth = useStravaAuth();

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
      // In development, use mock data instead of real Strava API
      if (__DEV__) {
        setSyncStatus({
          phase: "syncing",
          message: "Generating mock Strava data...",
        });

        const result = await seedMockStrava({
          profile: "intermediate",
          weeks: 12,
        });

        setSyncStatus({
          phase: "complete",
          message: `Synced ${result.synced} mock activities`,
          synced: result.synced,
        });

        return result;
      }

      // Production: use real Strava OAuth
      setSyncStatus({
        phase: "syncing",
        message: "Syncing activities from Strava...",
      });

      const result = await stravaAuth.connect();

      if (!result) {
        // User cancelled or auth failed
        if (stravaAuth.error) {
          throw new Error(stravaAuth.error);
        }
        setSyncStatus({ phase: "idle", message: "" });
        return null;
      }

      setSyncStatus({
        phase: "complete",
        message: `Synced ${result.synced} activities from Strava`,
        synced: result.synced,
      });

      return {
        connectionId: result.connectionId,
        synced: result.synced,
        errors: [],
      };
    } catch (err) {
      const message = extractErrorMessage(err);
      setError(message);
      setSyncStatus({ phase: "error", message });
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [seedMockStrava, stravaAuth]);

  return {
    connect,
    isConnecting,
    error,
    syncStatus,
  };
}

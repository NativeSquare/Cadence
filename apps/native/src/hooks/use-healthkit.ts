import { api } from "@packages/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { useState, useCallback } from "react";
import {
  checkHealthKitAvailable,
  importHealthKitDataWithRaw,
  getHealthKitAuthStatus,
  checkIfAuthorizationDenied,
  openHealthSettings,
  PERMISSION_DENIED_GUIDANCE,
} from "@/lib/healthkit";

export type SyncStatus = {
  phase:
    | "idle"
    | "authorizing"
    | "fetching"
    | "syncing"
    | "complete"
    | "error"
    | "permission_denied";
  message: string;
  progress?: {
    inserted: number;
    updated: number;
    failed: number;
    total: number;
  };
};

export type HealthKitResult = {
  summary: string;
  totalRuns: number;
  syncStats: {
    inserted: number;
    updated: number;
    failed: number;
    total: number;
  };
};

export function useHealthKit() {
  const storeHealthData = useMutation(api.healthkit.storeHealthData);
  const syncActivities = useMutation(api.integrations.healthkit.sync.syncHealthKitActivities);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    phase: "idle",
    message: "",
  });

  const connect = async (): Promise<HealthKitResult | null> => {
    // Check availability before starting
    if (!checkHealthKitAvailable()) {
      setError("HealthKit is not available on this device");
      setSyncStatus({ phase: "error", message: "HealthKit not available" });
      return null;
    }

    setIsConnecting(true);
    setError(null);
    setPermissionDenied(false);
    setSyncStatus({ phase: "authorizing", message: "Requesting HealthKit access..." });

    try {
      // Run the full import pipeline with raw data (authorize → query → aggregate)
      setSyncStatus({ phase: "fetching", message: "Fetching workout data..." });
      const result = await importHealthKitDataWithRaw();

      // Check if we got no data - might indicate denied permission
      if (result.totalRuns === 0) {
        const isDenied = await checkIfAuthorizationDenied();
        if (isDenied) {
          setPermissionDenied(true);
          setSyncStatus({
            phase: "permission_denied",
            message: PERMISSION_DENIED_GUIDANCE.message,
          });
          setError(PERMISSION_DENIED_GUIDANCE.message);
          return null;
        }
      }

      // Store aggregates in the backend (runner profile)
      await storeHealthData({
        aggregates: {
          avgWeeklyVolume: result.aggregates.avgWeeklyVolume,
          volumeConsistency: result.aggregates.volumeConsistency,
          easyPaceActual: result.aggregates.easyPaceActual,
          longRunPattern: result.aggregates.longRunPattern,
          restDayFrequency: result.aggregates.restDayFrequency,
          trainingLoadTrend: result.aggregates.trainingLoadTrend,
          estimatedFitness: result.aggregates.estimatedFitness,
        },
        totalRuns: result.totalRuns,
      });

      // Sync individual activities to the database
      setSyncStatus({
        phase: "syncing",
        message: `Syncing ${result.rawWorkouts.length} activities...`,
      });

      const syncStats = await syncActivities({
        rawWorkouts: result.rawWorkouts,
      });

      setSyncStatus({
        phase: "complete",
        message: `Synced ${syncStats.inserted} new, ${syncStats.updated} updated activities`,
        progress: syncStats,
      });

      return {
        summary: result.summary,
        totalRuns: result.totalRuns,
        syncStats,
      };
    } catch (err) {
      // Check if error is due to permission denial
      const isDenied = await checkIfAuthorizationDenied();
      if (isDenied) {
        setPermissionDenied(true);
        setSyncStatus({
          phase: "permission_denied",
          message: PERMISSION_DENIED_GUIDANCE.message,
        });
        setError(PERMISSION_DENIED_GUIDANCE.message);
        return null;
      }

      const message =
        err instanceof Error
          ? err.message
          : "Failed to connect to Apple Health";
      setError(message);
      setSyncStatus({ phase: "error", message });
      return null;
    } finally {
      setIsConnecting(false);
    }
  };

  /**
   * Check current authorization status.
   * Useful for determining UI state before attempting connection.
   */
  const checkAuthStatus = useCallback(async () => {
    return getHealthKitAuthStatus();
  }, []);

  /**
   * Open iOS Settings to allow user to grant permissions.
   * Should be called when permissionDenied is true.
   */
  const openSettings = useCallback(() => {
    openHealthSettings();
  }, []);

  /**
   * Retry connection after user has updated permissions in Settings.
   * Resets the permission denied state and attempts reconnection.
   */
  const retryAfterSettings = useCallback(async () => {
    setPermissionDenied(false);
    setSyncStatus({ phase: "idle", message: "" });
    setError(null);
    return connect();
  }, [connect]);

  return {
    connect,
    isConnecting,
    error,
    syncStatus,
    permissionDenied,
    permissionGuidance: PERMISSION_DENIED_GUIDANCE,
    checkAuthStatus,
    openSettings,
    retryAfterSettings,
  };
}

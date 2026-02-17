import { api } from "@packages/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { useState, useCallback } from "react";
import {
  checkHealthKitAvailable,
  importAllHealthKitData,
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
    total: number;
    activities: number;
    sleep: number;
    body: number;
    daily: number;
    nutrition: number;
    menstruation: number;
    athlete: boolean;
  };
};

export type HealthKitResult = {
  summary: string;
  totalRuns: number;
  syncStats: {
    total: number;
    activities: { ingested: number; failed: number };
    sleep: { ingested: number; failed: number };
    body: { ingested: number; failed: number };
    daily: { ingested: number; failed: number };
    nutrition: { ingested: number; failed: number };
    menstruation: { ingested: number; failed: number };
    athlete: boolean;
  };
};

export function useHealthKit() {
  const storeHealthData = useMutation(api.healthkit.storeHealthData);
  const syncHealthKit = useMutation(
    api.integrations.healthkit.sync.syncHealthKitData,
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    phase: "idle",
    message: "",
  });

  const connect = async (): Promise<HealthKitResult | null> => {
    if (!checkHealthKitAvailable()) {
      setError("HealthKit is not available on this device");
      setSyncStatus({ phase: "error", message: "HealthKit not available" });
      return null;
    }

    setIsConnecting(true);
    setError(null);
    setPermissionDenied(false);
    setSyncStatus({
      phase: "authorizing",
      message: "Requesting HealthKit access...",
    });

    try {
      // Fetch all health data from HealthKit using Soma transformers
      setSyncStatus({
        phase: "fetching",
        message: "Fetching health data...",
      });
      const result = await importAllHealthKitData();

      // Check if we got no data - might indicate denied permission
      if (
        result.totalRuns === 0 &&
        result.activities.length === 0 &&
        result.sleep.length === 0
      ) {
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

      // Store aggregates in the runner profile (unchanged)
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

      // Sync all health data to the Soma component
      const totalRecords =
        result.activities.length +
        result.sleep.length +
        result.body.length +
        result.daily.length +
        result.nutrition.length +
        result.menstruation.length +
        (result.athlete ? 1 : 0);

      setSyncStatus({
        phase: "syncing",
        message: `Syncing ${totalRecords} health records...`,
      });

      const syncStats = await syncHealthKit({
        activities: result.activities,
        sleep: result.sleep,
        body: result.body,
        daily: result.daily,
        nutrition: result.nutrition,
        menstruation: result.menstruation,
        athlete: result.athlete ?? undefined,
      });

      setSyncStatus({
        phase: "complete",
        message: `Synced ${syncStats.total} health records`,
        progress: {
          total: syncStats.total,
          activities: syncStats.activities.ingested,
          sleep: syncStats.sleep.ingested,
          body: syncStats.body.ingested,
          daily: syncStats.daily.ingested,
          nutrition: syncStats.nutrition.ingested,
          menstruation: syncStats.menstruation.ingested,
          athlete: syncStats.athlete,
        },
      });

      return {
        summary: result.summary,
        totalRuns: result.totalRuns,
        syncStats,
      };
    } catch (err) {
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

  const checkAuthStatus = useCallback(async () => {
    return getHealthKitAuthStatus();
  }, []);

  const openSettings = useCallback(() => {
    openHealthSettings();
  }, []);

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

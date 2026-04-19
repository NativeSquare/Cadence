import { api } from "@packages/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { useState, useCallback } from "react";
import {
  checkHealthKitAvailable,
  importAllHealthKitData,
  getHealthKitAuthStatus,
  checkIfAuthorizationDenied,
  openHealthSettings,
  requestHealthKitAuthorization,
  PERMISSION_DENIED_GUIDANCE,
} from "@/lib/healthkit";
import type { HealthKitCollectedData } from "@/lib/healthkit";
import { useNetworkOptional } from "@/contexts/network-context";
import {
  getHealthKitSyncState,
  resetHealthKitSyncState,
  setHealthKitSyncState,
} from "./use-healthkit-sync-store";

export type ConnectResult = {
  connected: true;
};

const SYNC_DAYS = 90;
const CHUNK_SIZE = 1000;
const COMPLETE_RESET_DELAY_MS = 3000;

function chunk<T>(items: T[], size: number): T[][] {
  if (items.length === 0) return [];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

function computeTimeRange(days: number) {
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  return { start_time: start.toISOString(), end_time: end.toISOString() };
}

export function useHealthKit() {
  const connectMutation = useMutation(api.soma.healthkit.connect);
  const syncActivities = useMutation(api.soma.healthkit.syncActivities);
  const syncSleep = useMutation(api.soma.healthkit.syncSleep);
  const syncBody = useMutation(api.soma.healthkit.syncBody);
  const syncDaily = useMutation(api.soma.healthkit.syncDaily);
  const syncNutrition = useMutation(api.soma.healthkit.syncNutrition);
  const syncMenstruation = useMutation(api.soma.healthkit.syncMenstruation);
  const syncAthlete = useMutation(api.soma.healthkit.syncAthlete);

  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const network = useNetworkOptional();
  const isOffline = network?.isOffline ?? false;

  // ── Background sync ──────────────────────────────────────────────────────
  //
  // Runs after `connect` returns. Not awaited by the UI — phase is surfaced
  // via the shared sync store so the Connections row can show "Syncing…"
  // even if the caller unmounts. Each per-type array is chunked under
  // CHUNK_SIZE to stay below Convex's 8192-item array validator limit.
  const runBackgroundSync = useCallback(
    async (data: HealthKitCollectedData) => {
      const timeRange = computeTimeRange(SYNC_DAYS);

      setHealthKitSyncState({ phase: "syncing", error: undefined });

      const uploadChunks = async <T,>(
        type: string,
        items: T[],
        call: (batch: T[]) => Promise<unknown>,
      ) => {
        if (items.length === 0) return;
        for (const batch of chunk(items, CHUNK_SIZE)) {
          try {
            await call(batch);
          } catch (err) {
            if (__DEV__) {
              console.warn(`[HealthKit] ${type} chunk failed:`, err);
            }
          }
        }
      };

      await uploadChunks("workouts", data.workouts, (workouts) =>
        syncActivities({ workouts }),
      );
      await uploadChunks("sleepSessions", data.sleepSessions, (sessions) =>
        syncSleep({ sessions }),
      );
      await uploadChunks("bodySamples", data.bodySamples, (samples) =>
        syncBody({ samples, timeRange }),
      );
      await uploadChunks("dailySamples", data.dailySamples, (samples) =>
        syncDaily({ samples, timeRange }),
      );
      await uploadChunks("nutritionSamples", data.nutritionSamples, (samples) =>
        syncNutrition({ samples, timeRange }),
      );
      await uploadChunks(
        "menstruationSamples",
        data.menstruationSamples,
        (samples) => syncMenstruation({ samples, timeRange }),
      );

      if (data.characteristics) {
        try {
          await syncAthlete({ characteristics: data.characteristics });
        } catch (err) {
          if (__DEV__) {
            console.warn("[HealthKit] athlete characteristics failed:", err);
          }
        }
      }

      setHealthKitSyncState({ phase: "complete" });

      // Auto-reset to idle so the Connections row goes quiet.
      setTimeout(() => {
        if (getHealthKitSyncState().phase === "complete") {
          resetHealthKitSyncState();
        }
      }, COMPLETE_RESET_DELAY_MS);
    },
    [
      syncActivities,
      syncSleep,
      syncBody,
      syncDaily,
      syncNutrition,
      syncMenstruation,
      syncAthlete,
    ],
  );

  // ── Connect flow (fast, blocking) ────────────────────────────────────────
  //
  // Phase 1 only: request permissions, register the connection. Data fetch
  // + upload happens in `runBackgroundSync`, which is not awaited.
  const connect = useCallback(async (): Promise<ConnectResult | null> => {
    if (isConnecting) return null;

    if (isOffline) {
      setError("No network connection. Please check your internet and try again.");
      return null;
    }

    if (!checkHealthKitAvailable()) {
      setError("HealthKit is not available on this device");
      return null;
    }

    // Guard: don't start a new sync while one is in flight.
    const currentPhase = getHealthKitSyncState().phase;
    if (currentPhase === "syncing") {
      return null;
    }

    setIsConnecting(true);
    setError(null);
    setPermissionDenied(false);
    setHealthKitSyncState({ phase: "connecting", error: undefined });

    try {
      // iOS permission sheet. `requestAuthorization` resolves `true` whether
      // the user grants or denies — we detect denial via a follow-up query.
      await requestHealthKitAuthorization();

      const isDenied = await checkIfAuthorizationDenied();
      if (isDenied) {
        setPermissionDenied(true);
        setError(PERMISSION_DENIED_GUIDANCE.message);
        resetHealthKitSyncState();
        return null;
      }

      // Mark the connection active server-side. The Connections screen's
      // `listConnections` subscription will flip the row to "Connected"
      // within one Convex round-trip — before any data is uploaded.
      await connectMutation();

      // Kick off the background sync without awaiting. The UI returns to
      // the caller immediately; the user can navigate away while data
      // uploads in the background.
      void (async () => {
        try {
          const data = await importAllHealthKitData(SYNC_DAYS);
          await runBackgroundSync(data);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Background sync failed";
          setHealthKitSyncState({ phase: "error", error: message });
          if (__DEV__) console.warn("[HealthKit] background sync failed:", err);
        }
      })();

      return { connected: true };
    } catch (err) {
      const isDenied = await checkIfAuthorizationDenied();
      if (isDenied) {
        setPermissionDenied(true);
        setError(PERMISSION_DENIED_GUIDANCE.message);
        resetHealthKitSyncState();
        return null;
      }
      const message =
        err instanceof Error ? err.message : "Failed to connect to Apple Health";
      setError(message);
      setHealthKitSyncState({ phase: "error", error: message });
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, isOffline, connectMutation, runBackgroundSync]);

  const checkAuthStatus = useCallback(async () => {
    return getHealthKitAuthStatus();
  }, []);

  const openSettings = useCallback(() => {
    openHealthSettings();
  }, []);

  const retryAfterSettings = useCallback(async (): Promise<ConnectResult | null> => {
    if (isConnecting) return null;
    setPermissionDenied(false);
    setError(null);
    return connect();
  }, [isConnecting, connect]);

  return {
    connect,
    isConnecting,
    error,
    permissionDenied,
    permissionGuidance: PERMISSION_DENIED_GUIDANCE,
    checkAuthStatus,
    openSettings,
    retryAfterSettings,
    isOffline,
  };
}

import { api } from "@packages/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { useState } from "react";
import {
  checkHealthKitAvailable,
  importHealthKitData,
} from "@/lib/healthkit";
import type { HealthKitImportResult } from "@/lib/healthkit";

export type HealthKitResult = {
  summary: string;
  totalRuns: number;
};

export function useHealthKit() {
  const storeHealthData = useMutation(api.healthkit.storeHealthData);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async (): Promise<HealthKitResult | null> => {
    // Check availability before starting
    if (!checkHealthKitAvailable()) {
      setError("HealthKit is not available on this device");
      return null;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Run the full import pipeline (authorize → query → aggregate)
      const result: HealthKitImportResult = await importHealthKitData();

      // Store aggregates in the backend
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

      return {
        summary: result.summary,
        totalRuns: result.totalRuns,
      };
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to connect to Apple Health";
      setError(message);
      return null;
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

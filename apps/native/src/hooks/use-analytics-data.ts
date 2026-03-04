/**
 * useAnalyticsData Hook - Data fetching and computation for Analytics screen
 *
 * Features:
 * - Placement gate check via getCompletedRunCount
 * - Radar chart data via getRadarChartData
 * - Race predictions via getRacePredictions
 * - Health metrics via getHealthMetrics
 * - Activities for volume/pace/zone computation
 * - Mock data fallback for development
 * - Pre-computed chart data arrays for victory-native (stable refs)
 */

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";

import {
  MOCK_VOLUME_DATA,
  MOCK_PACE_DATA,
  MOCK_WEEKLY_KM,
  MOCK_ZONE_DATA,
  MOCK_MULTI_WEEK_ZONE_DATA,
  MOCK_STATS,
  MOCK_VOLUME_STATS,
  MOCK_PREDICTIONS,
  MOCK_VDOT,
  MOCK_HEALTH_METRICS,
  PLAN_PROGRESS,
  DAY_LABELS,
  TODAY_INDEX,
  CURRENT_WEEK,
  type RacePrediction,
  type HealthMetric,
  type WeekZoneData,
} from "@/components/app/analytics/mock-data";

import type { RadarDataPoint } from "@/components/app/onboarding/viz/RadarChart";

export type HistogramDatum = {
  day: number;
  km: number;
  [key: string]: unknown;
};

export type ZoneChartDatum = {
  day: number;
  z2: number;
  z3: number;
  z4: number;
  [key: string]: unknown;
};

export type VolumeChartDatum = {
  week: number;
  volume: number;
  [key: string]: unknown;
};

export type PaceChartDatum = {
  week: number;
  pace: number;
  [key: string]: unknown;
};

export interface AnalyticsData {
  planProgress: typeof PLAN_PROGRESS;
  currentWeek: number;

  volumeStats: {
    currentVolume: number;
    plannedVolume: number;
    weekOverWeekChange: number;
    streak: number;
    streakDays: boolean[];
  };

  dayLabels: string[];
  todayIndex: number;

  histogramChartData: HistogramDatum[];
  zoneChartData: ZoneChartDatum[];
  multiWeekZoneData: WeekZoneData[];
  volumeChartData: VolumeChartDatum[];
  paceChartData: PaceChartDatum[];

  stats: typeof MOCK_STATS;

  radarData: RadarDataPoint[];
  predictions: RacePrediction[];
  vdot: number;
  healthMetrics: HealthMetric[];
}

export interface PlacementStatus {
  completedRuns: number;
  threshold: number;
  isUnlocked: boolean;
}

export interface UseAnalyticsDataResult {
  data: AnalyticsData | null;
  placement: PlacementStatus | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch and compute analytics data.
 * Queries placement gate, radar, predictions, health metrics, and activities.
 * Falls back to mock data when real data is unavailable.
 */
export function useAnalyticsData(): UseAnalyticsDataResult {
  const placementResult = useQuery(
    api.training.queries.getCompletedRunCount
  );

  const radarResult = useQuery(
    api.training.queries.getRacePredictions
  );

  const healthResult = useQuery(
    api.training.queries.getHealthMetrics
  );

  // Activities for chart data (uncomment when ready for real data):
  // const activities = useQuery(api.table.activities.listMyActivities, {
  //   startTime: getWeekStartTimestamp(),
  //   endTime: new Date().toISOString(),
  //   order: "asc",
  // });
  // const runner = useQuery(api.table.runners.getCurrentRunner);

  const placement = useMemo<PlacementStatus | null>(() => {
    if (placementResult === undefined) return null;
    if (placementResult === null) {
      return { completedRuns: 0, threshold: 10, isUnlocked: false };
    }
    return placementResult;
  }, [placementResult]);

  const data = useMemo<AnalyticsData>(() => {
    const predictions = radarResult?.predictions ?? MOCK_PREDICTIONS;
    const vdot = radarResult?.vdot ?? MOCK_VDOT;

    const healthMetrics: HealthMetric[] = healthResult
      ? [
          ...(healthResult.restingHr != null
            ? [
                {
                  label: "Resting HR",
                  value: healthResult.restingHr,
                  unit: "bpm",
                  trend: "stable" as const,
                },
              ]
            : []),
          ...(healthResult.hrv != null
            ? [
                {
                  label: "HRV",
                  value: healthResult.hrv,
                  unit: "ms",
                  trend: "stable" as const,
                  dark: true,
                },
              ]
            : []),
          ...(healthResult.sleepScore != null
            ? [
                {
                  label: "Sleep Score",
                  value: healthResult.sleepScore,
                  trend: "stable" as const,
                },
              ]
            : []),
          ...(healthResult.readinessScore != null
            ? [
                {
                  label: "Readiness",
                  value: healthResult.readinessScore,
                  trend: "stable" as const,
                  dark: true,
                },
              ]
            : []),
        ]
      : MOCK_HEALTH_METRICS;

    return {
      planProgress: PLAN_PROGRESS,
      currentWeek: CURRENT_WEEK,

      volumeStats: {
        currentVolume: MOCK_VOLUME_STATS.currentVolume,
        plannedVolume: MOCK_VOLUME_STATS.plannedVolume,
        weekOverWeekChange: MOCK_VOLUME_STATS.weekOverWeekChange,
        streak: MOCK_VOLUME_STATS.streak,
        streakDays: MOCK_VOLUME_STATS.streakDays,
      },

      dayLabels: DAY_LABELS,
      todayIndex: TODAY_INDEX,

      histogramChartData: MOCK_WEEKLY_KM.map((km, i) => ({ day: i, km })),
      zoneChartData: MOCK_ZONE_DATA.map((zone, i) => ({
        day: i,
        z2: zone.z2,
        z3: zone.z3,
        z4: zone.z4,
      })),
      multiWeekZoneData: MOCK_MULTI_WEEK_ZONE_DATA,
      volumeChartData: MOCK_VOLUME_DATA.map((volume, i) => ({
        week: i + 1,
        volume,
      })),
      paceChartData: MOCK_PACE_DATA.map((pace, i) => ({
        week: i + 1,
        pace,
      })),

      stats: MOCK_STATS,

      radarData: MOCK_PREDICTIONS.length > 0
        ? [
            { label: "Endurance", value: 75 },
            { label: "Speed", value: 65 },
            { label: "Recovery", value: 40 },
            { label: "Consistency", value: 85 },
            { label: "Injury Risk", value: 55 },
            { label: "Race Ready", value: 50 },
          ]
        : [],
      predictions,
      vdot,
      healthMetrics,
    };
  }, [radarResult, healthResult]);

  const isLoading =
    placementResult === undefined;

  return {
    data,
    placement,
    isLoading,
    error: null,
  };
}

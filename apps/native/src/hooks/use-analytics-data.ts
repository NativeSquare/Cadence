/**
 * useAnalyticsData Hook - Data fetching and computation for Analytics screen
 *
 * Fetches all analytics data from the backend composite query and maps it
 * into the shapes expected by chart components. Falls back to mock data
 * when the backend has no real data (no plan, no activities).
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
  MOCK_ZONE_BREAKDOWN,
  MOCK_STATS,
  MOCK_VOLUME_STATS,
  MOCK_PREDICTIONS,
  MOCK_VDOT,
  MOCK_HEALTH_METRICS,
  MOCK_VOLUME_BY_TIMEFRAME,
  VOLUME_X_LABELS,
  VOLUME_UNIT_LABELS,
  PLAN_PROGRESS,
  DAY_LABELS,
  TODAY_INDEX,
  CURRENT_WEEK,
  type RacePrediction,
  type HealthMetric,
  type WeekZoneData,
  type ZoneBreakdownData,
} from "@/components/app/analytics/mock-data";
import type { TimeFrame } from "@/components/shared/time-frame-selector";
import type { VolumeBarDatum } from "@/components/app/analytics/volume-bar-chart";

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

export type PredictionTrendDatum = {
  week: number;
  timeSeconds: number;
  [key: string]: unknown;
};

export type VolumeTimeframeBucket = {
  values: number[];
  labels: string[];
};

export interface AnalyticsData {
  planProgress: Array<{
    week: number;
    completed: boolean;
    current: boolean;
    phase: string;
  }>;
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

  stats: {
    totalDistance: number;
    totalPlanned: number;
    sessions: number;
    sessionsPlanned: number;
    longestRun: number;
    longestRunWeek: number;
  };

  zoneBreakdown: ZoneBreakdownData[];
  radarData: RadarDataPoint[];
  predictions: RacePrediction[];
  vdot: number;
  healthMetrics: HealthMetric[];

  volumeByTimeframe: Record<string, VolumeTimeframeBucket>;
}

export interface UseAnalyticsDataResult {
  data: AnalyticsData | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch and compute analytics data.
 * Queries the composite analytics endpoint plus placement, predictions,
 * and health metrics. Falls back to mock data when real data is unavailable.
 */
export function useAnalyticsData(): UseAnalyticsDataResult {
  const radarResult = useQuery(
    api.training.queries.getRacePredictions
  );

  const healthResult = useQuery(
    api.training.queries.getHealthMetrics
  );

  const analyticsResult = useQuery(
    api.training.analytics.getAnalyticsScreenData
  );

  const data = useMemo<AnalyticsData>(() => {
    const predictions = radarResult?.predictions ?? MOCK_PREDICTIONS;
    const vdot = radarResult?.vdot ?? MOCK_VDOT;

    const healthMetrics: HealthMetric[] = healthResult
      ? [
          ...(healthResult.restingHr != null
            ? [
                {
                  metricKey: "restingHr" as const,
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
                  metricKey: "hrv" as const,
                  label: "HRV",
                  value: healthResult.hrv,
                  unit: "ms",
                  trend: "stable" as const,
                },
              ]
            : []),
          ...(healthResult.sleepScore != null
            ? [
                {
                  metricKey: "sleepScore" as const,
                  label: "Sleep Score",
                  value: healthResult.sleepScore,
                  trend: "stable" as const,
                },
              ]
            : []),
          ...(healthResult.weight != null
            ? [
                {
                  metricKey: "weight" as const,
                  label: "Body Weight",
                  value: healthResult.weight,
                  unit: "kg",
                  trend: "stable" as const,
                },
              ]
            : []),
          {
            metricKey: "calories" as const,
            label: "Calories",
            value: 2450,
            unit: "kcal",
            subtitle: "Daily avg",
            trend: "stable" as const,
          },
          {
            metricKey: "spo2" as const,
            label: "SpO2",
            value: 97,
            unit: "%",
            subtitle: "Normal range",
            trend: "stable" as const,
          },
        ]
      : MOCK_HEALTH_METRICS;

    // When backend data is available, use it; otherwise fall back to mocks
    const be = analyticsResult;

    const planProgress = be != null && be.planProgress.length > 0
      ? be.planProgress
      : PLAN_PROGRESS;

    const currentWeek = be != null && be.currentWeek > 0
      ? be.currentWeek
      : CURRENT_WEEK;

    const volumeStats = be != null
      ? be.volumeStats
      : {
          currentVolume: MOCK_VOLUME_STATS.currentVolume,
          plannedVolume: MOCK_VOLUME_STATS.plannedVolume,
          weekOverWeekChange: MOCK_VOLUME_STATS.weekOverWeekChange,
          streak: MOCK_VOLUME_STATS.streak,
          streakDays: MOCK_VOLUME_STATS.streakDays,
        };

    const dayLabels = be != null ? be.dayLabels : DAY_LABELS;
    const todayIndex = be != null ? be.todayIndex : TODAY_INDEX;

    const histogramChartData: HistogramDatum[] = be != null
      ? be.dailyKm.map((km: number, i: number) => ({ day: i, km }))
      : MOCK_WEEKLY_KM.map((km, i) => ({ day: i, km }));

    const zoneChartData: ZoneChartDatum[] = be != null
      ? be.dailyZones.map((z: { z2: number; z3: number; z4: number }, i: number) => ({ day: i, z2: z.z2, z3: z.z3, z4: z.z4 }))
      : MOCK_ZONE_DATA.map((zone, i) => ({
          day: i,
          z2: zone.z2,
          z3: zone.z3,
          z4: zone.z4,
        }));

    const multiWeekZoneData: WeekZoneData[] = be != null
      ? be.multiWeekZones
      : MOCK_MULTI_WEEK_ZONE_DATA;

    const volumeChartData: VolumeChartDatum[] = be != null
      ? be.weeklyVolumes.map((volume: number, i: number) => ({ week: i + 1, volume }))
      : MOCK_VOLUME_DATA.map((volume, i) => ({ week: i + 1, volume }));

    const paceChartData: PaceChartDatum[] = be != null
      ? be.weeklyPaces.map((pace: number, i: number) => ({ week: i + 1, pace }))
      : MOCK_PACE_DATA.map((pace, i) => ({ week: i + 1, pace }));

    const stats = be != null
      ? be.stats
      : MOCK_STATS;

    const zoneBreakdown: ZoneBreakdownData[] = be != null
      ? be.zoneBreakdown
      : MOCK_ZONE_BREAKDOWN;

    const radarData: RadarDataPoint[] = be != null && be.radarData.length > 0
      ? be.radarData
      : [
          { label: "Endurance", value: 75 },
          { label: "Speed", value: 65 },
          { label: "Recovery", value: 40 },
          { label: "Consistency", value: 85 },
          { label: "Injury Risk", value: 55 },
          { label: "Race Ready", value: 50 },
        ];

    const volumeByTimeframe: Record<string, VolumeTimeframeBucket> = be != null
      ? be.volumeByTimeframe
      : Object.fromEntries(
          (["7d", "1mo", "3mo", "6mo", "1yr"] as const).map((tf) => [
            tf,
            {
              values: MOCK_VOLUME_BY_TIMEFRAME[tf],
              labels: VOLUME_X_LABELS[tf],
            },
          ]),
        );

    return {
      planProgress,
      currentWeek,
      volumeStats,
      dayLabels,
      todayIndex,
      histogramChartData,
      zoneChartData,
      multiWeekZoneData,
      volumeChartData,
      paceChartData,
      stats,
      zoneBreakdown,
      radarData,
      predictions,
      vdot,
      healthMetrics,
      volumeByTimeframe,
    };
  }, [radarResult, healthResult, analyticsResult]);

  const isLoading = analyticsResult === undefined;

  return {
    data,
    isLoading,
    error: null,
  };
}

export interface VolumeBarChartData {
  barData: VolumeBarDatum[];
  labels: string[];
  total: number;
  unitLabel: string;
}

export function getVolumeBarData(
  timeFrame: TimeFrame,
  volumeByTimeframe?: Record<string, VolumeTimeframeBucket>,
): VolumeBarChartData {
  const bucket = volumeByTimeframe?.[timeFrame];
  if (bucket) {
    const barData = bucket.values.map((volume, i) => ({ index: i, volume }));
    const total = Math.round(bucket.values.reduce((sum, v) => sum + v, 0));
    return { barData, labels: bucket.labels, total, unitLabel: VOLUME_UNIT_LABELS[timeFrame] };
  }

  const values = MOCK_VOLUME_BY_TIMEFRAME[timeFrame];
  const labels = VOLUME_X_LABELS[timeFrame];
  const unitLabel = VOLUME_UNIT_LABELS[timeFrame];
  const barData = values.map((volume, i) => ({ index: i, volume }));
  const total = Math.round(values.reduce((sum, v) => sum + v, 0));
  return { barData, labels, total, unitLabel };
}

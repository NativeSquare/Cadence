/**
 * useAnalyticsData Hook - Data fetching and computation for Analytics screen
 * Reference: Story 10.4 - Task 7.1
 *
 * Features:
 * - Query activities via api.table.activities.listMyActivities
 * - Query runner via api.table.runners.getCurrentRunner
 * - Compute weekly aggregates
 * - Return loading/error/data states
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
  MOCK_STATS,
  MOCK_VOLUME_STATS,
  PLAN_PROGRESS,
  DAY_LABELS,
  TODAY_INDEX,
  CURRENT_WEEK,
} from "@/components/app/analytics/mock-data";

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

  // Pre-computed chart data for victory-native
  histogramChartData: HistogramDatum[];
  zoneChartData: ZoneChartDatum[];
  volumeChartData: VolumeChartDatum[];
  paceChartData: PaceChartDatum[];

  stats: typeof MOCK_STATS;
}

export interface UseAnalyticsDataResult {
  data: AnalyticsData | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch and compute analytics data.
 * Pre-computes chart data arrays in victory-native format as stable references.
 */
export function useAnalyticsData(): UseAnalyticsDataResult {
  // Uncomment these when ready to use real data:
  // const activities = useQuery(api.table.activities.listMyActivities, {
  //   startTime: getWeekStartTimestamp(),
  //   endTime: Date.now(),
  //   order: "asc",
  // });
  // const runner = useQuery(api.table.runners.getCurrentRunner);

  const data = useMemo<AnalyticsData>(() => {
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
      volumeChartData: MOCK_VOLUME_DATA.map((volume, i) => ({
        week: i + 1,
        volume,
      })),
      paceChartData: MOCK_PACE_DATA.map((pace, i) => ({
        week: i + 1,
        pace,
      })),

      stats: MOCK_STATS,
    };
  }, []);

  return {
    data,
    isLoading: false,
    error: null,
  };
}

function getWeekStartTimestamp(): number {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday.getTime();
}

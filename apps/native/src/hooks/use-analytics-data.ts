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
 */

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";

// Import mock data for fallback
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

export interface AnalyticsData {
  // Plan progress
  planProgress: typeof PLAN_PROGRESS;
  currentWeek: number;

  // Volume stats
  volumeStats: {
    currentVolume: number;
    plannedVolume: number;
    weekOverWeekChange: number;
    streak: number;
    streakDays: boolean[];
  };

  // Weekly data for histograms
  weeklyKm: number[];
  zoneData: typeof MOCK_ZONE_DATA;
  dayLabels: string[];
  todayIndex: number;

  // Trend data for line charts
  volumeTrend: number[];
  paceTrend: number[];

  // Stats grid data
  stats: typeof MOCK_STATS;
}

export interface UseAnalyticsDataResult {
  data: AnalyticsData | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch and compute analytics data
 *
 * Currently uses mock data with optional real data integration.
 * To enable real data, uncomment the Convex queries and adjust
 * the computation logic accordingly.
 */
export function useAnalyticsData(): UseAnalyticsDataResult {
  // Uncomment these when ready to use real data:
  // const activities = useQuery(api.table.activities.listMyActivities, {
  //   startTime: getWeekStartTimestamp(),
  //   endTime: Date.now(),
  //   order: "asc",
  // });
  // const runner = useQuery(api.table.runners.getCurrentRunner);

  // For now, use mock data
  const data = useMemo<AnalyticsData>(() => {
    return {
      // Plan progress
      planProgress: PLAN_PROGRESS,
      currentWeek: CURRENT_WEEK,

      // Volume stats
      volumeStats: {
        currentVolume: MOCK_VOLUME_STATS.currentVolume,
        plannedVolume: MOCK_VOLUME_STATS.plannedVolume,
        weekOverWeekChange: MOCK_VOLUME_STATS.weekOverWeekChange,
        streak: MOCK_VOLUME_STATS.streak,
        streakDays: MOCK_VOLUME_STATS.streakDays,
      },

      // Weekly data for histograms
      weeklyKm: MOCK_WEEKLY_KM,
      zoneData: MOCK_ZONE_DATA,
      dayLabels: DAY_LABELS,
      todayIndex: TODAY_INDEX,

      // Trend data for line charts
      volumeTrend: MOCK_VOLUME_DATA,
      paceTrend: MOCK_PACE_DATA,

      // Stats grid data
      stats: MOCK_STATS,
    };
  }, []);

  return {
    data,
    isLoading: false,
    error: null,
  };
}

/**
 * Helper: Get week start timestamp (Monday 00:00:00)
 */
function getWeekStartTimestamp(): number {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Monday start
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday.getTime();
}

/**
 * Helper: Compute weekly aggregates from activities
 * (To be implemented when real data is available)
 */
// function computeWeeklyAggregates(activities: Activity[]): WeeklyAggregates {
//   // Group activities by day
//   // Sum distance per day
//   // Calculate zone splits
//   // Compute week-over-week comparisons
// }

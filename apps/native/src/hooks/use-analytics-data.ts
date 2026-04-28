/**
 * Analytics data hook — stubbed during agoge migration.
 *
 * Previous implementation composed trainingPlans + plannedSessions +
 * runners.currentState. Those tables are gone. Until the analytics screen is
 * rebuilt against agoge workouts + zones + events the hook returns an
 * empty-shape payload so the Analytics screen renders its empty state.
 *
 * TODO(agoge-migration): replace with a real aggregator over the agoge
 * queries + components.soma.public.listActivities.
 */

export function useAnalyticsData() {
  return {
    isLoading: false,
    hasData: false,
    radarData: null,
    progressionData: null,
    racePredictions: null,
    healthMetrics: null,
  } as const;
}

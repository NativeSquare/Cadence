/**
 * Analytics data hook — stubbed during agoge migration.
 *
 * Previous implementation composed trainingPlans + plannedSessions +
 * runners.currentState. Those tables are gone. Derived analytics (ATL/CTL/TSB)
 * now come from plan/state.ts; the full analytics screen is rebuilt against
 * agoge workouts + zones + events in a follow-up. Until then the hook returns
 * an empty-shape payload so the Analytics screen renders its empty state.
 *
 * TODO(agoge-migration): replace with a real aggregator over api.plan.reads.*
 * + components.soma.public.listActivities + plan/state.ts.
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

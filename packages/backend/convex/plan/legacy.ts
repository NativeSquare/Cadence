/**
 * Stub queries the frontend still depends on.
 *
 * These returned rich Cadence-specific shapes (weeklyPlan, radar chart data,
 * progression data) computed from the deleted training tables. Real
 * agoge-backed replacements land with the plan generator port. Until then,
 * returning null/empty keeps the UI compiling and rendering empty states.
 *
 * TODO(agoge-migration): delete as each real replacement lands.
 */

import { query } from "../_generated/server";

export const getActivePlanForRunner = query({
  args: {},
  handler: async (): Promise<null> => null,
});

export const getWeekSessions = query({
  args: {},
  handler: async (): Promise<[]> => [],
});

export const getProgressionChartData = query({
  args: {},
  handler: async (): Promise<null> => null,
});

export const getRadarChartData = query({
  args: {},
  handler: async (): Promise<null> => null,
});

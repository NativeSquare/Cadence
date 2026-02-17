// =============================================================================
// Line-based Decision Tree (Legacy/Terminal Style)
// =============================================================================
// Kept for backwards compatibility with terminal-style display.

import type { ActivityInsights, InsightLine, ConfidenceLevel } from "./types";
import { formatPace, formatDistance, formatNumber } from "./format-utils";

/**
 * Generate insight lines based on activity data (terminal style).
 * @deprecated Use buildInsightCards for card-based UI
 */
export function selectInsightLines(insights: ActivityInsights): InsightLine[] {
  const lines: InsightLine[] = [];

  // System lines
  lines.push({ type: "sys", text: "Connecting to Strava..." });
  lines.push({ type: "sys", text: `Found ${insights.totalRuns} activities.` });
  lines.push({ type: "sys", text: "Analyzing last 12 months..." });
  lines.push({ type: "sp", text: "" });

  // Recency
  if (insights.daysSinceLastRun > 14 && insights.daysSinceLastRun < Infinity) {
    lines.push({
      type: "warn",
      text:
        insights.daysSinceLastRun > 90
          ? `Last run: ${insights.daysSinceLastRun} days ago. Long break.`
          : `Last run: ${insights.daysSinceLastRun} days ago.`,
    });
  }

  // Consistency
  if (insights.activeWeeksLast12 >= 10) {
    lines.push({
      type: "pos",
      text: `${insights.activeWeeksLast12}/12 weeks active. That's elite consistency.`,
    });
  } else if (insights.activeWeeksLast12 >= 6) {
    lines.push({
      type: "dat",
      text: `${insights.activeWeeksLast12}/12 weeks active. Solid foundation.`,
    });
  }

  // Volume
  if (insights.avgWeeklyKm >= 25) {
    lines.push({
      type: "dat",
      text: `Weekly volume: ${formatDistance(insights.avgWeeklyKm)}.`,
    });
  }

  // Speed
  if (insights.fastestPace !== null && insights.fastestPace < 5.5) {
    lines.push({
      type: "pos",
      text: `Fastest pace: ${formatPace(insights.fastestPace)}/km.`,
    });
  }

  lines.push({ type: "sp", text: "" });

  const confidence: ConfidenceLevel =
    insights.totalRuns >= 20 ? "HIGH" : insights.totalRuns >= 10 ? "MODERATE" : "LOW";
  lines.push({
    type: "res",
    text: `Profile confidence: ${confidence}`,
  });

  return lines;
}

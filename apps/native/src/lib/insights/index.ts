// =============================================================================
// Insights Module
// =============================================================================
// Exports for the Data Insights Screen.

export { computeInsights } from "./compute-insights";
export {
  buildInsightCards,
  getConfidenceLevel,
  getCoachClosingMessage,
} from "./decision-tree";
export { selectInsightLines } from "./decision-tree-lines";
export {
  formatPace,
  formatDistance,
  formatDate,
  formatRelativeDate,
  formatNumber,
  distanceComparison,
  runnerIdentity,
} from "./format-utils";
export type {
  SomaActivity,
  ActivityInsights,
  InsightLine,
  InsightLineType,
  InsightCard,
  AccentColor,
  ConfidenceLevel,
} from "./types";

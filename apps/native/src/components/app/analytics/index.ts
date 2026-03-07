/**
 * Analytics Components Index
 * Story 10.4 - Analytics Screen (Analytics Tab)
 */

export { AnalyticsScreen } from "./AnalyticsScreen";
export { PlacementGate } from "./placement-gate";
export { PlanProgress } from "./PlanProgress";
export { RunnerProfileCard } from "./runner-profile-card";
export { PredictionCard } from "./prediction-card";
export { HealthMetricsCard } from "./health-metrics-card";
export { WeekVolumeCard } from "./WeekVolumeCard";
export { StreakCard } from "./StreakCard";
export { Histogram, type HistogramProps } from "./Histogram";
export {
  StackedHistogram,
  WeeklyZoneChart,
  ZoneLegend,
  type StackedHistogramProps,
  type WeeklyZoneChartProps,
} from "./StackedHistogram";
export { PaceChart, type LineChartProps } from "./LineChart";
export { VolumeBarChart, type VolumeBarDatum } from "./volume-bar-chart";
export { StatsGrid, type StatsGridProps, type StatItem } from "./StatsGrid";

// Mock data exports for development
export * from "./mock-data";

/**
 * Analytics Components Index
 * Story 10.4 - Analytics Screen (Analytics Tab)
 */

export { AnalyticsScreen } from "./AnalyticsScreen";
export { PlanProgress } from "./PlanProgress";
export { WeekVolumeCard } from "./WeekVolumeCard";
export { StreakCard } from "./StreakCard";
export { Histogram, type HistogramProps } from "./Histogram";
export {
  StackedHistogram,
  ZoneLegend,
  type StackedHistogramProps,
  type ZoneData,
} from "./StackedHistogram";
export { LineChart, VolumeChart, PaceChart, type LineChartProps } from "./LineChart";
export { StatsGrid, type StatsGridProps, type StatItem } from "./StatsGrid";

// Mock data exports for development
export * from "./mock-data";

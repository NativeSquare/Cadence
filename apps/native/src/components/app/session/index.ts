/**
 * Session Detail Screen components
 * Story 10.6: Session Detail Screen (Pre-Workout)
 */

export { SessionDetailScreen } from "./SessionDetailScreen";
export type { SessionDetailScreenProps } from "./SessionDetailScreen";

export { SessionDetailHeader, ZoneBadge } from "./SessionDetailHeader";
export type { SessionDetailHeaderProps } from "./SessionDetailHeader";

export { CollapsedHeader } from "./CollapsedHeader";
export type { CollapsedHeaderProps } from "./CollapsedHeader";

export { CoachInsightCard } from "./CoachInsightCard";
export type { CoachInsightCardProps } from "./CoachInsightCard";

export { IntensityProfileChart } from "./IntensityProfileChart";
export type { IntensityProfileChartProps } from "./IntensityProfileChart";

export { WorkoutStructure } from "./WorkoutStructure";
export type { WorkoutStructureProps } from "./WorkoutStructure";

export { OverviewGrid } from "./OverviewGrid";
export type { OverviewGridProps } from "./OverviewGrid";

export { FocusPoints } from "./FocusPoints";
export type { FocusPointsProps } from "./FocusPoints";

export { WeekContextBar } from "./WeekContextBar";
export type { WeekContextBarProps } from "./WeekContextBar";

export { StartSessionCTA } from "./StartSessionCTA";
export type { StartSessionCTAProps } from "./StartSessionCTA";

// Active Session Screen (Story 10.6 - Active Workout)
export { ActiveSessionScreen } from "./ActiveSessionScreen";
export type { ActiveSessionScreenProps } from "./ActiveSessionScreen";

export * from "./types";
export { getSessionDetail, getAllSessionDetails, MOCK_SESSION_DETAILS } from "./mock-data";

// Debrief Screen components (Story 10.7)
export { DebriefScreen } from "./DebriefScreen";
export type { DebriefScreenProps } from "./DebriefScreen";

export { DebriefHeader } from "./DebriefHeader";
export type { DebriefHeaderProps, StatItem } from "./DebriefHeader";

export { FeelingSelector, FEELING_OPTIONS } from "./FeelingSelector";
export type { FeelingSelectorProps, FeelingValue } from "./FeelingSelector";

export { QuickTagPills, DEBRIEF_PILLS } from "./QuickTagPills";
export type { QuickTagPillsProps } from "./QuickTagPills";

export { DebriefNoteInput } from "./DebriefNoteInput";
export type { DebriefNoteInputProps } from "./DebriefNoteInput";

export { VoiceRecorderMode } from "./VoiceRecorderMode";
export type { VoiceRecorderModeProps } from "./VoiceRecorderMode";

export { CoachResponseCard } from "./CoachResponseCard";
export type { CoachResponseCardProps } from "./CoachResponseCard";

export { DebriefSummary } from "./DebriefSummary";
export type { DebriefSummaryProps } from "./DebriefSummary";

export { CelebrationOverlay } from "./CelebrationOverlay";
export type { CelebrationOverlayProps } from "./CelebrationOverlay";

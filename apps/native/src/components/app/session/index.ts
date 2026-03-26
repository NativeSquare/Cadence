/**
 * Session Detail components
 */

// Unified Session Detail Page (replaces old SessionDetailScreen, SessionBriefSheet, CalendarSessionSheet)
export { SessionDetailPage } from "./session-detail-page";
export type { SessionDetailPageProps } from "./session-detail-page";

export { SessionHeader } from "./session-header";
export type { SessionHeaderProps } from "./session-header";

export { SessionStatsRow } from "./session-stats-row";
export type { SessionStatsRowProps } from "./session-stats-row";

export { SessionStructure } from "./session-structure";
export type { SessionStructureProps } from "./session-structure";

export { SessionCoachInsight } from "./session-coach-insight";
export type { SessionCoachInsightProps } from "./session-coach-insight";

export { SessionCompletedComparison } from "./session-completed-comparison";
export type { SessionCompletedComparisonProps } from "./session-completed-comparison";

export { SessionActionsBar } from "./session-actions-bar";
export type { SessionActionsBarProps } from "./session-actions-bar";

// Legacy sub-components still used by other screens
export { CoachInsightCard } from "./CoachInsightCard";
export type { CoachInsightCardProps } from "./CoachInsightCard";

export { IntensityProfileChart } from "./IntensityProfileChart";
export type { IntensityProfileChartProps } from "./IntensityProfileChart";

export { OverviewGrid } from "./OverviewGrid";
export type { OverviewGridProps } from "./OverviewGrid";

export { FocusPoints } from "./FocusPoints";
export type { FocusPointsProps } from "./FocusPoints";

export { StartSessionCTA } from "./StartSessionCTA";
export type { StartSessionCTAProps } from "./StartSessionCTA";

// Active Session Screen (Story 10.6 - Active Workout)
export { ActiveSessionScreen } from "./ActiveSessionScreen";
export type { ActiveSessionScreenProps } from "./ActiveSessionScreen";

export * from "./types";
export { getSessionDetail, getAllSessionDetails, MOCK_SESSION_DETAILS } from "./mock-data";

// Session Debrief Card (inline debrief in session detail)
export { SessionDebriefCard } from "./session-debrief-card";
export type { SessionDebriefCardProps } from "./session-debrief-card";

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

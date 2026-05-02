/**
 * Session Detail components
 */

export { SessionHeader } from "./session-header";
export type { SessionHeaderProps } from "./session-header";

export { SessionStatsRow } from "./session-stats-row";
export type { SessionStatsRowProps } from "./session-stats-row";

export { SessionStructure } from "./session-structure";
export type { SessionStructureProps } from "./session-structure";

export { SessionCoachInsight } from "./session-coach-insight";
export type { SessionCoachInsightProps } from "./session-coach-insight";

export { SessionWhyCallout } from "./session-why-callout";
export type { SessionWhyCalloutProps } from "./session-why-callout";

export { SessionFocusCue } from "./session-focus-cue";
export type { SessionFocusCueProps } from "./session-focus-cue";

export { SessionSplitsTable } from "./session-splits-table";
export type { SessionSplitsTableProps } from "./session-splits-table";

export { SessionHrZones } from "./session-hr-zones";
export type { SessionHrZonesProps } from "./session-hr-zones";

export { SessionPaceChart } from "./session-pace-chart";
export type { SessionPaceChartProps } from "./session-pace-chart";

export { SessionContextCard } from "./session-context-card";
export type { SessionContextCardProps } from "./session-context-card";

export { SessionCompletedComparison } from "./session-completed-comparison";
export type { SessionCompletedComparisonProps } from "./session-completed-comparison";

export { SessionActionsBar } from "./session-actions-bar";
export type { SessionActionsBarProps } from "./session-actions-bar";

export { IntensityProfileChart } from "./IntensityProfileChart";
export type { IntensityProfileChartProps } from "./IntensityProfileChart";

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

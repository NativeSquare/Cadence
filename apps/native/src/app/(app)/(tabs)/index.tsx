import { PlanScreen } from "@/components/app/plan/PlanScreen";

/**
 * Today Tab - Daily Training Plan
 * Renders the PlanScreen component which shows:
 * - Date header with greeting and week indicator
 * - 7-day calendar strip with activity dots
 * - Today's session card with coach message
 * - Coming up section with upcoming sessions
 * - Weekly stats (volume and streak)
 *
 * Reference: cadence-full-v9.jsx TodayTab component (lines 119-244)
 */
export default function Home() {
  return <PlanScreen />;
}

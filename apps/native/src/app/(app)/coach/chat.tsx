import { CoachScreen } from "@/components/app/coach";

/**
 * The free-form Coach chat — a pushed Stack route, no longer the Coach tab
 * itself. The tab is the dashboard (a vertical read); this is the drill-in
 * conversation, reached via the dashboard's "Pose-moi une question" card.
 * `CoachScreen` (the thread resolver) is reused unchanged; `ChatHeader` adds
 * the back affordance for this pushed context.
 */
export default function CoachChat() {
  return <CoachScreen />;
}

import { CoachScreen } from "@/components/app/coach";

/**
 * Coach Tab - AI Coaching Conversation
 * Renders the CoachScreen component which shows:
 * - Chat header with title and status
 * - Message history with coach/user bubbles
 * - Tool cards for data display (Training Load, etc.)
 * - Typing indicator when coach is responding
 * - Text input with mic and send buttons
 * - Voice recording mode with waveform
 *
 * Reference: cadence-full-v9.jsx CoachTab component (lines 248-397)
 * Source: Story 10.3
 */
export default function Coach() {
  return <CoachScreen />;
}

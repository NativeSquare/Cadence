/**
 * Tool-card registry — maps a tool name to its card component.
 *
 * Adding a card for a new writing tool: drop a `<MyToolCard>` file in this
 * folder, wrap its body in `<ProposalCard>` for the shared title/footer
 * chrome, and register it below. Tools without a registered card render
 * nothing (writing) or as a `ReadingToolPill` (reading).
 *
 * Writing tools always render — they execute immediately, so the card is a
 * read-only summary of what just happened. There is no approval flow.
 */

import type { ToolCardComponent } from "./types";
import { CorrectActualCard } from "./CorrectActualCard";
import { MarkWorkoutStatusCard } from "./MarkWorkoutStatusCard";
import { ProposalCard } from "./ProposalCard";
import { ReadingToolPill } from "./ReadingToolPill";
import { RequestRescheduleCard } from "./RequestRescheduleCard";

const writingCards: Record<string, ToolCardComponent> = {
  markWorkoutStatus: MarkWorkoutStatusCard,
  correctActual: CorrectActualCard,
  requestReschedule: RequestRescheduleCard,
};

const readingCards: Record<string, ToolCardComponent> = {};

/**
 * Whether a tool name is registered as a writing tool. Used by the chat list
 * to suppress silent-retry tool calls — writing tools whose validation
 * preflight returned errors and whose execute() short-circuited without
 * mutating anything. Such calls leave behind tool parts with `output.ok ===
 * false`; we hide them so the chat doesn't surface validation noise.
 */
export function isKnownWritingTool(toolName: string): boolean {
  return toolName in writingCards;
}

export function resolveToolCard(args: {
  toolName: string;
  isWriting: boolean;
}): ToolCardComponent | null {
  const { toolName, isWriting } = args;
  if (isWriting) {
    return writingCards[toolName] ?? null;
  }
  return readingCards[toolName] ?? ReadingToolPill;
}

export type { ToolCardProps, ToolCardComponent } from "./types";
export { ProposalCard, ReadingToolPill };

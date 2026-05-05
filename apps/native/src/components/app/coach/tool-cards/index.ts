/**
 * Tool-card registry — maps a tool name to its card component.
 *
 * Adding a card for a new writing tool: drop a `<MyToolCard>` file in this
 * folder and register it below. Tools without a registered card fall back
 * to `PendingActionCard`. Reading-tool calls render via `ReadingToolPill`
 * unless overridden here.
 */

import type { ToolCardComponent } from "./types";
import { PendingActionCard } from "./PendingActionCard";
import { ReadingToolPill } from "./ReadingToolPill";

/** Per-tool overrides. Empty until specific cards are added. */
const writingCards: Record<string, ToolCardComponent> = {
  // modifySession: ModifySessionCard,
};

const readingCards: Record<string, ToolCardComponent> = {
  // listRecentSessions: RecentSessionsList,
};

export function resolveToolCard(args: {
  toolName: string;
  isWriting: boolean;
}): ToolCardComponent {
  const { toolName, isWriting } = args;
  if (isWriting) {
    return writingCards[toolName] ?? PendingActionCard;
  }
  return readingCards[toolName] ?? ReadingToolPill;
}

export type { ToolCardProps, ToolCardComponent } from "./types";
export { PendingActionCard, ReadingToolPill };

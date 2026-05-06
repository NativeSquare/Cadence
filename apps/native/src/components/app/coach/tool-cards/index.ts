/**
 * Tool-card registry — maps a tool name to its card component.
 *
 * Adding a card for a new writing tool: drop a `<MyToolCard>` file in this
 * folder, wrap its body in `<ProposalCard>` for the shared title/footer
 * chrome, and register it below. Tools without a registered card fall
 * back to `PendingActionCard`. Reading-tool calls render via
 * `ReadingToolPill` unless overridden here.
 */

import type { ToolCardComponent } from "./types";
import { CreateBlockCard } from "./CreateBlockCard";
import { CreateWorkoutCard } from "./CreateWorkoutCard";
import { DeleteBlockCard } from "./DeleteBlockCard";
import { DeleteWorkoutCard } from "./DeleteWorkoutCard";
import { PendingActionCard } from "./PendingActionCard";
import { ProposalCard } from "./ProposalCard";
import { ReadingToolPill } from "./ReadingToolPill";
import { RescheduleWorkoutCard } from "./RescheduleWorkoutCard";
import { UpdateBlockCard } from "./UpdateBlockCard";
import { UpdateWorkoutCard } from "./UpdateWorkoutCard";

const writingCards: Record<string, ToolCardComponent> = {
  createWorkout: CreateWorkoutCard,
  updateWorkout: UpdateWorkoutCard,
  rescheduleWorkout: RescheduleWorkoutCard,
  deleteWorkout: DeleteWorkoutCard,
  createBlock: CreateBlockCard,
  updateBlock: UpdateBlockCard,
  deleteBlock: DeleteBlockCard,
};

const readingCards: Record<string, ToolCardComponent> = {};

/**
 * Whether a tool name is registered as a writing tool. The UI uses this to
 * recognize silent-retry tool calls — writing tools whose `needsApproval`
 * preflight returned false and whose execute() ran silently. Such parts
 * carry no approval signals, so the part-shape heuristic (`isWritingToolPart`)
 * misses them; the registry is the source of truth.
 */
export function isKnownWritingTool(toolName: string): boolean {
  return toolName in writingCards;
}

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
export { PendingActionCard, ProposalCard, ReadingToolPill };

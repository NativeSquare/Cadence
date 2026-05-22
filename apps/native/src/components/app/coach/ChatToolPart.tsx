/**
 * Renders a single tool message part as a compact reading pill. The coach's
 * only "writing" tool is `rememberAboutAthlete`, which is silent in chat —
 * `resolveToolCard` returns null for it so nothing renders here.
 */

import { getToolPartName, type ToolPart } from "@/lib/ai-stream";
import { resolveToolCard } from "./tool-cards";

interface ChatToolPartProps {
  part: ToolPart;
}

export function ChatToolPart({ part }: ChatToolPartProps) {
  const toolName = getToolPartName(part);
  const Card = resolveToolCard(toolName);
  if (!Card) return null;

  return (
    <Card
      toolCallId={part.toolCallId}
      toolName={toolName}
      state={part.state}
      input={part.input}
      output={part.output}
      errorText={part.errorText}
    />
  );
}

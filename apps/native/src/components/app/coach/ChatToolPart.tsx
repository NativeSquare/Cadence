/**
 * Renders a single tool message part — dispatches to the tool-cards registry.
 *
 * Reading tools render as a compact pill. Writing tools render as a card
 * showing what the coach just did (no approval flow — writes are immediate).
 *
 * Silent-retry writing-tool calls render nothing. When a writing tool's
 * inline validation fails, `execute()` returns `{ ok: false, errors }` so the
 * LLM can retry with corrected args; the resulting tool part is noise the
 * athlete should not see.
 */

import { getToolPartName, type ToolPart } from "@/lib/ai-stream";
import { isKnownWritingTool, resolveToolCard } from "./tool-cards";

interface ChatToolPartProps {
  part: ToolPart;
}

export function ChatToolPart({ part }: ChatToolPartProps) {
  const toolName = getToolPartName(part);
  const isWriting = isKnownWritingTool(toolName);

  if (isWriting && isSilentRetryFailure(part)) {
    return null;
  }

  const Card = resolveToolCard({ toolName, isWriting });
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

function isSilentRetryFailure(part: ToolPart): boolean {
  if (part.state !== "output-available") return false;
  const out = part.output as { ok?: boolean } | undefined;
  return out?.ok === false;
}

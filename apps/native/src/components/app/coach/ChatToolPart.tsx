/**
 * Renders a single tool message part — dispatches to the tool-cards registry.
 *
 * Reading tools (no approval ever requested) render as a compact pill.
 * Writing tools (any approval state seen on the part) render as a card with
 * Accept/Deny when in `approval-requested` state.
 */

import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { extractToolName, type ToolMessagePart } from "@/lib/ai-stream";
import { resolveToolCard } from "./tool-cards";

interface ChatToolPartProps {
  part: ToolMessagePart;
  onRespond: (args: {
    approvalId: string;
    approved: boolean;
    reason?: string;
  }) => Promise<void>;
}

export function ChatToolPart({ part, onRespond }: ChatToolPartProps) {
  const toolName = extractToolName(part);
  const isWriting =
    !!part.approval ||
    part.state === "approval-requested" ||
    part.state === "approval-responded";
  const Card = resolveToolCard({ toolName, isWriting });

  const [busy, setBusy] = useState(false);

  const respond = useCallback(
    async (approved: boolean) => {
      const approvalId = part.approval?.id;
      if (!approvalId || busy) return;
      setBusy(true);
      try {
        await onRespond({ approvalId, approved });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        Alert.alert("Could not submit response", message);
      } finally {
        setBusy(false);
      }
    },
    [part.approval?.id, busy, onRespond],
  );

  return (
    <Card
      toolCallId={part.toolCallId}
      toolName={toolName}
      state={part.state}
      input={part.input}
      output={part.output}
      errorText={part.errorText}
      approvalId={part.approval?.id}
      onAccept={() => respond(true)}
      onDeny={() => respond(false)}
      busy={busy}
    />
  );
}

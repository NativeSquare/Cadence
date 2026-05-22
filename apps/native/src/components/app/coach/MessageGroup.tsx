import { View } from "react-native";
import type { UIMessage } from "@convex-dev/agent/react";
import { ChatMessage as ChatMessageBubble } from "./ChatMessage";
import { ChatAttachmentBubble } from "./ChatAttachmentBubble";
import { ChatToolPart } from "./ChatToolPart";
import {
  getToolPartName,
  isToolPart,
  type ToolPart,
} from "@/lib/ai-stream";
import { isKnownWritingTool } from "./tool-cards";

interface MessageGroupProps {
  message: UIMessage;
}

function isSilentRetryFailure(part: ToolPart): boolean {
  if (part.state !== "output-available") return false;
  const out = part.output as { ok?: boolean } | undefined;
  return out?.ok === false;
}

export function hasRenderableParts(message: UIMessage): boolean {
  return message.parts.some((part) => {
    if (part.type === "text") return !!part.text;
    if (part.type === "file") return true;
    if (!isToolPart(part)) return false;
    if (
      isKnownWritingTool(getToolPartName(part)) &&
      isSilentRetryFailure(part)
    ) {
      return false;
    }
    return true;
  });
}

export function MessageGroup({ message }: MessageGroupProps) {
  const isCoach = message.role === "assistant";
  const isMessageStreaming = message.status === "streaming";
  const lastIdx = message.parts.length - 1;

  return (
    <View className="gap-4">
      {message.parts.map((part, idx) => {
        if (part.type === "text") {
          if (!part.text) return null;
          return (
            <ChatMessageBubble
              key={idx}
              text={part.text}
              isStreaming={isMessageStreaming && idx === lastIdx}
              isCoach={isCoach}
            />
          );
        }
        if (part.type === "file") {
          return (
            <ChatAttachmentBubble
              key={idx}
              mediaType={part.mediaType}
              url={part.url}
              filename={part.filename}
              isUser={!isCoach}
            />
          );
        }
        if (!isToolPart(part)) return null;
        return <ChatToolPart key={idx} part={part} />;
      })}
    </View>
  );
}

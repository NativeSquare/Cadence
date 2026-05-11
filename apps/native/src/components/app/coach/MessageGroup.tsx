import { View } from "react-native";
import type { UIMessage } from "@convex-dev/agent/react";
import { ChatMessage as ChatMessageBubble } from "./ChatMessage";
import { ChatAttachmentBubble } from "./ChatAttachmentBubble";
import { ChatToolPart } from "./ChatToolPart";
import {
  getToolPartName,
  isToolPart,
  isWritingToolPart,
} from "@/lib/ai-stream";
import { isKnownWritingTool } from "./tool-cards";

interface MessageGroupProps {
  message: UIMessage;
  onToolRespond: (args: {
    approvalId: string;
    approved: boolean;
    reason?: string;
  }) => Promise<void>;
}

export function hasRenderableParts(message: UIMessage): boolean {
  return message.parts.some((part) => {
    if (part.type === "text") return !!part.text;
    if (part.type === "file") return true;
    if (!isToolPart(part)) return false;
    if (
      !isWritingToolPart(part) &&
      isKnownWritingTool(getToolPartName(part))
    ) {
      return false;
    }
    return true;
  });
}

export function MessageGroup({
  message,
  onToolRespond,
}: MessageGroupProps) {
  const isCoach = message.role === "assistant";
  const isMessageStreaming = message.status === "streaming";
  const lastIdx = message.parts.length - 1;

  return (
    <View style={{ gap: 16 }}>
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
        if (
          !isWritingToolPart(part) &&
          isKnownWritingTool(getToolPartName(part))
        ) {
          return null;
        }
        return (
          <ChatToolPart key={idx} part={part} onRespond={onToolRespond} />
        );
      })}
    </View>
  );
}

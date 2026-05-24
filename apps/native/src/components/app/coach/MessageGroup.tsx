import { View } from "react-native";
import type { UIMessage } from "@convex-dev/agent/react";
import { ChatMessage as ChatMessageBubble } from "./ChatMessage";
import { ChatAttachmentBubble } from "./ChatAttachmentBubble";
import { ChatToolPart } from "./ChatToolPart";
import { getToolPartName, isToolPart } from "@/lib/ai-stream";

interface MessageGroupProps {
  message: UIMessage;
}

const SILENT_TOOLS = new Set(["rememberAboutAthlete"]);

// Tool-call pills are dev-only. In production the Coach speaks for itself —
// surfacing "reading..." chips breaks the illusion of a human coach.
const SHOW_TOOL_PARTS = __DEV__;

export function hasRenderableParts(message: UIMessage): boolean {
  return message.parts.some((part) => {
    if (part.type === "text") return !!part.text;
    if (part.type === "file") return true;
    if (!isToolPart(part)) return false;
    if (!SHOW_TOOL_PARTS) return false;
    return !SILENT_TOOLS.has(getToolPartName(part));
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
        if (!SHOW_TOOL_PARTS) return null;
        return <ChatToolPart key={idx} part={part} />;
      })}
    </View>
  );
}

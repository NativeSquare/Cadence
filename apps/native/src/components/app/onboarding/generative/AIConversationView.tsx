/**
 * AI Conversation View
 *
 * Renders AI conversation messages using MessageParts.
 * Integrates with useAIChat hook for streaming responses.
 *
 * Source: Story 2.2 - AC#1, AC#4
 */

import { useCallback, useRef, useEffect } from "react";
import { ScrollView, View } from "react-native";
import { MessageParts } from "./MessageParts";
import { ToolStateProvider } from "./tool-state-context";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/hooks/use-ai-chat";
import type { MessagePart as GenMessagePart } from "./types";

// =============================================================================
// Types
// =============================================================================

interface AIConversationViewProps {
  /** Messages from useAIChat */
  messages: ChatMessage[];
  /** Whether a response is currently streaming */
  isStreaming: boolean;
  /** Called when user submits a tool response */
  onToolSubmit?: (toolCallId: string, value: unknown) => void;
  /** Called when text streaming completes */
  onTextComplete?: () => void;
  /** Additional className */
  className?: string;
  /** Whether to auto-scroll to bottom */
  autoScroll?: boolean;
}

// =============================================================================
// Message Conversion
// =============================================================================

/**
 * Convert ChatMessage parts to GenMessagePart format
 */
function convertParts(parts: ChatMessage["parts"]): GenMessagePart[] {
  return parts.map((part) => {
    if (part.type === "text") {
      return { type: "text" as const, text: part.text };
    }
    if (part.type === "tool-call") {
      return {
        type: "tool-call" as const,
        toolCallId: part.toolCallId,
        toolName: part.toolName,
        args: part.args,
      };
    }
    if (part.type === "tool-result") {
      return {
        type: "tool-result" as const,
        toolCallId: part.toolCallId,
        toolName: part.toolName,
        result: part.result,
      };
    }
    // Fallback - shouldn't happen but TypeScript needs it
    return { type: "text" as const, text: "" };
  });
}

// =============================================================================
// Message Renderer
// =============================================================================

interface MessageRowProps {
  message: ChatMessage;
  isStreaming: boolean;
  onToolSubmit?: (toolCallId: string, value: unknown) => void;
  onTextComplete?: () => void;
}

function MessageRow({
  message,
  isStreaming,
  onToolSubmit,
  onTextComplete,
}: MessageRowProps) {
  // Only render assistant messages with parts
  if (message.role !== "assistant" || message.parts.length === 0) {
    return null;
  }

  const parts = convertParts(message.parts);

  return (
    <MessageParts
      parts={parts}
      isStreaming={isStreaming && message.isStreaming}
      onToolSubmit={onToolSubmit}
      onTextComplete={onTextComplete}
    />
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function AIConversationView({
  messages,
  isStreaming,
  onToolSubmit,
  onTextComplete,
  className,
  autoScroll = true,
}: AIConversationViewProps) {
  const scrollRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (autoScroll && messages.length > 0) {
      const timer = setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, autoScroll]);

  // Get the latest assistant message for streaming
  const lastAssistantMessage = messages
    .filter((m) => m.role === "assistant")
    .pop();

  const handleToolSubmit = useCallback(
    (toolCallId: string, value: unknown) => {
      onToolSubmit?.(toolCallId, value);
    },
    [onToolSubmit]
  );

  return (
    <ToolStateProvider>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ flexGrow: 1 }}
        contentContainerClassName="px-6 pt-safe pb-12"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        className={cn("flex-1", className)}
      >
        <View className="flex-1 justify-end min-h-full pt-20 gap-6">
          {messages
            .filter((m) => m.role === "assistant" && m.parts.length > 0)
            .map((message, index) => (
              <MessageRow
                key={message.id}
                message={message}
                isStreaming={isStreaming && message.id === lastAssistantMessage?.id}
                onToolSubmit={handleToolSubmit}
                onTextComplete={
                  message.id === lastAssistantMessage?.id
                    ? onTextComplete
                    : undefined
                }
              />
            ))}
        </View>
      </ScrollView>
    </ToolStateProvider>
  );
}

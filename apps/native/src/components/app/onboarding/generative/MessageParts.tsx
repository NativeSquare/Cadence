/**
 * Message Parts Renderer
 *
 * Iterates over message.parts array and renders each part appropriately.
 * Text parts use StreamingText, tool parts use ToolRenderer.
 *
 * Source: Story 2.2 - AC#1, AC#4
 */

import { useCallback, useMemo, memo } from "react";
import { View } from "react-native";
import { StreamingText } from "../streaming-text";
import { ToolRenderer } from "./tool-renderer";
import { cn } from "@/lib/utils";
import type { MessagePart, ToolState } from "./types";
import type { StreamPhrase } from "@/hooks/use-streaming-text";

// =============================================================================
// Types
// =============================================================================

interface MessagePartsProps {
  /** Array of message parts to render */
  parts: MessagePart[];
  /** Whether the message is still streaming */
  isStreaming?: boolean;
  /** Called when user submits a tool response */
  onToolSubmit?: (toolCallId: string, value: unknown) => void;
  /** Called when all text streaming completes */
  onTextComplete?: () => void;
  /** Additional className for container */
  className?: string;
}

// =============================================================================
// Part Renderers
// =============================================================================

interface TextPartRendererProps {
  text: string;
  isStreaming: boolean;
  onComplete?: () => void;
}

const TextPartRenderer = memo(function TextPartRenderer({
  text,
  isStreaming,
  onComplete,
}: TextPartRendererProps) {
  // Convert text to StreamPhrase format
  // Split by sentences for natural streaming
  const phrases: StreamPhrase[] = useMemo(() => {
    // Split text into sentences/phrases
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];

    return sentences.map((sentence, index) => ({
      text: sentence.trim(),
      haptic: index === 0 ? ("arrival" as const) : undefined,
      pauseAfter: 300,
    }));
  }, [text]);

  // If not streaming, just display the text immediately
  if (!isStreaming) {
    return (
      <View className="gap-4">
        {phrases.map((phrase, index) => (
          <View key={index}>
            <StreamingText
              phrases={[phrase]}
              charDelay={0}
              autoStart={true}
            />
          </View>
        ))}
      </View>
    );
  }

  return (
    <StreamingText
      phrases={phrases}
      charDelay={12}
      defaultPause={400}
      onComplete={onComplete}
    />
  );
});

interface ToolPartRendererProps {
  toolCallId: string;
  toolName: string;
  args?: unknown;
  result?: unknown;
  state: ToolState;
  onSubmit?: (value: unknown) => void;
}

const ToolPartRenderer = memo(function ToolPartRenderer({
  toolCallId,
  toolName,
  args,
  result,
  state,
  onSubmit,
}: ToolPartRendererProps) {
  return (
    <ToolRenderer
      toolCallId={toolCallId}
      toolName={toolName}
      state={state}
      args={args}
      result={result}
      onSubmit={onSubmit}
    />
  );
});

// =============================================================================
// Main Component
// =============================================================================

export const MessageParts = memo(function MessageParts({
  parts,
  isStreaming = false,
  onToolSubmit,
  onTextComplete,
  className,
}: MessagePartsProps) {
  // Track tool call -> result mapping for state determination
  const toolResultMap = useMemo(() => {
    const map = new Map<string, unknown>();
    parts.forEach((part) => {
      if (part.type === "tool-result") {
        map.set(part.toolCallId, part.result);
      }
    });
    return map;
  }, [parts]);

  // Determine tool state based on whether we have a result
  const getToolState = useCallback(
    (toolCallId: string, hasArgs: boolean): ToolState => {
      if (toolResultMap.has(toolCallId)) {
        return "result";
      }
      if (hasArgs) {
        return "call";
      }
      return "streaming";
    },
    [toolResultMap]
  );

  // Handle tool submission
  const handleToolSubmit = useCallback(
    (toolCallId: string) => (value: unknown) => {
      onToolSubmit?.(toolCallId, value);
    },
    [onToolSubmit]
  );

  // Filter out tool-result parts (they're merged with tool-call parts)
  const renderableParts = useMemo(() => {
    return parts.filter((part) => part.type !== "tool-result");
  }, [parts]);

  return (
    <View className={cn("gap-5", className)}>
      {renderableParts.map((part, index) => {
        const key = part.type === "tool-call" ? part.toolCallId : `text-${index}`;
        const isLastPart = index === renderableParts.length - 1;

        switch (part.type) {
          case "text":
            return (
              <TextPartRenderer
                key={key}
                text={part.text}
                isStreaming={isStreaming && isLastPart}
                onComplete={isLastPart ? onTextComplete : undefined}
              />
            );

          case "tool-call":
            return (
              <ToolPartRenderer
                key={key}
                toolCallId={part.toolCallId}
                toolName={part.toolName}
                args={part.args}
                result={toolResultMap.get(part.toolCallId)}
                state={getToolState(part.toolCallId, !!part.args)}
                onSubmit={handleToolSubmit(part.toolCallId)}
              />
            );

          default:
            return null;
        }
      })}
    </View>
  );
});

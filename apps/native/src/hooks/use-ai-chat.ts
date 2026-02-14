import { useAuthToken } from "@convex-dev/auth/react";
import { useCallback, useRef, useState } from "react";
import {
  streamWithReconnect,
  type MessagePart,
  type StreamMessage,
  type ToolCall,
  type ToolResult,
} from "@/lib/ai-stream";

/**
 * AI Chat Hook
 *
 * React hook for streaming AI conversations.
 * Handles SSE connection, message state, and tool calls.
 *
 * Source: Story 2.1 - AC#2
 */

// =============================================================================
// Types
// =============================================================================

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  parts: MessagePart[];
  isStreaming: boolean;
  createdAt: number;
}

export interface UseAIChatOptions {
  /** Convex site URL (defaults to EXPO_PUBLIC_CONVEX_URL with .site suffix) */
  convexSiteUrl?: string;
  /** Conversation ID for persistence */
  conversationId?: string;
  /** Called when a tool is invoked */
  onToolCall?: (toolCall: ToolCall) => void;
  /** Called when a tool returns a result */
  onToolResult?: (toolResult: ToolResult) => void;
  /** Called when an error occurs */
  onError?: (error: Error) => void;
  /** Called when streaming completes */
  onComplete?: (message: ChatMessage) => void;
  /** Initial messages to populate chat */
  initialMessages?: ChatMessage[];
}

export interface UseAIChatReturn {
  /** All messages in the conversation */
  messages: ChatMessage[];
  /** Whether a response is currently streaming */
  isStreaming: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Send a message and get streaming response */
  sendMessage: (content: string) => Promise<void>;
  /** Append a message without sending (for system messages) */
  appendMessage: (message: Omit<ChatMessage, "id" | "createdAt">) => void;
  /** Clear all messages */
  clearMessages: () => void;
  /** Abort current stream */
  abort: () => void;
  /** Retry last failed message */
  retry: () => Promise<void>;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useAIChat(options: UseAIChatOptions = {}): UseAIChatReturn {
  const {
    convexSiteUrl = getConvexSiteUrl(),
    conversationId,
    onToolCall,
    onToolResult,
    onError,
    onComplete,
    initialMessages = [],
  } = options;

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastUserMessageRef = useRef<string | null>(null);

  // Get auth token from Convex
  const authToken = useAuthToken();

  /**
   * Send a message and stream the response
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!authToken) {
        const authError = new Error("Not authenticated");
        setError(authError);
        onError?.(authError);
        return;
      }

      if (isStreaming) {
        return; // Don't allow concurrent streams
      }

      // Store for retry
      lastUserMessageRef.current = content;

      // Add user message
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        role: "user",
        content,
        parts: [{ type: "text", text: content }],
        isStreaming: false,
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);
      setError(null);

      // Create placeholder assistant message
      const assistantMessageId = `assistant_${Date.now()}`;
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        parts: [],
        isStreaming: true,
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Set up abort controller
      abortControllerRef.current = new AbortController();

      try {
        // Build message history for context
        const messageHistory = messages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }));

        // Add current user message
        messageHistory.push({ role: "user", content });

        const streamMessage = await streamWithReconnect({
          convexSiteUrl,
          authToken,
          messages: messageHistory,
          conversationId,
          signal: abortControllerRef.current.signal,
          onTextDelta: (text) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessageId
                  ? { ...m, content: m.content + text }
                  : m
              )
            );
          },
          onToolCall: (toolCall) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      parts: [
                        ...m.parts,
                        {
                          type: "tool-call" as const,
                          toolCallId: toolCall.toolCallId,
                          toolName: toolCall.toolName,
                          args: toolCall.args,
                        },
                      ],
                    }
                  : m
              )
            );
            onToolCall?.(toolCall);
          },
          onToolResult: (toolResult) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      parts: [
                        ...m.parts,
                        {
                          type: "tool-result" as const,
                          toolCallId: toolResult.toolCallId,
                          toolName: toolResult.toolName,
                          result: toolResult.result,
                        },
                      ],
                    }
                  : m
              )
            );
            onToolResult?.(toolResult);
          },
          onError: (err) => {
            setError(err);
            onError?.(err);
          },
        });

        // Finalize message
        const finalMessage: ChatMessage = {
          id: assistantMessageId,
          role: "assistant",
          content: streamMessage.content,
          parts: streamMessage.parts,
          isStreaming: false,
          createdAt: assistantMessage.createdAt,
        };

        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMessageId ? finalMessage : m))
        );

        onComplete?.(finalMessage);
      } catch (err) {
        const chatError = err instanceof Error ? err : new Error(String(err));
        setError(chatError);
        onError?.(chatError);

        // Mark message as failed
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? { ...m, isStreaming: false, content: m.content || "[Error]" }
              : m
          )
        );
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [authToken, isStreaming, messages, convexSiteUrl, conversationId, onToolCall, onToolResult, onError, onComplete]
  );

  /**
   * Append a message without sending
   */
  const appendMessage = useCallback(
    (message: Omit<ChatMessage, "id" | "createdAt">) => {
      const fullMessage: ChatMessage = {
        ...message,
        id: `${message.role}_${Date.now()}`,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, fullMessage]);
    },
    []
  );

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  /**
   * Abort current stream
   */
  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  /**
   * Retry last failed message
   */
  const retry = useCallback(async () => {
    if (lastUserMessageRef.current) {
      // Remove the last failed assistant message
      setMessages((prev) => {
        const lastIndex = prev.length - 1;
        if (lastIndex >= 0 && prev[lastIndex].role === "assistant") {
          return prev.slice(0, -1);
        }
        return prev;
      });

      // Also remove the user message we're about to retry
      setMessages((prev) => {
        const lastIndex = prev.length - 1;
        if (lastIndex >= 0 && prev[lastIndex].role === "user") {
          return prev.slice(0, -1);
        }
        return prev;
      });

      await sendMessage(lastUserMessageRef.current);
    }
  }, [sendMessage]);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    appendMessage,
    clearMessages,
    abort,
    retry,
  };
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Get Convex site URL from environment
 */
function getConvexSiteUrl(): string {
  const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("EXPO_PUBLIC_CONVEX_URL is not set");
  }

  // Convert cloud URL to site URL
  // https://xxx.convex.cloud -> https://xxx.convex.site
  return convexUrl.replace(".convex.cloud", ".convex.site");
}

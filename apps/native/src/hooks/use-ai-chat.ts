import { useAuthToken } from "@convex-dev/auth/react";
import { useCallback, useRef, useState, useEffect } from "react";
import {
  streamWithReconnect,
  type MessagePart,
  type StreamMessage,
  type ToolCall,
  type ToolResult,
} from "@/lib/ai-stream";
import { useNetworkOptional } from "@/contexts/network-context";
import { saveConversationProgress } from "@/lib/conversation-persistence";

/**
 * AI Chat Hook
 *
 * React hook for streaming AI conversations.
 * Handles SSE connection, message state, tool calls, and retry logic.
 *
 * Source: Story 2.1 - AC#2, Story 8.3 - AC#2, AC#3
 */

// =============================================================================
// Constants (Story 8.3 Task 3.2)
// =============================================================================

/**
 * Default timeout for LLM requests in milliseconds (Story 8.3 AC#2)
 * Note: This timeout covers the ENTIRE operation including internal retries
 * with exponential backoff (1s, 2s, 4s). Set higher than individual request
 * timeout to allow retries to complete.
 */
export const LLM_TIMEOUT_MS = 45000;

/** Maximum retries before showing exhausted message (Story 8.3 AC#3) */
export const MAX_RETRIES = 3;

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
  /** True if this message was interrupted by network loss (partial content) */
  isInterrupted?: boolean;
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
  /** Maximum retries before showing exhausted message (Story 8.3 Task 3.4) */
  maxRetries?: number;
  /** Timeout in milliseconds for LLM requests (Story 8.3 Task 3.2) */
  timeoutMs?: number;
}

export interface UseAIChatReturn {
  /** All messages in the conversation */
  messages: ChatMessage[];
  /** Whether a response is currently streaming */
  isStreaming: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Whether network is offline (cannot send) */
  isOffline: boolean;
  /** Whether currently trying to reconnect after network loss */
  isReconnecting: boolean;
  /** Seconds since disconnection started (0 if not disconnected) */
  disconnectionDuration: number;
  /** Current retry attempt count for the last failed message (Story 8.3 Task 3.4) */
  retryCount: number;
  /** Maximum retries allowed before exhausted (Story 8.3 Task 3.4) */
  maxRetries: number;
  /** Whether retries are exhausted (Story 8.3 AC#3) */
  isRetriesExhausted: boolean;
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
  /** Reset retry count (e.g., when user dismisses error) */
  resetRetryCount: () => void;
  /** Save conversation progress to local storage (Story 8.3 Task 4.2) */
  saveProgress: () => Promise<string | null>;
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
    maxRetries: maxRetriesOption = MAX_RETRIES,
    timeoutMs = LLM_TIMEOUT_MS,
  } = options;

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [disconnectionDuration, setDisconnectionDuration] = useState(0);
  // Retry tracking (Story 8.3 Task 3.1)
  const [retryCount, setRetryCount] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastUserMessageRef = useRef<string | null>(null);
  const pendingSendRef = useRef<string | null>(null);
  const disconnectionStartRef = useRef<number | null>(null);
  const wasStreamingRef = useRef(false);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Store timeout ID for cleanup
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track if current send is a retry (to avoid resetting retry count) - Story 8.3 fix
  const isRetryCallRef = useRef(false);

  // Get auth token from Convex
  const authToken = useAuthToken();

  // Get network status (optional - works outside NetworkProvider too)
  const network = useNetworkOptional();
  const isOffline = network?.isOffline ?? false;
  const isOnline = network?.isOnline ?? true;

  // Track disconnection and handle auto-resume (Story 8.2 AC#1, AC#2, AC#5)
  useEffect(() => {
    if (isOffline && !disconnectionStartRef.current) {
      // Network just went offline
      disconnectionStartRef.current = Date.now();
      setIsReconnecting(true);
      setDisconnectionDuration(0);

      // Track how long we've been offline
      durationIntervalRef.current = setInterval(() => {
        if (disconnectionStartRef.current) {
          const duration = Math.floor(
            (Date.now() - disconnectionStartRef.current) / 1000
          );
          setDisconnectionDuration(duration);
        }
      }, 1000);

      // If streaming, abort cleanly (pause, not error)
      if (isStreaming && abortControllerRef.current) {
        wasStreamingRef.current = true;
        abortControllerRef.current.abort();
      }
    } else if (isOnline && disconnectionStartRef.current) {
      // Network just came back online
      const wasStreaming = wasStreamingRef.current;
      const pendingMessage = pendingSendRef.current;

      // Clear tracking state
      disconnectionStartRef.current = null;
      wasStreamingRef.current = false;
      pendingSendRef.current = null;
      setDisconnectionDuration(0);

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      // Clear error state on reconnection
      setError(null);

      // Show reconnecting briefly then clear (handled by overlay)
      setTimeout(() => {
        setIsReconnecting(false);
      }, 100);

      // Auto-resume pending send or interrupted stream
      if (pendingMessage) {
        // Had a pending message queued - send it now
        // Using setTimeout to avoid state update during render
        setTimeout(() => {
          sendMessageRef.current?.(pendingMessage);
        }, 500);
      } else if (wasStreaming && lastUserMessageRef.current) {
        // Stream was interrupted - retry the last message
        setTimeout(() => {
          retryRef.current?.();
        }, 500);
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isOffline, isOnline, isStreaming]);

  // Refs to enable calling functions from the effect
  const sendMessageRef = useRef<((content: string) => Promise<void>) | null>(null);
  const retryRef = useRef<(() => Promise<void>) | null>(null);

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

      // Check network before sending (Story 8.1 AC#2, Story 8.2 AC#5)
      if (isOffline) {
        // Queue the message for when network returns (don't error)
        pendingSendRef.current = content;
        return;
      }

      if (isStreaming) {
        return; // Don't allow concurrent streams
      }

      // Store for retry (Story 8.3 Task 3.3 - preserve user input)
      lastUserMessageRef.current = content;

      // Reset retry count on new message (not a retry) - Story 8.3 fix
      // Only reset if this is NOT a retry call (checked via ref)
      if (!isRetryCallRef.current && retryCount > 0) {
        setRetryCount(0);
      }
      // Clear the retry flag after checking
      isRetryCallRef.current = false;

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

      // Set up abort controller with timeout (Story 8.3 Task 3.2)
      abortControllerRef.current = new AbortController();

      // Set up timeout (Story 8.3 AC#2 - 30s default)
      timeoutIdRef.current = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, timeoutMs);

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

        // Clear timeout on success
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }

        // Reset retry count on success (Story 8.3)
        setRetryCount(0);

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
        const isAbort = chatError.name === "AbortError";

        // Only set error state for non-abort errors
        if (!isAbort) {
          setError(chatError);
          onError?.(chatError);
        }

        // Handle message differently based on error type
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== assistantMessageId) return m;

            // If aborted (likely network loss), mark as interrupted if we had partial content
            if (isAbort && m.content) {
              return {
                ...m,
                isStreaming: false,
                isInterrupted: true,
              };
            }

            // For errors or empty aborts, show error state
            return {
              ...m,
              isStreaming: false,
              content: m.content || "[Error]",
            };
          })
        );
      } finally {
        // Clean up timeout
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [authToken, isStreaming, isOffline, messages, convexSiteUrl, conversationId, onToolCall, onToolResult, onError, onComplete, retryCount, timeoutMs]
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
   * Retry last failed message (Story 8.3 Task 3.1 - track retry count)
   */
  const retry = useCallback(async () => {
    if (lastUserMessageRef.current) {
      // Increment retry count (Story 8.3 Task 3.1)
      setRetryCount((prev) => prev + 1);

      // Mark this as a retry call so sendMessage doesn't reset the count
      isRetryCallRef.current = true;

      // Clear error state
      setError(null);

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

  /**
   * Reset retry count (e.g., when user dismisses error or starts fresh)
   */
  const resetRetryCount = useCallback(() => {
    setRetryCount(0);
    setError(null);
  }, []);

  /**
   * Save conversation progress to local storage (Story 8.3 Task 4.2)
   * Called when retries are exhausted and user wants to try later.
   */
  const saveProgress = useCallback(async (): Promise<string | null> => {
    if (messages.length === 0) return null;

    try {
      // Convert messages to saved format
      const savedMessages = messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        parts: m.parts,
        createdAt: m.createdAt,
        isInterrupted: m.isInterrupted,
      }));

      // Extract error info if available
      const errorInfo = error
        ? {
            code: (error as { code?: string }).code || "LLM_ERROR",
            message: error.message,
            requestId: ((error as { debugInfo?: { requestId?: string } }).debugInfo?.requestId),
          }
        : undefined;

      const savedId = await saveConversationProgress({
        conversationId,
        messages: savedMessages,
        lastUserInput: lastUserMessageRef.current || undefined,
        errorInfo,
      });

      console.log(`[useAIChat] Saved conversation progress: ${savedId}`);
      return savedId;
    } catch (err) {
      console.error("[useAIChat] Failed to save progress:", err);
      return null;
    }
  }, [messages, conversationId, error]);

  // Update refs for use in effect
  sendMessageRef.current = sendMessage;
  retryRef.current = retry;

  return {
    messages,
    isStreaming,
    error,
    isOffline,
    isReconnecting,
    disconnectionDuration,
    // Retry state (Story 8.3 Task 3.4)
    retryCount,
    maxRetries: maxRetriesOption,
    isRetriesExhausted: retryCount >= maxRetriesOption,
    sendMessage,
    appendMessage,
    clearMessages,
    abort,
    retry,
    resetRetryCount,
    saveProgress,
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

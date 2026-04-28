import { useCallback, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type { MessagePart } from "@/lib/ai-stream";
import { useNetworkOptional } from "@/contexts/network-context";

/**
 * AI Chat Hook
 *
 * Derives messages reactively from the `messages` table and posts user input
 * through `chat.send`, which writes the user message and schedules a stub
 * assistant reply while the new chat brain is being built.
 */

// =============================================================================
// Constants
// =============================================================================

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
  isInterrupted?: boolean;
}

export interface UseAIChatOptions {
  conversationId?: string;
  /** Kept for signature compatibility; no longer used. */
  initialMessages?: ChatMessage[];
  maxRetries?: number;
  /** Not called — assistant messages are persisted server-side. */
  onComplete?: (message: ChatMessage) => void;
  onError?: (error: Error) => void;
}

export interface UseAIChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: Error | null;
  isOffline: boolean;
  isReconnecting: boolean;
  disconnectionDuration: number;
  retryCount: number;
  maxRetries: number;
  isRetriesExhausted: boolean;
  sendMessage: (content: string, imageUrls?: string[]) => Promise<void>;
  appendMessage: (message: Omit<ChatMessage, "id" | "createdAt">) => void;
  clearMessages: () => void;
  abort: () => void;
  retry: () => Promise<void>;
  resetRetryCount: () => void;
  saveProgress: () => Promise<string | null>;
  /** No-op while the new chat brain is being built. */
  sendToolDecision: (args: {
    toolName: string;
    toolArgs: unknown;
    decision: "accepted" | "declined";
  }) => Promise<void>;
}

// =============================================================================
// Hook
// =============================================================================

export function useAIChat(options: UseAIChatOptions = {}): UseAIChatReturn {
  const {
    conversationId,
    maxRetries: maxRetriesOption = MAX_RETRIES,
    onError,
  } = options;

  const history = useQuery(
    api.cadence.messages.getConversationHistory,
    conversationId
      ? { conversationId: conversationId as Id<"conversations"> }
      : "skip",
  );
  const sendChatMessage = useMutation(api.cadence.messages.send);

  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [sending, setSending] = useState(false);
  const lastPayloadRef = useRef<{
    text: string;
    imageUrls?: string[];
  } | null>(null);

  const network = useNetworkOptional();
  const isOffline = network?.isOffline ?? false;

  const messages = useMemo<ChatMessage[]>(() => {
    if (!history) return [];
    return history
      .filter((msg) => msg.role === "user" || msg.role === "assistant")
      .map((msg) => ({
        id: msg._id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        parts: (msg.parts as MessagePart[] | undefined) ?? [
          { type: "text", text: msg.content },
        ],
        isStreaming: false,
        createdAt: msg.createdAt,
      }));
  }, [history]);

  // Awaiting a reply = the last persisted message is from the user,
  // or a mutation is in flight.
  const isStreaming = useMemo(() => {
    if (sending) return true;
    const last = messages[messages.length - 1];
    return last?.role === "user";
  }, [sending, messages]);

  const sendMessage = useCallback(
    async (content: string, imageUrls?: string[]) => {
      if (!conversationId) return;
      if (isOffline) return;
      if (sending) return;

      lastPayloadRef.current = { text: content, imageUrls };
      setSending(true);
      setError(null);

      try {
        await sendChatMessage({
          conversationId: conversationId as Id<"conversations">,
          text: content,
        });
        setRetryCount(0);
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        onError?.(e);
      } finally {
        setSending(false);
      }
    },
    [conversationId, sendChatMessage, isOffline, sending, onError],
  );

  const sendToolDecision = useCallback(
    async (_args: {
      toolName: string;
      toolArgs: unknown;
      decision: "accepted" | "declined";
    }) => {
      // Router pipeline removed — tool decisions have no consumer until the new
      // chat brain lands. The Accept/Decline UI still runs its own mutation
      // directly; this is just the optional follow-up notification.
    },
    [],
  );

  const retry = useCallback(async () => {
    if (!lastPayloadRef.current) return;
    setRetryCount((prev) => prev + 1);
    const { text, imageUrls } = lastPayloadRef.current;
    await sendMessage(text, imageUrls);
  }, [sendMessage]);

  const resetRetryCount = useCallback(() => {
    setRetryCount(0);
    setError(null);
  }, []);

  // No-op stubs preserved for API stability with callers that still expect them.
  const appendMessage = useCallback(() => {}, []);
  const clearMessages = useCallback(() => {}, []);
  const abort = useCallback(() => {}, []);
  const saveProgress = useCallback(async (): Promise<string | null> => null, []);

  return {
    messages,
    isStreaming,
    error,
    isOffline,
    isReconnecting: false,
    disconnectionDuration: 0,
    retryCount,
    maxRetries: maxRetriesOption,
    isRetriesExhausted: retryCount >= maxRetriesOption,
    sendMessage,
    sendToolDecision,
    appendMessage,
    clearMessages,
    abort,
    retry,
    resetRetryCount,
    saveProgress,
  };
}

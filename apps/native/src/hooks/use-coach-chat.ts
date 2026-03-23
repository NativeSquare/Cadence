import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type { ChatMessage } from "./use-ai-chat";
import type { MessagePart } from "@/lib/ai-stream";

/**
 * Coach Chat Conversation Manager
 *
 * Handles conversation lifecycle (create/load) and message persistence
 * for the coach tab. Returns initial messages and a conversationId
 * for use with `useAIChat`.
 */

export type CoachChatPhase = "loading" | "ready" | "error";

export interface UseCoachChatReturn {
  phase: CoachChatPhase;
  conversationId: string | undefined;
  initialMessages: ChatMessage[];
  persistUserMessage: (content: string) => Promise<void>;
  persistAssistantMessage: (message: ChatMessage) => Promise<void>;
}

export function useCoachChat(): UseCoachChatReturn {
  const runner = useQuery(api.table.runners.getCurrentRunner);
  const activeConversation = useQuery(api.ai.messages.getActiveConversation);
  const createConversation = useMutation(
    api.ai.messages.getOrCreateConversation
  );
  const addMessage = useMutation(api.ai.messages.addMessage);

  const [conversationId, setConversationId] = useState<string>();
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState(false);

  // Resolve conversation: use active or create new
  useEffect(() => {
    if (conversationId) return;

    if (activeConversation) {
      setConversationId(activeConversation._id);
    } else if (runner) {
      createConversation({ runnerId: runner._id })
        .then((id) => setConversationId(id))
        .catch(() => setError(true));
    }
  }, [activeConversation?._id, runner?._id, conversationId]);

  // Load conversation history
  const history = useQuery(
    api.ai.messages.getConversationHistory,
    conversationId
      ? { conversationId: conversationId as Id<"conversations"> }
      : "skip"
  );

  // Convert history to ChatMessage[] once on first load
  useEffect(() => {
    if (history === undefined || historyLoaded) return;

    const messages: ChatMessage[] = history
      .filter((msg) => msg.role === "user" || msg.role === "assistant")
      .map((msg) => ({
        id: msg._id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        parts: (msg.parts as MessagePart[]) ?? [
          { type: "text" as const, text: msg.content },
        ],
        isStreaming: false,
        createdAt: msg.createdAt,
      }));

    setInitialMessages(messages);
    setHistoryLoaded(true);
  }, [history, historyLoaded]);

  // Persist user message to Convex for compaction support
  const persistUserMessage = useCallback(
    async (content: string) => {
      if (!conversationId) return;
      try {
        await addMessage({
          conversationId: conversationId as Id<"conversations">,
          role: "user",
          content,
          isComplete: true,
        });
      } catch (err) {
        console.error("[CoachChat] Failed to persist user message:", err);
      }
    },
    [conversationId, addMessage]
  );

  // Persist completed assistant message to Convex
  const persistAssistantMessage = useCallback(
    async (message: ChatMessage) => {
      if (!conversationId) return;
      try {
        await addMessage({
          conversationId: conversationId as Id<"conversations">,
          role: "assistant",
          content: message.content,
          parts: message.parts,
          isComplete: true,
        });
      } catch (err) {
        console.error("[CoachChat] Failed to persist assistant message:", err);
      }
    },
    [conversationId, addMessage]
  );

  const phase: CoachChatPhase = error
    ? "error"
    : conversationId && historyLoaded
      ? "ready"
      : "loading";

  return {
    phase,
    conversationId,
    initialMessages,
    persistUserMessage,
    persistAssistantMessage,
  };
}

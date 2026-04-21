import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";

/**
 * Coach Chat Conversation Resolver
 *
 * Ensures an active conversation exists for the current runner and exposes
 * its id. Message persistence is owned by the Router pipeline
 * (`intelligence.events.ingestChat` + `intelligence.delivery.deliverCandidate`)
 * and surfaces reactively through `useAIChat`, so this hook no longer
 * handles persist callbacks.
 */

export type CoachChatPhase = "loading" | "ready" | "error";

export interface UseCoachChatReturn {
  phase: CoachChatPhase;
  conversationId: string | undefined;
}

export function useCoachChat(): UseCoachChatReturn {
  const runner = useQuery(api.table.runners.getCurrentRunner);
  const activeConversation = useQuery(api.ai.messages.getActiveConversation);
  const createConversation = useMutation(
    api.ai.messages.getOrCreateConversation,
  );

  const [conversationId, setConversationId] = useState<string>();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (conversationId) return;

    if (activeConversation) {
      setConversationId(activeConversation._id);
    } else if (runner) {
      createConversation({ runnerId: runner._id })
        .then((id) => setConversationId(id))
        .catch(() => setError(true));
    }
  }, [activeConversation, runner, conversationId, createConversation]);

  const phase: CoachChatPhase = error
    ? "error"
    : conversationId
      ? "ready"
      : "loading";

  return { phase, conversationId };
}

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";

/**
 * Coach Chat Conversation Resolver
 *
 * Ensures an active conversation exists for the current agoge athlete and
 * exposes its id. Message persistence is owned by `chat.send` and surfaces
 * reactively through `useAIChat`.
 */

export type CoachChatPhase = "loading" | "ready" | "error";

export interface UseCoachChatReturn {
  phase: CoachChatPhase;
  conversationId: string | undefined;
}

export function useCoachChat(): UseCoachChatReturn {
  const athlete = useQuery(api.agoge.athletes.getAthlete);
  const activeConversation = useQuery(api.cadence.messages.getActiveConversation);
  const createConversation = useMutation(
    api.cadence.messages.getOrCreateConversation,
  );

  const [conversationId, setConversationId] = useState<string>();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (conversationId) return;

    if (activeConversation) {
      setConversationId(activeConversation._id);
    } else if (athlete) {
      createConversation({ athleteId: athlete._id })
        .then((id) => setConversationId(id))
        .catch(() => setError(true));
    }
  }, [activeConversation, athlete, conversationId, createConversation]);

  const phase: CoachChatPhase = error
    ? "error"
    : conversationId
      ? "ready"
      : "loading";

  return { phase, conversationId };
}

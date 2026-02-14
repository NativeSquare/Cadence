/**
 * ConnectionCardTool Component
 *
 * AI tool wrapper for wearable connection card.
 * Implements mock provider flow for MVP - all connections simulate
 * then fall through to skip path.
 *
 * Source: Story 2.7 - AC#1, AC#2, AC#3, AC#5
 */

import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { selectionFeedback, questionPause } from "@/lib/haptics";
import { ConnectionCard } from "../connection-card";

// =============================================================================
// Types
// =============================================================================

interface ConnectionCardToolProps {
  toolCallId: string;
  args?: {
    prompt?: string;
    providers?: Array<"garmin" | "coros" | "apple" | "strava">;
    skipLabel?: string;
    allowSkip?: boolean;
  };
  onSubmit: (result: {
    action: "skip" | "connect";
    provider?: string | null;
  }) => void;
  disabled?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function ConnectionCardTool({
  toolCallId,
  args,
  onSubmit,
  disabled = false,
}: ConnectionCardToolProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(
    null
  );
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const skipWearable = useMutation(api.table.runners.skipWearableConnection);

  /**
   * Handle provider connection tap (mock flow)
   * Simulates connection attempt for 1-2 seconds then skips
   *
   * TODO: Replace with real OAuth flow in Epic 6
   * - Story 6.1: Strava OAuth Integration
   * - Story 6.2: HealthKit Integration
   * - Story 6.3: Health Connect Integration
   */
  const handleConnect = useCallback(
    async (providerId: string) => {
      if (disabled || hasSubmitted || isConnecting) return;

      selectionFeedback();
      setIsConnecting(true);
      setConnectingProvider(providerId);

      // Mock delay to simulate connection attempt (1.5 seconds)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // For MVP, all connections fall through to skip
      // This simulates "no data found" or "connection failed" scenario
      try {
        await skipWearable();
        questionPause();
        setHasSubmitted(true);
        onSubmit({ action: "connect", provider: providerId });
      } catch (error) {
        // On error, still submit to continue conversation
        console.warn("[ConnectionCardTool] Skip mutation failed:", error);
        setHasSubmitted(true);
        onSubmit({ action: "skip", provider: null });
      } finally {
        setIsConnecting(false);
        setConnectingProvider(null);
      }
    },
    [disabled, hasSubmitted, isConnecting, skipWearable, onSubmit]
  );

  /**
   * Handle skip button tap
   * Updates runner connections and continues conversation
   */
  const handleSkip = useCallback(async () => {
    if (disabled || hasSubmitted || isConnecting) return;

    selectionFeedback();
    setIsConnecting(true);

    try {
      await skipWearable();
      questionPause();
      setHasSubmitted(true);
      onSubmit({ action: "skip", provider: null });
    } catch (error) {
      console.warn("[ConnectionCardTool] Skip mutation failed:", error);
      // Still submit to continue conversation
      setHasSubmitted(true);
      onSubmit({ action: "skip", provider: null });
    } finally {
      setIsConnecting(false);
    }
  }, [disabled, hasSubmitted, isConnecting, skipWearable, onSubmit]);

  return (
    <ConnectionCard
      onConnect={handleConnect}
      onSkip={handleSkip}
      isConnecting={isConnecting}
      connectingProvider={connectingProvider}
    />
  );
}

/**
 * ConnectionCardTool Component
 *
 * AI tool wrapper for wearable connection card.
 * Implements mock provider flow for MVP - all connections simulate
 * then fall through to skip path.
 *
 * Source: Story 2.7 - AC#1, AC#2, AC#3, AC#5, Story 8.4 - AC#3
 */

import { useState, useCallback } from "react";
import { Platform, View } from "react-native";
import { selectionFeedback, questionPause } from "@/lib/haptics";
import { useHealthKit } from "@/hooks/use-healthkit";
import { ConnectionCard } from "../connection-card";
import { PermissionDeniedCard } from "./PermissionDeniedCard";

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
    null,
  );
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Use full HealthKit hook to access permission denied state (Story 8.4 AC#3)
  const {
    connect: connectHealthKit,
    permissionDenied,
    retryAfterSettings,
    isConnecting: isHealthKitConnecting,
  } = useHealthKit();

  /**
   * Handle provider connection tap.
   * Apple Health uses the real HealthKit integration.
   * Other providers simulate connection (Strava/Garmin TBD in Epic 6).
   * Does NOT advance the screen — user can connect multiple providers.
   */
  const handleConnect = useCallback(
    async (providerId: string) => {
      if (disabled || hasSubmitted || isConnecting) return;
      if (connectedProviders.includes(providerId)) return;

      selectionFeedback();
      setIsConnecting(true);
      setConnectingProvider(providerId);

      try {
        if (providerId === "apple" && Platform.OS === "ios") {
          const result = await connectHealthKit();
          if (result) {
            setConnectedProviders((prev) => [...prev, providerId]);
          }
        } else {
          // Other providers not yet implemented — simulate connection
          await new Promise((resolve) => setTimeout(resolve, 1500));
          setConnectedProviders((prev) => [...prev, providerId]);
        }
      } catch (error) {
        console.warn("[ConnectionCardTool] Connection failed:", error);
      } finally {
        setIsConnecting(false);
        setConnectingProvider(null);
      }
    },
    [
      disabled,
      hasSubmitted,
      isConnecting,
      connectedProviders,
      connectHealthKit,
    ],
  );

  /**
   * Handle continue button tap — user is done connecting providers.
   * Submits the connected providers and advances the conversation.
   */
  const handleContinue = useCallback(async () => {
    if (disabled || hasSubmitted || isConnecting) return;

    selectionFeedback();
    questionPause();
    setHasSubmitted(true);
    onSubmit({
      action: "connect",
      provider: connectedProviders.join(","),
    });
  }, [disabled, hasSubmitted, isConnecting, connectedProviders, onSubmit]);

  /**
   * Handle skip button tap.
   * If providers are already connected, behaves like continue.
   * Otherwise signals skip via onSubmit — the coach chat captures the
   * decision into coach memory.
   */
  const handleSkip = useCallback(() => {
    if (disabled || hasSubmitted || isConnecting) return;

    selectionFeedback();

    if (connectedProviders.length > 0) {
      questionPause();
      setHasSubmitted(true);
      onSubmit({
        action: "connect",
        provider: connectedProviders.join(","),
      });
      return;
    }

    questionPause();
    setHasSubmitted(true);
    onSubmit({ action: "skip", provider: null });
  }, [disabled, hasSubmitted, isConnecting, connectedProviders, onSubmit]);

  // Handle retry after permission denied (Story 8.4 AC#3)
  const handleRetryPermission = useCallback(async () => {
    const result = await retryAfterSettings();
    if (result) {
      setConnectedProviders((prev) => [...prev, "apple"]);
    }
  }, [retryAfterSettings]);

  // Handle skip after permission denied
  const handleSkipPermission = useCallback(() => {
    handleSkip();
  }, [handleSkip]);

  // Show PermissionDeniedCard when HealthKit permission is denied (Story 8.4 AC#3)
  if (permissionDenied) {
    return (
      <PermissionDeniedCard
        permissionType="healthkit"
        onRetry={handleRetryPermission}
        onSkip={handleSkipPermission}
        isRetrying={isHealthKitConnecting}
      />
    );
  }

  return (
    <ConnectionCard
      onConnect={handleConnect}
      onSkip={handleSkip}
      onContinue={connectedProviders.length > 0 ? handleContinue : undefined}
      isConnecting={isConnecting}
      connectingProvider={connectingProvider}
      connectedProviders={connectedProviders}
    />
  );
}

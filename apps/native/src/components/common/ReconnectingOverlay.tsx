/**
 * Reconnecting Overlay Component
 *
 * Semi-transparent overlay shown when connection is lost during active use.
 * Displays progressive timeout messages and allows manual retry.
 *
 * Source: Story 8.2 - AC#1, AC#2, AC#4
 */

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { WifiOff, Wifi, RefreshCw } from "lucide-react-native";
import { useEffect, useState, useRef } from "react";
import { View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

interface ReconnectingOverlayProps {
  /** Whether the overlay should be visible */
  isVisible: boolean;
  /** Callback when user manually retries */
  onRetry: () => void;
  /** Callback when reconnection succeeds (triggers brief "Back online" display) */
  onReconnected?: () => void;
}

type OverlayState = "reconnecting" | "back-online";

const BACK_ONLINE_DISPLAY_MS = 2000;

/**
 * Get progressive message based on disconnection duration.
 * Per AC#4: Progressive messaging at 10s, 20s, 30s thresholds.
 */
function getProgressiveMessage(durationSeconds: number): string {
  if (durationSeconds < 10) {
    return "Reconnecting...";
  } else if (durationSeconds < 20) {
    return "Still trying to reconnect...";
  } else if (durationSeconds < 30) {
    return "This is taking longer than expected";
  } else {
    return "Connection issues. You can try again.";
  }
}

/**
 * ReconnectingOverlay shows a non-blocking reconnection state.
 *
 * Features:
 * - Semi-transparent overlay (content visible behind)
 * - Animated pulsing icon
 * - Progressive timeout messages (10s, 20s, 30s)
 * - Manual retry button after 30s
 * - Brief "Back online" confirmation when reconnected
 * - Haptic feedback on state changes
 *
 * @example
 * <View className="flex-1">
 *   <ConversationView />
 *   <ReconnectingOverlay
 *     isVisible={isReconnecting}
 *     onRetry={handleRetry}
 *   />
 * </View>
 */
export function ReconnectingOverlay({
  isVisible,
  onRetry,
  onReconnected,
}: ReconnectingOverlayProps) {
  const [state, setState] = useState<OverlayState>("reconnecting");
  const [disconnectionDuration, setDisconnectionDuration] = useState(0);
  const disconnectionStartRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wasVisibleRef = useRef(false);

  // Pulsing animation for the icon
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withTiming(0.4, { duration: 800 }),
      -1,
      true
    );
  }, [pulseOpacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  // Track disconnection duration
  useEffect(() => {
    if (isVisible && !wasVisibleRef.current) {
      // Just became visible - start tracking
      disconnectionStartRef.current = Date.now();
      setDisconnectionDuration(0);
      setState("reconnecting");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      intervalRef.current = setInterval(() => {
        if (disconnectionStartRef.current) {
          const duration = Math.floor(
            (Date.now() - disconnectionStartRef.current) / 1000
          );
          setDisconnectionDuration(duration);
        }
      }, 1000);
    } else if (!isVisible && wasVisibleRef.current) {
      // Just became invisible - show "Back online" briefly
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      disconnectionStartRef.current = null;

      setState("back-online");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onReconnected?.();

      // Auto-hide "Back online" after delay
      setTimeout(() => {
        setState("reconnecting");
        setDisconnectionDuration(0);
      }, BACK_ONLINE_DISPLAY_MS);
    }

    wasVisibleRef.current = isVisible;

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isVisible, onReconnected]);

  // Don't render if not visible and not showing "back online"
  if (!isVisible && state !== "back-online") {
    return null;
  }

  const showRetryButton = disconnectionDuration >= 30 && state === "reconnecting";
  const message =
    state === "back-online"
      ? "Back online"
      : getProgressiveMessage(disconnectionDuration);

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      className="absolute inset-0 bg-background/80 items-center justify-center z-50"
    >
      <View className="items-center px-8">
        {state === "back-online" ? (
          <Icon as={Wifi} size={48} className="text-green-500 mb-4" />
        ) : (
          <Animated.View style={pulseStyle}>
            <Icon as={WifiOff} size={48} className="text-primary mb-4" />
          </Animated.View>
        )}

        <Text
          className={`text-lg font-medium text-center mb-2 ${
            state === "back-online" ? "text-green-500" : "text-foreground"
          }`}
        >
          {message}
        </Text>

        {state === "reconnecting" && disconnectionDuration > 0 && (
          <Text className="text-muted-foreground text-sm mb-4">
            {disconnectionDuration}s
          </Text>
        )}

        {showRetryButton && (
          <Button onPress={onRetry} variant="outline" className="mt-4">
            <Icon as={RefreshCw} size={16} className="mr-2" />
            <Text>Try Again</Text>
          </Button>
        )}
      </View>
    </Animated.View>
  );
}

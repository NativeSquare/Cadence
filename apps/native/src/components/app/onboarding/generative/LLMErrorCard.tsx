/**
 * LLM Error Card Component
 *
 * Displays user-friendly error messages when LLM calls fail.
 * Provides retry button, escalated error with support contact after exhausted retries.
 *
 * Source: Story 8.3 - AC#1, AC#3
 */

import { useRef, useEffect } from "react";
import { View, Pressable, Animated, Linking } from "react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import * as Haptics from "expo-haptics";
import { AlertCircle, RefreshCw, Mail, ArrowRight } from "lucide-react-native";

// =============================================================================
// Types
// =============================================================================

/**
 * LLM error codes that can be displayed.
 * Matches backend error classification from http_action.ts
 */
export type LLMErrorCode =
  | "LLM_TIMEOUT"
  | "LLM_RATE_LIMITED"
  | "LLM_MODEL_ERROR"
  | "LLM_NETWORK_ERROR"
  | "LLM_ERROR";

export interface LLMErrorInfo {
  code: LLMErrorCode;
  message: string;
  debugInfo?: {
    requestId: string;
    timestamp: number;
    details?: string;
  };
  isRetryable: boolean;
}

interface LLMErrorCardProps {
  /** Error information from the API */
  error: LLMErrorInfo | Error | string;
  /** Current retry count */
  retryCount: number;
  /** Maximum retries allowed */
  maxRetries?: number;
  /** Callback when retry is requested */
  onRetry: () => void;
  /** Callback when user wants to try later (navigate away) */
  onTryLater?: () => void;
  /** Whether retry is in progress */
  isRetrying?: boolean;
  /** Additional className for styling */
  className?: string;
}

// =============================================================================
// Constants
// =============================================================================

const SUPPORT_EMAIL = "support@cadence.app";

/**
 * User-friendly error messages per error type.
 * Matches backend messages for consistency.
 */
const ERROR_MESSAGES: Record<LLMErrorCode, string> = {
  LLM_TIMEOUT: "I'm thinking hard but taking too long. Let's try again?",
  LLM_RATE_LIMITED: "I need a moment to catch my breath. Try again in a few seconds.",
  LLM_MODEL_ERROR: "Something went wrong on my end. Let's try that again.",
  LLM_NETWORK_ERROR: "I can't reach my brain right now. Check your connection and retry.",
  LLM_ERROR: "Something unexpected happened. Let's try again.",
};

/**
 * Exhausted retries message.
 * Source: Story 8.3 Dev Notes
 */
const EXHAUSTED_RETRIES_MESSAGE =
  "I'm having trouble right now. Your progress is saved. You can try again later or contact support.";

// =============================================================================
// Helpers
// =============================================================================

/**
 * Parse error into LLMErrorInfo format.
 */
function parseError(error: LLMErrorInfo | Error | string): LLMErrorInfo {
  // Already structured error
  if (typeof error === "object" && "code" in error && "message" in error) {
    return error as LLMErrorInfo;
  }

  // Extract code from Error message if possible
  const errorMessage = error instanceof Error ? error.message : String(error);
  const code = classifyErrorMessage(errorMessage);

  return {
    code,
    message: ERROR_MESSAGES[code],
    isRetryable: code !== "LLM_MODEL_ERROR",
  };
}

/**
 * Classify error message into LLM error code.
 */
function classifyErrorMessage(message: string): LLMErrorCode {
  const lower = message.toLowerCase();

  if (lower.includes("timeout") || lower.includes("timed out")) {
    return "LLM_TIMEOUT";
  }
  if (lower.includes("rate") || lower.includes("429") || lower.includes("too many")) {
    return "LLM_RATE_LIMITED";
  }
  if (lower.includes("network") || lower.includes("fetch") || lower.includes("connection")) {
    return "LLM_NETWORK_ERROR";
  }
  if (lower.includes("model") || lower.includes("500") || lower.includes("502") || lower.includes("503")) {
    return "LLM_MODEL_ERROR";
  }

  return "LLM_ERROR";
}

// =============================================================================
// Component
// =============================================================================

export function LLMErrorCard({
  error,
  retryCount,
  maxRetries = 3,
  onRetry,
  onTryLater,
  isRetrying = false,
  className,
}: LLMErrorCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  const errorInfo = parseError(error);
  const isExhausted = retryCount >= maxRetries;

  // Entrance animation with haptic
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Gentle shake to draw attention
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -5, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, shakeAnim]);

  // Spin animation for retry button
  useEffect(() => {
    if (isRetrying) {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinAnim.setValue(0);
    }
  }, [isRetrying, spinAnim]);

  const handleRetry = () => {
    if (isRetrying || isExhausted) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRetry();
  };

  const handleTryLater = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onTryLater?.();
  };

  const handleContactSupport = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const subject = encodeURIComponent("Cadence Support Request");
    const body = encodeURIComponent(
      `Hi Support Team,\n\nI'm experiencing issues with the AI assistant.\n\nError Code: ${errorInfo.code}\nRequest ID: ${errorInfo.debugInfo?.requestId || "N/A"}\n\nPlease help!\n\nThanks`
    );
    await Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateX: shakeAnim }],
      }}
      className={cn("gap-4", className)}
    >
      {/* Error Card */}
      <View className="rounded-xl bg-destructive/10 border border-destructive/30 overflow-hidden">
        {/* Header */}
        <View className="px-4 py-3 flex-row items-center gap-3">
          <View className="w-8 h-8 rounded-full bg-destructive/20 items-center justify-center">
            <AlertCircle size={18} color="#ef4444" />
          </View>
          <View className="flex-1">
            <Text className="text-destructive font-medium text-base">
              {isExhausted ? "Unable to Connect" : "Oops!"}
            </Text>
          </View>
        </View>

        {/* Message */}
        <View className="px-4 pb-4">
          <Text className="text-white/80 text-base leading-relaxed">
            {isExhausted ? EXHAUSTED_RETRIES_MESSAGE : errorInfo.message}
          </Text>

          {/* Retry counter (only if not exhausted) */}
          {!isExhausted && retryCount > 0 && (
            <Text className="text-white/40 text-sm mt-2">
              Attempt {retryCount} of {maxRetries}
            </Text>
          )}

          {/* Debug info (only show request ID for support) */}
          {errorInfo.debugInfo?.requestId && isExhausted && (
            <Text className="text-white/30 text-xs mt-2 font-mono">
              Reference: {errorInfo.debugInfo.requestId}
            </Text>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      {!isExhausted ? (
        /* Retry Button */
        <Pressable
          onPress={handleRetry}
          disabled={isRetrying}
          className={cn(
            "flex-row items-center justify-center gap-2 bg-primary rounded-xl py-3.5",
            isRetrying && "opacity-70"
          )}
        >
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <RefreshCw size={18} color="#000" />
          </Animated.View>
          <Text className="text-primary-foreground font-semibold text-base">
            {isRetrying ? "Retrying..." : "Try Again"}
          </Text>
        </Pressable>
      ) : (
        /* Exhausted Retries - Support Options */
        <View className="gap-3">
          {/* Contact Support */}
          <Pressable
            onPress={handleContactSupport}
            className="flex-row items-center justify-center gap-2 bg-primary rounded-xl py-3.5 active:bg-primary/90"
          >
            <Mail size={18} color="#000" />
            <Text className="text-primary-foreground font-semibold text-base">
              Contact Support
            </Text>
          </Pressable>

          {/* Try Later */}
          {onTryLater && (
            <Pressable
              onPress={handleTryLater}
              className="flex-row items-center justify-center gap-2 bg-white/10 rounded-xl py-3.5 active:bg-white/20"
            >
              <Text className="text-white/70 font-medium text-base">Try Later</Text>
              <ArrowRight size={16} color="rgba(255,255,255,0.5)" />
            </Pressable>
          )}
        </View>
      )}
    </Animated.View>
  );
}

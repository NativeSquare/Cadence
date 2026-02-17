/**
 * Permission Denied Card Component
 *
 * Displays user-friendly guidance when a permission is denied.
 * Provides platform-specific instructions and action buttons.
 *
 * Source: Story 8.4 - AC#1, AC#4
 */

import { useRef, useEffect, useCallback } from "react";
import { View, Pressable, Animated, Linking, Platform } from "react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import * as Haptics from "expo-haptics";
import { ShieldAlert, Settings, RefreshCw, ChevronRight, Heart, Mic } from "lucide-react-native";

// =============================================================================
// Types
// =============================================================================

/**
 * Permission types that can be denied.
 */
export type PermissionType = "healthkit" | "microphone" | "notifications" | "camera" | "location";

/**
 * Platform-specific permission guidance.
 */
export interface PermissionGuidance {
  title: string;
  message: string;
  instructions: string[];
  alternativeInstructions?: string[];
  settingsDeepLink?: string;
}

interface PermissionDeniedCardProps {
  /** Type of permission that was denied */
  permissionType: PermissionType;
  /** Custom guidance (overrides default for permission type) */
  customGuidance?: Partial<PermissionGuidance>;
  /** Callback when user taps "Try Again" */
  onRetry: () => void;
  /** Callback when user taps "Skip" (optional) */
  onSkip?: () => void;
  /** Whether retry is in progress */
  isRetrying?: boolean;
  /** Additional className for styling */
  className?: string;
}

// =============================================================================
// Permission Guidance Constants (Story 8.4 Task 4)
// =============================================================================

/**
 * Default guidance per permission type.
 * Source: Story 8.4 Task 4
 */
export const PERMISSION_GUIDANCE: Record<PermissionType, PermissionGuidance> = {
  healthkit: {
    title: "Apple Health Access Required",
    message: "To sync your health data, please enable Apple Health access in Settings.",
    instructions: [
      "Tap 'Open Settings' below",
      "Tap 'Health' in the app settings",
      "Turn on all data types you want to share",
      "Return to this app and tap 'Try Again'",
    ],
    alternativeInstructions: [
      "Open the Health app",
      "Tap your profile picture → Apps",
      "Find and tap 'Cadence'",
      "Enable the data types you want to share",
    ],
  },
  microphone: {
    title: "Microphone Access Required",
    message: "To use voice input, please enable microphone access in Settings.",
    instructions: [
      "Tap 'Open Settings' below",
      "Find 'Microphone' in the app settings",
      "Toggle the switch to enable access",
      "Return to this app and tap 'Try Again'",
    ],
  },
  notifications: {
    title: "Notifications Disabled",
    message: "To receive training reminders, please enable notifications in Settings.",
    instructions: [
      "Tap 'Open Settings' below",
      "Find 'Notifications' in the app settings",
      "Toggle 'Allow Notifications' to enable",
      "Return to this app and tap 'Try Again'",
    ],
  },
  camera: {
    title: "Camera Access Required",
    message: "To take photos, please enable camera access in Settings.",
    instructions: [
      "Tap 'Open Settings' below",
      "Find 'Camera' in the app settings",
      "Toggle the switch to enable access",
      "Return to this app and tap 'Try Again'",
    ],
  },
  location: {
    title: "Location Access Required",
    message: "To track your runs, please enable location access in Settings.",
    instructions: [
      "Tap 'Open Settings' below",
      "Find 'Location' in the app settings",
      "Select 'While Using the App' or 'Always'",
      "Return to this app and tap 'Try Again'",
    ],
  },
};

/**
 * Icon mapping per permission type.
 */
const PERMISSION_ICONS: Record<PermissionType, React.ReactNode> = {
  healthkit: <Heart size={20} color="#ef4444" />,
  microphone: <Mic size={20} color="#ef4444" />,
  notifications: <ShieldAlert size={20} color="#ef4444" />,
  camera: <ShieldAlert size={20} color="#ef4444" />,
  location: <ShieldAlert size={20} color="#ef4444" />,
};

// =============================================================================
// Component
// =============================================================================

export function PermissionDeniedCard({
  permissionType,
  customGuidance,
  onRetry,
  onSkip,
  isRetrying = false,
  className,
}: PermissionDeniedCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Merge custom guidance with defaults
  const guidance: PermissionGuidance = {
    ...PERMISSION_GUIDANCE[permissionType],
    ...customGuidance,
  };

  // Entrance animation with haptic
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

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

  // Open app settings
  const handleOpenSettings = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (Platform.OS === "ios") {
        // iOS: Open app-specific settings
        await Linking.openURL("app-settings:");
      } else {
        // Android: Open app settings
        await Linking.openSettings();
      }
    } catch (error) {
      console.warn("[PermissionDeniedCard] Failed to open settings:", error);
    }
  }, []);

  // Try again (re-request permission)
  const handleTryAgain = useCallback(() => {
    if (isRetrying) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRetry();
  }, [isRetrying, onRetry]);

  // Skip this permission (consistent Medium haptic with other buttons)
  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSkip?.();
  }, [onSkip]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={{ opacity: fadeAnim }}
      className={cn("gap-4", className)}
    >
      {/* Permission Card */}
      <View className="rounded-xl bg-destructive/10 border border-destructive/30 overflow-hidden">
        {/* Header */}
        <View className="px-4 py-3 flex-row items-center gap-3">
          <View className="w-8 h-8 rounded-full bg-destructive/20 items-center justify-center">
            {PERMISSION_ICONS[permissionType]}
          </View>
          <View className="flex-1">
            <Text className="text-destructive font-medium text-base">
              {guidance.title}
            </Text>
          </View>
        </View>

        {/* Message */}
        <View className="px-4 pb-3">
          <Text className="text-white/80 text-base leading-relaxed">
            {guidance.message}
          </Text>
        </View>

        {/* Instructions */}
        <View className="px-4 pb-4">
          <Text className="text-white/50 text-sm mb-2">How to enable:</Text>
          {guidance.instructions.map((instruction, index) => (
            <View key={index} className="flex-row items-start gap-2 mb-1.5">
              <View className="w-5 h-5 rounded-full bg-white/10 items-center justify-center mt-0.5">
                <Text className="text-white/60 text-xs font-medium">{index + 1}</Text>
              </View>
              <Text className="text-white/70 text-sm flex-1">{instruction}</Text>
            </View>
          ))}
        </View>

        {/* Alternative instructions (e.g., for HealthKit) */}
        {guidance.alternativeInstructions && (
          <View className="px-4 pb-4 pt-2 border-t border-white/5">
            <Text className="text-white/40 text-xs mb-2">Alternative method:</Text>
            {guidance.alternativeInstructions.map((instruction, index) => (
              <Text key={index} className="text-white/50 text-xs mb-1">
                {index + 1}. {instruction}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View className="gap-3">
        {/* Open Settings Button */}
        <Pressable
          onPress={handleOpenSettings}
          className="flex-row items-center justify-center gap-2 bg-primary rounded-xl py-3.5 active:bg-primary/90"
        >
          <Settings size={18} color="#000" />
          <Text className="text-primary-foreground font-semibold text-base">
            Open Settings
          </Text>
          <ChevronRight size={16} color="#000" />
        </Pressable>

        {/* Try Again Button */}
        <Pressable
          onPress={handleTryAgain}
          disabled={isRetrying}
          className={cn(
            "flex-row items-center justify-center gap-2 bg-white/10 rounded-xl py-3.5",
            isRetrying && "opacity-70"
          )}
        >
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <RefreshCw size={18} color="rgba(255,255,255,0.7)" />
          </Animated.View>
          <Text className="text-white/70 font-medium text-base">
            {isRetrying ? "Checking..." : "Try Again"}
          </Text>
        </Pressable>

        {/* Skip Button (optional) */}
        {onSkip && (
          <Pressable
            onPress={handleSkip}
            className="py-2 items-center"
          >
            <Text className="text-white/40 text-sm">Skip for now</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

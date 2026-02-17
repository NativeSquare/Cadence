/**
 * Offline Screen Component
 *
 * Full-screen component shown when the app has no network connection.
 * Used during onboarding and for network-dependent features.
 *
 * Source: Story 8.1 - AC#1, AC#3
 */

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useNetwork } from "@/contexts/network-context";
import { WifiOff } from "lucide-react-native";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface OfflineScreenProps {
  /** Optional custom title */
  title?: string;
  /** Optional custom message */
  message?: string;
  /** Optional callback for retry button press (otherwise uses network refresh) */
  onRetry?: () => void;
  /** Show retry button (default: true) */
  showRetryButton?: boolean;
}

/**
 * OfflineScreen displays a user-friendly message when offline.
 *
 * Features:
 * - WiFi icon in lime accent color
 * - Friendly messaging per FR56
 * - Manual retry option
 * - Design system compliant styling
 *
 * @example
 * function OnboardingEntry() {
 *   const { isOffline } = useNetwork();
 *
 *   if (isOffline) {
 *     return <OfflineScreen />;
 *   }
 *
 *   return <AIConversationView />;
 * }
 */
export function OfflineScreen({
  title = "No Connection",
  message = "I need to be online to get started. Connect to WiFi or cellular and let's try again.",
  onRetry,
  showRetryButton = true,
}: OfflineScreenProps) {
  const { refresh } = useNetwork();

  const handleRetry = async () => {
    if (onRetry) {
      onRetry();
    } else {
      await refresh();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-8">
        <Icon
          as={WifiOff}
          size={64}
          className="text-primary mb-6"
        />

        <Text className="text-2xl font-bold text-foreground text-center mb-4">
          {title}
        </Text>

        <Text className="text-muted-foreground text-center mb-8 leading-relaxed">
          {message}
        </Text>

        {showRetryButton && (
          <Button onPress={handleRetry} variant="default" size="lg">
            <Text>Try Again</Text>
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}

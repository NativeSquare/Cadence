/**
 * Network Status Banner Component
 *
 * Slim banner that appears at the top of the screen when network status changes.
 * Shows offline warning and "Back online" confirmation.
 *
 * Source: Story 8.1 - AC#2, AC#4
 */

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useNetwork } from "@/contexts/network-context";
import { WifiOff, Wifi } from "lucide-react-native";
import { useEffect, useState, useRef } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type BannerState = "hidden" | "offline" | "online";

const ANIMATION_DURATION = 200;
const ONLINE_BANNER_DISPLAY_MS = 2000;

interface NetworkStatusBannerProps {
  /** Control visibility externally (default: auto-managed) */
  visible?: boolean;
}

/**
 * NetworkStatusBanner displays network status changes.
 *
 * Features:
 * - Slides in from top when offline
 * - Shows orange/amber warning with WifiOff icon
 * - Shows green "Back online" briefly when reconnected
 * - Auto-dismisses after 2 seconds when online
 * - Respects safe area insets
 *
 * @example
 * // Place at the top of screen layouts
 * function ScreenLayout() {
 *   return (
 *     <View className="flex-1">
 *       <NetworkStatusBanner />
 *       <Content />
 *     </View>
 *   );
 * }
 */
export function NetworkStatusBanner({ visible }: NetworkStatusBannerProps) {
  const { isOnline, isOffline } = useNetwork();
  const insets = useSafeAreaInsets();

  const [bannerState, setBannerState] = useState<BannerState>("hidden");
  const translateY = useSharedValue(-50);
  const wasOfflineRef = useRef(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Determine banner visibility based on external prop or internal state
  const shouldShow = visible !== undefined ? visible : bannerState !== "hidden";

  // Clear any pending timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Handle network state changes
  useEffect(() => {
    // Clear any pending hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    if (isOffline) {
      wasOfflineRef.current = true;
      setBannerState("offline");
      translateY.value = withTiming(0, { duration: ANIMATION_DURATION });
    } else if (isOnline && wasOfflineRef.current) {
      // Show "Back online" banner
      setBannerState("online");
      translateY.value = withTiming(0, { duration: ANIMATION_DURATION });

      // Auto-hide after delay
      hideTimeoutRef.current = setTimeout(() => {
        translateY.value = withTiming(-50, { duration: ANIMATION_DURATION });
        setTimeout(() => {
          setBannerState("hidden");
          wasOfflineRef.current = false;
        }, ANIMATION_DURATION);
      }, ONLINE_BANNER_DISPLAY_MS);
    } else if (isOnline && !wasOfflineRef.current) {
      // Initial online state - no banner needed
      setBannerState("hidden");
      translateY.value = -50;
    }
  }, [isOnline, isOffline, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!shouldShow && bannerState === "hidden") {
    return null;
  }

  const isOfflineBanner = bannerState === "offline";

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          paddingTop: insets.top,
        },
      ]}
    >
      <View
        className={`flex-row items-center justify-center gap-2 py-2 px-4 ${
          isOfflineBanner
            ? "bg-amber-600/90"
            : "bg-green-600/90"
        }`}
      >
        <Icon
          as={isOfflineBanner ? WifiOff : Wifi}
          size={16}
          className="text-white"
        />
        <Text className="text-white text-sm font-medium">
          {isOfflineBanner ? "No internet connection" : "Back online"}
        </Text>
      </View>
    </Animated.View>
  );
}

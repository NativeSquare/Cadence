/**
 * Push Notification Hook
 *
 * Handles the full push notification lifecycle:
 * 1. Requests notification permissions
 * 2. Registers the Expo push token with the backend
 * 3. Listens for notification taps and navigates accordingly
 */

import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";

// Configure how notifications are presented when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowInForeground: true,
  }),
});

export function usePushNotifications(enabled = true) {
  const router = useRouter();
  const registerToken = useMutation(
    api.integrations.notifications.registerPushToken,
  );
  const registeredRef = useRef(false);

  // Register push token when enabled (authenticated + onboarded)
  useEffect(() => {
    if (!enabled || registeredRef.current) return;

    async function register() {
      // Push notifications only work on physical devices
      if (!Device.isDevice) {
        console.log("[push] Must use physical device for push notifications");
        return;
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("[push] Permission not granted");
        return;
      }

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;

      if (!projectId) {
        console.error("[push] No EAS projectId found");
        return;
      }

      try {
        const { data: token } = await Notifications.getExpoPushTokenAsync({
          projectId,
        });

        await registerToken({
          token,
          platform: Platform.OS,
        });

        registeredRef.current = true;
        console.log("[push] Token registered:", token);
      } catch (err) {
        console.error("[push] Failed to register token:", err);
      }
    }

    register();
  }, [enabled, registerToken]);

  // Listen for notification taps (response = user interacted with notification)
  useEffect(() => {
    const subscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as {
          sessionId?: string;
          screen?: string;
        } | undefined;

        if (data?.screen === "debrief" && data.sessionId) {
          router.push({
            pathname: "/(app)/session/[id]",
            params: { id: data.sessionId, mode: "debrief" },
          });
        }
      });

    return () => subscription.remove();
  }, [router]);
}

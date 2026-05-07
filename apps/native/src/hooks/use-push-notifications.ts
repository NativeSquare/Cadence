/**
 * Push Notification Hook
 *
 * Handles the full push notification lifecycle:
 * 1. Requests notification permissions
 * 2. Registers the Expo push token with the backend
 * 3. Re-checks on app foreground so OS-level permission flips are picked up
 * 4. Listens for notification taps and navigates accordingly
 */

import { useEffect } from "react";
import { AppState } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";

// Configure how notifications are presented when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications(enabled = true) {
  const router = useRouter();
  const recordToken = useMutation(api.notifications.recordPushNotificationToken);

  useEffect(() => {
    if (!enabled) return;

    async function register({ requestPermission }: { requestPermission: boolean }) {
      if (!Device.isDevice) {
        console.log("[push] Must use physical device for push notifications");
        return;
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted" && requestPermission) {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") return;

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
        await recordToken({ token });
      } catch (err) {
        console.error("[push] Failed to register token:", err);
      }
    }

    register({ requestPermission: true });

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        register({ requestPermission: false });
      }
    });

    return () => sub.remove();
  }, [enabled, recordToken]);

  // Listen for notification taps (response = user interacted with notification)
  useEffect(() => {
    const subscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as {
          workoutId?: string;
          screen?: string;
        } | undefined;

        if (data?.screen === "workout" && data.workoutId) {
          router.push(`/(app)/workouts/${data.workoutId}`);
        }
      });

    return () => subscription.remove();
  }, [router]);
}

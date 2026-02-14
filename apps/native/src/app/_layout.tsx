import "@/lib/nativewind-interop";
import { ThemeStatusBar } from "@/lib/theme-status-bar";
import { checkForUpdates } from "@/utils/expo/check-for-updates";
import { ConvexAuthProvider, useAuthActions } from "@convex-dev/auth/react";
import { api } from "@packages/backend/convex/_generated/api";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { PortalHost } from "@rn-primitives/portal";
import { ConvexReactClient, useConvexAuth, useMutation, useQuery } from "convex/react";
import { Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useColorScheme } from "nativewind";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Alert, Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./global.css";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

const secureStorage = {
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  removeItem: SecureStore.deleteItemAsync,
};

export default function RootLayout() {
  useEffect(() => {
    if (!__DEV__) {
      checkForUpdates();
    }
  }, []);
  return (
    <KeyboardProvider>
      <ConvexAuthProvider
        client={convex}
        storage={
          Platform.OS === "android" || Platform.OS === "ios"
            ? secureStorage
            : undefined
        }
      >
        <GestureHandlerRootView>
          <BottomSheetModalProvider>
            <SafeAreaProvider>
              <ThemeStatusBar />
              <RootStack />
              <PortalHost />
            </SafeAreaProvider>
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </ConvexAuthProvider>
    </KeyboardProvider>
  );
}

function RootStack() {
  const { colorScheme } = useColorScheme();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const user = useQuery(api.table.users.currentUser);
  const runner = useQuery(
    api.table.runners.getCurrentRunner,
    isAuthenticated ? {} : "skip"
  );
  const createRunner = useMutation(api.table.runners.createRunner);
  const hasCompletedOnboarding = user?.hasCompletedOnboarding ?? false;
  const runnerCreationAttempted = useRef(false);

  // Auto-create Runner Object for new users
  useEffect(() => {
    if (
      isAuthenticated &&
      user &&
      runner === null &&
      !runnerCreationAttempted.current
    ) {
      runnerCreationAttempted.current = true;
      createRunner({
        identity: {
          name: user.name ?? "",
          nameConfirmed: false,
        },
      }).catch((err) => {
        console.error("Failed to create runner:", err);
        runnerCreationAttempted.current = false;
      });
    }
    // Reset flag when user changes (e.g., sign out)
    if (!isAuthenticated) {
      runnerCreationAttempted.current = false;
    }
  }, [isAuthenticated, user, runner, createRunner]);

  // Detect banned users and show alert before signing them out
  const isBanned =
    user?.banned && (!user.banExpires || user.banExpires > Date.now());

  useEffect(() => {
    if (isAuthenticated && isBanned) {
      Alert.alert(
        "Account Suspended",
        user?.banReason
          ? `Your account has been suspended: ${user.banReason}. Contact support if you believe this is an error.`
          : "Your account has been suspended. Contact support if you believe this is an error.",
        [{ text: "OK", onPress: () => signOut() }]
      );
    }
  }, [isAuthenticated, isBanned]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator color={colorScheme === "dark" ? "white" : "black"} />
      </View>
    );
  }
  return (
    <View className="flex-1 bg-background">
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade_from_bottom",
          contentStyle: { backgroundColor: "transparent" },
        }}
      >
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>

        <Stack.Protected guard={isAuthenticated && !hasCompletedOnboarding}>
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>

        <Stack.Protected guard={isAuthenticated && hasCompletedOnboarding}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
      </Stack>
    </View>
  );
}

import "@/lib/nativewind-interop";
import { fontAssets } from "@/lib/fonts";
import { initI18n, setLanguage, useLanguage } from "@/lib/i18n";
import { ThemeStatusBar } from "@/lib/theme-status-bar";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { checkForUpdates } from "@/utils/expo/check-for-updates";
import { NetworkProvider } from "@/contexts/network-context";
import { ConvexAuthProvider, useAuthActions } from "@convex-dev/auth/react";
import { api } from "@packages/backend/convex/_generated/api";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { PortalHost } from "@rn-primitives/portal";
import {
  ConvexReactClient,
  useConvexAuth,
  useMutation,
  useQuery,
} from "convex/react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "nativewind";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./global.css";

SplashScreen.preventAutoHideAsync();

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

const secureStorage = {
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  removeItem: SecureStore.deleteItemAsync,
};

export default function RootLayout() {
  const { setColorScheme } = useColorScheme();
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const [i18nReady, setI18nReady] = useState(false);

  // Force light mode globally
  useEffect(() => {
    setColorScheme("light");
  }, [setColorScheme]);

  useEffect(() => {
    initI18n()
      .catch((err) => console.warn("[i18n] init failed", err))
      .finally(() => setI18nReady(true));
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if ((fontsLoaded || fontError) && i18nReady) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, i18nReady]);

  useEffect(() => {
    if (!__DEV__) {
      checkForUpdates();
    }
  }, []);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  if ((!fontsLoaded && !fontError) || !i18nReady) {
    return null;
  }

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
          <NetworkProvider>
            <BottomSheetModalProvider>
              <SafeAreaProvider>
                <ThemeStatusBar />
                <RootStack />
                <PortalHost />
              </SafeAreaProvider>
            </BottomSheetModalProvider>
          </NetworkProvider>
        </GestureHandlerRootView>
      </ConvexAuthProvider>
    </KeyboardProvider>
  );
}

function RootStack() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const user = useQuery(
    api.table.users.currentUser,
    isAuthenticated ? {} : "skip",
  );
  const athlete = useQuery(
    api.agoge.athletes.getAthlete,
    isAuthenticated ? {} : "skip",
  );
  const upsertAthlete = useMutation(api.agoge.athletes.upsertAthlete);
  const setUserLocale = useMutation(api.table.users.setLocale);
  const currentLocale = useLanguage();
  const hasCompletedOnboarding = user?.hasCompletedOnboarding ?? false;
  const athleteCreationAttempted = useRef(false);

  // Keep server <-> local language in sync. Server wins when it has a value;
  // otherwise push the locally-detected language up so it persists across devices.
  useEffect(() => {
    if (!user) return;
    if (!user.locale) {
      setUserLocale({ locale: currentLocale }).catch((err) =>
        console.warn("[i18n] setLocale failed", err),
      );
      return;
    }
    if (user.locale !== currentLocale) {
      setLanguage(user.locale);
    }
  }, [user, currentLocale, setUserLocale]);

  // Auto-create agoge athlete for new users
  useEffect(() => {
    if (
      isAuthenticated &&
      user &&
      athlete === null &&
      !athleteCreationAttempted.current
    ) {
      athleteCreationAttempted.current = true;
      upsertAthlete(user.name ? { name: user.name } : {}).catch((err) => {
        console.error("Failed to create athlete:", err);
        athleteCreationAttempted.current = false;
      });
    }
    // Reset flag when user changes (e.g., sign out)
    if (!isAuthenticated) {
      athleteCreationAttempted.current = false;
    }
  }, [isAuthenticated, user, athlete, upsertAthlete]);

  // Register push notifications when authenticated and onboarded
  usePushNotifications(isAuthenticated && hasCompletedOnboarding);

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
        [{ text: "OK", onPress: () => signOut() }],
      );
    }
  }, [isAuthenticated, isBanned]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator color="black" />
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

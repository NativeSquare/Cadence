import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { LEGAL_URLS } from "@/lib/constants";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { useAuthActions } from "@convex-dev/auth/react";
import { APP_SLUG } from "@packages/shared";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { openAuthSessionAsync } from "expo-web-browser";
import * as React from "react";
import { ActivityIndicator, Alert, Image, Platform, View } from "react-native";

const SOCIAL_STRATEGIES = [
  {
    provider: "google",
    label: "Continue with Google",
    source: { uri: "https://img.clerk.com/static/google.png?width=160" },
    useTint: false,
    enabled: true,
  },
  {
    provider: "apple",
    label: "Continue with Apple",
    source: { uri: "https://img.clerk.com/static/apple.png?width=160" },
    useTint: true,
    enabled: false, // Deferred - Apple Sign-In coming later
  },
];

export function SignInCard() {
  const redirectTo = makeRedirectUri();
  const { signIn } = useAuthActions();
  const [loadingProvider, setLoadingProvider] = React.useState<string | null>(
    null,
  );
  const [error, setError] = React.useState<string | null>(null);

  async function handleSocialSignIn(
    strategy: (typeof SOCIAL_STRATEGIES)[number],
  ) {
    // Handle disabled providers (e.g., Apple Sign-In is deferred)
    if (!strategy.enabled) {
      Alert.alert(
        "Coming Soon",
        "Apple Sign-In will be available in a future update.",
        [{ text: "OK" }]
      );
      return;
    }

    setLoadingProvider(strategy.provider);
    setError(null);
    try {
      const { redirect } = await signIn(strategy.provider, { redirectTo });
      if (Platform.OS === "web") return;
      const result = await openAuthSessionAsync(
        redirect!.toString(),
        redirectTo,
      );
      if (result.type === "success") {
        const { url } = result;
        const code = new URL(url).searchParams.get("code")!;
        await signIn(strategy.provider, {
          code,
          redirectTo: `${APP_SLUG}://`,
        });
      }
    } catch (err) {
      setError(getConvexErrorMessage(err));
    } finally {
      setLoadingProvider(null);
    }
  }

  const openTerms = () => WebBrowser.openBrowserAsync(LEGAL_URLS.terms);
  const openPrivacy = () => WebBrowser.openBrowserAsync(LEGAL_URLS.privacy);

  return (
    <View className="rounded-3xl bg-card px-6 pt-8 pb-8 gap-3">
      <Text className="text-xl font-bold text-center mb-2">Get Started</Text>
      {error && (
        <Text className="text-destructive text-center text-sm">{error}</Text>
      )}
      {SOCIAL_STRATEGIES.map((strategy) => (
        <Button
          key={strategy.provider}
          variant="outline"
          className={`w-full h-12 rounded-xl !bg-white ${!strategy.enabled ? "opacity-50" : ""}`}
          onPress={() => handleSocialSignIn(strategy)}
          disabled={!!loadingProvider}
        >
          {loadingProvider === strategy.provider ? (
            <ActivityIndicator />
          ) : (
            <>
              <Image
                className="size-5"
                tintColor={Platform.select({
                  native: strategy.useTint ? "black" : undefined,
                })}
                source={strategy.source}
              />
              <Text className="text-black">{strategy.label}</Text>
            </>
          )}
        </Button>
      ))}

      {/* Legal acceptance text */}
      <Text className="text-muted-foreground text-center text-xs mt-2 leading-5">
        By signing in, you agree to our{" "}
        <Text onPress={openTerms} className="text-primary text-xs underline">
          Terms of Service
        </Text>
        {" "}and{" "}
        <Text onPress={openPrivacy} className="text-primary text-xs underline">
          Privacy Policy
        </Text>
      </Text>
    </View>
  );
}

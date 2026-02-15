import { Text } from "@/components/ui/text";
import { COLORS, GRAYS } from "@/lib/design-tokens";
import { LEGAL_URLS } from "@/lib/constants";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { useAuthActions } from "@convex-dev/auth/react";
import { APP_SLUG } from "@packages/shared";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { openAuthSessionAsync } from "expo-web-browser";
import * as React from "react";
import { Alert, Platform, StyleSheet, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInUp,
} from "react-native-reanimated";
import { GoogleButton, AppleButton } from "./oauth-buttons";
import { CommunityPulse } from "./community-pulse";

export function SignInCard() {
  const redirectTo = makeRedirectUri();
  const { signIn } = useAuthActions();
  const [loadingProvider, setLoadingProvider] = React.useState<string | null>(
    null
  );
  const [error, setError] = React.useState<string | null>(null);

  async function handleGoogleSignIn() {
    setLoadingProvider("google");
    setError(null);
    try {
      const { redirect } = await signIn("google", { redirectTo });
      if (Platform.OS === "web") return;
      const result = await openAuthSessionAsync(
        redirect!.toString(),
        redirectTo
      );
      if (result.type === "success") {
        const { url } = result;
        const code = new URL(url).searchParams.get("code")!;
        await signIn("google", {
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

  async function handleAppleSignIn() {
    // Apple Sign-In deferred
    Alert.alert(
      "Coming Soon",
      "Apple Sign-In will be available in a future update.",
      [{ text: "OK" }]
    );
  }

  const openTerms = () => WebBrowser.openBrowserAsync(LEGAL_URLS.terms);
  const openPrivacy = () => WebBrowser.openBrowserAsync(LEGAL_URLS.privacy);

  return (
    <View style={styles.container}>
      {/* Logo / wordmark */}
      <Animated.View entering={FadeIn.duration(600)} style={styles.logoContainer}>
        <Text style={styles.logo}>cadence</Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.Text
        entering={FadeIn.duration(600).delay(150)}
        style={styles.tagline}
      >
        AI coaching that sees what you can't.
      </Animated.Text>

      {/* Community counter */}
      <Animated.View
        entering={FadeInUp.duration(500).delay(300)}
        style={styles.pulseContainer}
      >
        <CommunityPulse />
      </Animated.View>

      {/* OAuth buttons */}
      <View style={styles.buttonsContainer}>
        {error && <Text style={styles.error}>{error}</Text>}
        <Animated.View entering={FadeInUp.duration(500).delay(100)}>
          <GoogleButton
            onPress={handleGoogleSignIn}
            loading={loadingProvider === "google"}
            disabled={!!loadingProvider}
          />
        </Animated.View>
        <Animated.View entering={FadeInUp.duration(500).delay(200)}>
          <AppleButton
            onPress={handleAppleSignIn}
            loading={loadingProvider === "apple"}
            disabled={!!loadingProvider}
          />
        </Animated.View>
      </View>

      {/* Legal */}
      <Animated.Text
        entering={FadeIn.duration(500).delay(400)}
        style={styles.legal}
      >
        By signing in, you agree to our{" "}
        <Text onPress={openTerms} style={styles.legalLink}>
          Terms of Service
        </Text>{" "}
        and{" "}
        <Text onPress={openPrivacy} style={styles.legalLink}>
          Privacy Policy
        </Text>
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 32,
    paddingHorizontal: 28,
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: 6,
  },
  logo: {
    fontFamily: "Outfit-Bold",
    fontSize: 32,
    color: GRAYS.g1,
    letterSpacing: -1.28,
  },
  tagline: {
    fontFamily: "Outfit-Light",
    fontSize: 15,
    color: GRAYS.g3,
    textAlign: "center",
    marginBottom: 24,
    letterSpacing: -0.15,
  },
  pulseContainer: {
    marginBottom: 28,
  },
  buttonsContainer: {
    width: "100%",
    gap: 10,
    marginBottom: 24,
  },
  error: {
    fontFamily: "Outfit-Regular",
    fontSize: 14,
    color: "#FF5A5A",
    textAlign: "center",
    marginBottom: 8,
  },
  legal: {
    fontFamily: "Outfit-Light",
    fontSize: 12,
    color: GRAYS.g4,
    textAlign: "center",
    lineHeight: 19.2,
  },
  legalLink: {
    fontFamily: "Outfit-Light",
    fontSize: 12,
    color: COLORS.lime,
  },
});

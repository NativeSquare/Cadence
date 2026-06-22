import { SignInCard } from "@/components/app/auth/sign-in-card";
import { GRAYS } from "@/lib/design-tokens";
import { StatusBar } from "expo-status-bar";
import { ImageBackground, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";

const backgroundImage = require("../../../../assets/images/background.jpg");

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ImageBackground
        source={backgroundImage}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Top section: honest product framing over the background image.
            Replaced the fabricated testimonial carousel — no impersonated users. */}
        <View style={styles.framingSection}>
          <Animated.Text
            entering={FadeIn.duration(600)}
            style={styles.framingVision}
          >
            {t("auth.framing.vision")}
          </Animated.Text>
          <Animated.Text
            entering={FadeIn.duration(600).delay(150)}
            style={styles.framingGrounded}
          >
            {t("auth.framing.grounded")}
          </Animated.Text>
        </View>

        {/* Bottom section: Auth controls with gradient fade from transparent to black */}
        <LinearGradient
          colors={[
            "transparent",
            "rgba(0,0,0,0.7)",
            "rgba(0,0,0,0.92)",
            "#000000",
          ]}
          locations={[0, 0.2, 0.4, 0.55]}
          style={styles.authSection}
        >
          <View style={{ paddingBottom: Math.max(insets.bottom, 24) }}>
            <SignInCard />
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  background: {
    flex: 1,
  },
  framingSection: {
    flex: 0.42,
    overflow: "hidden",
    justifyContent: "flex-end",
    paddingHorizontal: 32,
    paddingBottom: 8,
  },
  framingVision: {
    fontFamily: "Outfit-Light",
    fontSize: 28,
    lineHeight: 36,
    color: GRAYS.g1,
    letterSpacing: -0.84,
    marginBottom: 12,
  },
  framingGrounded: {
    fontFamily: "Outfit-Regular",
    fontSize: 14,
    lineHeight: 20,
    color: GRAYS.g3,
    letterSpacing: -0.14,
  },
  authSection: {
    flex: 0.58,
    justifyContent: "flex-end",
  },
});

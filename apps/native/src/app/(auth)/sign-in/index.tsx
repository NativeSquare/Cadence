import { SignInCard } from "@/components/app/auth/sign-in-card";
import { TestimonialCarousel } from "@/components/app/auth/testimonial-carousel";
import { StatusBar } from "expo-status-bar";
import { ImageBackground, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const backgroundImage = require("../../../../assets/images/background.jpg");

export default function SignIn() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ImageBackground
        source={backgroundImage}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Top section: Testimonial area over background image */}
        <View style={styles.testimonialSection}>
          <TestimonialCarousel />
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
  testimonialSection: {
    flex: 0.42,
    overflow: "hidden",
  },
  authSection: {
    flex: 0.58,
    justifyContent: "flex-end",
  },
});

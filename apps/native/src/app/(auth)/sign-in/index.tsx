import { SignInCard } from "@/components/app/auth/sign-in-card";
import { TestimonialCarousel } from "@/components/app/auth/testimonial-carousel";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SignIn() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Top section: Testimonial area with gradient background */}
      <View style={styles.testimonialSection}>
        {/* Forest/running gradient background */}
        <LinearGradient
          colors={["#0a1a0a", "#0d1f0d", "#081408", "#050505"]}
          locations={[0, 0.3, 0.6, 1]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Radial glow overlays */}
        <View style={styles.glowOverlay1} />
        <View style={styles.glowOverlay2} />

        <TestimonialCarousel />
      </View>

      {/* Bottom section: Auth controls with gradient fade */}
      <LinearGradient
        colors={[
          "transparent",
          "rgba(0,0,0,0.85)",
          "#000000",
        ]}
        locations={[0, 0.15, 0.3]}
        style={styles.authSection}
      >
        <View style={{ paddingBottom: Math.max(insets.bottom, 24) }}>
          <SignInCard />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  testimonialSection: {
    flex: 0.58,
    overflow: "hidden",
  },
  glowOverlay1: {
    position: "absolute",
    top: "30%",
    left: "30%",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(15,40,15,0.6)",
    transform: [{ scaleX: 1.5 }],
  },
  glowOverlay2: {
    position: "absolute",
    top: "50%",
    right: "20%",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(10,30,10,0.4)",
  },
  authSection: {
    flex: 0.42,
    justifyContent: "flex-end",
  },
});

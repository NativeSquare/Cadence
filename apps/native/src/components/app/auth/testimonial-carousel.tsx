import { COLORS, GRAYS } from "@/lib/design-tokens";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";

const testimonials = [
  {
    name: "Sarah M.",
    result: "1:38 half marathon",
    quote: "Cadence saw what I couldn't — I was overtraining every easy day.",
    location: "London, UK",
    weeks: 12,
  },
  {
    name: "Thomas K.",
    result: "Sub-3:15 marathon",
    quote: "The plan adapted after my knee flared up. No other app does that.",
    location: "Berlin, DE",
    weeks: 16,
  },
  {
    name: "Léa R.",
    result: "First 10K completed",
    quote: "I went from couch to 10K with a coach that actually listened.",
    location: "Lyon, FR",
    weeks: 8,
  },
  {
    name: "James O.",
    result: "PR by 4 minutes",
    quote:
      "The decision audit sold me. I finally understand WHY I'm doing each run.",
    location: "Austin, TX",
    weeks: 10,
  },
  {
    name: "Aiko N.",
    result: "Consistent 5x/week",
    quote: "Recovery days aren't optional anymore. My body thanks me.",
    location: "Tokyo, JP",
    weeks: 14,
  },
];

export function TestimonialCarousel() {
  const [idx, setIdx] = useState(0);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    const cycle = () => {
      // Fade out
      opacity.value = withTiming(0, { duration: 500 });
      translateY.value = withTiming(-10, { duration: 500 });

      setTimeout(() => {
        setIdx((i) => (i + 1) % testimonials.length);
        // Reset position
        translateY.value = 10;
        // Fade in
        opacity.value = withTiming(1, { duration: 500 });
        translateY.value = withTiming(0, { duration: 500 });
      }, 500);
    };

    const iv = setInterval(cycle, 5000);
    return () => clearInterval(iv);
  }, [opacity, translateY]);

  const t = testimonials[idx];

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Ambient glow effects */}
      <View style={styles.glowTop} />
      <View style={styles.glowRight} />

      <Animated.View style={[styles.content, animatedStyle]}>
        {/* Quote mark */}
        <Text style={styles.quoteMark}>"</Text>

        {/* Quote text */}
        <Text style={styles.quoteText}>{t.quote}</Text>

        {/* Person + result */}
        <View style={styles.personRow}>
          {/* Avatar */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{t.name.charAt(0)}</Text>
          </View>

          <View>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{t.name}</Text>
              <Text style={styles.location}>{t.location}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.result}>{t.result}</Text>
              <Text style={styles.weeks}>· {t.weeks} weeks</Text>
            </View>
          </View>
        </View>

        {/* Carousel dots */}
        <View style={styles.dotsContainer}>
          {testimonials.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === idx ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 36,
  },
  glowTop: {
    position: "absolute",
    top: "20%",
    left: "15%",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(200,255,0,0.03)",
  },
  glowRight: {
    position: "absolute",
    top: "35%",
    right: "10%",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(200,255,0,0.02)",
  },
  content: {
    zIndex: 5,
  },
  quoteMark: {
    fontFamily: "Outfit-Light",
    fontSize: 48,
    color: COLORS.lime,
    lineHeight: 48,
    marginBottom: -8,
    opacity: 0.4,
  },
  quoteText: {
    fontFamily: "Outfit-Light",
    fontSize: 22,
    color: GRAYS.g1,
    lineHeight: 32,
    letterSpacing: -0.44,
    marginBottom: 20,
  },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.limeDim,
    borderWidth: 1.5,
    borderColor: "rgba(200,255,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 16,
    color: COLORS.lime,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    fontFamily: "Outfit-Medium",
    fontSize: 15,
    color: GRAYS.g1,
  },
  location: {
    fontFamily: "JetBrainsMono-Regular",
    fontSize: 10,
    color: GRAYS.g4,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  result: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 12,
    color: COLORS.lime,
  },
  weeks: {
    fontFamily: "JetBrainsMono-Regular",
    fontSize: 10,
    color: GRAYS.g4,
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 6,
    marginTop: 20,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 20,
    backgroundColor: COLORS.lime,
  },
  dotInactive: {
    width: 6,
    backgroundColor: GRAYS.g5,
  },
});

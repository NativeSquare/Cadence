import { useStreamingText, StreamPhrase } from "@/hooks/use-streaming-text";
import { selectionFeedback, arrivalPulse, insightTap } from "@/lib/haptics";
import { Text } from "@/components/ui/text";
import { useRef, useEffect, useState } from "react";
import { Animated, Pressable, View } from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

type WelcomeScreenProps = {
  userName: string;
  /** Which part of the welcome to show */
  part: "intro" | "transition";
  /** Called when the user taps the CTA button for this part */
  onContinue: () => void;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function WelcomeScreen({
  userName,
  part,
  onContinue,
}: WelcomeScreenProps) {
  const [showButton, setShowButton] = useState(false);

  const introPhrases: StreamPhrase[] = [
    { text: `Hey ${userName}!`, haptic: "arrival", pauseAfter: 350 },
    { text: "I'm Cadence.", pauseAfter: 450 },
    {
      text: "Not just a training plan.\nNot a calendar.",
      pauseAfter: 350,
    },
    { text: "Your running coach.", haptic: "insight", pauseAfter: 250 },
  ];

  const transitionPhrases: StreamPhrase[] = [
    {
      text: "But every runner's different. Before I coach you, I need to know who I'm working with.",
      haptic: "arrival",
      pauseAfter: 400,
    },
    { text: "Mind a few questions?", haptic: "question", pauseAfter: 200 },
  ];

  const phrases = part === "intro" ? introPhrases : transitionPhrases;

  const { visiblePhrases, currentPhraseIndex, isComplete } = useStreamingText({
    phrases,
    charDelay: 18,
    initialDelay: 300,
    onComplete: () => setShowButton(true),
    onPhraseStart: (phrase) => {
      if (phrase.haptic === "arrival") arrivalPulse();
      if (phrase.haptic === "insight") insightTap();
    },
  });

  const buttonLabel = part === "intro" ? "Hey Cadence!" : "Get Started";

  return (
    <View className="flex-1 pt-safe">
      {/* Text from the top */}
      <View className="flex-1 px-8 pt-20">
        <View className="gap-8">
          {visiblePhrases.map((text, index) => {
            if (!text) return null;
            return (
              <WelcomeLine
                key={index}
                text={text}
                isStreaming={index === currentPhraseIndex && !isComplete}
              />
            );
          })}
        </View>
      </View>

      {/* CTA button at bottom */}
      {showButton && <WelcomeButton label={buttonLabel} onPress={onContinue} />}
    </View>
  );
}

// ─── Welcome Line ─────────────────────────────────────────────────────────────

function WelcomeLine({
  text,
  isStreaming,
}: {
  text: string;
  isStreaming: boolean;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Text className="text-[34px] leading-[1.25] text-white font-extralight tracking-wide">
        {text}
        {isStreaming && <Text className="text-white/30">|</Text>}
      </Text>
    </Animated.View>
  );
}

// ─── Welcome Button ───────────────────────────────────────────────────────────

function WelcomeButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateY: translateAnim }] }}
      className="px-6 pb-12"
    >
      <Pressable
        onPress={() => {
          selectionFeedback();
          onPress();
        }}
        className="bg-primary rounded-2xl py-4 items-center active:bg-primary/90"
      >
        <Text className="text-primary-foreground font-bold text-lg tracking-wide">
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

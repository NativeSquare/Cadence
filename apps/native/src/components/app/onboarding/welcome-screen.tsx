import { useStreamingText, StreamPhrase } from "@/hooks/use-streaming-text";
import { selectionFeedback, arrivalPulse, insightTap } from "@/lib/haptics";
import { Text } from "@/components/ui/text";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { useRef, useEffect, useState } from "react";
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

type WelcomeScreenProps = {
  userName: string;
  /** Which part of the welcome to show */
  part: "intro" | "got-it" | "transition";
  /** Called when the user taps the CTA button for this part */
  onContinue: () => void;
  /** Called when the user changes their name */
  onNameChanged?: (newName: string) => void;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function WelcomeScreen({
  userName,
  part,
  onContinue,
  onNameChanged,
}: WelcomeScreenProps) {
  const [showButton, setShowButton] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [newName, setNewName] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const confirmName = useMutation(api.table.runners.confirmName);

  const introPhrases: StreamPhrase[] = [
    { text: `Welcome ${userName}`, pauseAfter: 600 },
    { text: "I'm Cadence.", pauseAfter: 450 },
    {
      text: "Not just a training plan.\nNot a calendar.",
      pauseAfter: 350,
    },
    { text: "Your running coach.", haptic: "insight", pauseAfter: 250 },
  ];

  const gotItPhrases: StreamPhrase[] = [
    { text: "Got it.", haptic: "insight", pauseAfter: 800 },
  ];

  const transitionPhrases: StreamPhrase[] = [
    {
      text: `${userName}, every runner's different. Before I coach you, I need to know who I'm working with.`,
      haptic: "arrival",
      pauseAfter: 400,
    },
    { text: "Mind a few questions?", haptic: "question", pauseAfter: 200 },
  ];

  const phrases =
    part === "intro"
      ? introPhrases
      : part === "got-it"
        ? gotItPhrases
        : transitionPhrases;

  const { visiblePhrases, currentPhraseIndex, isComplete } = useStreamingText({
    phrases,
    charDelay: 18,
    initialDelay: part === "got-it" ? 500 : 1000,
    onComplete: () => {
      if (part === "got-it") {
        // Auto-continue after "Got it" completes
        setTimeout(() => onContinue(), 600);
      } else {
        setShowButton(true);
      }
    },
    onPhraseStart: (phrase) => {
      if (phrase.haptic === "arrival") arrivalPulse();
      if (phrase.haptic === "insight") insightTap();
    },
  });

  const buttonLabel = part === "intro" ? "Hey Cadence!" : "Get Started";

  const handleContinue = async () => {
    selectionFeedback();
    // Confirm name on intro screen before continuing
    if (part === "intro") {
      setIsConfirming(true);
      try {
        await confirmName({});
        onContinue();
      } finally {
        setIsConfirming(false);
      }
    } else {
      onContinue();
    }
  };

  const handleChangeName = () => {
    selectionFeedback();
    setNewName(userName); // Pre-fill with current name
    setShowNameInput(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSubmitNewName = async () => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      inputRef.current?.focus();
      return;
    }

    selectionFeedback();
    Keyboard.dismiss();
    setIsConfirming(true);
    try {
      await confirmName({ name: trimmedName });
      onNameChanged?.(trimmedName);
    } finally {
      setIsConfirming(false);
    }
  };

  // Name input view - inline text editing style
  if (showNameInput) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View className="flex-1 pt-safe px-8 justify-center">
          <View className="gap-8">
            <Text className="text-[34px] leading-[1.25] text-white font-extralight tracking-wide">
              How should I call you?
            </Text>

            <View className="flex-row items-center">
              <TextInput
                ref={inputRef}
                value={newName}
                onChangeText={setNewName}
                placeholder="Your name"
                placeholderTextColor="rgba(255,255,255,0.3)"
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSubmitNewName}
                selectionColor="#D4FF3A"
                cursorColor="#D4FF3A"
                style={{
                  fontSize: 34,
                  lineHeight: 42,
                  color: "white",
                  fontWeight: "200",
                  letterSpacing: 0.5,
                  padding: 0,
                  margin: 0,
                  minWidth: 100,
                }}
              />
            </View>

            <Pressable
              onPress={handleSubmitNewName}
              disabled={isConfirming || !newName.trim()}
              className={`bg-primary rounded-2xl py-4 items-center active:bg-primary/90 mt-4 ${
                !newName.trim() ? "opacity-50" : ""
              }`}
            >
              <Text className="text-primary-foreground font-bold text-lg tracking-wide">
                {isConfirming ? "..." : "That's better"}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // "Got it" scene - centered text
  if (part === "got-it") {
    return (
      <View className="flex-1 pt-safe items-center justify-center px-8">
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
    );
  }

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

      {/* CTA buttons at bottom */}
      {showButton && (
        <WelcomeButtons
          primaryLabel={buttonLabel}
          onPrimaryPress={handleContinue}
          showSecondary={part === "intro"}
          onSecondaryPress={handleChangeName}
          isLoading={isConfirming}
        />
      )}
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

// ─── Welcome Buttons ───────────────────────────────────────────────────────────

function WelcomeButtons({
  primaryLabel,
  onPrimaryPress,
  showSecondary,
  onSecondaryPress,
  isLoading,
}: {
  primaryLabel: string;
  onPrimaryPress: () => void;
  showSecondary: boolean;
  onSecondaryPress: () => void;
  isLoading: boolean;
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
      className="px-6 pb-12 gap-3"
    >
      <Pressable
        onPress={onPrimaryPress}
        disabled={isLoading}
        className="bg-primary rounded-2xl py-4 items-center active:bg-primary/90"
      >
        <Text className="text-primary-foreground font-bold text-lg tracking-wide">
          {isLoading ? "..." : primaryLabel}
        </Text>
      </Pressable>

      {showSecondary && (
        <Pressable onPress={onSecondaryPress} className="py-3 items-center">
          <Text className="text-muted-foreground text-base">Change my name</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

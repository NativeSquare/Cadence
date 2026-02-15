/**
 * WelcomeMock - Welcome screen matching cadence-v3.jsx prototype.
 *
 * Source: cadence-v3.jsx lines 376-394
 */

import { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { useStream } from "@/hooks/use-stream";
import { Cursor } from "../../Cursor";
import { COLORS, GRAYS } from "@/lib/design-tokens";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { selectionFeedback } from "@/lib/haptics";

interface WelcomeMockProps {
  userName?: string;
  onNext: () => void;
  onNameChanged?: (newName: string) => void;
}

export function WelcomeMock({
  userName = "Alex",
  onNext,
  onNameChanged,
}: WelcomeMockProps) {
  const [ready, setReady] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [newName, setNewName] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [displayName, setDisplayName] = useState(userName);
  const inputRef = useRef<TextInput>(null);

  const confirmName = useMutation(api.table.runners.confirmName);

  const s1 = useStream({
    text: `${displayName}, every runner's different.`,
    speed: 32,
    delay: 500,
  });

  const s2 = useStream({
    text: "Before I coach you, I need to know who I'm working with.",
    speed: 32,
    delay: 400,
    active: s1.done,
  });

  const s3 = useStream({
    text: "Mind a few questions?",
    speed: 32,
    delay: 600,
    active: s2.done,
  });

  useEffect(() => {
    if (s3.done) {
      setTimeout(() => setReady(true), 400);
    }
  }, [s3.done]);

  const handleChangeName = () => {
    selectionFeedback();
    setNewName(displayName);
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
      setDisplayName(trimmedName);
      onNameChanged?.(trimmedName);
      setShowNameInput(false);
    } finally {
      setIsConfirming(false);
    }
  };

  // Name input view
  if (showNameInput) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={styles.nameInputContainer}>
          <Text style={styles.headline}>How should I call you?</Text>

          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              value={newName}
              onChangeText={setNewName}
              placeholder="Your name"
              placeholderTextColor={GRAYS.g4}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSubmitNewName}
              selectionColor={COLORS.lime}
              cursorColor={COLORS.lime}
              style={styles.nameInput}
            />
          </View>

          <Pressable
            onPress={handleSubmitNewName}
            disabled={isConfirming || !newName.trim()}
            style={[
              styles.primaryButton,
              (isConfirming || !newName.trim()) && styles.primaryButtonDisabled,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {isConfirming ? "..." : "That's better"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.textArea}>
        <Text style={styles.headlineBold}>
          {s1.displayed}
          {!s1.done && s1.started && <Cursor visible height={36} />}
        </Text>

        {s2.started && (
          <Text style={[styles.headline, styles.marginTop]}>
            {s2.displayed}
            {!s2.done && <Cursor visible height={36} />}
          </Text>
        )}

        {s3.started && (
          <Text style={[styles.subheadline, styles.marginTopLarge]}>
            {s3.displayed}
            {!s3.done && <Cursor visible height={36} />}
          </Text>
        )}
      </View>

      {ready && (
        <Animated.View entering={FadeIn.duration(400)} style={styles.buttons}>
          <Pressable onPress={onNext} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </Pressable>
          <Pressable onPress={handleChangeName} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>That's not my name</Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
    justifyContent: "space-between",
    paddingTop: 120,
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  textArea: {
    flex: 1,
  },
  headline: {
    fontSize: 42,
    fontFamily: "Outfit-Light",
    fontWeight: "300",
    color: GRAYS.g1,
    lineHeight: 50,
    letterSpacing: -1.26,
  },
  headlineBold: {
    fontSize: 42,
    fontFamily: "Outfit-Medium",
    fontWeight: "500",
    color: GRAYS.g1,
    lineHeight: 50,
    letterSpacing: -1.26,
  },
  subheadline: {
    fontSize: 42,
    fontFamily: "Outfit-Light",
    fontWeight: "300",
    color: GRAYS.g2,
    lineHeight: 50,
    letterSpacing: -1.26,
  },
  marginTop: {
    marginTop: 8,
  },
  marginTopLarge: {
    marginTop: 24,
  },
  buttons: {
    gap: 12,
  },
  primaryButton: {
    width: "100%",
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: COLORS.lime,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.black,
    letterSpacing: -0.17,
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontFamily: "Outfit-Regular",
    fontSize: 15,
    color: GRAYS.g3,
  },
  nameInputContainer: {
    flex: 1,
    justifyContent: "center",
    gap: 32,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  nameInput: {
    fontSize: 42,
    lineHeight: 50,
    color: GRAYS.g1,
    fontFamily: "Outfit-Light",
    fontWeight: "300",
    letterSpacing: -1.26,
    padding: 0,
    margin: 0,
    minWidth: 100,
  },
});

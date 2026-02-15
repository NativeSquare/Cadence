/**
 * WelcomeMock - Welcome screen matching cadence-v3.jsx prototype.
 *
 * Source: cadence-v3.jsx lines 376-394
 */

import { useEffect, useState, useRef, useCallback } from "react";
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

// Separate component for name input to isolate state updates
interface NameInputViewProps {
  initialName: string;
  onConfirm: (name: string) => Promise<void>;
}

function NameInputView({ initialName, onConfirm }: NameInputViewProps) {
  // Use a ref instead of state to track input value — avoids a full React
  // re-render on every keystroke, which causes a visible desync/glitch
  // between the native TextInput layer and React's controlled `value` prop.
  const valueRef = useRef(initialName);
  const [isConfirming, setIsConfirming] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timeout = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timeout);
  }, []);

  const handleSubmit = async () => {
    const trimmedName = valueRef.current.trim();
    if (!trimmedName) {
      inputRef.current?.focus();
      return;
    }

    selectionFeedback();
    Keyboard.dismiss();
    setIsConfirming(true);
    try {
      await onConfirm(trimmedName);
    } finally {
      setIsConfirming(false);
    }
  };

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
            defaultValue={initialName}
            onChangeText={(text) => {
              valueRef.current = text;
            }}
            placeholder="Your name"
            placeholderTextColor={GRAYS.g4}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            textContentType="none"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            selectionColor={COLORS.lime}
            cursorColor={COLORS.lime}
            style={styles.nameInput}
          />
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={isConfirming}
          style={[
            styles.primaryButton,
            isConfirming && styles.primaryButtonDisabled,
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

// Helper to render text with "cadence" styled in bold (matching logo)
function renderWithCadenceBold(text: string) {
  const cadenceIndex = text.indexOf("cadence");
  if (cadenceIndex === -1) {
    return <Text style={styles.headline}>{text}</Text>;
  }

  const before = text.slice(0, cadenceIndex);
  const after = text.slice(cadenceIndex + 7); // "cadence".length = 7

  return (
    <>
      {before}
      <Text style={styles.cadenceBold}>cadence</Text>
      {after}
    </>
  );
}

export function WelcomeMock({
  userName = "Alex",
  onNext,
  onNameChanged,
}: WelcomeMockProps) {
  const [ready, setReady] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [displayName, setDisplayName] = useState(userName);

  const confirmName = useMutation(api.table.runners.confirmName);

  // Phrase 1: Welcome greeting (2s delay to create moment of entry)
  const s1 = useStream({
    text: `Welcome to the team, ${displayName}.`,
    speed: 32,
    delay: 2000,
    active: !showNameInput,
  });

  // Phrase 2: Identity - "I'm cadence."
  const s2 = useStream({
    text: "I'm cadence.",
    speed: 32,
    delay: 800,
    active: s1.done && !showNameInput,
  });

  // Phrase 3: Not a training plan
  const s3 = useStream({
    text: "Not a training plan app.",
    speed: 32,
    delay: 700,
    active: s2.done && !showNameInput,
  });

  // Phrase 4: Not a calendar
  const s4 = useStream({
    text: "Not a calendar.",
    speed: 32,
    delay: 600,
    active: s3.done && !showNameInput,
  });

  // Phrase 5: Your running coach
  const s5 = useStream({
    text: "Your running coach.",
    speed: 32,
    delay: 800,
    active: s4.done && !showNameInput,
  });

  useEffect(() => {
    if (s5.done) {
      setTimeout(() => setReady(true), 400);
    }
  }, [s5.done]);

  const handleChangeName = () => {
    selectionFeedback();
    setShowNameInput(true);
  };

  const handleConfirmName = useCallback(
    async (trimmedName: string) => {
      await confirmName({ name: trimmedName });
      setDisplayName(trimmedName);
      onNameChanged?.(trimmedName);
      setShowNameInput(false);
    },
    [confirmName, onNameChanged],
  );

  // Name input view - rendered in separate component to isolate state
  if (showNameInput) {
    return (
      <NameInputView initialName={displayName} onConfirm={handleConfirmName} />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.textArea}>
        {/* Phrase 1: Welcome greeting */}
        <Text style={styles.headlineBold}>
          {s1.displayed}
          {!s1.done && s1.started && <Cursor visible height={36} />}
        </Text>

        {/* Phrase 2: I'm cadence */}
        {s2.started && (
          <Text style={[styles.headline, styles.marginTop]}>
            {renderWithCadenceBold(s2.displayed)}
            {!s2.done && <Cursor visible height={36} />}
          </Text>
        )}

        {/* Phrase 3: Not a training plan app */}
        {s3.started && (
          <Text style={[styles.headline, styles.marginTopSmall]}>
            {s3.displayed}
            {!s3.done && <Cursor visible height={36} />}
          </Text>
        )}

        {/* Phrase 4: Not a calendar */}
        {s4.started && (
          <Text style={[styles.headline, styles.marginTopSmall]}>
            {s4.displayed}
            {!s4.done && <Cursor visible height={36} />}
          </Text>
        )}

        {/* Phrase 5: Your running coach */}
        {s5.started && (
          <Text style={[styles.subheadline, styles.marginTopLarge]}>
            {s5.displayed}
            {!s5.done && <Cursor visible height={36} />}
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
  cadenceBold: {
    fontFamily: "Outfit-Bold",
    fontSize: 32,
    letterSpacing: -1.28,
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
  marginTopSmall: {
    marginTop: 4,
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
    // Avoid lineHeight on TextInput — it causes a layout recalc / shift on
    // every keystroke. Use an explicit height for stable sizing instead.
    height: 56,
    color: GRAYS.g1,
    fontFamily: "Outfit-Light",
    fontWeight: "300",
    letterSpacing: -1.26,
    padding: 0,
    margin: 0,
    flex: 1,
  },
});

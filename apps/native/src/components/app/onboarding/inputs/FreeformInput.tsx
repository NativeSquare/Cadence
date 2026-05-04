/**
 * FreeformInput Component
 *
 * Enhanced text input with quick-tap pills, voice recording,
 * character count, and animated send button.
 *
 * Source: Story 2.10 - AC#7-#12
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { View, TextInput, Pressable, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { COLORS, GRAYS, SURFACES } from "@/lib/design-tokens";
import { useScaleIn, useShimmer } from "@/lib/use-animations";
import { getStaggerDelay } from "@/lib/animations";
import { Mic, ArrowUp, X, Check } from "lucide-react-native";

// =============================================================================
// Types
// =============================================================================

export interface FreeformInputProps {
  /** Placeholder text for the input */
  placeholder?: string;
  /** Quick-tap pill options */
  pills?: string[];
  /** Callback when text is submitted */
  onSubmit?: (text: string) => void;
  /** Callback when a pill is tapped */
  onPill?: (pill: string) => void;
  /** Whether voice input is enabled */
  allowVoice?: boolean;
}

// =============================================================================
// Sub-components
// =============================================================================

/** Animated pill chip with dashed border */
function PillChip({
  text,
  index,
  onPress,
  disabled,
}: {
  text: string;
  index: number;
  onPress: () => void;
  disabled: boolean;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    const delay = getStaggerDelay(index, 80);
    opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 200 }));
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={[styles.pill, disabled && styles.pillDisabled]}
      >
        <Text style={styles.pillText}>{text}</Text>
      </Pressable>
    </Animated.View>
  );
}

/** Animated send button with scaleIn */
function SendButton({
  visible,
  onPress,
}: {
  visible: boolean;
  onPress: () => void;
}) {
  const scaleStyle = useScaleIn(visible, 0, 150);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View style={scaleStyle}>
      <Pressable onPress={onPress} style={styles.sendButton}>
        <ArrowUp size={20} color="#000" strokeWidth={2.5} />
      </Pressable>
    </Animated.View>
  );
}

/** Waveform visualization bar */
function WaveformBar({ index }: { index: number }) {
  const shimmerStyle = useShimmer();
  const [height, setHeight] = useState(Math.random() * 20 + 8);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeight(Math.random() * 20 + 8);
    }, 150 + index * 10);
    return () => clearInterval(interval);
  }, [index]);

  return (
    <Animated.View
      style={[
        styles.waveformBar,
        { height },
        shimmerStyle,
      ]}
    />
  );
}

/** Recording timer display */
function RecordingTimer({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 100);
    return () => clearInterval(interval);
  }, [startTime]);

  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  const formatted = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return <Text style={styles.timerText}>{formatted}</Text>;
}

/** Voice recording state view */
function RecordingView({
  startTime,
  onCancel,
  onDone,
}: {
  startTime: number;
  onCancel: () => void;
  onDone: () => void;
}) {
  return (
    <View style={styles.recordingContainer}>
      <View style={styles.recordingHeader}>
        <View style={styles.recordingDot} />
        <Text style={styles.recordingLabel}>Listening...</Text>
      </View>

      {/* Waveform visualization */}
      <View style={styles.waveform}>
        {Array.from({ length: 24 }).map((_, i) => (
          <WaveformBar key={i} index={i} />
        ))}
      </View>

      {/* Timer */}
      <RecordingTimer startTime={startTime} />

      {/* Action buttons */}
      <View style={styles.recordingActions}>
        <Pressable onPress={onCancel} style={styles.cancelButton}>
          <X size={20} color={GRAYS.g2} />
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable onPress={onDone} style={styles.doneButton}>
          <Check size={20} color="#000" />
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </View>
    </View>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function FreeformInput({
  placeholder = "Type here...",
  pills = [],
  onSubmit,
  onPill,
  allowVoice = true,
}: FreeformInputProps) {
  const [value, setValue] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const hasText = value.trim().length > 0;

  const handleSubmit = useCallback(() => {
    if (!hasText || submitted) return;

    setSubmitted(true);
    onSubmit?.(value.trim());
  }, [hasText, submitted, value, onSubmit]);

  const handlePillPress = useCallback((pill: string) => {
    if (submitted) return;

    setSubmitted(true);
    onPill?.(pill);
  }, [submitted, onPill]);

  const handleMicPress = useCallback(() => {
    if (submitted) return;

    setRecording(true);
    setRecordingStartTime(Date.now());
  }, [submitted]);

  const handleCancelRecording = useCallback(() => {
    setRecording(false);
    setRecordingStartTime(0);
  }, []);

  const handleDoneRecording = useCallback(() => {
    setRecording(false);
    setRecordingStartTime(0);
    // Simulate transcription with placeholder text
    setValue("I'd like to run a half marathon in October. I had a baby last year so I'm just getting back into running after a long break.");
  }, []);

  // Recording mode view
  if (recording) {
    return (
      <View style={styles.container}>
        <RecordingView
          startTime={recordingStartTime}
          onCancel={handleCancelRecording}
          onDone={handleDoneRecording}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Quick-tap pills */}
      {pills.length > 0 && !submitted && (
        <View style={styles.pillsContainer}>
          {pills.map((pill, index) => (
            <PillChip
              key={pill}
              text={pill}
              index={index}
              onPress={() => handlePillPress(pill)}
              disabled={submitted}
            />
          ))}
        </View>
      )}

      {/* Input card */}
      <View style={[styles.inputCard, submitted && styles.inputCardDisabled]}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={setValue}
          placeholder={placeholder}
          placeholderTextColor={GRAYS.g3}
          multiline
          editable={!submitted}
          style={styles.textInput}
        />

        {/* Bottom row with mic, character count, send */}
        <View style={styles.inputFooter}>
          {/* Voice input button */}
          {allowVoice && !submitted && (
            <Pressable onPress={handleMicPress} style={styles.micButton}>
              <Mic size={18} color={GRAYS.g3} />
            </Pressable>
          )}

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Character count */}
          {value.length > 0 && (
            <Text style={styles.charCount}>{value.length}</Text>
          )}

          {/* Send button */}
          <SendButton visible={hasText && !submitted} onPress={handleSubmit} />
        </View>
      </View>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  pillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: GRAYS.g4,
    backgroundColor: "transparent",
  },
  pillDisabled: {
    opacity: 0.5,
  },
  pillText: {
    fontFamily: "Outfit-Regular",
    fontSize: 14,
    color: GRAYS.g2,
  },
  inputCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SURFACES.brd,
    backgroundColor: SURFACES.card,
    padding: 12,
  },
  inputCardDisabled: {
    opacity: 0.6,
  },
  textInput: {
    fontFamily: "Outfit-Regular",
    fontSize: 16,
    color: GRAYS.g1,
    minHeight: 80,
    maxHeight: 160,
    textAlignVertical: "top",
    paddingTop: 0,
  },
  inputFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 12,
  },
  micButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GRAYS.g6,
    justifyContent: "center",
    alignItems: "center",
  },
  charCount: {
    fontFamily: "JetBrainsMono-Regular",
    fontSize: 11,
    color: GRAYS.g4,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.lime,
    justifyContent: "center",
    alignItems: "center",
  },

  // Recording state styles
  recordingContainer: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.lime,
    backgroundColor: SURFACES.sg,
    padding: 20,
    alignItems: "center",
    gap: 16,
  },
  recordingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.lime,
  },
  recordingLabel: {
    fontFamily: "Outfit-Medium",
    fontSize: 14,
    color: COLORS.lime,
  },
  waveform: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    height: 32,
  },
  waveformBar: {
    width: 3,
    backgroundColor: COLORS.lime,
    borderRadius: 1.5,
  },
  timerText: {
    fontFamily: "JetBrainsMono-Medium",
    fontSize: 24,
    color: GRAYS.g1,
  },
  recordingActions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: GRAYS.g6,
  },
  cancelText: {
    fontFamily: "Outfit-Medium",
    fontSize: 14,
    color: GRAYS.g2,
  },
  doneButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: COLORS.lime,
  },
  doneText: {
    fontFamily: "Outfit-Medium",
    fontSize: 14,
    color: "#000",
  },
});

/**
 * Open Text Input Component
 *
 * Renders a text input field for free-form responses.
 * Supports suggested response chips, multiline, voice input button,
 * and various input types.
 *
 * Source: Story 2.4 - AC#1, AC#2, AC#3, AC#4
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Pressable,
  TextInput as RNTextInput,
  Animated,
  Keyboard,
  ScrollView,
} from "react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { selectionFeedback, questionPause } from "@/lib/haptics";
import { Send, Mic } from "lucide-react-native";

// =============================================================================
// Types
// =============================================================================

interface OpenInputArgs {
  prompt?: string;
  placeholder?: string;
  suggestedResponses?: string[];
  allowVoice?: boolean;
  multiline?: boolean;
  maxLength?: number;
  inputType?: "text" | "number" | "duration" | "pace";
}

interface OpenInputProps {
  toolCallId: string;
  args?: OpenInputArgs;
  onSubmit: (value: string) => void;
  disabled?: boolean;
  onVoicePress?: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function OpenInput({
  toolCallId,
  args,
  onSubmit,
  disabled = false,
  onVoicePress,
}: OpenInputProps) {
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<RNTextInput>(null);

  const {
    prompt,
    placeholder = "Type here...",
    suggestedResponses = [],
    allowVoice = false,
    multiline = false,
    maxLength,
    inputType = "text",
  } = args ?? {};

  // Entrance animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const canSubmit = text.trim().length > 0 && !isSubmitted && !disabled;

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;

    Keyboard.dismiss();
    selectionFeedback();
    setIsSubmitted(true);
    questionPause();
    onSubmit(text.trim());
  }, [canSubmit, text, onSubmit]);

  const handleChipPress = useCallback(
    (response: string) => {
      if (isSubmitted || disabled) return;

      Keyboard.dismiss();
      selectionFeedback();
      setIsSubmitted(true);
      questionPause();
      onSubmit(response);
    },
    [isSubmitted, disabled, onSubmit]
  );

  const handleVoicePress = useCallback(() => {
    if (isSubmitted || disabled) return;

    selectionFeedback();
    if (onVoicePress) {
      onVoicePress();
    } else {
      // Placeholder for Story 2.5 integration
      console.log("[OpenInput] Voice input not yet implemented");
    }
  }, [isSubmitted, disabled, onVoicePress]);

  const getKeyboardType = () => {
    switch (inputType) {
      case "number":
      case "duration":
      case "pace":
        return "numeric";
      default:
        return "default";
    }
  };

  const isDisabled = disabled || isSubmitted;

  return (
    <Animated.View style={{ opacity: fadeAnim }} className="gap-4">
      {/* Prompt text */}
      {prompt && (
        <Text className="text-white/90 text-base leading-6">{prompt}</Text>
      )}

      {/* Input container */}
      <View
        className={cn(
          "rounded-xl bg-white/5 border p-3 flex-row items-center gap-2",
          isFocused ? "border-primary/50" : "border-white/10"
        )}
      >
        <RNTextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.3)"
          keyboardType={getKeyboardType()}
          returnKeyType={multiline ? "default" : "send"}
          onSubmitEditing={multiline ? undefined : handleSubmit}
          blurOnSubmit={!multiline}
          multiline={multiline}
          maxLength={maxLength}
          editable={!isDisabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "flex-1 text-white text-base",
            multiline && "min-h-[60px] max-h-[120px]"
          )}
          style={multiline ? { textAlignVertical: "top" } : undefined}
        />

        {/* Voice input button */}
        {allowVoice && !isDisabled && (
          <Pressable
            onPress={handleVoicePress}
            className="p-2 rounded-full bg-white/10 active:bg-white/20"
          >
            <Mic size={20} color="rgba(255,255,255,0.6)" />
          </Pressable>
        )}

        {/* Send button */}
        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          className={cn(
            "p-2 rounded-full",
            canSubmit ? "bg-primary active:bg-primary/90" : "bg-white/10"
          )}
        >
          <Send
            size={20}
            color={canSubmit ? "#000" : "rgba(255,255,255,0.3)"}
          />
        </Pressable>
      </View>

      {/* Character count for long inputs */}
      {maxLength && maxLength > 100 && text.length > 0 && (
        <Text className="text-white/40 text-xs text-right">
          {text.length}/{maxLength}
        </Text>
      )}

      {/* Suggested response chips */}
      {suggestedResponses.length > 0 && !isSubmitted && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2"
        >
          {suggestedResponses.map((response, index) => (
            <Pressable
              key={index}
              onPress={() => handleChipPress(response)}
              disabled={isDisabled}
              className="bg-white/10 px-4 py-2 rounded-full active:bg-white/20"
            >
              <Text className="text-white/70 text-sm">{response}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </Animated.View>
  );
}

/**
 * Multiple Choice Input Component
 *
 * Renders tappable option cards for user selection.
 * Supports single select (auto-submit), multi-select (with confirm),
 * free text fallback, and skip option.
 *
 * Source: Story 2.3 - AC#1, AC#2, AC#3, AC#4, AC#5
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Pressable,
  TextInput as RNTextInput,
  Animated,
  Keyboard,
} from "react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { selectionFeedback, questionPause } from "@/lib/haptics";
import { GRAYS } from "@/lib/design-tokens";
import type { MultipleChoiceArgs } from "./types";

// =============================================================================
// Types
// =============================================================================

interface MultipleChoiceInputProps {
  toolCallId: string;
  args?: MultipleChoiceArgs;
  onSubmit: (value: string | string[] | { skipped: true } | { freeText: string }) => void;
  disabled?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function MultipleChoiceInput({
  toolCallId,
  args,
  onSubmit,
  disabled = false,
}: MultipleChoiceInputProps) {
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [showFreeText, setShowFreeText] = useState(false);
  const [freeTextValue, setFreeTextValue] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const freeTextInputRef = useRef<RNTextInput>(null);

  const {
    question,
    options = [],
    allowMultiple = false,
    allowFreeText = false,
    allowSkip = false,
    skipLabel = "Skip for now",
  } = args ?? {};

  // Entrance animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Focus free text input when shown
  useEffect(() => {
    if (showFreeText) {
      setTimeout(() => freeTextInputRef.current?.focus(), 100);
    }
  }, [showFreeText]);

  const handleSelect = useCallback(
    (value: string) => {
      if (disabled || isSubmitted) return;

      selectionFeedback();

      if (allowMultiple) {
        // Toggle selection in multi-select mode
        setSelectedValues((prev) =>
          prev.includes(value)
            ? prev.filter((v) => v !== value)
            : [...prev, value]
        );
      } else {
        // Auto-submit in single-select mode
        setSelectedValues([value]);
        setIsSubmitted(true);
        questionPause();
        onSubmit(value);
      }
    },
    [allowMultiple, disabled, isSubmitted, onSubmit]
  );

  const handleConfirmMultiple = useCallback(() => {
    if (selectedValues.length === 0 || isSubmitted) return;

    selectionFeedback();
    setIsSubmitted(true);
    questionPause();
    onSubmit(selectedValues);
  }, [selectedValues, isSubmitted, onSubmit]);

  const handleFreeTextToggle = useCallback(() => {
    selectionFeedback();
    setShowFreeText(true);
  }, []);

  const handleFreeTextSubmit = useCallback(() => {
    if (!freeTextValue.trim() || isSubmitted) return;

    Keyboard.dismiss();
    selectionFeedback();
    setIsSubmitted(true);
    questionPause();
    onSubmit({ freeText: freeTextValue.trim() });
  }, [freeTextValue, isSubmitted, onSubmit]);

  const handleSkip = useCallback(() => {
    if (isSubmitted) return;

    selectionFeedback();
    setIsSubmitted(true);
    onSubmit({ skipped: true });
  }, [isSubmitted, onSubmit]);

  // Don't render if no options
  if (options.length === 0) {
    return null;
  }

  const isDisabled = disabled || isSubmitted;
  const showConfirmButton = allowMultiple && selectedValues.length > 0 && !isSubmitted;

  return (
    <Animated.View style={{ opacity: fadeAnim }} className="gap-4">
      {/* Question text */}
      {question && (
        <Text className="text-white/90 text-base leading-6 mb-1">{question}</Text>
      )}

      {/* Options */}
      {!showFreeText && (
        <View className="gap-3">
          {options.map((option) => {
            const isSelected = selectedValues.includes(option.value);
            return (
              <Pressable
                key={option.value}
                onPress={() => handleSelect(option.value)}
                disabled={isDisabled}
                className={cn(
                  "rounded-xl px-5 py-4 border transition-colors",
                  isSelected
                    ? "bg-primary/15 border-primary/30"
                    : "bg-white/5 border-white/10",
                  !isDisabled && !isSelected && "active:bg-white/10"
                )}
              >
                <Text
                  className={cn(
                    "text-base leading-6",
                    isSelected ? "text-primary font-medium" : "text-white/80"
                  )}
                >
                  {option.label}
                </Text>
                {option.description && (
                  <Text
                    className={cn(
                      "text-sm leading-5 mt-1",
                      isSelected ? "text-primary/70" : "text-white/50"
                    )}
                  >
                    {option.description}
                  </Text>
                )}
              </Pressable>
            );
          })}

          {/* Free text "Other" option */}
          {allowFreeText && !isDisabled && (
            <Pressable
              onPress={handleFreeTextToggle}
              className="rounded-xl px-5 py-4 border bg-white/5 border-white/10 active:bg-white/10"
            >
              <Text className="text-white/60 text-base">Other...</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Free text input mode */}
      {showFreeText && (
        <View className="gap-3">
          <View className="rounded-xl bg-white/5 border border-white/10 p-3 flex-row items-center">
            <RNTextInput
              ref={freeTextInputRef}
              value={freeTextValue}
              onChangeText={setFreeTextValue}
              placeholder="Type your answer..."
              placeholderTextColor={GRAYS.g4}
              returnKeyType="done"
              onSubmitEditing={handleFreeTextSubmit}
              editable={!isDisabled}
              className="flex-1 text-white text-base"
            />
          </View>
          {freeTextValue.trim().length > 0 && !isSubmitted && (
            <ConfirmButton label="Submit" onPress={handleFreeTextSubmit} />
          )}
          {!isSubmitted && (
            <Pressable
              onPress={() => setShowFreeText(false)}
              className="py-2"
            >
              <Text className="text-white/40 text-sm text-center">
                Back to options
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Confirm button for multi-select */}
      {showConfirmButton && (
        <ConfirmButton label="Done" onPress={handleConfirmMultiple} />
      )}

      {/* Skip option */}
      {allowSkip && !isSubmitted && !showFreeText && (
        <Pressable onPress={handleSkip} className="py-2">
          <Text className="text-white/40 text-sm text-center">{skipLabel}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

// =============================================================================
// Confirm Button
// =============================================================================

function ConfirmButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Pressable
        onPress={onPress}
        className="bg-primary rounded-xl py-3.5 items-center active:bg-primary/90"
      >
        <Text className="text-primary-foreground font-semibold text-base">
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

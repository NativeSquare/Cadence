import { selectionFeedback } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { Text } from "@/components/ui/text";
import { useRef, useEffect, useState } from "react";
import {
  Animated,
  Pressable,
  View,
  TextInput as RNTextInput,
} from "react-native";
import type { QuestionOption } from "./question-data";

// ─── Single Select ────────────────────────────────────────────────────────────

type SingleSelectProps = {
  options: QuestionOption[];
  selectedValue?: string;
  onSelect: (value: string) => void;
};

export function SingleSelectInput({
  options,
  selectedValue,
  onSelect,
}: SingleSelectProps) {
  return (
    <View className="gap-3">
      {options.map((option) => (
        <Pressable
          key={option.value}
          onPress={() => {
            selectionFeedback();
            onSelect(option.value);
          }}
          disabled={!!selectedValue}
          className={cn(
            "rounded-xl px-5 py-4 border",
            selectedValue === option.value
              ? "bg-primary/15 border-primary/30"
              : "bg-white/5 border-white/10 active:bg-white/10",
          )}
        >
          <Text
            className={cn(
              "text-base leading-6",
              selectedValue === option.value
                ? "text-primary font-medium"
                : "text-white/80",
            )}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ─── Multi Select ─────────────────────────────────────────────────────────────

type MultiSelectProps = {
  options: QuestionOption[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  onConfirm: () => void;
};

export function MultiSelectInput({
  options,
  selectedValues,
  onToggle,
  onConfirm,
}: MultiSelectProps) {
  const hasSelection = selectedValues.length > 0;

  const handleToggle = (value: string) => {
    selectionFeedback();
    // "None" clears everything else; selecting something else clears "none"
    if (value === "none") {
      onToggle("none");
      return;
    }
    onToggle(value);
  };

  return (
    <View className="gap-4">
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.value);
          return (
            <Pressable
              key={option.value}
              onPress={() => handleToggle(option.value)}
              className={cn(
                "rounded-xl px-4 py-3 border",
                isSelected
                  ? "bg-primary/15 border-primary/30"
                  : "bg-white/5 border-white/10 active:bg-white/10",
              )}
            >
              <Text
                className={cn(
                  "text-sm leading-5",
                  isSelected ? "text-primary font-medium" : "text-white/80",
                )}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {hasSelection && <ConfirmButton label="Continue" onPress={onConfirm} />}
    </View>
  );
}

// ─── Pace Input ───────────────────────────────────────────────────────────────

type PaceInputProps = {
  onSubmit: (value: string) => void;
  allowSkip?: boolean;
  skipLabel?: string;
};

export function PaceInput({
  onSubmit,
  allowSkip = false,
  skipLabel = "Not sure",
}: PaceInputProps) {
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const secondsRef = useRef<RNTextInput>(null);

  const isValid =
    minutes.length > 0 &&
    seconds.length > 0 &&
    Number(seconds) >= 0 &&
    Number(seconds) < 60;

  const handleSubmit = () => {
    if (isValid) {
      selectionFeedback();
      onSubmit(`${minutes}:${seconds.padStart(2, "0")}`);
    }
  };

  return (
    <View className="gap-4">
      <View className="flex-row items-center gap-2">
        <RNTextInput
          value={minutes}
          onChangeText={(t) => {
            const clean = t.replace(/[^0-9]/g, "").slice(0, 2);
            setMinutes(clean);
            if (clean.length >= 1 && Number(clean) > 0) {
              secondsRef.current?.focus();
            }
          }}
          placeholder="min"
          placeholderTextColor="rgba(255,255,255,0.25)"
          keyboardType="number-pad"
          maxLength={2}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-lg text-center"
        />
        <Text className="text-2xl text-white/40 font-light">:</Text>
        <RNTextInput
          ref={secondsRef}
          value={seconds}
          onChangeText={(t) => setSeconds(t.replace(/[^0-9]/g, "").slice(0, 2))}
          placeholder="sec"
          placeholderTextColor="rgba(255,255,255,0.25)"
          keyboardType="number-pad"
          maxLength={2}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-lg text-center"
        />
        <Text className="text-sm text-white/40">/km</Text>
      </View>

      {isValid && <ConfirmButton label="Continue" onPress={handleSubmit} />}

      {allowSkip && !isValid && (
        <Pressable
          onPress={() => {
            selectionFeedback();
            onSubmit("skip");
          }}
        >
          <Text className="text-white/40 text-sm text-center">{skipLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Distance Input ───────────────────────────────────────────────────────────

type DistanceInputProps = {
  onSubmit: (value: string) => void;
  placeholder?: string;
};

export function DistanceInput({
  onSubmit,
  placeholder = "e.g. 18km",
}: DistanceInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (value.trim()) {
      selectionFeedback();
      onSubmit(value.trim());
    }
  };

  return (
    <View className="gap-4">
      <RNTextInput
        value={value}
        onChangeText={setValue}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.25)"
        keyboardType="numeric"
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
        className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-base"
      />
      {value.trim().length > 0 && (
        <ConfirmButton label="Continue" onPress={handleSubmit} />
      )}
    </View>
  );
}

// ─── Text Input ───────────────────────────────────────────────────────────────

type FreeTextInputProps = {
  onSubmit: (value: string) => void;
  placeholder?: string;
};

export function FreeTextInput({
  onSubmit,
  placeholder = "Type here...",
}: FreeTextInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (value.trim()) {
      selectionFeedback();
      onSubmit(value.trim());
    }
  };

  return (
    <View className="gap-4">
      <RNTextInput
        value={value}
        onChangeText={setValue}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.25)"
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
        className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-base"
      />
      {value.trim().length > 0 && (
        <ConfirmButton label="Continue" onPress={handleSubmit} />
      )}
    </View>
  );
}

// ─── Date Picker (simplified text-based for now) ──────────────────────────────

type DatePickerInputProps = {
  onSubmit: (value: string) => void;
};

export function DatePickerInput({ onSubmit }: DatePickerInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (value.trim()) {
      selectionFeedback();
      onSubmit(value.trim());
    }
  };

  return (
    <View className="gap-4">
      <RNTextInput
        value={value}
        onChangeText={setValue}
        placeholder="e.g. April 18, 2026"
        placeholderTextColor="rgba(255,255,255,0.25)"
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
        className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-base"
      />
      {value.trim().length > 0 && (
        <ConfirmButton label="Continue" onPress={handleSubmit} />
      )}
    </View>
  );
}

// ─── Confirm Button (shared) ──────────────────────────────────────────────────

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
  }, []);

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

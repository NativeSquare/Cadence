/**
 * Voice Input Component
 *
 * Renders voice recording interface with permission handling,
 * recording animation, and transcription review.
 *
 * Source: Story 2.5 - AC#1, AC#2, AC#3, AC#4
 */

import { useRef, useEffect } from "react";
import {
  View,
  Pressable,
  TextInput as RNTextInput,
  Animated,
} from "react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { Mic, Square, RotateCcw, Check, X, Settings } from "lucide-react-native";
import {
  useVoiceInput,
  openAppSettings,
  type VoiceInputStatus,
} from "@/hooks/use-voice-input";

// =============================================================================
// Types
// =============================================================================

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  onCancel: () => void;
  prompt?: string;
  maxDuration?: number;
}

// =============================================================================
// Component
// =============================================================================

export function VoiceInput({
  onTranscription,
  onCancel,
  prompt,
  maxDuration = 60,
}: VoiceInputProps) {
  const {
    state,
    startRecording,
    stopRecording,
    confirmTranscription,
    editTranscription,
    cancelRecording,
    retryRecording,
  } = useVoiceInput(onTranscription);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Entrance animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Pulse animation for recording state
  useEffect(() => {
    if (state.status === "recording") {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state.status, pulseAnim]);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCancel = () => {
    cancelRecording();
    onCancel();
  };

  return (
    <Animated.View style={{ opacity: fadeAnim }} className="gap-4">
      {/* Prompt text */}
      {prompt && state.status !== "review" && (
        <Text className="text-white/90 text-base text-center">{prompt}</Text>
      )}

      {/* Idle / Start Recording */}
      {state.status === "idle" && (
        <View className="items-center gap-4">
          <Pressable
            onPress={startRecording}
            className="w-20 h-20 rounded-full bg-primary items-center justify-center active:bg-primary/90"
          >
            <Mic size={32} color="#000" />
          </Pressable>
          <Text className="text-white/60 text-sm">Tap to start recording</Text>
          <Pressable onPress={handleCancel} className="py-2">
            <Text className="text-white/40 text-sm">Cancel</Text>
          </Pressable>
        </View>
      )}

      {/* Recording State */}
      {state.status === "recording" && (
        <View className="items-center gap-4">
          <Animated.View
            style={{ transform: [{ scale: pulseAnim }] }}
            className="w-20 h-20 rounded-full bg-red-500 items-center justify-center"
          >
            <Pressable onPress={stopRecording} className="w-full h-full items-center justify-center">
              <Square size={24} color="#fff" fill="#fff" />
            </Pressable>
          </Animated.View>
          <View className="items-center gap-1">
            <Text className="text-red-400 font-medium">
              Recording... {formatDuration(state.recordingDuration)}
            </Text>
            <Text className="text-white/40 text-xs">
              Tap to stop (max {maxDuration}s)
            </Text>
          </View>
        </View>
      )}

      {/* Transcribing State */}
      {state.status === "transcribing" && (
        <View className="items-center gap-4">
          <View className="w-20 h-20 rounded-full bg-white/10 items-center justify-center">
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: pulseAnim.interpolate({
                      inputRange: [1, 1.1],
                      outputRange: ["0deg", "360deg"],
                    }),
                  },
                ],
              }}
            >
              <Mic size={32} color="rgba(255,255,255,0.6)" />
            </Animated.View>
          </View>
          <Text className="text-white/60">Transcribing...</Text>
        </View>
      )}

      {/* Review State */}
      {state.status === "review" && (
        <View className="gap-4">
          <View className="rounded-xl bg-white/5 border border-white/10 p-4">
            <RNTextInput
              value={state.transcription}
              onChangeText={editTranscription}
              multiline
              placeholder="Edit transcription..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              className="text-white text-base min-h-[80px]"
              style={{ textAlignVertical: "top" }}
            />
          </View>

          <View className="flex-row gap-3">
            <Pressable
              onPress={retryRecording}
              className="flex-1 flex-row items-center justify-center gap-2 bg-white/10 rounded-xl py-3 active:bg-white/20"
            >
              <RotateCcw size={18} color="rgba(255,255,255,0.7)" />
              <Text className="text-white/70 font-medium">Re-record</Text>
            </Pressable>

            <Pressable
              onPress={confirmTranscription}
              disabled={!state.transcription.trim()}
              className={cn(
                "flex-1 flex-row items-center justify-center gap-2 rounded-xl py-3",
                state.transcription.trim()
                  ? "bg-primary active:bg-primary/90"
                  : "bg-white/10"
              )}
            >
              <Check
                size={18}
                color={state.transcription.trim() ? "#000" : "rgba(255,255,255,0.3)"}
              />
              <Text
                className={cn(
                  "font-medium",
                  state.transcription.trim()
                    ? "text-primary-foreground"
                    : "text-white/30"
                )}
              >
                Confirm
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Error State */}
      {state.status === "error" && (
        <View className="items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
          <Text className="text-white/90 text-base text-center">
            {state.error}
          </Text>

          {state.error?.includes("Settings") ? (
            <Pressable
              onPress={openAppSettings}
              className="flex-row items-center gap-2 bg-primary rounded-xl px-6 py-3"
            >
              <Settings size={18} color="#000" />
              <Text className="text-primary-foreground font-medium">
                Open Settings
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={retryRecording}
              className="flex-row items-center gap-2 bg-primary rounded-xl px-6 py-3"
            >
              <RotateCcw size={18} color="#000" />
              <Text className="text-primary-foreground font-medium">
                Try Again
              </Text>
            </Pressable>
          )}

          <Pressable onPress={handleCancel} className="py-2">
            <Text className="text-white/40 text-sm">Use text input instead</Text>
          </Pressable>
        </View>
      )}

      {/* Permission Request State */}
      {state.status === "requesting_permission" && (
        <View className="items-center gap-4">
          <View className="w-20 h-20 rounded-full bg-white/10 items-center justify-center">
            <Mic size={32} color="rgba(255,255,255,0.6)" />
          </View>
          <Text className="text-white/60">Requesting microphone access...</Text>
        </View>
      )}
    </Animated.View>
  );
}

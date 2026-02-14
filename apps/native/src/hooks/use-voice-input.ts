/**
 * Voice Input Hook
 *
 * Manages voice recording state machine for speech-to-text input.
 * Handles permissions, recording, and transcription flow.
 *
 * NOTE: Full implementation requires expo-av to be installed.
 * Voice input is optional for MVP (PRD: "can defer if complexity requires").
 * This is a stub implementation that can be extended post-MVP.
 *
 * To enable full voice input:
 * 1. Install expo-av: npx expo install expo-av
 * 2. Add transcription backend action (Whisper API)
 * 3. Uncomment and update the recording implementation
 *
 * Source: Story 2.5 - AC#1, AC#2, AC#3, AC#4
 */

import { useState, useCallback } from "react";
import { Linking, Platform } from "react-native";
import * as Haptics from "expo-haptics";

// =============================================================================
// Types
// =============================================================================

export type VoiceInputStatus =
  | "idle"
  | "requesting_permission"
  | "recording"
  | "transcribing"
  | "review"
  | "error";

export interface VoiceInputState {
  status: VoiceInputStatus;
  transcription: string;
  error: string | null;
  recordingDuration: number;
}

export interface UseVoiceInputReturn {
  state: VoiceInputState;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  confirmTranscription: () => void;
  editTranscription: (text: string) => void;
  cancelRecording: () => void;
  retryRecording: () => void;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Voice input hook - stub implementation for MVP
 *
 * Full implementation requires:
 * 1. Install expo-av: npx expo install expo-av
 * 2. Add transcription backend action (Whisper API)
 * 3. Implement audio recording and upload
 */
export function useVoiceInput(
  onTranscriptionConfirmed: (text: string) => void
): UseVoiceInputReturn {
  const [state, setState] = useState<VoiceInputState>({
    status: "idle",
    transcription: "",
    error: null,
    recordingDuration: 0,
  });

  // Start recording - stub for MVP
  const startRecording = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Show not implemented message for MVP
    setState({
      status: "error",
      transcription: "",
      error: "Voice input coming soon! Please use text input for now.",
      recordingDuration: 0,
    });
  }, []);

  // Stop recording - stub
  const stopRecording = useCallback(async () => {
    // No-op for stub implementation
  }, []);

  // Confirm transcription
  const confirmTranscription = useCallback(() => {
    if (state.status !== "review" || !state.transcription.trim()) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onTranscriptionConfirmed(state.transcription.trim());

    setState({
      status: "idle",
      transcription: "",
      error: null,
      recordingDuration: 0,
    });
  }, [state.status, state.transcription, onTranscriptionConfirmed]);

  // Edit transcription in review mode
  const editTranscription = useCallback((text: string) => {
    setState((prev) => ({ ...prev, transcription: text }));
  }, []);

  // Cancel recording or review
  const cancelRecording = useCallback(() => {
    setState({
      status: "idle",
      transcription: "",
      error: null,
      recordingDuration: 0,
    });
  }, []);

  // Retry after error
  const retryRecording = useCallback(() => {
    setState({
      status: "idle",
      transcription: "",
      error: null,
      recordingDuration: 0,
    });
  }, []);

  return {
    state,
    startRecording,
    stopRecording,
    confirmTranscription,
    editTranscription,
    cancelRecording,
    retryRecording,
  };
}

// =============================================================================
// Helper: Open Settings
// =============================================================================

export async function openAppSettings(): Promise<void> {
  if (Platform.OS === "ios") {
    await Linking.openURL("app-settings:");
  } else {
    await Linking.openSettings();
  }
}

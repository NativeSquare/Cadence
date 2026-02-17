/**
 * Voice Input Hook
 *
 * Manages voice recording state machine for speech-to-text input.
 * Handles permissions, recording, and transcription flow.
 *
 * MVP SCOPE NOTE:
 * Voice input is DEFERRED for MVP (PRD: "can defer if complexity requires").
 * This file provides:
 * - Type infrastructure (VoiceInputStatus, VoiceInputState) - COMPLETE
 * - State machine skeleton with permission_denied status - COMPLETE
 * - Stub implementations that gracefully degrade to text input - COMPLETE
 *
 * The permission_denied flow (Story 8.4 AC#2) is intentionally stubbed because
 * microphone permission denial can only occur when voice input is actually
 * implemented. The fallback behavior (text input remains available) is
 * achieved by the stub returning an error that prompts users to use text.
 *
 * POST-MVP ACTIVATION:
 * 1. Install expo-av: npx expo install expo-av
 * 2. Add transcription backend action (Whisper API)
 * 3. Uncomment permission checks in startRecording/retryPermission
 * 4. Implement actual audio recording
 *
 * Source: Story 2.5 - AC#1, AC#2, AC#3, AC#4, Story 8.4 - AC#2
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
  | "permission_denied"  // Story 8.4 Task 2.1
  | "recording"
  | "transcribing"
  | "review"
  | "error";

export interface VoiceInputState {
  status: VoiceInputStatus;
  transcription: string;
  error: string | null;
  recordingDuration: number;
  /** True if microphone permission was explicitly denied (Story 8.4 Task 2.1) */
  isPermissionDenied: boolean;
}

export interface UseVoiceInputOptions {
  /** Callback when transcription is confirmed */
  onTranscriptionConfirmed: (text: string) => void;
  /** Callback when permission is denied (Story 8.4 Task 2.2) */
  onPermissionDenied?: () => void;
}

export interface UseVoiceInputReturn {
  state: VoiceInputState;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  confirmTranscription: () => void;
  editTranscription: (text: string) => void;
  cancelRecording: () => void;
  retryRecording: () => void;
  /** Request permission again after denial (Story 8.4 Task 2.3) */
  retryPermission: () => Promise<void>;
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
 *
 * Source: Story 8.4 Task 2
 */
export function useVoiceInput(
  optionsOrCallback: UseVoiceInputOptions | ((text: string) => void)
): UseVoiceInputReturn {
  // Support both old callback API and new options API
  const options: UseVoiceInputOptions = typeof optionsOrCallback === "function"
    ? { onTranscriptionConfirmed: optionsOrCallback }
    : optionsOrCallback;

  const { onTranscriptionConfirmed, onPermissionDenied } = options;

  const [state, setState] = useState<VoiceInputState>({
    status: "idle",
    transcription: "",
    error: null,
    recordingDuration: 0,
    isPermissionDenied: false,
  });

  // Start recording - stub for MVP
  // When full implementation is added, this should check permission status
  const startRecording = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // TODO: When expo-av is installed, check permission here
    // const { status } = await Audio.requestPermissionsAsync();
    // if (status === 'denied') {
    //   setState({ ...state, status: 'permission_denied', isPermissionDenied: true });
    //   onPermissionDenied?.();
    //   return;
    // }

    // Show not implemented message for MVP
    setState({
      status: "error",
      transcription: "",
      error: "Voice input coming soon! Please use text input for now.",
      recordingDuration: 0,
      isPermissionDenied: false,
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
      isPermissionDenied: false,
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
      isPermissionDenied: false,
    });
  }, []);

  // Retry after error
  const retryRecording = useCallback(() => {
    setState({
      status: "idle",
      transcription: "",
      error: null,
      recordingDuration: 0,
      isPermissionDenied: false,
    });
  }, []);

  // Retry permission request after denial (Story 8.4 Task 2.3)
  const retryPermission = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setState((prev) => ({
      ...prev,
      status: "requesting_permission",
      isPermissionDenied: false,
      error: null,
    }));

    // TODO: When expo-av is installed, request permission again
    // const { status } = await Audio.requestPermissionsAsync();
    // if (status === 'granted') {
    //   setState(prev => ({ ...prev, status: 'idle' }));
    // } else {
    //   setState(prev => ({ ...prev, status: 'permission_denied', isPermissionDenied: true }));
    //   onPermissionDenied?.();
    // }

    // For stub: Just show error again
    setState({
      status: "error",
      transcription: "",
      error: "Voice input coming soon! Please use text input for now.",
      recordingDuration: 0,
      isPermissionDenied: false,
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
    retryPermission,
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

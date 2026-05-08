import { useCallback } from "react";
import {
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";

const VOICE_RECORDING_OPTIONS = {
  ...RecordingPresets.HIGH_QUALITY,
  sampleRate: 16000,
  numberOfChannels: 1,
};

export function useVoiceRecording() {
  const recorder = useAudioRecorder(VOICE_RECORDING_OPTIONS);
  const state = useAudioRecorderState(recorder, 250);

  const start = useCallback(async () => {
    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    });
    await recorder.prepareToRecordAsync();
    recorder.record();
  }, [recorder]);

  const stop = useCallback(async (): Promise<string | null> => {
    if (!state.isRecording && !state.canRecord) return null;
    await recorder.stop();
    return recorder.uri;
  }, [recorder, state.isRecording, state.canRecord]);

  return {
    start,
    stop,
    isRecording: state.isRecording,
    durationMs: state.durationMillis,
  };
}

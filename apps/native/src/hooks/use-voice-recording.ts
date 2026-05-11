import { useCallback } from "react";
import {
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";

export function useVoiceRecording() {
  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });
  const state = useAudioRecorderState(recorder);

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

  const getMetering = useCallback(
    (): number | null => recorder.getStatus().metering ?? null,
    [recorder],
  );

  return {
    start,
    stop,
    getMetering,
    isRecording: state.isRecording,
    durationMs: state.durationMillis,
  };
}

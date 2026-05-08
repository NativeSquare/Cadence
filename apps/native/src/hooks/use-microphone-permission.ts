import { useCallback, useEffect, useState } from "react";
import {
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
} from "expo-audio";

export type MicrophonePermissionStatus =
  | "undetermined"
  | "granted"
  | "denied";

export function useMicrophonePermission() {
  const [status, setStatus] = useState<MicrophonePermissionStatus>(
    "undetermined",
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await getRecordingPermissionsAsync();
      if (cancelled) return;
      setStatus(
        res.granted
          ? "granted"
          : res.canAskAgain
            ? "undetermined"
            : "denied",
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const request = useCallback(async (): Promise<boolean> => {
    const res = await requestRecordingPermissionsAsync();
    setStatus(
      res.granted
        ? "granted"
        : res.canAskAgain
          ? "undetermined"
          : "denied",
    );
    return res.granted;
  }, []);

  return { status, request };
}

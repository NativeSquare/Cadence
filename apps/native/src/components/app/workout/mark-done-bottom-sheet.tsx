import { BottomSheetModal } from "@/components/custom/bottom-sheet";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import { nowIso } from "@/components/app/workout/workout-form-helpers";
import { useMicrophonePermission } from "@/hooks/use-microphone-permission";
import { useUploadImage } from "@/hooks/use-upload-image";
import { useVoiceRecording } from "@/hooks/use-voice-recording";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { api } from "@packages/backend/convex/_generated/api";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BottomSheetModal as GorhomBottomSheetModal,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { useMutation } from "convex/react";
import { Check, Mic, Square } from "lucide-react-native";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Linking,
  Pressable,
  View,
} from "react-native";
import { z } from "zod";

const MAX_RECORDING_MS = 120_000;

const formSchema = z.object({
  testDistanceKm: z.number().positive().optional(),
  testDurationMinutes: z.number().int().min(0).optional(),
  testDurationSeconds: z.number().int().min(0).max(59).optional(),
});

type FormValues = z.infer<typeof formSchema>;

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export interface MarkDoneBottomSheetProps {
  sheetRef: React.RefObject<GorhomBottomSheetModal | null>;
  workoutId: string;
  workoutName: string;
  isTest?: boolean;
  /**
   * Date to record on the completed face. Most users mark a workout done
   * after the fact, so we default the actual date to its planned date
   * rather than "right now" — that matches reality the vast majority of
   * the time. Falls back to `nowIso()` if the workout has no planned face.
   */
  plannedDate?: string;
}

const DEFAULTS: FormValues = {
  testDistanceKm: undefined,
  testDurationMinutes: undefined,
  testDurationSeconds: undefined,
};

export function MarkDoneBottomSheet({
  sheetRef,
  workoutId,
  workoutName,
  isTest,
  plannedDate,
}: MarkDoneBottomSheetProps) {
  const { t } = useTranslation();
  const updateWorkout = useMutation(api.agoge.workouts.updateWorkout);
  const recordForWorkout = useMutation(
    api.table.sessionFeedback.recordForWorkout,
  );
  const { uploadFileToStorage } = useUploadImage();
  const micPermission = useMicrophonePermission();
  const voiceRecording = useVoiceRecording();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    defaultValues: DEFAULTS,
  });

  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [recordedUri, setRecordedUri] = React.useState<string | null>(null);
  const [recordedDurationMs, setRecordedDurationMs] = React.useState(0);
  const isSubmitting = form.formState.isSubmitting;
  const isRecording = voiceRecording.isRecording;

  const stopRecording = React.useCallback(async () => {
    const ms = voiceRecording.durationMs;
    try {
      const uri = await voiceRecording.stop();
      if (uri) {
        setRecordedUri(uri);
        setRecordedDurationMs(ms);
      }
    } catch (err) {
      console.error("[MarkDoneBottomSheet] Stop recording failed", err);
    }
  }, [voiceRecording]);

  const startRecording = React.useCallback(async () => {
    setSubmitError(null);
    let granted = micPermission.status === "granted";
    if (!granted) granted = await micPermission.request();
    if (!granted) {
      Alert.alert(
        t("coach.voice.permissionDeniedTitle"),
        t("coach.voice.permissionDeniedMessage"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("coach.voice.openSettings"),
            onPress: () => void Linking.openSettings(),
          },
        ],
      );
      return;
    }
    setRecordedUri(null);
    setRecordedDurationMs(0);
    selectionFeedback();
    try {
      await voiceRecording.start();
    } catch (err) {
      console.error("[MarkDoneBottomSheet] Start recording failed", err);
    }
  }, [micPermission, voiceRecording, t]);

  // Hard-cap recordings — auto-stop when the limit is reached.
  React.useEffect(() => {
    if (isRecording && voiceRecording.durationMs >= MAX_RECORDING_MS) {
      void stopRecording();
    }
  }, [isRecording, voiceRecording.durationMs, stopRecording]);

  const handleSubmit = form.handleSubmit(async (data) => {
    setSubmitError(null);
    Keyboard.dismiss();

    if (isRecording) {
      await stopRecording();
    }
    if (!recordedUri) {
      setSubmitError(t("workout.markDone.errorAudioRequired"));
      return;
    }

    let testFields: { distanceMeters: number; durationSeconds: number } | null =
      null;
    if (isTest) {
      const km = data.testDistanceKm;
      if (km == null || !(km > 0)) {
        setSubmitError(t("workout.markDone.errorDistanceRequired"));
        return;
      }
      const totalSeconds =
        (data.testDurationMinutes ?? 0) * 60 + (data.testDurationSeconds ?? 0);
      if (totalSeconds <= 0) {
        setSubmitError(t("workout.markDone.errorTimeRequired"));
        return;
      }
      testFields = {
        distanceMeters: Math.round(km * 1000),
        durationSeconds: totalSeconds,
      };
    }

    try {
      const audioStorageId = await uploadFileToStorage(
        recordedUri,
        "audio/m4a",
      );

      const actual = {
        date: plannedDate ?? nowIso(),
        ...(testFields ?? {}),
      };
      await updateWorkout({ workoutId, status: "completed", actual });

      await recordForWorkout({
        workoutId,
        audioStorageId,
        durationMs: recordedDurationMs,
      });

      sheetRef.current?.dismiss();
      form.reset(DEFAULTS);
      setRecordedUri(null);
      setRecordedDurationMs(0);
    } catch (err) {
      setSubmitError(getConvexErrorMessage(err));
    }
  });

  const handleDismiss = React.useCallback(() => {
    if (voiceRecording.isRecording) void voiceRecording.stop();
    form.reset(DEFAULTS);
    setSubmitError(null);
    setRecordedUri(null);
    setRecordedDurationMs(0);
  }, [form, voiceRecording]);

  const canSubmit = !isSubmitting && !!recordedUri && !isRecording;

  return (
    <BottomSheetModal ref={sheetRef} onDismiss={handleDismiss}>
      <View className="gap-7 px-5 pb-4 pt-2">
        <Text
          className="font-coach-bold text-lg"
          style={{ color: LIGHT_THEME.wText }}
          numberOfLines={1}
        >
          {workoutName}
        </Text>

        {isTest && (
          <View className="gap-4">
            <Text
              className="font-coach-bold text-base"
              style={{ color: LIGHT_THEME.wText }}
            >
              {t("workout.markDone.testHeader")}
            </Text>
            <Controller
              control={form.control}
              name="testDistanceKm"
              render={({ field }) => (
                <DistanceField
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Controller
                  control={form.control}
                  name="testDurationMinutes"
                  render={({ field }) => (
                    <TimePartField
                      label={t("workout.markDone.testTimeLabel")}
                      suffix={t("workout.markDone.testTimeMinutes")}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </View>
              <View className="flex-1">
                <Controller
                  control={form.control}
                  name="testDurationSeconds"
                  render={({ field }) => (
                    <TimePartField
                      label=" "
                      suffix={t("workout.markDone.testTimeSeconds")}
                      value={field.value}
                      onChange={field.onChange}
                      maxLength={2}
                    />
                  )}
                />
              </View>
            </View>
          </View>
        )}

        <RecorderField
          isRecording={isRecording}
          hasRecording={!!recordedUri}
          liveDurationMs={voiceRecording.durationMs}
          recordedDurationMs={recordedDurationMs}
          onStart={startRecording}
          onStop={stopRecording}
        />

        {submitError && (
          <Text
            className="text-center font-coach text-sm"
            style={{ color: COLORS.red }}
          >
            {submitError}
          </Text>
        )}

        <Pressable
          onPress={() => handleSubmit()}
          disabled={!canSubmit}
          className="items-center rounded-2xl py-3.5 active:opacity-90"
          style={{
            backgroundColor: canSubmit ? LIGHT_THEME.wText : LIGHT_THEME.w3,
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              className="font-coach-bold text-sm"
              style={{ color: "#FFFFFF" }}
            >
              {t("workout.markDone.submit")}
            </Text>
          )}
        </Pressable>
      </View>
    </BottomSheetModal>
  );
}

function RecorderField({
  isRecording,
  hasRecording,
  liveDurationMs,
  recordedDurationMs,
  onStart,
  onStop,
}: {
  isRecording: boolean;
  hasRecording: boolean;
  liveDurationMs: number;
  recordedDurationMs: number;
  onStart: () => void;
  onStop: () => void;
}) {
  const { t } = useTranslation();

  const tint = isRecording
    ? COLORS.red
    : hasRecording
      ? COLORS.grn
      : LIGHT_THEME.wText;

  return (
    <View className="gap-3">
      <Text
        className="font-coach-bold text-base"
        style={{ color: LIGHT_THEME.wText }}
      >
        {t("workout.markDone.recordPrompt")}
      </Text>

      <Pressable
        onPress={isRecording ? onStop : onStart}
        className="flex-row items-center justify-center gap-2.5 rounded-2xl py-3.5 active:opacity-80"
        style={{
          borderWidth: 1.5,
          borderColor: tint,
          backgroundColor: isRecording ? "rgba(255,59,48,0.08)" : LIGHT_THEME.w2,
        }}
        accessibilityRole="button"
        accessibilityLabel={
          isRecording
            ? t("workout.markDone.stopRecording")
            : hasRecording
              ? t("workout.markDone.reRecord")
              : t("workout.markDone.startRecording")
        }
      >
        {isRecording ? (
          <Square size={18} color={tint} fill={tint} strokeWidth={0} />
        ) : hasRecording ? (
          <Check size={20} color={tint} strokeWidth={2.5} />
        ) : (
          <Mic size={20} color={tint} strokeWidth={2} />
        )}
        <Text className="font-coach-bold text-sm" style={{ color: tint }}>
          {isRecording
            ? `${t("workout.markDone.recording")} · ${formatDuration(liveDurationMs)}`
            : hasRecording
              ? `${t("workout.markDone.recorded")} · ${formatDuration(recordedDurationMs)}`
              : t("workout.markDone.startRecording")}
        </Text>
      </Pressable>

      <Text
        className="text-center font-coach text-[12px]"
        style={{ color: LIGHT_THEME.wMute }}
      >
        {isRecording
          ? t("workout.markDone.recordingHint")
          : hasRecording
            ? t("workout.markDone.reRecordHint")
            : t("workout.markDone.recordHint")}
      </Text>
    </View>
  );
}

function DistanceField({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  const { t } = useTranslation();
  const [text, setText] = React.useState<string>(
    value == null ? "" : String(value),
  );
  React.useEffect(() => {
    setText(value == null ? "" : String(value));
  }, [value]);

  return (
    <View className="gap-2">
      <Text
        className="font-coach-bold text-sm"
        style={{ color: LIGHT_THEME.wText }}
      >
        {t("workout.markDone.testDistanceLabel")}
      </Text>
      <View
        className="flex-row items-center"
        style={{
          paddingHorizontal: 14,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: LIGHT_THEME.wBrd,
          backgroundColor: LIGHT_THEME.w2,
        }}
      >
        <BottomSheetTextInput
          value={text}
          onChangeText={(raw) => {
            const normalized = raw.replace(",", ".");
            setText(normalized);
            const parsed = Number.parseFloat(normalized);
            onChange(Number.isFinite(parsed) ? parsed : undefined);
          }}
          keyboardType="decimal-pad"
          inputMode="decimal"
          placeholder="5.0"
          placeholderTextColor={LIGHT_THEME.wMute}
          className="flex-1 font-coach text-[15px]"
          style={{ paddingVertical: 12, color: LIGHT_THEME.wText }}
        />
        <Text
          className="font-coach text-sm"
          style={{ color: LIGHT_THEME.wMute }}
        >
          {t("workout.markDone.testDistanceUnit")}
        </Text>
      </View>
    </View>
  );
}

function TimePartField({
  label,
  suffix,
  value,
  onChange,
  maxLength,
}: {
  label: string;
  suffix: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  maxLength?: number;
}) {
  const [text, setText] = React.useState<string>(
    value == null ? "" : String(value),
  );
  React.useEffect(() => {
    setText(value == null ? "" : String(value));
  }, [value]);

  return (
    <View className="gap-2">
      <Text
        className="font-coach-bold text-sm"
        style={{ color: LIGHT_THEME.wText }}
      >
        {label}
      </Text>
      <View
        className="flex-row items-center"
        style={{
          paddingHorizontal: 14,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: LIGHT_THEME.wBrd,
          backgroundColor: LIGHT_THEME.w2,
        }}
      >
        <BottomSheetTextInput
          value={text}
          onChangeText={(raw) => {
            const digits = raw.replace(/\D/g, "");
            setText(digits);
            const parsed = Number.parseInt(digits, 10);
            onChange(Number.isFinite(parsed) ? parsed : undefined);
          }}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={maxLength}
          placeholder="0"
          placeholderTextColor={LIGHT_THEME.wMute}
          className="flex-1 font-coach text-[15px]"
          style={{ paddingVertical: 12, color: LIGHT_THEME.wText }}
        />
        <Text
          className="font-coach text-sm"
          style={{ color: LIGHT_THEME.wMute }}
        >
          {suffix}
        </Text>
      </View>
    </View>
  );
}

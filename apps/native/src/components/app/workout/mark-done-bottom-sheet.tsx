import { BottomSheetModal } from "@/components/custom/bottom-sheet";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import { nowIso } from "@/components/app/workout/workout-form-helpers";
import {
  ConcernTierPill,
  SignalChips,
  buildChips,
  tierColors,
  type DerivedSignals,
} from "@/components/app/workout/signal-display";
import { workoutTypeLabel } from "@/components/app/workout/workout-helpers";
import { useMicrophonePermission } from "@/hooks/use-microphone-permission";
import { useUploadImage } from "@/hooks/use-upload-image";
import { useVoiceRecording } from "@/hooks/use-voice-recording";
import { useLanguage, type Language } from "@/lib/i18n";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { api } from "@packages/backend/convex/_generated/api";
import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type { WorkoutType } from "@nativesquare/agoge/schema";
import {
  WORKOUT_TYPES_COLORS,
  WORKOUT_TYPES_COLORS_DIM,
} from "@packages/shared/colors";
import { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";
import { useAction, useMutation } from "convex/react";
import { Check, Mic, Sparkles, Square } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Linking,
  Pressable,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

const MAX_RECORDING_MS = 120_000;

// How long each "Analyzing…" sub-message shows before rotating. The labels are
// honest *categories* of work (transcribing already happened), not a precise
// progress bar — see ADR-0004.
const ANALYZING_CYCLE_MS = 2600;
const ANALYZING_STEPS = 3;

// Everything the commit step needs, held client-side after `transcribe`
// succeeds. On a `deriveAndCommit` failure we retry from here — no re-upload,
// no second Whisper call (ADR-0004).
type HeldCapture = {
  audioStorageId: Id<"_storage">;
  transcript: string;
  transcriptLang: "en" | "fr";
};

// The capture pipeline's phase. "idle" = the form is showing (pre-submit, or
// after a transcribe failure cleared everything).
type Phase = "idle" | "uploading" | "transcribing" | "analyzing";

// A workout's volume for the white-box ease preview. `0` on either dimension
// means "not computable" — the preview then shows a type-only contrast rather
// than inventing numbers.
type PreviewVolume = { type: string; durationSec: number; distanceM: number };

// The upcoming hard session the debrief collides with, plus the before/after
// the ease would produce. `before`/`after` come from the same Engine core that
// performs the reshape, so the preview matches what "Ease it" applies.
type Conflict = {
  workoutId: string;
  name: string;
  date: string;
  type: string;
  before: PreviewVolume;
  after: PreviewVolume & { rpe: number };
};

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
  /**
   * Date to record on the completed face. Most users mark a workout done
   * after the fact, so we default the actual date to its planned date
   * rather than "right now" — that matches reality the vast majority of
   * the time. Falls back to `nowIso()` if the workout has no planned face.
   */
  plannedDate?: string;
}

export function MarkDoneBottomSheet({
  sheetRef,
  workoutId,
  workoutName,
  plannedDate,
}: MarkDoneBottomSheetProps) {
  const { t } = useTranslation();
  // The capture→derive pipeline is split into two actions so the runner sees
  // their transcript the moment Whisper finishes, while the extraction LLM
  // still runs (ADR-0004). `transcribe` writes nothing; `deriveAndCommit` is
  // the sole writer and is all-or-nothing on its own LLM call.
  const transcribe = useAction(api.journal.transcribe);
  const deriveAndCommit = useAction(api.journal.deriveAndCommit);
  const easeConflictingSession = useMutation(
    api.engine.interventions.easeConflictingSession,
  );
  // Logs the runner's intention (`go`/`ease`) onto the journal entry the
  // capture just created — the minimal first-class Decision. Independent of
  // the ease reshape: Keep logs `go` and changes nothing; Ease logs `ease`
  // alongside the Engine intervention.
  const recordDecision = useMutation(api.table.journalEntry.recordDecision);
  const { uploadFileToStorage } = useUploadImage();
  const micPermission = useMicrophonePermission();
  const voiceRecording = useVoiceRecording();

  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [recordedUri, setRecordedUri] = React.useState<string | null>(null);
  const [recordedDurationMs, setRecordedDurationMs] = React.useState(0);
  // Pipeline state. `phase` drives the in-flight progress view; `transcript`
  // fades in the moment it lands and stays inline through the final response;
  // `held` lets a failed commit retry from the transcript.
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [transcript, setTranscript] = React.useState<string | null>(null);
  const [held, setHeld] = React.useState<HeldCapture | null>(null);
  // The coach's in-the-moment reply, shown after a successful capture instead
  // of dismissing immediately — the "we heard you" beat. When the debrief is
  // serious AND a hard session is coming up, `conflict` carries it so we can
  // offer a one-tap ease (the Path B decision prompt).
  const [response, setResponse] = React.useState<{
    coachReply: string;
    derived: DerivedSignals;
    transcript: string;
    // The journal entry the capture created — the target for `recordDecision`
    // when the runner picks Keep/Ease.
    entryId: Id<"journalEntry">;
    conflict: Conflict | null;
  } | null>(null);
  const isRecording = voiceRecording.isRecording;
  const isCapturing = phase !== "idle";

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

  // Step 2: extract signals + commit. Reused for the first run and for a
  // resume-from-transcript retry after a `deriveAndCommit` failure. On failure
  // it keeps `transcript`/`held` so the retry button can call it again.
  const commit = React.useCallback(
    async (capture: HeldCapture) => {
      setSubmitError(null);
      setPhase("analyzing");
      try {
        const result = await deriveAndCommit({
          workoutId,
          audioStorageId: capture.audioStorageId,
          durationMs: recordedDurationMs,
          actualDate: plannedDate ?? nowIso(),
          transcript: capture.transcript,
          transcriptLang: capture.transcriptLang,
        });
        // Settle into the response view; the transcript rides along so it
        // stays inline beneath the reply.
        setRecordedUri(null);
        setRecordedDurationMs(0);
        setPhase("idle");
        setTranscript(null);
        setHeld(null);
        setResponse({
          coachReply: result.coachReply,
          derived: result.derived,
          transcript: capture.transcript,
          entryId: result.entryId,
          conflict: result.conflict,
        });
      } catch (err) {
        // Keep `transcript` + `held` visible so the runner can retry from here.
        setPhase("idle");
        setSubmitError(getConvexErrorMessage(err));
      }
    },
    [deriveAndCommit, workoutId, recordedDurationMs, plannedDate],
  );

  const handleSubmit = async () => {
    setSubmitError(null);
    Keyboard.dismiss();

    if (isRecording) {
      await stopRecording();
    }
    if (!recordedUri) {
      setSubmitError(t("workout.markDone.errorAudioRequired"));
      return;
    }

    // Step 1: upload + transcribe. A failure here clears everything (the
    // transcript never appeared) and drops back to the form for a fresh retry.
    let capture: HeldCapture;
    try {
      setPhase("uploading");
      const audioStorageId = await uploadFileToStorage(recordedUri, "audio/m4a");
      setPhase("transcribing");
      const { transcript: tx, transcriptLang } = await transcribe({
        audioStorageId,
      });
      capture = { audioStorageId, transcript: tx, transcriptLang };
      setTranscript(tx);
      setHeld(capture);
    } catch (err) {
      setPhase("idle");
      setTranscript(null);
      setHeld(null);
      setSubmitError(getConvexErrorMessage(err));
      return;
    }

    await commit(capture);
  };

  const dismissAfterResponse = React.useCallback(() => {
    selectionFeedback();
    sheetRef.current?.dismiss();
  }, [sheetRef]);

  const handleDismiss = React.useCallback(() => {
    if (voiceRecording.isRecording) void voiceRecording.stop();
    setSubmitError(null);
    setRecordedUri(null);
    setRecordedDurationMs(0);
    setPhase("idle");
    setTranscript(null);
    setHeld(null);
    setResponse(null);
  }, [voiceRecording]);

  const canSubmit = !isCapturing && !!recordedUri && !isRecording;

  if (response) {
    return (
      <BottomSheetModal ref={sheetRef} onDismiss={handleDismiss}>
        <CoachResponse
          coachReply={response.coachReply}
          derived={response.derived}
          transcript={response.transcript}
          conflict={response.conflict}
          onEase={(workoutId) => easeConflictingSession({ workoutId })}
          onDecision={(intention) =>
            recordDecision({ entryId: response.entryId, intention })
          }
          onDone={dismissAfterResponse}
        />
      </BottomSheetModal>
    );
  }

  // Capture in flight, or a commit failed with the transcript still in hand
  // (retry-from-transcript). Either way we show the progressive-reveal view
  // instead of the form.
  if (isCapturing || (held && transcript)) {
    return (
      <BottomSheetModal ref={sheetRef} onDismiss={handleDismiss}>
        <CaptureStage
          phase={phase}
          transcript={transcript}
          error={submitError}
          onRetry={held ? () => void commit(held) : undefined}
        />
      </BottomSheetModal>
    );
  }

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
          <Text className="font-coach-bold text-sm" style={{ color: "#FFFFFF" }}>
            {t("workout.markDone.submit")}
          </Text>
        </Pressable>
      </View>
    </BottomSheetModal>
  );
}

/**
 * The progressive-reveal view shown while the capture pipeline runs. A phase
 * pill animates the work in flight; the runner's transcript fades in the moment
 * `transcribe` returns and stays put while `deriveAndCommit` runs. On a commit
 * failure the error + a "Try again" sit under the still-visible transcript
 * (retry-from-transcript — ADR-0004).
 */
function CaptureStage({
  phase,
  transcript,
  error,
  onRetry,
}: {
  phase: Phase;
  transcript: string | null;
  error: string | null;
  onRetry?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <View className="gap-6 px-5 pb-4 pt-2">
      <View className="flex-row items-center gap-2">
        <Sparkles size={16} color={LIGHT_THEME.wMute} strokeWidth={2} />
        <Text
          className="font-coach-semibold text-[11px] uppercase tracking-wider"
          style={{ color: LIGHT_THEME.wMute }}
        >
          {t("workout.markDone.coachLabel")}
        </Text>
      </View>

      {transcript && (
        <Animated.View entering={FadeIn.duration(280)} className="gap-2">
          <Text
            className="font-coach-semibold text-[12px]"
            style={{ color: LIGHT_THEME.wSub }}
          >
            {t("workout.markDone.capture.heardLabel")}
          </Text>
          <Text
            className="font-coach text-[15px]"
            style={{ color: LIGHT_THEME.wText, lineHeight: 22 }}
          >
            {transcript}
          </Text>
        </Animated.View>
      )}

      {phase !== "idle" && <PhasePill phase={phase} />}

      {error && (
        <View className="gap-3">
          <Text
            className="font-coach text-sm"
            style={{ color: COLORS.red }}
          >
            {error}
          </Text>
          {onRetry && (
            <Pressable
              onPress={onRetry}
              className="items-center rounded-2xl py-3.5 active:opacity-90"
              style={{ backgroundColor: LIGHT_THEME.wText }}
            >
              <Text
                className="font-coach-bold text-sm"
                style={{ color: "#FFFFFF" }}
              >
                {t("workout.markDone.capture.retry")}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

/**
 * Animated "what's happening" pill. Uploading/transcribing carry one label
 * each; analyzing rotates through a few honest sub-messages on a timer (the
 * backend is a black box past this point — ADR-0004).
 */
function PhasePill({ phase }: { phase: Exclude<Phase, "idle"> }) {
  const { t } = useTranslation();
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    if (phase !== "analyzing") return;
    setStep(0);
    const id = setInterval(
      () => setStep((s) => (s + 1) % ANALYZING_STEPS),
      ANALYZING_CYCLE_MS,
    );
    return () => clearInterval(id);
  }, [phase]);

  const label =
    phase === "analyzing"
      ? t(`workout.markDone.capture.analyzing.${step}`)
      : t(`workout.markDone.capture.${phase}`);

  return (
    <View className="flex-row items-center gap-2 self-start">
      <ActivityIndicator size="small" color={LIGHT_THEME.wMute} />
      <Text className="font-coach text-[13px]" style={{ color: LIGHT_THEME.wSub }}>
        {label}
      </Text>
    </View>
  );
}

/**
 * The coach's reply after a successful capture — the "we heard you" beat.
 * Shown in place of the form. Headlined by the Concern-tier pill (the one
 * colored verdict), then the LLM-narrated reply on a tier-tinted card, the
 * runner's transcript inline, and the neutral signal chips. The reply text is
 * already localized and scaled to the debrief's concern tier server-side.
 *
 * When `conflict` is present (a serious debrief AND an upcoming hard session),
 * we offer the Path B decision prompt: Ease it (one-tap, reuses the Engine's
 * revertible reshape) or Keep it. Without a conflict it's just the reply + Done.
 */
function CoachResponse({
  coachReply,
  derived,
  transcript,
  conflict,
  onEase,
  onDecision,
  onDone,
}: {
  coachReply: string;
  derived: DerivedSignals;
  transcript: string;
  conflict: Conflict | null;
  onEase: (workoutId: string) => Promise<unknown>;
  onDecision: (intention: "go" | "ease") => Promise<unknown>;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const [phase, setPhase] = React.useState<
    "prompt" | "easing" | "eased" | "error"
  >("prompt");

  const chips = buildChips(t, derived);
  const tier = derived.concern ? tierColors(derived.concern) : null;

  const handleEase = async () => {
    if (!conflict) return;
    selectionFeedback();
    setPhase("easing");
    try {
      await onEase(conflict.workoutId);
      // Log the intention once the reshape succeeded — best-effort, the
      // decision log must never block or fail the ease.
      void onDecision("ease");
      setPhase("eased");
    } catch (err) {
      console.error("[MarkDoneBottomSheet] ease failed", err);
      setPhase("error");
    }
  };

  // Keep: log `go` (best-effort) and dismiss. Only reachable when a fork was
  // presented, so a logged decision always means a real choice was on offer.
  const handleKeep = () => {
    void onDecision("go");
    onDone();
  };

  return (
    <View className="gap-6 px-5 pb-4 pt-2">
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-row items-center gap-2">
          <Sparkles size={16} color={LIGHT_THEME.wMute} strokeWidth={2} />
          <Text
            className="font-coach-semibold text-[11px] uppercase tracking-wider"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {t("workout.markDone.coachLabel")}
          </Text>
        </View>
        {derived.concern && <ConcernTierPill concern={derived.concern} />}
      </View>

      <View
        className="gap-2 rounded-2xl p-4"
        style={
          tier
            ? {
                backgroundColor: tier.wash,
                borderLeftWidth: 3,
                borderLeftColor: tier.fg,
              }
            : { backgroundColor: LIGHT_THEME.w2 }
        }
      >
        <Text
          className="font-coach text-base"
          style={{ color: LIGHT_THEME.wText, lineHeight: 24 }}
        >
          {coachReply}
        </Text>
      </View>

      <View className="gap-2">
        <Text
          className="font-coach-semibold text-[12px]"
          style={{ color: LIGHT_THEME.wSub }}
        >
          {t("workout.markDone.capture.heardLabel")}
        </Text>
        <Text
          className="font-coach text-[15px]"
          style={{ color: LIGHT_THEME.wText, lineHeight: 22 }}
        >
          {transcript}
        </Text>
      </View>

      <SignalChips chips={chips} />

      {/* Decision prompt — only when a hard session is in conflict and the
          runner hasn't already eased it. The before/after preview makes the
          reshape white-box: the runner sees exactly what easing produces
          before they tap it. */}
      {conflict && phase !== "eased" && (
        <View className="gap-3">
          <EasePreview conflict={conflict} resolved={false} />
          {phase === "error" && (
            <Text
              className="font-coach text-[12px]"
              style={{ color: COLORS.red }}
            >
              {t("workout.markDone.decision.easeError")}
            </Text>
          )}
          <Pressable
            onPress={handleEase}
            disabled={phase === "easing"}
            className="items-center rounded-2xl py-3.5 active:opacity-90"
            style={{ backgroundColor: LIGHT_THEME.wText }}
          >
            {phase === "easing" ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                className="font-coach-bold text-sm"
                style={{ color: "#FFFFFF" }}
              >
                {t("workout.markDone.decision.ease")}
              </Text>
            )}
          </Pressable>
          <Pressable
            onPress={handleKeep}
            disabled={phase === "easing"}
            className="items-center rounded-2xl border py-3.5 active:opacity-80"
            style={{
              backgroundColor: LIGHT_THEME.w1,
              borderColor: LIGHT_THEME.wBrd,
            }}
          >
            <Text
              className="font-coach-semibold text-sm"
              style={{ color: LIGHT_THEME.wText }}
            >
              {t("workout.markDone.decision.keep")}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Confirmation after an ease, or the plain Done when there's no prompt.
          The resolved preview closes the loop — the runner sees the new
          prescription, not just a claim that it changed. */}
      {(!conflict || phase === "eased") && (
        <>
          {phase === "eased" && conflict && (
            <View className="gap-3">
              <EasePreview conflict={conflict} resolved={true} />
              <Text
                className="font-coach text-[13px]"
                style={{ color: LIGHT_THEME.wSub, lineHeight: 19 }}
              >
                {t("workout.markDone.decision.easedConfirm", {
                  name: conflict.name,
                })}
              </Text>
            </View>
          )}
          <Pressable
            onPress={onDone}
            className="items-center rounded-2xl py-3.5 active:opacity-90"
            style={{ backgroundColor: LIGHT_THEME.wText }}
          >
            <Text
              className="font-coach-bold text-sm"
              style={{ color: "#FFFFFF" }}
            >
              {t("workout.markDone.responseDone")}
            </Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

/** "9.0 km · 48 min" / "~45 min" / null when nothing is computable. */
function formatVolume(
  durationSec: number,
  distanceM: number,
  approx: boolean,
): string | null {
  const km = distanceM > 0 ? `${(distanceM / 1000).toFixed(1)} km` : null;
  const min =
    durationSec > 0
      ? `${approx ? "~" : ""}${Math.round(durationSec / 60)} min`
      : null;
  const parts = [km, min].filter((p): p is string => p !== null);
  return parts.length > 0 ? parts.join(" · ") : null;
}

/**
 * White-box before/after for the post-session ease. Two cards — the session as
 * prescribed vs. the easy run it becomes — echoing the WorkoutCard / Swap-confirm
 * look so the runner reads the trade-off (time-on-feet held, intensity dropped)
 * in the same visual language as the rest of the app. The colored day-badge
 * carries both the workout-type color and the session's date; the orange→green
 * shift between the two cards *is* the intensity drop. The numbers come from the
 * same Engine core that performs the reshape, so the preview can't lie.
 *
 * Both cards stamp the *same* date — easing holds the date and drops intensity,
 * it never reschedules. In `resolved` mode (after the ease applied) the BEFORE
 * card is dimmed + struck through and the AFTER card stands as the new reality.
 * When the conflicting session has no computable volume, the cards fall back to
 * a type-only contrast rather than inventing numbers.
 */
function EasePreview({
  conflict,
  resolved,
}: {
  conflict: Conflict;
  resolved: boolean;
}) {
  const { t } = useTranslation();
  const { before, after } = conflict;

  const hasVolume = before.durationSec > 0 || before.distanceM > 0;
  const beforeVolume = formatVolume(before.durationSec, before.distanceM, false);
  // The eased duration is 5-min-rounded; flag it approximate so it never
  // masquerades as exactly held.
  const afterVolume = formatVolume(after.durationSec, after.distanceM, true);
  const rpe = `RPE ${after.rpe}`;
  const afterDetail = hasVolume
    ? [afterVolume, rpe].filter(Boolean).join(" · ")
    : rpe;

  return (
    <View className="gap-2">
      <EaseCard
        date={conflict.date}
        type={before.type}
        title={conflict.name}
        detail={hasVolume ? beforeVolume : null}
        dimmed={resolved}
        strike={resolved}
      />

      <Text
        className="text-center font-coach text-[15px]"
        style={{ color: LIGHT_THEME.wMute }}
      >
        ↓
      </Text>

      <EaseCard
        date={conflict.date}
        type={after.type}
        title={workoutTypeLabel(t, after.type)}
        detail={afterDetail}
        dimmed={false}
        strike={false}
      />

      <Text
        className="mt-1 font-coach text-[12px]"
        style={{ color: LIGHT_THEME.wMute, lineHeight: 17 }}
      >
        {t(
          hasVolume
            ? "workout.markDone.decision.preview.caption"
            : "workout.markDone.decision.preview.captionNoVolume",
        )}
      </Text>
    </View>
  );
}

/** "Sat" / "sam" + day-of-month, for the colored date badge. */
function formatEaseDay(
  locale: Language,
  iso: string,
): { weekday: string; day: string } {
  const d = new Date(iso);
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "short" })
    .format(d)
    .slice(0, 3);
  return { weekday, day: String(d.getDate()) };
}

/**
 * Presentational card for one side of the ease before/after. Mirrors WorkoutCard's
 * look — colored day-badge + title + subtitle — but takes plain projection props
 * (the eased "after" side is a synthetic projection, not a persisted WorkoutDoc),
 * and drops the chevron/navigation since this lives inside a confirmation preview.
 */
function EaseCard({
  date,
  type,
  title,
  detail,
  dimmed,
  strike,
}: {
  date: string;
  type: string;
  title: string;
  detail: string | null;
  dimmed: boolean;
  strike: boolean;
}) {
  const locale = useLanguage();
  const day = formatEaseDay(locale, date);
  const typeColor = WORKOUT_TYPES_COLORS[type as WorkoutType];
  const typeColorDim = WORKOUT_TYPES_COLORS_DIM[type as WorkoutType];
  const lineThrough = strike ? "line-through" : undefined;

  return (
    <View
      className="flex-row items-center gap-3 rounded-2xl border px-4 py-3.5"
      style={{
        backgroundColor: LIGHT_THEME.w1,
        borderColor: LIGHT_THEME.wBrd,
        opacity: dimmed ? 0.5 : 1,
      }}
    >
      <View
        className="size-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: typeColorDim }}
      >
        <Text
          className="font-coach-extrabold uppercase"
          style={{
            color: typeColor,
            fontSize: 9,
            letterSpacing: 0.5,
            lineHeight: 11,
          }}
        >
          {day.weekday}
        </Text>
        <Text
          className="font-coach-extrabold"
          style={{ color: typeColor, fontSize: 14, lineHeight: 16 }}
        >
          {day.day}
        </Text>
      </View>
      <View className="flex-1">
        <Text
          numberOfLines={1}
          className="font-coach-semibold text-[15px]"
          style={{ color: LIGHT_THEME.wText, textDecorationLine: lineThrough }}
        >
          {title}
        </Text>
        {detail && (
          <Text
            numberOfLines={1}
            className="mt-0.5 font-coach text-[12px]"
            style={{ color: LIGHT_THEME.wSub, textDecorationLine: lineThrough }}
          >
            {detail}
          </Text>
        )}
      </View>
    </View>
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


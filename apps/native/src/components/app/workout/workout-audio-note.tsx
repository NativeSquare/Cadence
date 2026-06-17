/**
 * Post-session journal readout on the workout detail page: the voice-note
 * player, the transcript (collapsible), and the structured signals an LLM
 * extracted from it ("You mentioned: right calf · RPE 7 · slept ok"). Renders
 * nothing when the workout has no journal entry.
 *
 * The audio lives in Convex storage and is served from an extension-less URL
 * with a non-standard `audio/m4a` content-type, which `expo-audio` can't decode
 * by streaming (it buffers forever, never loading). So we download it to a
 * local `.m4a` cache file first — the extension lets the native decoder
 * identify the format. This also fixes recordings already in storage.
 */
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import {
  ConcernTierPill,
  SignalChips,
  buildChips,
} from "@/components/app/workout/signal-display";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { File, Paths } from "expo-file-system";
import { ChevronDown, ChevronRight, Pause, Play } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, View } from "react-native";

function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function WorkoutAudioNote({ workoutId }: { workoutId: string }) {
  const { t } = useTranslation();
  const entry = useQuery(api.table.journalEntry.getForWorkout, { workoutId });

  if (!entry) return null;

  const chips = entry.derived ? buildChips(t, entry.derived) : [];

  return (
    <Shell
      label={t("workout.detail.voiceNote")}
      // The tier pill headlines the card's verdict. Suppressed entirely when
      // `concern` is absent (legacy / backfilled entries) — green is a
      // judgment ("nothing notable"), never a default for an untriaged entry.
      accessory={
        entry.derived?.concern ? (
          <ConcernTierPill concern={entry.derived.concern} />
        ) : null
      }
    >
      {entry.audioUrl ? (
        <VoiceNote
          url={entry.audioUrl}
          cacheKey={entry._id}
          durationMs={entry.durationMs ?? 0}
        />
      ) : null}

      <SignalChips chips={chips} />

      {entry.transcript ? <Transcript text={entry.transcript} /> : null}
    </Shell>
  );
}

/** Collapsible transcript, collapsed by default to keep the readout tidy. */
function Transcript({ text }: { text: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  return (
    <View className="gap-2">
      <Pressable
        onPress={() => {
          selectionFeedback();
          setOpen((o) => !o);
        }}
        className="flex-row items-center gap-1 active:opacity-70"
        accessibilityRole="button"
      >
        {open ? (
          <ChevronDown size={14} color={LIGHT_THEME.wMute} />
        ) : (
          <ChevronRight size={14} color={LIGHT_THEME.wMute} />
        )}
        <Text
          className="font-coach-semibold text-[12px]"
          style={{ color: LIGHT_THEME.wMute }}
        >
          {t("workout.detail.transcript")}
        </Text>
      </Pressable>
      {open && (
        <Text
          className="font-coach text-[13px]"
          style={{ color: LIGHT_THEME.wSub, lineHeight: 19 }}
        >
          {text}
        </Text>
      )}
    </View>
  );
}

/** Downloads the remote audio to a local `.m4a` file, then renders the player. */
function VoiceNote({
  url,
  cacheKey,
  durationMs,
}: {
  url: string;
  cacheKey: string;
  durationMs: number;
}) {
  const { t } = useTranslation();
  const [localUri, setLocalUri] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const dest = new File(Paths.cache, `voice-${cacheKey}.m4a`);
        if (!dest.exists) {
          await File.downloadFileAsync(url, dest);
        }
        if (!cancelled) setLocalUri(dest.uri);
      } catch (err) {
        console.error("[WorkoutAudioNote] download failed", err);
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url, cacheKey]);

  return localUri ? (
    <LoadedPlayer localUri={localUri} fallbackDurationMs={durationMs} />
  ) : (
    <PlaceholderRow
      durationMs={durationMs}
      failed={failed}
      failedLabel={t("workout.detail.voiceNoteUnavailable")}
    />
  );
}

function Shell({
  label,
  accessory,
  children,
}: {
  label: string;
  accessory?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View
      className="gap-3 rounded-2xl border p-4"
      style={{
        backgroundColor: LIGHT_THEME.w1,
        borderColor: LIGHT_THEME.wBrd,
      }}
    >
      <View className="flex-row items-center justify-between gap-2">
        <Text
          className="font-coach-semibold text-[11px] uppercase tracking-wider"
          style={{ color: LIGHT_THEME.wMute }}
        >
          {label}
        </Text>
        {accessory}
      </View>
      {children}
    </View>
  );
}

function PlaceholderRow({
  durationMs,
  failed,
  failedLabel,
}: {
  durationMs: number;
  failed: boolean;
  failedLabel: string;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <View
        className="size-11 items-center justify-center rounded-full"
        style={{ backgroundColor: LIGHT_THEME.w3 }}
      >
        {!failed && <ActivityIndicator size="small" color={LIGHT_THEME.wMute} />}
      </View>
      <Text className="font-coach text-[12px]" style={{ color: LIGHT_THEME.wMute }}>
        {failed ? failedLabel : formatClock(durationMs)}
      </Text>
    </View>
  );
}

function LoadedPlayer({
  localUri,
  fallbackDurationMs,
}: {
  localUri: string;
  fallbackDurationMs: number;
}) {
  const { t } = useTranslation();
  const player = useAudioPlayer(localUri);
  const status = useAudioPlayerStatus(player);

  const isPlaying = status.playing;
  const positionMs = (status.currentTime ?? 0) * 1000;
  const totalMs =
    status.duration && status.duration > 0
      ? status.duration * 1000
      : fallbackDurationMs;
  const progress = totalMs > 0 ? Math.min(1, positionMs / totalMs) : 0;

  const toggle = React.useCallback(async () => {
    selectionFeedback();
    try {
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });
      if (player.playing) {
        player.pause();
        return;
      }
      if (status.didJustFinish || (totalMs > 0 && positionMs >= totalMs - 50)) {
        await player.seekTo(0);
      }
      player.play();
    } catch (err) {
      console.error("[WorkoutAudioNote] playback toggle failed", err);
    }
  }, [player, status.didJustFinish, positionMs, totalMs]);

  const remainingMs =
    isPlaying || positionMs > 0 ? totalMs - positionMs : totalMs;

  return (
    <View className="flex-row items-center gap-3">
      <Pressable
        onPress={toggle}
        className="size-11 items-center justify-center rounded-full active:opacity-80"
        style={{ backgroundColor: LIGHT_THEME.wText }}
        accessibilityRole="button"
        accessibilityLabel={
          isPlaying
            ? t("workout.detail.voiceNotePause")
            : t("workout.detail.voiceNotePlay")
        }
      >
        {isPlaying ? (
          <Pause size={18} color="#FFFFFF" fill="#FFFFFF" strokeWidth={0} />
        ) : (
          <Play size={18} color="#FFFFFF" fill="#FFFFFF" strokeWidth={0} />
        )}
      </Pressable>

      <View className="flex-1 gap-1.5">
        <View
          className="h-1.5 overflow-hidden rounded-full"
          style={{ backgroundColor: LIGHT_THEME.w3 }}
        >
          <View
            className="h-full rounded-full"
            style={{
              width: `${progress * 100}%`,
              backgroundColor: LIGHT_THEME.wText,
            }}
          />
        </View>
        <Text
          className="font-coach text-[12px]"
          style={{ color: LIGHT_THEME.wMute }}
        >
          {formatClock(remainingMs)}
        </Text>
      </View>
    </View>
  );
}

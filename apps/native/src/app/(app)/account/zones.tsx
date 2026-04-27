import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { paceMpsToMinPerKm, parsePaceInput } from "@/lib/format-pace";
import { api } from "@packages/backend/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { computeZoneBoundaries, type ZoneMethod } from "@nativesquare/agoge";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";

type Kind = "hr" | "pace";

const METHOD_FOR: Record<Kind, ZoneMethod> = {
  hr: "coggan-hr",
  pace: "coggan-pace",
};

// Sentinel cap values for Z5's upper bound (mirrors @nativesquare/agoge).
// These never change with threshold, so we keep them here for the empty draft.
const ZONE_CAP: Record<Kind, number> = {
  hr: 255,
  pace: 1609.34,
};

function emptyDraft(kind: Kind): string[] {
  // Z1 low is fixed at 0 and Z5 high is the cap; the four middle boundaries
  // are blank for the user to fill in.
  return ["0", "", "", "", "", formatBoundary(kind, ZONE_CAP[kind])];
}

function draftFromZone(kind: Kind, zone: ZoneDoc | null): string[] {
  return zone?.boundaries
    ? zone.boundaries.map((b) => formatBoundary(kind, b))
    : emptyDraft(kind);
}

function formatBoundary(kind: Kind, value: number): string {
  if (kind === "hr") return String(Math.round(value));
  return paceMpsToMinPerKm(value);
}

function parseBoundary(kind: Kind, raw: string): number | null {
  if (kind === "hr") {
    const n = Number.parseInt(raw, 10);
    if (!Number.isInteger(n) || n < 0) return null;
    return n;
  }
  const p = parsePaceInput(raw);
  if (p === null || !Number.isFinite(p) || p <= 0) return null;
  return p;
}

export default function ZonesScreen() {
  const router = useRouter();
  const zones = useQuery(api.plan.zones.listCurrentZones);
  const upsertZones = useMutation(api.plan.zones.upsertZones);
  const updateZoneBoundaries = useMutation(api.plan.zones.updateZoneBoundaries);
  const resyncZonesFromThreshold = useMutation(
    api.plan.zones.resyncZonesFromThreshold,
  );

  const [error, setError] = React.useState<string | null>(null);

  const loading = zones === undefined;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="pt-safe flex-1"
      style={{ backgroundColor: LIGHT_THEME.w2 }}
    >
      <View
        className="flex-row items-center gap-3 px-4 pb-3 pt-4"
        style={{ borderBottomWidth: 1, borderBottomColor: LIGHT_THEME.wBrd }}
      >
        <Pressable
          onPress={() => router.back()}
          className="size-9 items-center justify-center rounded-full active:opacity-70"
          style={{ backgroundColor: LIGHT_THEME.w3 }}
        >
          <Ionicons name="chevron-back" size={20} color={LIGHT_THEME.wText} />
        </Pressable>
        <Text
          className="flex-1 font-coach-bold text-lg"
          style={{ color: LIGHT_THEME.wText }}
        >
          Zones
        </Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6"
      >
        <View className="w-full max-w-md gap-6 self-center">
          {loading ? (
            <View className="py-12 items-center">
              <ActivityIndicator color={LIGHT_THEME.wText} />
            </View>
          ) : (
            <>
              <ThresholdsBlock
                hrZone={zones?.hr ?? null}
                paceZone={zones?.pace ?? null}
                onUpsert={upsertZones}
                onError={setError}
              />

              <ZonesBlock
                kind="hr"
                title="HR Zones"
                zone={zones?.hr ?? null}
                onUpdateBoundaries={updateZoneBoundaries}
                onResync={resyncZonesFromThreshold}
                onError={setError}
              />

              <ZonesBlock
                kind="pace"
                title="Pace Zones"
                zone={zones?.pace ?? null}
                onUpdateBoundaries={updateZoneBoundaries}
                onResync={resyncZonesFromThreshold}
                onError={setError}
              />
            </>
          )}

          {error && (
            <Text
              className="text-center font-coach text-sm"
              style={{ color: COLORS.red }}
            >
              {error}
            </Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({
  title,
  headerRight,
  children,
}: {
  title: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between px-1">
        <Text
          className="font-coach-semibold text-[13px] uppercase tracking-wider"
          style={{ color: LIGHT_THEME.wMute }}
        >
          {title}
        </Text>
        {headerRight}
      </View>
      <View
        className="overflow-hidden rounded-[18px]"
        style={{
          backgroundColor: LIGHT_THEME.w1,
          borderWidth: 1,
          borderColor: LIGHT_THEME.wBrd,
        }}
      >
        {children}
      </View>
    </View>
  );
}

type ZoneDoc = {
  threshold?: number;
  boundaries: number[];
  source?: string;
  effectiveFrom: string;
};

function thresholdToInput(kind: Kind, threshold: number | undefined): string {
  if (threshold === undefined) return "";
  return kind === "hr"
    ? String(Math.round(threshold))
    : paceMpsToMinPerKm(threshold);
}

function ThresholdsBlock({
  hrZone,
  paceZone,
  onUpsert,
  onError,
}: {
  hrZone: ZoneDoc | null;
  paceZone: ZoneDoc | null;
  onUpsert: (args: { kind: Kind; threshold: number }) => Promise<unknown>;
  onError: (msg: string | null) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [hrDraft, setHrDraft] = React.useState<string>(() =>
    thresholdToInput("hr", hrZone?.threshold),
  );
  const [paceDraft, setPaceDraft] = React.useState<string>(() =>
    thresholdToInput("pace", paceZone?.threshold),
  );
  const [busy, setBusy] = React.useState(false);

  // Re-seed drafts when the underlying zones change and we are not editing.
  const hrKey = hrZone?.threshold ?? "";
  const paceKey = paceZone?.threshold ?? "";
  React.useEffect(() => {
    if (!editing) {
      setHrDraft(thresholdToInput("hr", hrZone?.threshold));
      setPaceDraft(thresholdToInput("pace", paceZone?.threshold));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hrKey, paceKey, editing]);

  const beginEdit = () => {
    onError(null);
    setHrDraft(thresholdToInput("hr", hrZone?.threshold));
    setPaceDraft(thresholdToInput("pace", paceZone?.threshold));
    setEditing(true);
  };

  const cancelEdit = () => {
    onError(null);
    setHrDraft(thresholdToInput("hr", hrZone?.threshold));
    setPaceDraft(thresholdToInput("pace", paceZone?.threshold));
    setEditing(false);
  };

  const saveEdit = async () => {
    onError(null);
    Keyboard.dismiss();
    const tasks: { kind: Kind; threshold: number }[] = [];

    if (hrDraft.trim().length > 0) {
      const n = Number.parseInt(hrDraft, 10);
      if (!Number.isInteger(n) || n <= 60 || n > 250) {
        onError("Enter a heart rate between 61 and 250 bpm.");
        return;
      }
      const current = hrZone?.threshold;
      if (current === undefined || Math.round(current) !== n) {
        tasks.push({ kind: "hr", threshold: n });
      }
    }

    if (paceDraft.trim().length > 0) {
      const p = parsePaceInput(paceDraft);
      if (p === null || !Number.isFinite(p) || p <= 0) {
        onError("Enter a pace in min:sec per km (e.g. 3:45).");
        return;
      }
      const current = paceZone?.threshold;
      const currentDisplay =
        current !== undefined ? paceMpsToMinPerKm(current) : "";
      if (paceMpsToMinPerKm(p) !== currentDisplay) {
        tasks.push({ kind: "pace", threshold: p });
      }
    }

    setBusy(true);
    try {
      for (const t of tasks) {
        await onUpsert(t);
      }
      setEditing(false);
    } catch (err) {
      onError(getConvexErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const headerRight = editing ? (
    <View className="flex-row items-center gap-1.5">
      <Pressable
        onPress={cancelEdit}
        disabled={busy}
        hitSlop={6}
        className="h-9 items-center justify-center rounded-md px-3 active:opacity-70"
        style={{ backgroundColor: LIGHT_THEME.w3 }}
      >
        <Text
          className="font-coach-medium text-[13px]"
          style={{ color: LIGHT_THEME.wText }}
        >
          Cancel
        </Text>
      </Pressable>
      <Pressable
        onPress={saveEdit}
        disabled={busy}
        hitSlop={6}
        className="h-9 items-center justify-center rounded-md px-3 active:opacity-90"
        style={{ backgroundColor: LIGHT_THEME.wText }}
      >
        {busy ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text
            className="font-coach-bold text-[13px]"
            style={{ color: "#FFFFFF" }}
          >
            Save
          </Text>
        )}
      </Pressable>
    </View>
  ) : (
    <Pressable
      onPress={beginEdit}
      hitSlop={6}
      className="h-9 items-center justify-center rounded-md px-3 active:opacity-70"
      style={{ backgroundColor: LIGHT_THEME.w3 }}
    >
      <Text
        className="font-coach-medium text-[13px]"
        style={{ color: LIGHT_THEME.wText }}
      >
        Edit
      </Text>
    </Pressable>
  );

  const rows: {
    kind: Kind;
    label: string;
    unit: string;
    draft: string;
    setDraft: (v: string) => void;
  }[] = [
    {
      kind: "hr",
      label: "Heart Rate Threshold (LTHR)",
      unit: "bpm",
      draft: hrDraft,
      setDraft: setHrDraft,
    },
    {
      kind: "pace",
      label: "Pace Threshold",
      unit: "/km",
      draft: paceDraft,
      setDraft: setPaceDraft,
    },
  ];

  return (
    <Section title="Your Thresholds" headerRight={headerRight}>
      {rows.map((row, i) => (
        <View
          key={row.kind}
          className="flex-row items-center gap-3 px-4 py-3"
          style={
            i === rows.length - 1
              ? undefined
              : { borderBottomWidth: 1, borderBottomColor: LIGHT_THEME.wBrd }
          }
        >
          <Text
            className="flex-1 font-coach-medium text-[15px]"
            style={{ color: LIGHT_THEME.wText }}
          >
            {row.label}
          </Text>
          <ZoneNumberInput
            kind={row.kind}
            value={row.draft}
            onChangeText={(v) =>
              row.setDraft(
                row.kind === "hr"
                  ? v.replace(/[^0-9]/g, "")
                  : v.replace(/[^0-9:]/g, ""),
              )
            }
            editable={editing}
          />
          <Text
            className="font-coach text-[12px]"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {row.unit}
          </Text>
        </View>
      ))}
    </Section>
  );
}

function ZonesBlock({
  kind,
  title,
  zone,
  onUpdateBoundaries,
  onResync,
  onError,
}: {
  kind: Kind;
  title: string;
  zone: ZoneDoc | null;
  onUpdateBoundaries: (args: {
    kind: Kind;
    boundaries: number[];
  }) => Promise<unknown>;
  onResync: (args: { kind: Kind }) => Promise<unknown>;
  onError: (msg: string | null) => void;
}) {
  const { labels } = computeZoneBoundaries(kind, 100, METHOD_FOR[kind]);
  const isManual = zone?.source === "manual";

  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState<string[]>(() =>
    draftFromZone(kind, zone),
  );
  const [busy, setBusy] = React.useState(false);
  const [resyncConfirm, setResyncConfirm] = React.useState(false);

  // Re-seed the draft whenever the underlying zone changes and we are not editing.
  const baseKey = zone?.boundaries ? zone.boundaries.join(",") : "empty";
  React.useEffect(() => {
    if (!editing) {
      setDraft(draftFromZone(kind, zone));
    }
    // zone is captured via baseKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseKey, editing, kind]);

  React.useEffect(() => {
    setResyncConfirm(false);
  }, [zone?.source, zone?.effectiveFrom]);

  const beginEdit = () => {
    onError(null);
    setDraft(draftFromZone(kind, zone));
    setEditing(true);
  };

  const cancelEdit = () => {
    onError(null);
    setEditing(false);
    setDraft(draftFromZone(kind, zone));
  };

  const saveEdit = async () => {
    onError(null);
    Keyboard.dismiss();
    const parsed: number[] = [];
    for (let i = 0; i < draft.length; i++) {
      const n = parseBoundary(kind, draft[i]);
      if (n === null) {
        onError(
          kind === "hr"
            ? "Enter whole numbers in bpm for every zone."
            : "Enter paces as min:sec per km (e.g. 3:45) for every zone.",
        );
        return;
      }
      parsed.push(n);
    }
    if (parsed[0] !== 0) {
      onError("Z1 must start at 0.");
      return;
    }
    for (let i = 1; i < parsed.length; i++) {
      if (parsed[i] <= parsed[i - 1]) {
        onError("Each zone must be higher than the one below it.");
        return;
      }
    }
    setBusy(true);
    try {
      await onUpdateBoundaries({ kind, boundaries: parsed });
      setEditing(false);
    } catch (err) {
      onError(getConvexErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const setRowValue = (index: number, value: string) => {
    setDraft((prev) => {
      const next = [...prev];
      next[index] =
        kind === "hr"
          ? value.replace(/[^0-9]/g, "")
          : value.replace(/[^0-9:]/g, "");
      return next;
    });
  };

  const handleResyncTap = async () => {
    if (!resyncConfirm) {
      setResyncConfirm(true);
      return;
    }
    onError(null);
    setBusy(true);
    try {
      await onResync({ kind });
    } catch (err) {
      onError(getConvexErrorMessage(err));
      setResyncConfirm(false);
    } finally {
      setBusy(false);
    }
  };

  const headerRight = editing ? (
    <View className="flex-row items-center gap-1.5">
      <Pressable
        onPress={cancelEdit}
        disabled={busy}
        hitSlop={6}
        className="h-9 items-center justify-center rounded-md px-3 active:opacity-70"
        style={{ backgroundColor: LIGHT_THEME.w3 }}
      >
        <Text
          className="font-coach-medium text-[13px]"
          style={{ color: LIGHT_THEME.wText }}
        >
          Cancel
        </Text>
      </Pressable>
      <Pressable
        onPress={saveEdit}
        disabled={busy}
        hitSlop={6}
        className="h-9 items-center justify-center rounded-md px-3 active:opacity-90"
        style={{ backgroundColor: LIGHT_THEME.wText }}
      >
        {busy ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text
            className="font-coach-bold text-[13px]"
            style={{ color: "#FFFFFF" }}
          >
            Save
          </Text>
        )}
      </Pressable>
    </View>
  ) : (
    <Pressable
      onPress={beginEdit}
      hitSlop={6}
      className="h-9 items-center justify-center rounded-md px-3 active:opacity-70"
      style={{ backgroundColor: LIGHT_THEME.w3 }}
    >
      <Text
        className="font-coach-medium text-[13px]"
        style={{ color: LIGHT_THEME.wText }}
      >
        Edit
      </Text>
    </Pressable>
  );

  return (
    <Section title={title} headerRight={headerRight}>
      {isManual && (
        <View
          className="flex-row items-center gap-3 px-4 py-2.5"
          style={{
            backgroundColor: COLORS.ylwDim,
            borderBottomWidth: 1,
            borderBottomColor: LIGHT_THEME.wBrd,
            borderLeftWidth: 3,
            borderLeftColor: COLORS.ylw,
          }}
        >
          <Text
            className="flex-1 font-coach text-[12px]"
            style={{ color: LIGHT_THEME.wText }}
          >
            {"Custom zones — won't auto-update from threshold"}
          </Text>
          <Pressable
            onPress={handleResyncTap}
            disabled={busy || !zone?.threshold}
            hitSlop={8}
            className="active:opacity-70"
          >
            {busy ? (
              <ActivityIndicator size="small" color={LIGHT_THEME.wText} />
            ) : (
              <Text
                className="font-coach-semibold text-[12px]"
                style={{ color: LIGHT_THEME.wText }}
              >
                {resyncConfirm ? "Tap to confirm" : "Reset to default"}
              </Text>
            )}
          </Pressable>
        </View>
      )}
      {labels.map((label, i) => {
        const lowFixed = i === 0; // Z1 low is always 0
        const highFixed = i === labels.length - 1; // Z5 high is the cap sentinel
        return (
          <View
            key={`${kind}-row-${i}`}
            className="flex-row items-center gap-3 px-4 py-3"
            style={
              i === labels.length - 1
                ? undefined
                : { borderBottomWidth: 1, borderBottomColor: LIGHT_THEME.wBrd }
            }
          >
            <View
              className="size-8 items-center justify-center rounded-md"
              style={{ backgroundColor: LIGHT_THEME.w3 }}
            >
              <Text
                className="font-coach-bold text-[12px]"
                style={{ color: LIGHT_THEME.wText }}
              >
                Z{i + 1}
              </Text>
            </View>
            <Text
              className="flex-1 font-coach-medium text-[15px]"
              style={{ color: LIGHT_THEME.wText }}
            >
              {label}
            </Text>
            <ZoneNumberInput
              kind={kind}
              value={draft[i]}
              onChangeText={(v) => setRowValue(i, v)}
              editable={editing && !lowFixed}
            />
            <Text
              className="font-coach text-[13px]"
              style={{ color: LIGHT_THEME.wMute }}
            >
              –
            </Text>
            <ZoneNumberInput
              kind={kind}
              value={draft[i + 1]}
              onChangeText={(v) => setRowValue(i + 1, v)}
              editable={editing && !highFixed}
            />
            <Text
              className="font-coach text-[12px]"
              style={{ color: LIGHT_THEME.wMute }}
            >
              {kind === "hr" ? "bpm" : "/km"}
            </Text>
          </View>
        );
      })}
    </Section>
  );
}

function ZoneNumberInput({
  kind,
  value,
  onChangeText,
  editable,
}: {
  kind: Kind;
  value: string;
  onChangeText: (v: string) => void;
  editable: boolean;
}) {
  return (
    <Input
      className={"h-9 w-14 text-center font-coach-medium text-[13px]"}
      value={value}
      onChangeText={onChangeText}
      editable={editable}
      keyboardType={kind === "hr" ? "number-pad" : "numbers-and-punctuation"}
      maxLength={kind === "hr" ? 3 : 5}
    />
  );
}

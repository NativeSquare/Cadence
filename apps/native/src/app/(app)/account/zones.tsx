import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { paceMpsToMinPerKm, parsePaceInput } from "@/lib/format-pace";
import {
  HrThresholdField,
  PaceThresholdField,
  ZONE_FORMAT_MESSAGES,
  ZONE_ORDERING_MESSAGES,
  makeZonesFormSchema,
} from "@/validation/zones";
import { api } from "@packages/backend/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { computeZoneBoundaries, type ZoneMethod } from "@nativesquare/agoge";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import { z } from "zod";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { ZoneKind } from "@nativesquare/agoge/schema";

const METHOD_FOR: Record<ZoneKind, ZoneMethod> = {
  hr: "coggan-hr",
  pace: "coggan-pace",
};

// Sentinel cap values for Z5's upper bound (mirrors @nativesquare/agoge).
// These never change with threshold, so we keep them here for the empty draft.
const ZONE_CAP: Record<ZoneKind, number> = {
  hr: 255,
  pace: 1609.34,
};

function emptyDraft(kind: ZoneKind): string[] {
  // Z1 low is fixed at 0 and Z5 high is the cap; the four middle boundaries
  // are blank for the user to fill in.
  return ["0", "", "", "", "", formatBoundary(kind, ZONE_CAP[kind])];
}

function draftFromZone(kind: ZoneKind, zone: ZoneDoc | null): string[] {
  return zone?.boundaries
    ? zone.boundaries.map((b) => formatBoundary(kind, b))
    : emptyDraft(kind);
}

function formatBoundary(kind: ZoneKind, value: number): string {
  if (kind === "hr") return String(Math.round(value));
  return paceMpsToMinPerKm(value);
}

function parseBoundary(kind: ZoneKind, raw: string): number | null {
  if (kind === "hr") {
    const n = Number.parseInt(raw, 10);
    if (!Number.isInteger(n) || n < 0) return null;
    return n;
  }
  const p = parsePaceInput(raw);
  if (p === null || !Number.isFinite(p) || p <= 0) return null;
  return p;
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function findZone<T extends { kind: ZoneKind }>(
  list: readonly T[] | undefined,
  kind: ZoneKind,
): T | null {
  return list?.find((z) => z.kind === kind) ?? null;
}

export default function ZonesScreen() {
  const router = useRouter();
  const zones = useQuery(api.agoge.zones.listAthleteZones);
  const createZone = useMutation(api.agoge.zones.createZone);
  const updateZone = useMutation(api.agoge.zones.updateZone);

  // The backend stores zones as an append-only history. We patch today's
  // record in place if one exists; otherwise we create a new history row
  // dated today.
  const saveZone = React.useCallback(
    async (
      existing: { _id: string; effectiveFrom: string } | null,
      next: {
        kind: ZoneKind;
        boundaries: number[];
        threshold?: number;
        maxHr?: number;
        restingHr?: number;
        source: "manual" | "system";
      },
    ) => {
      const today = todayDateString();
      if (existing && existing.effectiveFrom === today) {
        await updateZone({
          zoneId: existing._id,
          boundaries: next.boundaries,
          threshold: next.threshold,
          maxHr: next.maxHr,
          restingHr: next.restingHr,
          source: next.source,
        });
        return;
      }
      await createZone({
        kind: next.kind,
        boundaries: next.boundaries,
        threshold: next.threshold,
        maxHr: next.maxHr,
        restingHr: next.restingHr,
        source: next.source,
        effectiveFrom: today,
      });
    },
    [createZone, updateZone],
  );

  // Threshold edits: if the previous zone was manually overridden, keep its
  // boundaries (the user owns them — the threshold change is metadata only).
  // Otherwise recompute from the new threshold.
  const handleUpsertThreshold = React.useCallback(
    async ({ kind, threshold }: { kind: ZoneKind; threshold: number }) => {
      const existing = findZone(zones, kind);
      const isManual = existing?.source === "manual";
      const boundaries =
        isManual && existing
          ? existing.boundaries
          : computeZoneBoundaries(kind, threshold, METHOD_FOR[kind]).boundaries;
      await saveZone(existing, {
        kind,
        boundaries,
        threshold,
        maxHr: existing?.maxHr,
        restingHr: existing?.restingHr,
        source: isManual ? "manual" : "system",
      });
    },
    [zones, saveZone],
  );

  const handleUpdateBoundaries = React.useCallback(
    async ({ kind, boundaries }: { kind: ZoneKind; boundaries: number[] }) => {
      const existing = findZone(zones, kind);
      await saveZone(existing, {
        kind,
        boundaries,
        threshold: existing?.threshold,
        maxHr: existing?.maxHr,
        restingHr: existing?.restingHr,
        source: "manual",
      });
    },
    [zones, saveZone],
  );

  const handleResync = React.useCallback(
    async ({ kind }: { kind: ZoneKind }) => {
      const existing = findZone(zones, kind);
      if (!existing?.threshold) {
        throw new Error("Set a threshold before re-syncing zones.");
      }
      const boundaries = computeZoneBoundaries(
        kind,
        existing.threshold,
        METHOD_FOR[kind],
      ).boundaries;
      await saveZone(existing, {
        kind,
        boundaries,
        threshold: existing.threshold,
        maxHr: existing.maxHr,
        restingHr: existing.restingHr,
        source: "system",
      });
    },
    [zones, saveZone],
  );

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
                hrZone={findZone(zones, "hr")}
                paceZone={findZone(zones, "pace")}
                onUpsert={handleUpsertThreshold}
              />

              <ZonesBlock
                kind="hr"
                title="HR Zones"
                zone={findZone(zones, "hr")}
                onUpdateBoundaries={handleUpdateBoundaries}
                onResync={handleResync}
              />

              <ZonesBlock
                kind="pace"
                title="Pace Zones"
                zone={findZone(zones, "pace")}
                onUpdateBoundaries={handleUpdateBoundaries}
                onResync={handleResync}
              />
            </>
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

function thresholdToInput(
  kind: ZoneKind,
  threshold: number | undefined,
): string {
  if (threshold === undefined) return "";
  return kind === "hr"
    ? String(Math.round(threshold))
    : paceMpsToMinPerKm(threshold);
}

function ThresholdsBlock({
  hrZone,
  paceZone,
  onUpsert,
}: {
  hrZone: ZoneDoc | null;
  paceZone: ZoneDoc | null;
  onUpsert: (args: { kind: ZoneKind; threshold: number }) => Promise<unknown>;
}) {
  const [editing, setEditing] = React.useState(false);
  const [hrDraft, setHrDraft] = React.useState<string>(() =>
    thresholdToInput("hr", hrZone?.threshold),
  );
  const [paceDraft, setPaceDraft] = React.useState<string>(() =>
    thresholdToInput("pace", paceZone?.threshold),
  );
  const [busy, setBusy] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

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

  // Live per-field validation: parses each non-empty draft against its schema
  // and surfaces the field error inline. Empty drafts are treated as "skip"
  // (the user can save just one threshold).
  const fieldErrors = React.useMemo<{ hr?: string; pace?: string }>(() => {
    if (!editing) return {};
    const errors: { hr?: string; pace?: string } = {};
    if (hrDraft.trim().length > 0) {
      const r = HrThresholdField.safeParse(hrDraft);
      if (!r.success) errors.hr = r.error.issues[0]?.message;
    }
    if (paceDraft.trim().length > 0) {
      const r = PaceThresholdField.safeParse(paceDraft);
      if (!r.success) errors.pace = r.error.issues[0]?.message;
    }
    return errors;
  }, [editing, hrDraft, paceDraft]);

  const anyFieldInvalid = !!fieldErrors.hr || !!fieldErrors.pace;
  const canSave = !anyFieldInvalid && !busy;

  const beginEdit = () => {
    setFormError(null);
    setHrDraft(thresholdToInput("hr", hrZone?.threshold));
    setPaceDraft(thresholdToInput("pace", paceZone?.threshold));
    setEditing(true);
  };

  const cancelEdit = () => {
    setFormError(null);
    setHrDraft(thresholdToInput("hr", hrZone?.threshold));
    setPaceDraft(thresholdToInput("pace", paceZone?.threshold));
    setEditing(false);
  };

  const saveEdit = async () => {
    setFormError(null);
    Keyboard.dismiss();
    if (anyFieldInvalid) return;

    const tasks: { kind: ZoneKind; threshold: number }[] = [];

    if (hrDraft.trim().length > 0) {
      const r = HrThresholdField.safeParse(hrDraft);
      if (r.success) {
        const current = hrZone?.threshold;
        if (current === undefined || Math.round(current) !== r.data) {
          tasks.push({ kind: "hr", threshold: r.data });
        }
      }
    }

    if (paceDraft.trim().length > 0) {
      const r = PaceThresholdField.safeParse(paceDraft);
      if (r.success) {
        const current = paceZone?.threshold;
        const currentDisplay =
          current !== undefined ? paceMpsToMinPerKm(current) : "";
        if (paceMpsToMinPerKm(r.data) !== currentDisplay) {
          tasks.push({ kind: "pace", threshold: r.data });
        }
      }
    }

    setBusy(true);
    try {
      for (const t of tasks) {
        await onUpsert(t);
      }
      setEditing(false);
    } catch (err) {
      setFormError(getConvexErrorMessage(err));
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
      >
        <Text
          className="font-coach-medium text-[13px]"
          style={{ color: LIGHT_THEME.wMute }}
        >
          Cancel
        </Text>
      </Pressable>
      <Pressable
        onPress={saveEdit}
        disabled={!canSave}
        hitSlop={6}
        className="h-9 items-center justify-center rounded-md px-3 active:opacity-90"
        style={{
          backgroundColor: LIGHT_THEME.wText,
          opacity: canSave ? 1 : 0.4,
        }}
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
    kind: ZoneKind;
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

  const showFormError = formError !== null;

  return (
    <Section title="Your Thresholds" headerRight={headerRight}>
      {rows.map((row, i) => {
        const fieldError = fieldErrors[row.kind];
        const isLastRow = i === rows.length - 1;
        const showBottomBorder = !isLastRow || showFormError;
        return (
          <View
            key={row.kind}
            className="px-4 py-3"
            style={
              showBottomBorder
                ? { borderBottomWidth: 1, borderBottomColor: LIGHT_THEME.wBrd }
                : undefined
            }
          >
            <View className="flex-row items-center gap-3">
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
                invalid={editing && !!fieldError}
              />
              <Text
                className="font-coach text-[12px]"
                style={{ color: LIGHT_THEME.wMute }}
              >
                {row.unit}
              </Text>
            </View>
            {fieldError && (
              <Text
                className="mt-2 font-coach text-[12px]"
                style={{ color: COLORS.red }}
              >
                {fieldError}
              </Text>
            )}
          </View>
        );
      })}
      {showFormError && (
        <View className="px-4 py-2.5">
          <Text
            className="font-coach text-[12px]"
            style={{ color: COLORS.red }}
          >
            {formError}
          </Text>
        </View>
      )}
    </Section>
  );
}

function ZonesBlock({
  kind,
  title,
  zone,
  onUpdateBoundaries,
  onResync,
}: {
  kind: ZoneKind;
  title: string;
  zone: ZoneDoc | null;
  onUpdateBoundaries: (args: {
    kind: ZoneKind;
    boundaries: number[];
  }) => Promise<unknown>;
  onResync: (args: { kind: ZoneKind }) => Promise<unknown>;
}) {
  const { labels } = computeZoneBoundaries(kind, 100, METHOD_FOR[kind]);
  const isManual = zone?.source === "manual";

  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState<string[]>(() =>
    draftFromZone(kind, zone),
  );
  const [busy, setBusy] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  // Re-seed the draft whenever the underlying zone changes and we are not editing.
  const baseKey = zone?.boundaries ? zone.boundaries.join(",") : "empty";
  React.useEffect(() => {
    if (!editing) {
      setDraft(draftFromZone(kind, zone));
    }
    // zone is captured via baseKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseKey, editing, kind]);

  const beginEdit = () => {
    setFormError(null);
    setDraft(draftFromZone(kind, zone));
    setEditing(true);
  };

  const cancelEdit = () => {
    setFormError(null);
    setEditing(false);
    setDraft(draftFromZone(kind, zone));
  };

  // Only the four middle boundaries are user-editable. Z1 low is fixed at 0
  // and Z5 high is the cap sentinel — both come from emptyDraft / the loaded
  // zone and are not exposed as inputs.
  const editableIndices = [1, 2, 3, 4] as const;

  const parsedMiddle: (number | null)[] = editableIndices.map((k) =>
    draft[k].trim().length === 0 ? null : parseBoundary(kind, draft[k]),
  );

  // Format-invalid rows: filled but unparseable (e.g. "3:" for pace).
  const formatInvalidIndices = React.useMemo(() => {
    const set = new Set<number>();
    for (let i = 0; i < editableIndices.length; i++) {
      const k = editableIndices[i];
      if (draft[k].trim().length === 0) continue;
      if (parsedMiddle[i] === null) set.add(k);
    }
    return set;
  }, [parsedMiddle]);

  // Ordering-invalid rows: parseable but not strictly above the previous filled
  // value. Empty/format-invalid rows reset the comparison so a single blank
  // doesn't cascade-invalidate later rows.
  const invalidIndices = React.useMemo(() => {
    const set = new Set<number>(formatInvalidIndices);
    let prev: number = 0; // Z1 low edge
    for (let i = 0; i < editableIndices.length; i++) {
      const k = editableIndices[i];
      if (draft[k].trim().length === 0) {
        prev = Number.NaN;
        continue;
      }
      const v = parsedMiddle[i];
      if (v === null) {
        prev = Number.NaN;
        continue;
      }
      if (Number.isFinite(prev) && v <= prev) {
        set.add(k);
      }
      prev = v;
    }
    return set;
  }, [parsedMiddle, formatInvalidIndices]);

  const anyEmpty = editableIndices.some((k) => draft[k].trim().length === 0);
  const someFilled = editableIndices.some((k) => draft[k].trim().length > 0);
  const anyFormatInvalid = formatInvalidIndices.size > 0;
  const anyInvalid = invalidIndices.size > 0;
  const canSave = !anyEmpty && !anyInvalid && !busy;

  // Helper priority: format errors first (they make the ordering check
  // meaningless), then ordering, then "fill in all four".
  // Don't surface the "fill in all four" helper while every field is still
  // blank — that would scold the user the moment they tap Edit.
  const helperText = anyFormatInvalid
    ? `${ZONE_FORMAT_MESSAGES[kind]}.`
    : anyInvalid
      ? `${ZONE_ORDERING_MESSAGES[kind]}.`
      : someFilled && anyEmpty
        ? "Fill in all four boundaries to save."
        : null;

  const saveEdit = async () => {
    setFormError(null);
    Keyboard.dismiss();
    const result = makeZonesFormSchema(kind).safeParse({
      b1: draft[1],
      b2: draft[2],
      b3: draft[3],
      b4: draft[4],
    });
    if (!result.success) {
      const tree = z.treeifyError(result.error);
      const firstFieldError =
        tree.properties?.b1?.errors?.[0] ??
        tree.properties?.b2?.errors?.[0] ??
        tree.properties?.b3?.errors?.[0] ??
        tree.properties?.b4?.errors?.[0];
      setFormError(
        firstFieldError ?? tree.errors?.[0] ?? "Invalid zone boundaries",
      );
      return;
    }
    const parsed = [
      0,
      result.data.b1,
      result.data.b2,
      result.data.b3,
      result.data.b4,
      ZONE_CAP[kind],
    ];
    setBusy(true);
    try {
      await onUpdateBoundaries({ kind, boundaries: parsed });
      setEditing(false);
    } catch (err) {
      setFormError(getConvexErrorMessage(err));
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

  const headerRight = editing ? (
    <View className="flex-row items-center gap-1.5">
      <Pressable
        onPress={cancelEdit}
        disabled={busy}
        hitSlop={6}
        className="h-9 items-center justify-center rounded-md px-3 active:opacity-70"
      >
        <Text
          className="font-coach-medium text-[13px]"
          style={{ color: LIGHT_THEME.wMute }}
        >
          Cancel
        </Text>
      </Pressable>
      <Pressable
        onPress={saveEdit}
        disabled={!canSave}
        hitSlop={6}
        className="h-9 items-center justify-center rounded-md px-3 active:opacity-90"
        style={{
          backgroundColor: LIGHT_THEME.wText,
          opacity: canSave ? 1 : 0.4,
        }}
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
    <View className="gap-3">
      <Section title={title} headerRight={headerRight}>
      {labels.map((label, i) => {
        const isLastRow = i === labels.length - 1; // Z5
        const highIndex = i + 1;
        const highEditableInput = !isLastRow;
        const isHighInvalid = invalidIndices.has(highIndex);
        const lowText =
          i === 0
            ? kind === "hr"
              ? "0"
              : "∞"
            : draft[i].trim().length === 0
              ? ""
              : draft[i];
        return (
          <View
            key={`${kind}-row-${i}`}
            className="flex-row items-center gap-3 px-4 py-3"
            style={
              !isLastRow || (editing && !!helperText) || !!formError
                ? { borderBottomWidth: 1, borderBottomColor: LIGHT_THEME.wBrd }
                : undefined
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
            <View className="h-9 w-14 items-center justify-center">
              <Text
                className={`font-coach-medium ${lowText === "∞" ? "text-[20px]" : "text-[13px]"}`}
                style={{ color: LIGHT_THEME.wMute }}
              >
                {lowText}
              </Text>
            </View>
            <Text
              className="font-coach text-[13px]"
              style={{ color: LIGHT_THEME.wMute }}
            >
              –
            </Text>
            {highEditableInput ? (
              <ZoneNumberInput
                kind={kind}
                value={draft[highIndex]}
                onChangeText={(v) => setRowValue(highIndex, v)}
                editable={editing}
                invalid={editing && isHighInvalid}
              />
            ) : (
              <View className="h-9 w-14 items-center justify-center">
                <Text
                  className={`font-coach-medium ${kind === "hr" ? "text-[20px]" : "text-[13px]"}`}
                  style={{ color: LIGHT_THEME.wMute }}
                >
                  {kind === "hr" ? "∞" : formatBoundary(kind, ZONE_CAP[kind])}
                </Text>
              </View>
            )}
            <Text
              className="font-coach text-[12px]"
              style={{ color: LIGHT_THEME.wMute }}
            >
              {kind === "hr" ? "bpm" : "/km"}
            </Text>
          </View>
        );
      })}
      {editing && helperText && (
        <View
          className="px-4 py-2.5"
          style={
            formError
              ? { borderBottomWidth: 1, borderBottomColor: LIGHT_THEME.wBrd }
              : undefined
          }
        >
          <Text
            className="font-coach text-[12px]"
            style={{ color: anyInvalid ? COLORS.red : LIGHT_THEME.wMute }}
          >
            {helperText}
          </Text>
        </View>
      )}
      {formError && (
        <View className="px-4 py-2.5">
          <Text
            className="font-coach text-[12px]"
            style={{ color: COLORS.red }}
          >
            {formError}
          </Text>
        </View>
      )}
      </Section>
      {isManual && !editing && (
        <ResyncAlert
          kind={kind}
          canResync={!!zone?.threshold}
          onResync={onResync}
        />
      )}
    </View>
  );
}

function ResyncAlert({
  kind,
  canResync,
  onResync,
}: {
  kind: ZoneKind;
  canResync: boolean;
  onResync: (args: { kind: ZoneKind }) => Promise<unknown>;
}) {
  const [confirming, setConfirming] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    setBusy(true);
    try {
      await onResync({ kind });
      // On success the zone's source flips to "system" and this alert unmounts.
    } catch (err) {
      setError(getConvexErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <View
      className="gap-3 rounded-[14px] px-4 py-3"
      style={{
        backgroundColor: COLORS.ylwDim,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.ylw,
      }}
    >
      <Text
        className="font-coach text-[14px] leading-5"
        style={{ color: LIGHT_THEME.wText }}
      >
        These zones use custom boundaries — they won't recompute when your threshold changes. Re-sync to recalculate them from your current threshold.
      </Text>
      {error && (
        <Text
          className="font-coach text-[12px]"
          style={{ color: COLORS.red }}
        >
          {error}
        </Text>
      )}
      <View className="flex-row items-center justify-end gap-1.5">
        {confirming ? (
          <>
            <Pressable
              onPress={() => {
                setError(null);
                setConfirming(false);
              }}
              disabled={busy}
              hitSlop={6}
              className="h-9 items-center justify-center rounded-md px-3 active:opacity-70"
            >
              <Text
                className="font-coach-medium text-[13px]"
                style={{ color: LIGHT_THEME.wMute }}
              >
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              disabled={busy}
              hitSlop={6}
              className="h-9 items-center justify-center rounded-md px-3 active:opacity-90"
              style={{
                backgroundColor: LIGHT_THEME.wText,
                opacity: busy ? 0.4 : 1,
              }}
            >
              {busy ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text
                  className="font-coach-bold text-[13px]"
                  style={{ color: "#FFFFFF" }}
                >
                  Confirm
                </Text>
              )}
            </Pressable>
          </>
        ) : (
          <Pressable
            onPress={() => setConfirming(true)}
            disabled={!canResync}
            hitSlop={6}
            className="h-9 items-center justify-center rounded-md px-3 active:opacity-90"
            style={{
              backgroundColor: LIGHT_THEME.wText,
              opacity: !canResync ? 0.4 : 1,
            }}
          >
            <Text
              className="font-coach-bold text-[13px]"
              style={{ color: "#FFFFFF" }}
            >
              Re-sync from threshold
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function ZoneNumberInput({
  kind,
  value,
  onChangeText,
  editable,
  invalid,
}: {
  kind: ZoneKind;
  value: string;
  onChangeText: (v: string) => void;
  editable: boolean;
  invalid?: boolean;
}) {
  return (
    <Input
      className={"h-9 w-14 text-center font-coach-medium text-[13px]"}
      style={invalid ? { borderColor: COLORS.red, borderWidth: 1 } : undefined}
      value={value}
      onChangeText={onChangeText}
      editable={editable}
      keyboardType={kind === "hr" ? "number-pad" : "numbers-and-punctuation"}
      maxLength={kind === "hr" ? 3 : 5}
    />
  );
}

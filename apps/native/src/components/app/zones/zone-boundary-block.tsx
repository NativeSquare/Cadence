import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { paceMpsToMinPerKm, parsePaceInput } from "@/lib/format-pace";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import {
  ZONE_CAP,
  ZONE_FORMAT_MESSAGES,
  ZONE_ORDERING_MESSAGES,
  makeZonesFormSchema,
} from "@/validation/zones";
import { computeZoneBoundaries } from "@nativesquare/agoge";
import { ZoneKind } from "@nativesquare/agoge/schema";
import React from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  View,
} from "react-native";
import { z } from "zod";
import type { ZoneDoc } from "./types";
import { METHOD_FOR } from "./zone-method";
import { ZoneNumberInput } from "./zone-number-input";
import { ZoneResyncAlert } from "./zone-resync-alert";
import { ZoneSection } from "./zone-section";

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

export type ZoneBoundaryBlockProps = {
  kind: ZoneKind;
  title: string;
  zone: ZoneDoc | null;
  onUpdateBoundaries: (args: {
    kind: ZoneKind;
    boundaries: number[];
  }) => Promise<unknown>;
  onResync: (args: { kind: ZoneKind }) => Promise<unknown>;
};

export function ZoneBoundaryBlock({
  kind,
  title,
  zone,
  onUpdateBoundaries,
  onResync,
}: ZoneBoundaryBlockProps) {
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
      <ZoneSection title={title} headerRight={headerRight}>
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
                    className="font-coach-medium text-[13px]"
                    style={{ color: LIGHT_THEME.wMute }}
                  >
                    {formatBoundary(kind, ZONE_CAP[kind])}
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
      </ZoneSection>
      {isManual && !editing && (
        <ZoneResyncAlert
          kind={kind}
          canResync={!!zone?.threshold}
          onResync={onResync}
        />
      )}
    </View>
  );
}

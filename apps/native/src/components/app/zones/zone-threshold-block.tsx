import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { paceMpsToMinPerKm } from "@/lib/format-pace";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { HrThresholdField, PaceThresholdField } from "@/validation/zones";
import { ZoneKind } from "@nativesquare/agoge/schema";
import React from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  View,
} from "react-native";
import type { ZoneDoc } from "./types";
import { ZoneNumberInput } from "./zone-number-input";
import { ZoneSection } from "./zone-section";

export type ZoneThresholdBlockProps = {
  hrZone: ZoneDoc | null;
  paceZone: ZoneDoc | null;
  onUpsert: (args: { kind: ZoneKind; threshold: number }) => Promise<unknown>;
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

export function ZoneThresholdBlock({
  hrZone,
  paceZone,
  onUpsert,
}: ZoneThresholdBlockProps) {
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
    <ZoneSection title="Your Thresholds" headerRight={headerRight}>
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
    </ZoneSection>
  );
}

import { Text } from "@/components/ui/text";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { paceMpsToMinPerKm, parsePaceInput } from "@/lib/format-pace";
import { api } from "@packages/backend/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import {
  computeZoneBoundaries,
  type ZoneMethod,
} from "@nativesquare/agoge";
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
  TextInput,
  View,
} from "react-native";

type Kind = "hr" | "pace";

const METHOD_FOR: Record<Kind, ZoneMethod> = {
  hr: "coggan-hr",
  pace: "coggan-pace",
};

function formatIsoDate(iso: string): string {
  const [y, m, d] = iso.split("-").map((s) => Number.parseInt(s, 10));
  const date = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatSource(raw: string | undefined): string | null {
  if (!raw) return null;
  if (raw === "manual") return "Manual entry";
  return raw;
}

function formatThresholdValue(kind: Kind, threshold: number): string {
  return kind === "hr"
    ? `${Math.round(threshold)} bpm`
    : `${paceMpsToMinPerKm(threshold)} /km`;
}

type ZoneRow = { label: string; range: string };

// Lower-bound percentages for the 5-zone schemes — mirrored from @nativesquare/agoge
// so we can render the zones table before the athlete has set a threshold.
const DEFAULT_PERCENTS: Record<Kind, readonly number[]> = {
  hr: [0, 0.68, 0.83, 0.94, 1.05],
  pace: [0, 0.775, 0.885, 0.952, 1.031],
};

function formatPercent(fraction: number): string {
  const pct = fraction * 100;
  return Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(1)}%`;
}

function defaultZoneRows(kind: Kind, labels: readonly string[]): ZoneRow[] {
  const percents = DEFAULT_PERCENTS[kind];
  const unit = kind === "hr" ? "LTHR" : "pace threshold";
  const rows: ZoneRow[] = [];
  for (let i = 0; i < labels.length; i++) {
    const lower = percents[i];
    const upper = percents[i + 1];
    let range: string;
    if (kind === "hr") {
      if (i === 0) range = `< ${formatPercent(upper)} ${unit}`;
      else if (i === labels.length - 1) range = `> ${formatPercent(lower)} ${unit}`;
      else range = `${formatPercent(lower)}–${formatPercent(upper)} ${unit}`;
    } else {
      if (i === 0) range = `slower than ${formatPercent(upper)} ${unit}`;
      else if (i === labels.length - 1)
        range = `faster than ${formatPercent(lower)} ${unit}`;
      else range = `${formatPercent(lower)}–${formatPercent(upper)} ${unit}`;
    }
    rows.push({ label: labels[i], range });
  }
  return rows;
}

function hrZoneRows(boundaries: readonly number[], labels: readonly string[]): ZoneRow[] {
  const rows: ZoneRow[] = [];
  for (let i = 0; i < labels.length; i++) {
    const lower = boundaries[i];
    const upper = boundaries[i + 1];
    let range: string;
    if (i === 0) range = `< ${upper} bpm`;
    else if (i === labels.length - 1) range = `${lower}+ bpm`;
    else range = `${lower}–${upper - 1} bpm`;
    rows.push({ label: labels[i], range });
  }
  return rows;
}

function paceZoneRows(boundaries: readonly number[], labels: readonly string[]): ZoneRow[] {
  // boundaries (m/s, ascending) → display slowest → fastest.
  const rows: ZoneRow[] = [];
  for (let i = 0; i < labels.length; i++) {
    const lowerMps = boundaries[i];
    const upperMps = boundaries[i + 1];
    let range: string;
    if (i === 0) range = `slower than ${paceMpsToMinPerKm(upperMps)}/km`;
    else if (i === labels.length - 1)
      range = `faster than ${paceMpsToMinPerKm(lowerMps)}/km`;
    else
      range = `${paceMpsToMinPerKm(upperMps)}–${paceMpsToMinPerKm(lowerMps)}/km`;
    rows.push({ label: labels[i], range });
  }
  return rows;
}

export default function ZonesScreen() {
  const router = useRouter();
  const zones = useQuery(api.plan.zones.listCurrentZones);
  const upsertZones = useMutation(api.plan.zones.upsertZones);

  const [editingThreshold, setEditingThreshold] = React.useState<Kind | null>(null);
  const [thresholdForm, setThresholdForm] = React.useState<string>("");
  const [busyKind, setBusyKind] = React.useState<Kind | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleThresholdEdit = (kind: Kind) => {
    setError(null);
    const current = zones?.[kind]?.threshold;
    setThresholdForm(
      current === undefined
        ? ""
        : kind === "hr"
          ? String(Math.round(current))
          : paceMpsToMinPerKm(current),
    );
    setEditingThreshold(kind);
  };

  const handleThresholdSave = async (kind: Kind) => {
    setError(null);
    Keyboard.dismiss();
    let threshold: number;
    if (kind === "hr") {
      const n = Number.parseInt(thresholdForm, 10);
      if (!Number.isInteger(n) || n <= 60 || n > 250) {
        setError("Enter a heart rate between 61 and 250 bpm.");
        return;
      }
      threshold = n;
    } else {
      const p = parsePaceInput(thresholdForm);
      if (p === null || !Number.isFinite(p)) {
        setError("Enter a pace in min:sec per km (e.g. 3:45).");
        return;
      }
      threshold = p;
    }
    setBusyKind(kind);
    try {
      await upsertZones({ kind, threshold });
      setEditingThreshold(null);
    } catch (err) {
      setError(getConvexErrorMessage(err));
    } finally {
      setBusyKind(null);
    }
  };

  const loading = zones === undefined;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="mt-safe flex-1"
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
              <Section title="Your Thresholds">
                <ThresholdCard
                  kind="hr"
                  label="Heart Rate Threshold (LTHR)"
                  zone={zones?.hr ?? null}
                  editing={editingThreshold === "hr"}
                  form={thresholdForm}
                  onFormChange={setThresholdForm}
                  onEdit={() => handleThresholdEdit("hr")}
                  onSave={() => handleThresholdSave("hr")}
                  onCancel={() => setEditingThreshold(null)}
                  busy={busyKind === "hr"}
                />
                <Divider />
                <ThresholdCard
                  kind="pace"
                  label="Pace Threshold"
                  zone={zones?.pace ?? null}
                  editing={editingThreshold === "pace"}
                  form={thresholdForm}
                  onFormChange={setThresholdForm}
                  onEdit={() => handleThresholdEdit("pace")}
                  onSave={() => handleThresholdSave("pace")}
                  onCancel={() => setEditingThreshold(null)}
                  busy={busyKind === "pace"}
                />
              </Section>

              <ZonesBlock
                kind="hr"
                title="HR Zones"
                zone={zones?.hr ?? null}
              />

              <ZonesBlock
                kind="pace"
                title="Pace Zones"
                zone={zones?.pace ?? null}
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
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-2">
      <Text
        className="px-1 font-coach-semibold text-[11px] uppercase tracking-wider"
        style={{ color: LIGHT_THEME.wMute }}
      >
        {title}
      </Text>
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

function Divider() {
  return (
    <View
      style={{ height: 1, backgroundColor: LIGHT_THEME.wBrd }}
    />
  );
}

type ZoneDoc = {
  threshold: number;
  boundaries: number[];
  source?: string;
  effectiveFrom: string;
};

function ThresholdCard({
  kind,
  label,
  zone,
  editing,
  form,
  onFormChange,
  onEdit,
  onSave,
  onCancel,
  busy,
}: {
  kind: Kind;
  label: string;
  zone: ZoneDoc | null;
  editing: boolean;
  form: string;
  onFormChange: (v: string) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const sourceLine = formatSource(zone?.source);
  return (
    <View className="gap-2 px-4 py-4">
      <Text
        className="font-coach-medium text-[13px]"
        style={{ color: LIGHT_THEME.wMute }}
      >
        {label}
      </Text>
      {editing ? (
        <View className="flex-row items-center gap-2">
          <TextInput
            className="h-10 flex-1 rounded-lg border px-3 font-coach-medium text-[16px]"
            style={{
              backgroundColor: LIGHT_THEME.w2,
              borderColor: LIGHT_THEME.wBrd,
              color: LIGHT_THEME.wText,
            }}
            value={form}
            onChangeText={(v) =>
              onFormChange(
                kind === "hr"
                  ? v.replace(/[^0-9]/g, "")
                  : v.replace(/[^0-9:]/g, ""),
              )
            }
            placeholder={kind === "hr" ? "172" : "3:45"}
            placeholderTextColor={LIGHT_THEME.wMute}
            keyboardType={kind === "hr" ? "number-pad" : "numbers-and-punctuation"}
            maxLength={kind === "hr" ? 3 : 5}
            autoFocus
            selectionColor={COLORS.lime}
            cursorColor={COLORS.lime}
          />
          <Pressable
            onPress={onCancel}
            disabled={busy}
            className="h-10 items-center justify-center rounded-lg px-3 active:opacity-70"
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
            onPress={onSave}
            disabled={busy}
            className="h-10 items-center justify-center rounded-lg px-3 active:opacity-90"
            style={{ backgroundColor: LIGHT_THEME.wText }}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" />
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
        <View className="flex-row items-center justify-between">
          <Text
            className="font-coach-bold text-[22px]"
            style={{ color: zone ? LIGHT_THEME.wText : LIGHT_THEME.wMute }}
          >
            {zone ? formatThresholdValue(kind, zone.threshold) : "Not set"}
          </Text>
          <Pressable
            onPress={onEdit}
            className="h-8 items-center justify-center rounded-lg px-3 active:opacity-70"
            style={{ backgroundColor: LIGHT_THEME.w3 }}
          >
            <Text
              className="font-coach-medium text-[12px]"
              style={{ color: LIGHT_THEME.wText }}
            >
              {zone ? "Edit" : "Set"}
            </Text>
          </Pressable>
        </View>
      )}
      {zone && !editing && (
        <View className="gap-0.5">
          <Text
            className="font-coach text-[11px]"
            style={{ color: LIGHT_THEME.wMute }}
          >
            Last updated: {formatIsoDate(zone.effectiveFrom)}
          </Text>
          {sourceLine && (
            <Text
              className="font-coach text-[11px]"
              style={{ color: LIGHT_THEME.wMute }}
            >
              Source: {sourceLine}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

function ZonesBlock({
  kind,
  title,
  zone,
}: {
  kind: Kind;
  title: string;
  zone: ZoneDoc | null;
}) {
  // Labels are fixed by the 5-zone scheme; call with a placeholder threshold
  // just to read them back so the default view doesn't duplicate the list.
  const { labels } = computeZoneBoundaries(kind, 100, METHOD_FOR[kind]);

  let rows: ZoneRow[];
  if (zone) {
    const computed = computeZoneBoundaries(
      kind,
      zone.threshold,
      METHOD_FOR[kind],
    );
    rows =
      kind === "hr"
        ? hrZoneRows(computed.boundaries, computed.labels)
        : paceZoneRows(computed.boundaries, computed.labels);
  } else {
    rows = defaultZoneRows(kind, labels);
  }

  return (
    <Section title={title}>
      {rows.map((row, i) => (
        <View
          key={`${kind}-row-${i}`}
          className="flex-row items-center gap-3 px-4 py-3"
          style={
            i === rows.length - 1
              ? undefined
              : { borderBottomWidth: 1, borderBottomColor: LIGHT_THEME.wBrd }
          }
        >
          <View
            className="size-7 items-center justify-center rounded-md"
            style={{ backgroundColor: LIGHT_THEME.w3 }}
          >
            <Text
              className="font-coach-bold text-[11px]"
              style={{ color: LIGHT_THEME.wText }}
            >
              Z{i + 1}
            </Text>
          </View>
          <Text
            className="flex-1 font-coach-medium text-[14px]"
            style={{ color: LIGHT_THEME.wText }}
          >
            {row.label}
          </Text>
          <Text
            className="font-coach-medium text-[13px]"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {row.range}
          </Text>
        </View>
      ))}
    </Section>
  );
}

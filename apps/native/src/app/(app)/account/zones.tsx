import { Text } from "@/components/ui/text";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { api } from "@packages/backend/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
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

const ZONE_LABELS = ["Recovery", "Endurance", "Tempo", "Threshold", "VO2 Max"];
const ZONE_COUNT = 5;
const EMPTY_HR: string[] = Array(ZONE_COUNT).fill("");
const EMPTY_PACE: string[] = Array(ZONE_COUNT).fill("");

function paceMpsToMinPerKm(mps: number): string {
  if (!Number.isFinite(mps) || mps <= 0) return "";
  const secPerKm = 1000 / mps;
  const minutes = Math.floor(secPerKm / 60);
  const seconds = Math.round(secPerKm - minutes * 60);
  if (seconds === 60) return `${minutes + 1}:00`;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function parsePaceInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  const match = trimmed.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) return Number.NaN;
  const minutes = Number.parseInt(match[1], 10);
  const seconds = Number.parseInt(match[2], 10);
  if (seconds >= 60) return Number.NaN;
  const secPerKm = minutes * 60 + seconds;
  if (secPerKm <= 0) return Number.NaN;
  return 1000 / secPerKm;
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

function hrBoundariesFromForm(form: string[]): number[] | "empty" | "invalid" {
  const allEmpty = form.every((v) => v.trim() === "");
  if (allEmpty) return "empty";
  const nums: number[] = [];
  for (const raw of form) {
    const n = Number.parseInt(raw, 10);
    if (!Number.isInteger(n) || n <= 0 || n > 250) return "invalid";
    nums.push(n);
  }
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] <= nums[i - 1]) return "invalid";
  }
  return nums;
}

function paceBoundariesFromForm(form: string[]): number[] | "empty" | "invalid" {
  const allEmpty = form.every((v) => v.trim() === "");
  if (allEmpty) return "empty";
  const mps: number[] = [];
  for (const raw of form) {
    const parsed = parsePaceInput(raw);
    if (parsed === null || !Number.isFinite(parsed)) return "invalid";
    mps.push(parsed);
  }
  // Slowest zone (Z1) = lowest m/s; fastest (Z5) = highest m/s.
  // In min/km this means Z1 has the biggest number, Z5 the smallest — we store ascending in m/s.
  for (let i = 1; i < mps.length; i++) {
    if (mps[i] <= mps[i - 1]) return "invalid";
  }
  return mps;
}

export default function ZonesScreen() {
  const router = useRouter();
  const zones = useQuery(api.plan.zones.listCurrentZones);
  const upsertZones = useMutation(api.plan.zones.upsertZones);

  const [initialHr, setInitialHr] = React.useState<string[]>(EMPTY_HR);
  const [initialPace, setInitialPace] = React.useState<string[]>(EMPTY_PACE);
  const [hrForm, setHrForm] = React.useState<string[]>(EMPTY_HR);
  const [paceForm, setPaceForm] = React.useState<string[]>(EMPTY_PACE);
  const [hydrated, setHydrated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (zones === undefined || hydrated) return;
    const hr = zones?.hr?.boundaries ?? null;
    const pace = zones?.pace?.boundaries ?? null;
    const nextHr =
      hr && hr.length === ZONE_COUNT ? hr.map((n) => String(Math.round(n))) : EMPTY_HR;
    const nextPace =
      pace && pace.length === ZONE_COUNT ? pace.map(paceMpsToMinPerKm) : EMPTY_PACE;
    setInitialHr(nextHr);
    setInitialPace(nextPace);
    setHrForm(nextHr);
    setPaceForm(nextPace);
    setHydrated(true);
  }, [zones, hydrated]);

  const hrChanged = !arraysEqual(hrForm, initialHr);
  const paceChanged = !arraysEqual(paceForm, initialPace);
  const hasChanges = hrChanged || paceChanged;

  const handleSave = async () => {
    setError(null);
    Keyboard.dismiss();

    const jobs: Array<{ kind: "hr" | "pace"; boundaries: number[] }> = [];

    if (hrChanged) {
      const result = hrBoundariesFromForm(hrForm);
      if (result === "invalid") {
        setError("Heart rate zones must be 5 ascending bpm values");
        return;
      }
      if (result !== "empty") {
        jobs.push({ kind: "hr", boundaries: result });
      }
    }
    if (paceChanged) {
      const result = paceBoundariesFromForm(paceForm);
      if (result === "invalid") {
        setError("Pace zones must be 5 ascending paces in min:sec per km");
        return;
      }
      if (result !== "empty") {
        jobs.push({ kind: "pace", boundaries: result });
      }
    }

    if (jobs.length === 0) {
      router.back();
      return;
    }

    setIsLoading(true);
    try {
      await Promise.all(jobs.map((job) => upsertZones(job)));
      router.back();
    } catch (err) {
      setError(getConvexErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const updateHr = (index: number, value: string) => {
    setHrForm((f) => {
      const next = [...f];
      next[index] = value.replace(/[^0-9]/g, "");
      return next;
    });
  };

  const updatePace = (index: number, value: string) => {
    setPaceForm((f) => {
      const next = [...f];
      next[index] = value.replace(/[^0-9:]/g, "");
      return next;
    });
  };

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
          <Section title="Heart Rate" unit="upper bound · bpm">
            {ZONE_LABELS.map((label, i) => (
              <ZoneRow
                key={`hr-${i}`}
                index={i + 1}
                label={label}
                value={hrForm[i]}
                placeholder="—"
                unit="bpm"
                keyboardType="number-pad"
                maxLength={3}
                onChange={(v) => updateHr(i, v)}
                isLast={i === ZONE_LABELS.length - 1}
              />
            ))}
          </Section>

          <Section title="Pace" unit="upper bound · min:sec per km">
            {ZONE_LABELS.map((label, i) => (
              <ZoneRow
                key={`pace-${i}`}
                index={i + 1}
                label={label}
                value={paceForm[i]}
                placeholder="—:——"
                unit="/km"
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                onChange={(v) => updatePace(i, v)}
                isLast={i === ZONE_LABELS.length - 1}
              />
            ))}
          </Section>
        </View>
      </ScrollView>

      <View className="w-full max-w-md gap-2 self-center px-4 pb-4 mb-safe">
        {error && (
          <Text
            className="text-center font-coach text-sm"
            style={{ color: COLORS.red }}
          >
            {error}
          </Text>
        )}
        <Pressable
          onPress={handleSave}
          disabled={isLoading || !hasChanges}
          className="items-center rounded-2xl py-3.5 active:opacity-90"
          style={{
            backgroundColor:
              isLoading || !hasChanges ? LIGHT_THEME.w3 : LIGHT_THEME.wText,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              className="font-coach-bold text-sm"
              style={{
                color:
                  isLoading || !hasChanges ? LIGHT_THEME.wMute : "#FFFFFF",
              }}
            >
              Save
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Section({
  title,
  unit,
  children,
}: {
  title: string;
  unit: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-2">
      <View className="flex-row items-end justify-between px-1">
        <Text
          className="font-coach-semibold text-[11px] uppercase tracking-wider"
          style={{ color: LIGHT_THEME.wMute }}
        >
          {title}
        </Text>
        <Text
          className="font-coach text-[10px]"
          style={{ color: LIGHT_THEME.wMute }}
        >
          {unit}
        </Text>
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

function ZoneRow({
  index,
  label,
  value,
  placeholder,
  unit,
  keyboardType,
  maxLength,
  onChange,
  isLast,
}: {
  index: number;
  label: string;
  value: string;
  placeholder: string;
  unit: string;
  keyboardType: "number-pad" | "numbers-and-punctuation";
  maxLength: number;
  onChange: (v: string) => void;
  isLast: boolean;
}) {
  return (
    <View
      className="flex-row items-center gap-3 px-4 py-3"
      style={
        isLast
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
          Z{index}
        </Text>
      </View>
      <Text
        className="flex-1 font-coach-medium text-[14px]"
        style={{ color: LIGHT_THEME.wText }}
      >
        {label}
      </Text>
      <TextInput
        className="h-10 rounded-lg border px-3 font-coach-medium text-[14px]"
        style={{
          backgroundColor: LIGHT_THEME.w2,
          borderColor: LIGHT_THEME.wBrd,
          color: LIGHT_THEME.wText,
          textAlign: "center",
          minWidth: 80,
        }}
        placeholder={placeholder}
        placeholderTextColor={LIGHT_THEME.wMute}
        keyboardType={keyboardType}
        maxLength={maxLength}
        value={value}
        onChangeText={onChange}
        selectionColor={COLORS.lime}
        cursorColor={COLORS.lime}
      />
      <Text
        className="font-coach-medium text-[11px]"
        style={{ color: LIGHT_THEME.wMute, width: 32 }}
      >
        {unit}
      </Text>
    </View>
  );
}

import { ConfirmationSheet } from "@/components/shared/confirmation-sheet";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
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

export const PRIORITIES = ["A", "B", "C"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const STATUSES = [
  "upcoming",
  "completed",
  "dnf",
  "dns",
  "cancelled",
] as const;
export type RaceStatus = (typeof STATUSES)[number];

export const COURSE_TYPES = [
  "loop",
  "point_to_point",
  "out_and_back",
  "laps",
  "other",
] as const;
export type CourseType = (typeof COURSE_TYPES)[number];

export const SURFACES = [
  "pavement",
  "mixed",
  "trail",
  "technical_trail",
  "track",
  "other",
] as const;
export type Surface = (typeof SURFACES)[number];

const PRIORITY_DESCRIPTIONS: Record<Priority, string> = {
  A: "Primary goal",
  B: "Secondary",
  C: "Training",
};

const STATUS_LABELS: Record<RaceStatus, string> = {
  upcoming: "Upcoming",
  completed: "Completed",
  dnf: "DNF",
  dns: "DNS",
  cancelled: "Cancelled",
};

const COURSE_TYPE_LABELS: Record<CourseType, string> = {
  loop: "Loop",
  point_to_point: "Point to point",
  out_and_back: "Out & back",
  laps: "Laps",
  other: "Other",
};

const SURFACE_LABELS: Record<Surface, string> = {
  pavement: "Pavement",
  mixed: "Mixed",
  trail: "Trail",
  technical_trail: "Technical trail",
  track: "Track",
  other: "Other",
};

export type RaceFormInitial = {
  name: string;
  date: string;
  priority: Priority;
  distanceMeters?: number;
  status: RaceStatus;
  location?: { city?: string; country?: string };
  notes?: string;
  elevationGainMeters?: number;
  courseType?: CourseType;
  surface?: Surface;
  bibNumber?: string;
  registrationUrl?: string;
  result?: {
    finishTime?: string;
    finishTimeSec?: number;
    placement?: number;
    notes?: string;
  };
};

export type RaceFormSubmit = {
  name: string;
  date: string;
  priority: Priority;
  distanceMeters?: number;
  status: RaceStatus;
  location?: { city?: string; country?: string };
  notes?: string;
  elevationGainMeters?: number;
  courseType?: CourseType;
  surface?: Surface;
  bibNumber?: string;
  registrationUrl?: string;
  result?: {
    finishTime?: string;
    finishTimeSec?: number;
    placement?: number;
    notes?: string;
  };
};

type FormState = {
  name: string;
  dateDay: string;
  dateMonth: string;
  dateYear: string;
  priority: Priority;
  distanceKm: string;
  status: RaceStatus;
  city: string;
  country: string;
  notes: string;
  elevationM: string;
  courseType: CourseType | "";
  surface: Surface | "";
  bibNumber: string;
  registrationUrl: string;
  finishHours: string;
  finishMinutes: string;
  finishSeconds: string;
  placement: string;
  resultNotes: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  dateDay: "",
  dateMonth: "",
  dateYear: "",
  priority: "B",
  distanceKm: "",
  status: "upcoming",
  city: "",
  country: "",
  notes: "",
  elevationM: "",
  courseType: "",
  surface: "",
  bibNumber: "",
  registrationUrl: "",
  finishHours: "",
  finishMinutes: "",
  finishSeconds: "",
  placement: "",
  resultNotes: "",
};

function isValidDate(d: string, m: string, y: string): boolean {
  const day = Number.parseInt(d, 10);
  const month = Number.parseInt(m, 10);
  const year = Number.parseInt(y, 10);
  if (
    !Number.isInteger(day) ||
    !Number.isInteger(month) ||
    !Number.isInteger(year)
  ) {
    return false;
  }
  if (year < 2000 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function initialToForm(initial: RaceFormInitial): FormState {
  const [y, m, d] = initial.date.split("-");
  const km =
    initial.distanceMeters != null
      ? String(Math.round((initial.distanceMeters / 1000) * 10) / 10)
      : "";
  const sec = initial.result?.finishTimeSec;
  let h = "";
  let mm = "";
  let ss = "";
  if (sec != null && sec > 0) {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = Math.round(sec % 60);
    h = hours > 0 ? String(hours) : "";
    mm = String(minutes).padStart(2, "0");
    ss = String(seconds).padStart(2, "0");
  }
  return {
    name: initial.name,
    dateDay: d ?? "",
    dateMonth: m ?? "",
    dateYear: y ?? "",
    priority: initial.priority,
    distanceKm: km,
    status: initial.status,
    city: initial.location?.city ?? "",
    country: initial.location?.country ?? "",
    notes: initial.notes ?? "",
    elevationM:
      initial.elevationGainMeters != null
        ? String(initial.elevationGainMeters)
        : "",
    courseType: initial.courseType ?? "",
    surface: initial.surface ?? "",
    bibNumber: initial.bibNumber ?? "",
    registrationUrl: initial.registrationUrl ?? "",
    finishHours: h,
    finishMinutes: mm,
    finishSeconds: ss,
    placement:
      initial.result?.placement != null ? String(initial.result.placement) : "",
    resultNotes: initial.result?.notes ?? "",
  };
}

export function RaceForm({
  title,
  initial,
  submitLabel,
  onSubmit,
  onDelete,
}: {
  title: string;
  initial?: RaceFormInitial;
  submitLabel: string;
  onSubmit: (values: RaceFormSubmit) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const router = useRouter();
  const [form, setForm] = React.useState<FormState>(
    initial ? initialToForm(initial) : EMPTY_FORM,
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const deleteSheetRef = React.useRef<BottomSheetModal>(null);

  const showResultSection = form.status === "completed";

  const canSave =
    form.name.trim().length > 0 &&
    isValidDate(form.dateDay, form.dateMonth, form.dateYear) &&
    form.distanceKm.trim().length > 0;

  const handleSave = async () => {
    setError(null);
    Keyboard.dismiss();
    if (!canSave) {
      setError("Name, date and distance are required");
      return;
    }

    const date = `${form.dateYear.padStart(4, "0")}-${form.dateMonth.padStart(2, "0")}-${form.dateDay.padStart(2, "0")}`;

    const km = Number.parseFloat(form.distanceKm.trim());
    if (!Number.isFinite(km) || km <= 0 || km > 1000) {
      setError("Invalid distance");
      return;
    }
    const distanceMeters = Math.round(km * 1000);

    let elevationGainMeters: number | undefined;
    if (form.elevationM.trim().length > 0) {
      const e = Number.parseFloat(form.elevationM.trim());
      if (!Number.isFinite(e) || e < 0 || e > 20000) {
        setError("Invalid elevation");
        return;
      }
      elevationGainMeters = Math.round(e);
    }

    const location =
      form.city.trim() || form.country.trim()
        ? {
            city: form.city.trim() || undefined,
            country: form.country.trim() || undefined,
          }
        : undefined;

    let result: RaceFormSubmit["result"];
    if (showResultSection) {
      const h = Number.parseInt(form.finishHours || "0", 10);
      const m = Number.parseInt(form.finishMinutes || "0", 10);
      const s = Number.parseInt(form.finishSeconds || "0", 10);
      const hasTime =
        form.finishHours.length > 0 ||
        form.finishMinutes.length > 0 ||
        form.finishSeconds.length > 0;
      let finishTime: string | undefined;
      let finishTimeSec: number | undefined;
      if (hasTime) {
        if (
          !Number.isFinite(h) ||
          !Number.isFinite(m) ||
          !Number.isFinite(s) ||
          m > 59 ||
          s > 59
        ) {
          setError("Invalid finish time");
          return;
        }
        finishTimeSec = h * 3600 + m * 60 + s;
        finishTime =
          h > 0
            ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
            : `${m}:${String(s).padStart(2, "0")}`;
      }
      let placement: number | undefined;
      if (form.placement.trim().length > 0) {
        const p = Number.parseInt(form.placement.trim(), 10);
        if (!Number.isFinite(p) || p < 1) {
          setError("Invalid placement");
          return;
        }
        placement = p;
      }
      if (
        finishTime ||
        placement !== undefined ||
        form.resultNotes.trim().length > 0
      ) {
        result = {
          finishTime,
          finishTimeSec,
          placement,
          notes: form.resultNotes.trim() || undefined,
        };
      }
    }

    setIsLoading(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        date,
        priority: form.priority,
        distanceMeters,
        status: form.status,
        location,
        notes: form.notes.trim() || undefined,
        elevationGainMeters,
        courseType: form.courseType || undefined,
        surface: form.surface || undefined,
        bibNumber: form.bibNumber.trim() || undefined,
        registrationUrl: form.registrationUrl.trim() || undefined,
        result,
      });
      router.back();
    } catch (err) {
      setError(getConvexErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete();
      deleteSheetRef.current?.dismiss();
      router.dismissAll();
      router.replace("/account/races");
    } catch (err) {
      setError(getConvexErrorMessage(err));
      setIsDeleting(false);
    }
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
          {title}
        </Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6"
      >
        <View className="w-full max-w-md gap-8 self-center">
          <Section title="Event">
            <Field label="Name">
              <TextInput
                className="h-12 rounded-xl border px-4 font-coach-medium text-[15px]"
                style={inputStyle}
                placeholder="e.g. Paris Marathon"
                placeholderTextColor={LIGHT_THEME.wMute}
                value={form.name}
                onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                autoCapitalize="words"
                returnKeyType="next"
                selectionColor={COLORS.lime}
                cursorColor={COLORS.lime}
              />
            </Field>

            <Field label="Date">
              <View className="flex-row gap-2">
                <DatePart
                  placeholder="DD"
                  value={form.dateDay}
                  maxLength={2}
                  onChange={(v) => setForm((f) => ({ ...f, dateDay: v }))}
                  widthClassName="w-[72px]"
                />
                <DatePart
                  placeholder="MM"
                  value={form.dateMonth}
                  maxLength={2}
                  onChange={(v) => setForm((f) => ({ ...f, dateMonth: v }))}
                  widthClassName="w-[72px]"
                />
                <DatePart
                  placeholder="YYYY"
                  value={form.dateYear}
                  maxLength={4}
                  onChange={(v) => setForm((f) => ({ ...f, dateYear: v }))}
                  widthClassName="flex-1"
                />
              </View>
            </Field>

            <Field label="Location (optional)">
              <View className="flex-row gap-2">
                <TextInput
                  className="h-12 flex-1 rounded-xl border px-4 font-coach-medium text-[15px]"
                  style={inputStyle}
                  placeholder="City"
                  placeholderTextColor={LIGHT_THEME.wMute}
                  value={form.city}
                  onChangeText={(v) => setForm((f) => ({ ...f, city: v }))}
                  autoCapitalize="words"
                  selectionColor={COLORS.lime}
                  cursorColor={COLORS.lime}
                />
                <TextInput
                  className="h-12 flex-1 rounded-xl border px-4 font-coach-medium text-[15px]"
                  style={inputStyle}
                  placeholder="Country"
                  placeholderTextColor={LIGHT_THEME.wMute}
                  value={form.country}
                  onChangeText={(v) => setForm((f) => ({ ...f, country: v }))}
                  autoCapitalize="words"
                  selectionColor={COLORS.lime}
                  cursorColor={COLORS.lime}
                />
              </View>
            </Field>

            <Field label="Notes (optional)">
              <TextInput
                className="min-h-[80px] rounded-xl border px-4 py-3 font-coach-medium text-[15px]"
                style={inputStyle}
                placeholder="Terrain, course notes, expectations…"
                placeholderTextColor={LIGHT_THEME.wMute}
                value={form.notes}
                onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
                multiline
                textAlignVertical="top"
                selectionColor={COLORS.lime}
                cursorColor={COLORS.lime}
              />
            </Field>
          </Section>

          <Section title="Race">
            <Field label="Priority">
              <View className="flex-row gap-2">
                {PRIORITIES.map((value) => {
                  const selected = form.priority === value;
                  return (
                    <Pressable
                      key={value}
                      onPress={() => {
                        selectionFeedback();
                        setForm((f) => ({ ...f, priority: value }));
                      }}
                      className="flex-1 items-center rounded-2xl py-3.5 active:opacity-80"
                      style={{
                        backgroundColor: selected
                          ? COLORS.lime
                          : LIGHT_THEME.w1,
                        borderWidth: 1,
                        borderColor: selected ? COLORS.lime : LIGHT_THEME.wBrd,
                      }}
                    >
                      <Text
                        className="font-coach-extrabold text-[15px]"
                        style={{
                          color: selected ? COLORS.black : LIGHT_THEME.wText,
                        }}
                      >
                        {value}
                      </Text>
                      <Text
                        className="mt-0.5 font-coach text-[10px]"
                        style={{
                          color: selected ? COLORS.black : LIGHT_THEME.wMute,
                        }}
                      >
                        {PRIORITY_DESCRIPTIONS[value]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Field>

            <Field label="Distance">
              <View className="flex-row items-center gap-3">
                <TextInput
                  className="h-12 flex-1 rounded-xl border px-4 font-coach-medium text-[15px]"
                  style={inputStyle}
                  placeholder="—"
                  placeholderTextColor={LIGHT_THEME.wMute}
                  keyboardType="decimal-pad"
                  value={form.distanceKm}
                  onChangeText={(v) =>
                    setForm((f) => ({ ...f, distanceKm: v }))
                  }
                  selectionColor={COLORS.lime}
                  cursorColor={COLORS.lime}
                />
                <Text
                  className="font-coach-medium text-[13px]"
                  style={{ color: LIGHT_THEME.wMute, width: 36 }}
                >
                  km
                </Text>
              </View>
            </Field>

            <Field label="Status">
              <PillSelect
                options={STATUSES}
                labels={STATUS_LABELS}
                value={form.status}
                onChange={(v) => setForm((f) => ({ ...f, status: v }))}
              />
            </Field>

            <Field label="Course type (optional)">
              <PillSelect
                options={COURSE_TYPES}
                labels={COURSE_TYPE_LABELS}
                value={form.courseType}
                onChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    courseType: f.courseType === v ? "" : v,
                  }))
                }
                allowClear
              />
            </Field>

            <Field label="Surface (optional)">
              <PillSelect
                options={SURFACES}
                labels={SURFACE_LABELS}
                value={form.surface}
                onChange={(v) =>
                  setForm((f) => ({ ...f, surface: f.surface === v ? "" : v }))
                }
                allowClear
              />
            </Field>

            <Field label="Elevation gain (optional)">
              <View className="flex-row items-center gap-3">
                <TextInput
                  className="h-12 flex-1 rounded-xl border px-4 font-coach-medium text-[15px]"
                  style={inputStyle}
                  placeholder="—"
                  placeholderTextColor={LIGHT_THEME.wMute}
                  keyboardType="number-pad"
                  value={form.elevationM}
                  onChangeText={(v) =>
                    setForm((f) => ({ ...f, elevationM: v.replace(/[^0-9]/g, "") }))
                  }
                  selectionColor={COLORS.lime}
                  cursorColor={COLORS.lime}
                />
                <Text
                  className="font-coach-medium text-[13px]"
                  style={{ color: LIGHT_THEME.wMute, width: 36 }}
                >
                  m
                </Text>
              </View>
            </Field>

            <Field label="Bib number (optional)">
              <TextInput
                className="h-12 rounded-xl border px-4 font-coach-medium text-[15px]"
                style={inputStyle}
                placeholder="—"
                placeholderTextColor={LIGHT_THEME.wMute}
                value={form.bibNumber}
                onChangeText={(v) => setForm((f) => ({ ...f, bibNumber: v }))}
                autoCapitalize="characters"
                selectionColor={COLORS.lime}
                cursorColor={COLORS.lime}
              />
            </Field>

            <Field label="Registration URL (optional)">
              <TextInput
                className="h-12 rounded-xl border px-4 font-coach-medium text-[15px]"
                style={inputStyle}
                placeholder="https://…"
                placeholderTextColor={LIGHT_THEME.wMute}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                value={form.registrationUrl}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, registrationUrl: v }))
                }
                selectionColor={COLORS.lime}
                cursorColor={COLORS.lime}
              />
            </Field>
          </Section>

          {showResultSection && (
            <Section title="Result">
              <Field label="Finish time (HH:MM:SS)">
                <View className="flex-row gap-2">
                  <DatePart
                    placeholder="HH"
                    value={form.finishHours}
                    maxLength={2}
                    onChange={(v) =>
                      setForm((f) => ({ ...f, finishHours: v }))
                    }
                    widthClassName="flex-1"
                  />
                  <DatePart
                    placeholder="MM"
                    value={form.finishMinutes}
                    maxLength={2}
                    onChange={(v) =>
                      setForm((f) => ({ ...f, finishMinutes: v }))
                    }
                    widthClassName="flex-1"
                  />
                  <DatePart
                    placeholder="SS"
                    value={form.finishSeconds}
                    maxLength={2}
                    onChange={(v) =>
                      setForm((f) => ({ ...f, finishSeconds: v }))
                    }
                    widthClassName="flex-1"
                  />
                </View>
              </Field>

              <Field label="Placement (optional)">
                <TextInput
                  className="h-12 rounded-xl border px-4 font-coach-medium text-[15px]"
                  style={inputStyle}
                  placeholder="—"
                  placeholderTextColor={LIGHT_THEME.wMute}
                  keyboardType="number-pad"
                  value={form.placement}
                  onChangeText={(v) =>
                    setForm((f) => ({
                      ...f,
                      placement: v.replace(/[^0-9]/g, ""),
                    }))
                  }
                  selectionColor={COLORS.lime}
                  cursorColor={COLORS.lime}
                />
              </Field>

              <Field label="Result notes (optional)">
                <TextInput
                  className="min-h-[80px] rounded-xl border px-4 py-3 font-coach-medium text-[15px]"
                  style={inputStyle}
                  placeholder="How did it go?"
                  placeholderTextColor={LIGHT_THEME.wMute}
                  value={form.resultNotes}
                  onChangeText={(v) =>
                    setForm((f) => ({ ...f, resultNotes: v }))
                  }
                  multiline
                  textAlignVertical="top"
                  selectionColor={COLORS.lime}
                  cursorColor={COLORS.lime}
                />
              </Field>
            </Section>
          )}

          {onDelete && (
            <Pressable
              className="items-center py-2 active:opacity-70"
              onPress={() => deleteSheetRef.current?.present()}
            >
              <Text
                className="font-coach text-[13px]"
                style={{ color: COLORS.red }}
              >
                Delete race
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      <View className="mb-safe w-full max-w-md gap-2 self-center px-4 pb-4">
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
          disabled={isLoading || !canSave}
          className="items-center rounded-2xl py-3.5 active:opacity-90"
          style={{
            backgroundColor:
              isLoading || !canSave ? LIGHT_THEME.w3 : LIGHT_THEME.wText,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              className="font-coach-bold text-sm"
              style={{
                color: isLoading || !canSave ? LIGHT_THEME.wMute : "#FFFFFF",
              }}
            >
              {submitLabel}
            </Text>
          )}
        </Pressable>
      </View>

      {onDelete && (
        <ConfirmationSheet
          sheetRef={deleteSheetRef}
          icon="trash-outline"
          title="Delete race"
          description="This cannot be undone."
          confirmLabel="Delete"
          destructive
          loading={isDeleting}
          onConfirm={handleDelete}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const inputStyle = {
  backgroundColor: LIGHT_THEME.w1,
  borderColor: LIGHT_THEME.wBrd,
  color: LIGHT_THEME.wText,
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-5">
      <Text
        className="font-coach-extrabold text-[11px] uppercase tracking-widest"
        style={{ color: LIGHT_THEME.wSub }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-2">
      <Text
        className="px-1 font-coach-semibold text-[11px] uppercase tracking-wider"
        style={{ color: LIGHT_THEME.wMute }}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

function DatePart({
  placeholder,
  value,
  maxLength,
  onChange,
  widthClassName,
}: {
  placeholder: string;
  value: string;
  maxLength: number;
  onChange: (v: string) => void;
  widthClassName: string;
}) {
  return (
    <TextInput
      className={`h-12 rounded-xl border px-4 font-coach-medium text-[15px] ${widthClassName}`}
      style={{
        ...inputStyle,
        textAlign: "center",
      }}
      placeholder={placeholder}
      placeholderTextColor={LIGHT_THEME.wMute}
      keyboardType="number-pad"
      maxLength={maxLength}
      value={value}
      onChangeText={(v) => onChange(v.replace(/[^0-9]/g, ""))}
      selectionColor={COLORS.lime}
      cursorColor={COLORS.lime}
    />
  );
}

function PillSelect<T extends string>({
  options,
  labels,
  value,
  onChange,
  allowClear = false,
}: {
  options: readonly T[];
  labels: Record<T, string>;
  value: T | "";
  onChange: (v: T) => void;
  allowClear?: boolean;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <Pressable
            key={opt}
            onPress={() => {
              selectionFeedback();
              onChange(opt);
            }}
            className="rounded-full border px-4 py-2 active:opacity-80"
            style={{
              backgroundColor: selected ? LIGHT_THEME.wText : LIGHT_THEME.w1,
              borderColor: selected ? LIGHT_THEME.wText : LIGHT_THEME.wBrd,
            }}
          >
            <Text
              className="font-coach-semibold text-[13px]"
              style={{
                color: selected ? "#FFFFFF" : LIGHT_THEME.wText,
              }}
            >
              {labels[opt]}
            </Text>
          </Pressable>
        );
      })}
      {allowClear && value !== "" && (
        <Text
          className="px-2 py-2 font-coach text-[11px]"
          style={{ color: LIGHT_THEME.wMute }}
        >
          Tap again to clear
        </Text>
      )}
    </View>
  );
}

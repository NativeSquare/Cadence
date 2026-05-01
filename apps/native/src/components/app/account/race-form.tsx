import {
  DateField,
  DatePart,
  FormField,
  FormSection,
} from "@/components/app/form";
import { ConfirmationSheet } from "@/components/shared/confirmation-sheet";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import type {
  CourseType,
  Discipline as AgogeDiscipline,
  ItraCategory,
  RaceFormat,
  RacePriority,
  RaceStatus,
  Surface,
} from "@nativesquare/agoge/schema";
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

export type Priority = RacePriority;
export type Discipline = Exclude<AgogeDiscipline, "ultra">;
export type Format = Extract<
  RaceFormat,
  "5k" | "10k" | "15k" | "half_marathon" | "marathon" | "custom"
>;
export type { CourseType, ItraCategory, RaceStatus, Surface };

export const PRIORITIES = ["A", "B", "C"] as const satisfies readonly Priority[];

export const STATUSES = [
  "upcoming",
  "completed",
  "dnf",
  "dns",
  "cancelled",
] as const satisfies readonly RaceStatus[];

export const COURSE_TYPES = [
  "loop",
  "point_to_point",
  "out_and_back",
  "laps",
  "stages",
  "other",
] as const satisfies readonly CourseType[];

export const SURFACES = [
  "road",
  "mixed",
  "trail",
  "technical_trail",
  "track",
  "other",
] as const satisfies readonly Surface[];

export const DISCIPLINES = [
  "road",
  "trail",
  "track",
  "cross_country",
] as const satisfies readonly Discipline[];

export const FORMATS = [
  "5k",
  "10k",
  "15k",
  "half_marathon",
  "marathon",
  "custom",
] as const satisfies readonly Format[];

const FORMAT_DISTANCE_METERS: Record<
  Exclude<Format, "custom">,
  number
> = {
  "5k": 5000,
  "10k": 10000,
  "15k": 15000,
  half_marathon: 21098,
  marathon: 42195,
};

const CUSTOM_DISTANCE_MIN_KM = 1;
const CUSTOM_DISTANCE_MAX_KM = 500;

function clampDistanceKm(input: string): string {
  let cleaned = input.replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot !== -1) {
    cleaned =
      cleaned.slice(0, firstDot + 1) +
      cleaned.slice(firstDot + 1).replace(/\./g, "");
  }
  if (cleaned === "" || cleaned === ".") return cleaned;
  const num = Number.parseFloat(cleaned);
  if (Number.isFinite(num) && num > CUSTOM_DISTANCE_MAX_KM) {
    return String(CUSTOM_DISTANCE_MAX_KM);
  }
  return cleaned;
}

export const ITRA_CATEGORIES = [
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
] as const satisfies readonly ItraCategory[];

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
  stages: "Stages",
  other: "Other",
};

const SURFACE_LABELS: Record<Surface, string> = {
  road: "Road",
  mixed: "Mixed",
  trail: "Trail",
  technical_trail: "Technical trail",
  track: "Track",
  other: "Other",
};

const DISCIPLINE_LABELS: Record<Discipline, string> = {
  road: "Road",
  trail: "Trail",
  track: "Track",
  cross_country: "Cross-country",
};

const FORMAT_LABELS: Record<Format, string> = {
  "5k": "5K",
  "10k": "10K",
  "15k": "15K",
  half_marathon: "Half marathon",
  marathon: "Marathon",
  custom: "Custom",
};

const ITRA_CATEGORY_LABELS: Record<ItraCategory, string> = {
  XXS: "XXS",
  XS: "XS",
  S: "S",
  M: "M",
  L: "L",
  XL: "XL",
  XXL: "XXL",
};

export type RaceFormInitial = {
  name: string;
  date: string;
  priority: Priority;
  discipline?: Discipline;
  format?: Format;
  distanceMeters?: number;
  status: RaceStatus;
  location?: { city?: string; country?: string };
  notes?: string;
  elevationGainMeters?: number;
  elevationLossMeters?: number;
  courseType?: CourseType;
  surface?: Surface;
  itraCategory?: ItraCategory;
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
  discipline: Discipline;
  format: Format;
  distanceMeters: number;
  status: RaceStatus;
  location?: { city?: string; country?: string };
  notes?: string;
  elevationGainMeters?: number;
  elevationLossMeters?: number;
  courseType?: CourseType;
  surface?: Surface;
  itraCategory?: ItraCategory;
  result?: {
    finishTime?: string;
    finishTimeSec?: number;
    placement?: number;
    notes?: string;
  };
};

function todayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

type FormState = {
  name: string;
  date: string;
  priority: Priority;
  discipline: Discipline;
  format: Format | "";
  distanceKm: string;
  status: RaceStatus;
  city: string;
  country: string;
  notes: string;
  elevationGainM: string;
  elevationLossM: string;
  courseType: CourseType | "";
  surface: Surface | "";
  itraCategory: ItraCategory | "";
  finishHours: string;
  finishMinutes: string;
  finishSeconds: string;
  placement: string;
  resultNotes: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  date: "",
  priority: "B",
  discipline: "road",
  format: "",
  distanceKm: "",
  status: "upcoming",
  city: "",
  country: "",
  notes: "",
  elevationGainM: "",
  elevationLossM: "",
  courseType: "",
  surface: "",
  itraCategory: "",
  finishHours: "",
  finishMinutes: "",
  finishSeconds: "",
  placement: "",
  resultNotes: "",
};

function initialToForm(initial: RaceFormInitial): FormState {
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
    date: initial.date,
    priority: initial.priority,
    discipline: initial.discipline ?? "road",
    format: initial.format ?? "",
    distanceKm: km,
    status: initial.status,
    city: initial.location?.city ?? "",
    country: initial.location?.country ?? "",
    notes: initial.notes ?? "",
    elevationGainM:
      initial.elevationGainMeters != null
        ? String(initial.elevationGainMeters)
        : "",
    elevationLossM:
      initial.elevationLossMeters != null
        ? String(initial.elevationLossMeters)
        : "",
    courseType: initial.courseType ?? "",
    surface: initial.surface ?? "",
    itraCategory: initial.itraCategory ?? "",
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
  mode = "create",
  initial,
  submitLabel,
  onSubmit,
  onDelete,
}: {
  title: string;
  mode?: "create" | "edit";
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
  const [pastDateAcknowledged, setPastDateAcknowledged] = React.useState(false);
  const deleteSheetRef = React.useRef<BottomSheetModal>(null);

  const dateIsValid = form.date.length === 10;
  const dateString = dateIsValid ? form.date : null;
  const dateIsPast = dateString != null && dateString < todayDateString();

  const showPastDatePrompt =
    mode === "create" && dateIsPast && !pastDateAcknowledged;

  const showResultSection = form.status === "completed";
  const showStatusPill = mode === "edit";

  const canSave =
    form.name.trim().length > 0 &&
    dateIsValid &&
    form.format !== "" &&
    (form.format !== "custom" || form.distanceKm.trim().length > 0) &&
    !showPastDatePrompt;

  React.useEffect(() => {
    setPastDateAcknowledged(false);
  }, [form.date]);

  const acknowledgePastDate = () => {
    selectionFeedback();
    setPastDateAcknowledged(true);
    setForm((f) => ({ ...f, status: "completed" }));
  };

  const clearPastDate = () => {
    selectionFeedback();
    setForm((f) => ({ ...f, date: "" }));
  };

  const handleSave = async () => {
    setError(null);
    Keyboard.dismiss();
    if (!canSave || form.format === "") {
      setError("Name, date and format are required");
      return;
    }
    const format = form.format;

    const date = form.date;

    if (mode === "edit") {
      const today = todayDateString();
      if (form.status === "upcoming" && date < today) {
        setError("An upcoming race cannot have a past date.");
        return;
      }
      if (
        (form.status === "completed" ||
          form.status === "dnf" ||
          form.status === "dns") &&
        date > today
      ) {
        setError("A completed/DNF/DNS race must have a past or today's date.");
        return;
      }
    }

    let distanceMeters: number;
    if (format === "custom") {
      const km = Number.parseFloat(form.distanceKm.trim());
      if (!Number.isFinite(km)) {
        setError("Invalid distance");
        return;
      }
      if (km < CUSTOM_DISTANCE_MIN_KM) {
        setError(`Distance must be at least ${CUSTOM_DISTANCE_MIN_KM} km`);
        return;
      }
      if (km > CUSTOM_DISTANCE_MAX_KM) {
        setError(`Distance can't exceed ${CUSTOM_DISTANCE_MAX_KM} km`);
        return;
      }
      distanceMeters = Math.round(km * 1000);
    } else {
      distanceMeters = FORMAT_DISTANCE_METERS[format];
    }

    let elevationGainMeters: number | undefined;
    if (form.elevationGainM.trim().length > 0) {
      const e = Number.parseFloat(form.elevationGainM.trim());
      if (!Number.isFinite(e) || e < 0 || e > 20000) {
        setError("Invalid elevation gain");
        return;
      }
      elevationGainMeters = Math.round(e);
    }

    let elevationLossMeters: number | undefined;
    if (form.elevationLossM.trim().length > 0) {
      const e = Number.parseFloat(form.elevationLossM.trim());
      if (!Number.isFinite(e) || e < 0 || e > 20000) {
        setError("Invalid elevation loss");
        return;
      }
      elevationLossMeters = Math.round(e);
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
        discipline: form.discipline,
        format,
        distanceMeters,
        status: form.status,
        location,
        notes: form.notes.trim() || undefined,
        elevationGainMeters,
        elevationLossMeters,
        courseType: form.courseType || undefined,
        surface: form.surface || undefined,
        itraCategory: form.itraCategory || undefined,
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
          <FormSection title="Event">
            <FormField label="Name">
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
            </FormField>

            <DateField
              label="Date"
              value={form.date || undefined}
              onChange={(v) => setForm((f) => ({ ...f, date: v }))}
              minDate={
                mode === "edit" && form.status === "upcoming"
                  ? todayDateString()
                  : undefined
              }
              maxDate={
                mode === "edit" &&
                (form.status === "completed" ||
                  form.status === "dnf" ||
                  form.status === "dns")
                  ? todayDateString()
                  : undefined
              }
            />

            {showPastDatePrompt && (
              <PromptCard
                title="This date is in the past"
                description="Is this a completed race you're logging?"
                primary={{
                  label: "Yes, log it as completed",
                  onPress: acknowledgePastDate,
                }}
                secondary={{
                  label: "No, fix the date",
                  onPress: clearPastDate,
                }}
              />
            )}

            <FormField label="Location (optional)">
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
            </FormField>

            <FormField label="Notes (optional)">
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
            </FormField>
          </FormSection>

          <FormSection title="Race">
            <FormField label="Priority">
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
            </FormField>

            <FormField label="Format">
              <PillSelect
                options={FORMATS}
                labels={FORMAT_LABELS}
                value={form.format}
                onChange={(v) => setForm((f) => ({ ...f, format: v }))}
              />
            </FormField>

            {form.format === "custom" && (
              <FormField label="Distance">
                <View className="flex-row items-center gap-3">
                  <TextInput
                    className="h-12 flex-1 rounded-xl border px-4 font-coach-medium text-[15px]"
                    style={inputStyle}
                    placeholder="—"
                    placeholderTextColor={LIGHT_THEME.wMute}
                    keyboardType="decimal-pad"
                    value={form.distanceKm}
                    onChangeText={(v) =>
                      setForm((f) => ({
                        ...f,
                        distanceKm: clampDistanceKm(v),
                      }))
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
              </FormField>
            )}

            <FormField label="Discipline">
              <PillSelect
                options={DISCIPLINES}
                labels={DISCIPLINE_LABELS}
                value={form.discipline}
                onChange={(v) => setForm((f) => ({ ...f, discipline: v }))}
              />
            </FormField>

            {showStatusPill && (
              <FormField label="Status">
                <PillSelect
                  options={STATUSES}
                  labels={STATUS_LABELS}
                  value={form.status}
                  onChange={(v) => setForm((f) => ({ ...f, status: v }))}
                />
              </FormField>
            )}

            <FormField label="Course type (optional)">
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
            </FormField>

            <FormField label="Surface (optional)">
              <PillSelect
                options={SURFACES}
                labels={SURFACE_LABELS}
                value={form.surface}
                onChange={(v) =>
                  setForm((f) => ({ ...f, surface: f.surface === v ? "" : v }))
                }
                allowClear
              />
            </FormField>

            {form.discipline === "trail" && (
              <FormField label="ITRA category (optional)">
                <PillSelect
                  options={ITRA_CATEGORIES}
                  labels={ITRA_CATEGORY_LABELS}
                  value={form.itraCategory}
                  onChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      itraCategory: f.itraCategory === v ? "" : v,
                    }))
                  }
                  allowClear
                />
              </FormField>
            )}

            <FormField label="Elevation (optional)">
              <View className="flex-row items-center gap-3">
                <TextInput
                  className="h-12 flex-1 rounded-xl border px-4 font-coach-medium text-[15px]"
                  style={inputStyle}
                  placeholder="Gain"
                  placeholderTextColor={LIGHT_THEME.wMute}
                  keyboardType="number-pad"
                  value={form.elevationGainM}
                  onChangeText={(v) =>
                    setForm((f) => ({
                      ...f,
                      elevationGainM: v.replace(/[^0-9]/g, ""),
                    }))
                  }
                  selectionColor={COLORS.lime}
                  cursorColor={COLORS.lime}
                />
                <TextInput
                  className="h-12 flex-1 rounded-xl border px-4 font-coach-medium text-[15px]"
                  style={inputStyle}
                  placeholder="Loss"
                  placeholderTextColor={LIGHT_THEME.wMute}
                  keyboardType="number-pad"
                  value={form.elevationLossM}
                  onChangeText={(v) =>
                    setForm((f) => ({
                      ...f,
                      elevationLossM: v.replace(/[^0-9]/g, ""),
                    }))
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
            </FormField>

          </FormSection>

          {showResultSection && (
            <FormSection title="Result">
              <FormField label="Finish time (HH:MM:SS)">
                <View className="flex-row gap-2">
                  <DatePart
                    placeholder="HH"
                    value={form.finishHours}
                    maxLength={2}
                    onChange={(v) => setForm((f) => ({ ...f, finishHours: v }))}
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
              </FormField>

              <FormField label="Placement (optional)">
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
              </FormField>

              <FormField label="Result notes (optional)">
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
              </FormField>
            </FormSection>
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

function PromptCard({
  title,
  description,
  primary,
  secondary,
}: {
  title: string;
  description: string;
  primary: { label: string; onPress: () => void };
  secondary: { label: string; onPress: () => void };
}) {
  return (
    <View
      className="gap-3 rounded-2xl border p-4"
      style={{
        backgroundColor: LIGHT_THEME.w1,
        borderColor: LIGHT_THEME.wBrd,
      }}
    >
      <View className="gap-1">
        <Text
          className="font-coach-bold text-[14px]"
          style={{ color: LIGHT_THEME.wText }}
        >
          {title}
        </Text>
        <Text
          className="font-coach text-[12px]"
          style={{ color: LIGHT_THEME.wMute }}
        >
          {description}
        </Text>
      </View>
      <View className="gap-2">
        <Pressable
          onPress={primary.onPress}
          className="items-center rounded-xl py-3 active:opacity-90"
          style={{ backgroundColor: LIGHT_THEME.wText }}
        >
          <Text
            className="font-coach-bold text-[13px]"
            style={{ color: "#FFFFFF" }}
          >
            {primary.label}
          </Text>
        </Pressable>
        <Pressable
          onPress={secondary.onPress}
          className="items-center rounded-xl border py-3 active:opacity-80"
          style={{
            backgroundColor: LIGHT_THEME.w1,
            borderColor: LIGHT_THEME.wBrd,
          }}
        >
          <Text
            className="font-coach-semibold text-[13px]"
            style={{ color: LIGHT_THEME.wText }}
          >
            {secondary.label}
          </Text>
        </Pressable>
      </View>
    </View>
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
            className="rounded-full border px-[18px] py-2.5 active:opacity-80"
            style={{
              backgroundColor: selected ? LIGHT_THEME.wText : LIGHT_THEME.w1,
              borderColor: selected ? LIGHT_THEME.wText : LIGHT_THEME.wBrd,
            }}
          >
            <Text
              className="font-coach-semibold text-[14px]"
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

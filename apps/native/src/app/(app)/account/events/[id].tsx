import { ConfirmationSheet } from "@/components/shared/confirmation-sheet";
import { Text } from "@/components/ui/text";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import { api } from "@packages/backend/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
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

const PRIORITIES = ["A", "B", "C"] as const;
type Priority = (typeof PRIORITIES)[number];

const PRIORITY_DESCRIPTIONS: Record<Priority, string> = {
  A: "Primary goal",
  B: "Secondary",
  C: "Training",
};

type FormState = {
  name: string;
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  priority: Priority;
  distanceKm: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  dobDay: "",
  dobMonth: "",
  dobYear: "",
  priority: "B",
  distanceKm: "",
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

function eventToForm(event: {
  name: string;
  date: string;
  priority: string;
  distanceMeters?: number;
}): FormState {
  const [y, m, d] = event.date.split("-");
  return {
    name: event.name,
    dobDay: d ?? "",
    dobMonth: m ?? "",
    dobYear: y ?? "",
    priority: (event.priority as Priority) ?? "B",
    distanceKm:
      event.distanceMeters != null
        ? String(Math.round((event.distanceMeters / 1000) * 10) / 10)
        : "",
  };
}

export default function EventFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === "new";

  const event = useQuery(
    api.plan.events.getMyEvent,
    isNew ? "skip" : { eventId: id },
  );
  const createEvent = useMutation(api.plan.events.createMyEvent);
  const updateEvent = useMutation(api.plan.events.updateMyEvent);
  const deleteEvent = useMutation(api.plan.events.deleteMyEvent);

  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [hydrated, setHydrated] = React.useState(isNew);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const deleteSheetRef = React.useRef<BottomSheetModal>(null);

  React.useEffect(() => {
    if (isNew || hydrated) return;
    if (event === undefined) return;
    if (event === null) {
      setError("Event not found");
      return;
    }
    setForm(eventToForm(event));
    setHydrated(true);
  }, [event, hydrated, isNew]);

  const canSave =
    form.name.trim().length > 0 &&
    isValidDate(form.dobDay, form.dobMonth, form.dobYear);

  const handleSave = async () => {
    setError(null);
    Keyboard.dismiss();
    if (!canSave) {
      setError("Name and a valid date are required");
      return;
    }

    const date = `${form.dobYear.padStart(4, "0")}-${form.dobMonth.padStart(2, "0")}-${form.dobDay.padStart(2, "0")}`;
    const distanceTrimmed = form.distanceKm.trim();
    let distanceMeters: number | undefined;
    if (distanceTrimmed.length > 0) {
      const km = Number.parseFloat(distanceTrimmed);
      if (!Number.isFinite(km) || km <= 0 || km > 1000) {
        setError("Invalid distance");
        return;
      }
      distanceMeters = Math.round(km * 1000);
    }

    setIsLoading(true);
    try {
      if (isNew) {
        await createEvent({
          name: form.name.trim(),
          date,
          priority: form.priority,
          distanceMeters,
        });
      } else {
        await updateEvent({
          eventId: id,
          name: form.name.trim(),
          date,
          priority: form.priority,
          distanceMeters,
        });
      }
      router.back();
    } catch (err) {
      setError(getConvexErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (isNew) return;
    setIsDeleting(true);
    try {
      await deleteEvent({ eventId: id });
      deleteSheetRef.current?.dismiss();
      router.back();
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
          {isNew ? "New event" : "Edit event"}
        </Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6"
      >
        <View className="w-full max-w-md gap-6 self-center">
          <Field label="Name">
            <TextInput
              className="h-12 rounded-xl border px-4 font-coach-medium text-[15px]"
              style={{
                backgroundColor: LIGHT_THEME.w1,
                borderColor: LIGHT_THEME.wBrd,
                color: LIGHT_THEME.wText,
              }}
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
                value={form.dobDay}
                maxLength={2}
                onChange={(v) => setForm((f) => ({ ...f, dobDay: v }))}
                widthClassName="w-[72px]"
              />
              <DatePart
                placeholder="MM"
                value={form.dobMonth}
                maxLength={2}
                onChange={(v) => setForm((f) => ({ ...f, dobMonth: v }))}
                widthClassName="w-[72px]"
              />
              <DatePart
                placeholder="YYYY"
                value={form.dobYear}
                maxLength={4}
                onChange={(v) => setForm((f) => ({ ...f, dobYear: v }))}
                widthClassName="flex-1"
              />
            </View>
          </Field>

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
                      backgroundColor: selected ? COLORS.lime : LIGHT_THEME.w1,
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

          <Field label="Distance (optional)">
            <View className="flex-row items-center gap-3">
              <TextInput
                className="h-12 flex-1 rounded-xl border px-4 font-coach-medium text-[15px]"
                style={{
                  backgroundColor: LIGHT_THEME.w1,
                  borderColor: LIGHT_THEME.wBrd,
                  color: LIGHT_THEME.wText,
                }}
                placeholder="—"
                placeholderTextColor={LIGHT_THEME.wMute}
                keyboardType="decimal-pad"
                value={form.distanceKm}
                onChangeText={(v) => setForm((f) => ({ ...f, distanceKm: v }))}
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

          {!isNew && (
            <Pressable
              className="items-center py-2 active:opacity-70"
              onPress={() => deleteSheetRef.current?.present()}
            >
              <Text
                className="font-coach text-[13px]"
                style={{ color: COLORS.red }}
              >
                Delete event
              </Text>
            </Pressable>
          )}
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
              {isNew ? "Create event" : "Save"}
            </Text>
          )}
        </Pressable>
      </View>

      <ConfirmationSheet
        sheetRef={deleteSheetRef}
        icon="trash-outline"
        title="Delete event"
        description="This cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
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
        backgroundColor: LIGHT_THEME.w1,
        borderColor: LIGHT_THEME.wBrd,
        color: LIGHT_THEME.wText,
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

import { NameField } from "@/components/app/account/name-field";
import { ProfilePictureField } from "@/components/app/account/profile-picture-field";
import { Text } from "@/components/ui/text";
import { useUploadImage } from "@/hooks/use-upload-image";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import { UserProfileSchema } from "@/validation/account";
import {
  AthleteProfileSchema,
  SEX_VALUES,
  type Sex,
} from "@/validation/athlete";
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
import z from "zod";

type FormState = {
  name: string;
  image: string | null;
  sex: Sex | null;
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  heightCm: string;
  weightKg: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  image: null,
  sex: null,
  dobDay: "",
  dobMonth: "",
  dobYear: "",
  heightCm: "",
  weightKg: "",
};

const SEX_LABELS: Record<Sex, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
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
  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function buildInitialForm(
  user: { name?: string; image?: string } | null | undefined,
  athlete:
    | {
        sex?: Sex;
        dateOfBirth?: string;
        weightKg?: number;
        heightCm?: number;
      }
    | null
    | undefined,
): FormState {
  const [y, m, d] = (athlete?.dateOfBirth ?? "").split("-");
  return {
    name: user?.name ?? "",
    image: user?.image ?? null,
    sex: athlete?.sex ?? null,
    dobDay: d ?? "",
    dobMonth: m ?? "",
    dobYear: y ?? "",
    heightCm: athlete?.heightCm != null ? String(athlete.heightCm) : "",
    weightKg: athlete?.weightKg != null ? String(athlete.weightKg) : "",
  };
}

function isIdentityEqual(a: FormState, b: FormState): boolean {
  return a.name.trim() === b.name.trim() && a.image === b.image;
}

function isAthleteEqual(a: FormState, b: FormState): boolean {
  return (
    a.sex === b.sex &&
    a.dobDay === b.dobDay &&
    a.dobMonth === b.dobMonth &&
    a.dobYear === b.dobYear &&
    a.heightCm === b.heightCm &&
    a.weightKg === b.weightKg
  );
}

export default function EditProfileScreen() {
  const router = useRouter();
  const user = useQuery(api.table.users.currentUser);
  const athlete = useQuery(api.plan.reads.getAthlete);
  const patchUser = useMutation(api.table.users.patch);
  const upsertAthlete = useMutation(api.plan.athlete.upsertAthlete);
  const { uploadImage, isUploading } = useUploadImage();

  const [initial, setInitial] = React.useState<FormState>(EMPTY_FORM);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [hydrated, setHydrated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<{
    name?: string;
    image?: string;
  }>({});

  React.useEffect(() => {
    if (user === undefined || athlete === undefined || hydrated) return;
    const next = buildInitialForm(user, athlete);
    setInitial(next);
    setForm(next);
    setHydrated(true);
  }, [user, athlete, hydrated]);

  const identityChanged = !isIdentityEqual(form, initial);
  const athleteChanged = !isAthleteEqual(form, initial);
  const hasChanges = identityChanged || athleteChanged;
  const isBusy = isLoading || isUploading;

  const handleSave = async () => {
    setError(null);
    setFieldErrors({});
    Keyboard.dismiss();

    if (!user?._id) {
      setError("You must be logged in to update your profile");
      return;
    }

    const dobProvided =
      form.dobDay.length > 0 ||
      form.dobMonth.length > 0 ||
      form.dobYear.length > 0;
    if (dobProvided && !isValidDate(form.dobDay, form.dobMonth, form.dobYear)) {
      setError("Invalid date of birth");
      return;
    }

    const parseNumber = (raw: string) => {
      if (raw.trim().length === 0) return undefined;
      const n = Number.parseFloat(raw);
      return Number.isFinite(n) ? n : Number.NaN;
    };

    const userCandidate = {
      name: form.name.trim(),
      image: form.image ?? undefined,
    };
    const userParsed = UserProfileSchema.safeParse(userCandidate);
    if (!userParsed.success) {
      const tree = z.treeifyError(userParsed.error);
      setFieldErrors({
        name: tree.properties?.name?.errors?.[0],
        image: tree.properties?.image?.errors?.[0],
      });
      setError(tree.errors?.[0] ?? null);
      return;
    }

    const athleteCandidate = {
      sex: form.sex ?? undefined,
      dateOfBirth: dobProvided
        ? `${form.dobYear.padStart(4, "0")}-${form.dobMonth.padStart(2, "0")}-${form.dobDay.padStart(2, "0")}`
        : undefined,
      heightCm: parseNumber(form.heightCm),
      weightKg: parseNumber(form.weightKg),
    };
    const athleteParsed = AthleteProfileSchema.safeParse(athleteCandidate);
    if (!athleteParsed.success) {
      const tree = z.treeifyError(athleteParsed.error);
      setError(tree.errors?.[0] ?? "Invalid values");
      return;
    }

    setIsLoading(true);
    try {
      if (identityChanged) {
        let imageUrl = form.image;
        if (imageUrl && !imageUrl.startsWith("http")) {
          imageUrl = await uploadImage(imageUrl);
        }
        await patchUser({
          id: user._id,
          data: {
            name: userParsed.data.name,
            image: imageUrl ?? undefined,
          },
        });
      }
      if (athleteChanged) {
        await upsertAthlete(athleteParsed.data);
      }
      router.back();
    } catch (err) {
      setError(getConvexErrorMessage(err));
    } finally {
      setIsLoading(false);
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
          Profile
        </Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6"
      >
        <View className="w-full max-w-md gap-8 self-center">
          <View className="gap-6">
            <ProfilePictureField
              image={form.image}
              name={form.name}
              onImageChange={(uri) =>
                setForm((prev) => ({ ...prev, image: uri }))
              }
              onImageRemove={() =>
                setForm((prev) => ({ ...prev, image: null }))
              }
              error={fieldErrors.image}
            />

            <NameField
              value={form.name}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, name: value }))
              }
              error={fieldErrors.name}
            />
          </View>

          <View className="gap-1">
            <Text
              className="px-1 font-coach-bold text-[11px] uppercase tracking-wider"
              style={{ color: LIGHT_THEME.wSub }}
            >
              Athlete
            </Text>
            <Text
              className="px-1 font-coach text-[12px]"
              style={{ color: LIGHT_THEME.wMute }}
            >
              Used to personalize training zones and AI coaching.
            </Text>
          </View>

          <View className="gap-6">
            <Field label="Sex">
              <View className="flex-row gap-2">
                {SEX_VALUES.map((value) => {
                  const selected = form.sex === value;
                  return (
                    <Pressable
                      key={value}
                      onPress={() => {
                        selectionFeedback();
                        setForm((f) => ({ ...f, sex: value }));
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
                        className="font-coach-medium text-[15px]"
                        style={{
                          color: selected ? COLORS.black : LIGHT_THEME.wSub,
                        }}
                      >
                        {SEX_LABELS[value]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Field>

            <Field label="Date of birth">
              <View className="flex-row gap-2">
                <DobInput
                  placeholder="DD"
                  value={form.dobDay}
                  maxLength={2}
                  onChange={(v) => setForm((f) => ({ ...f, dobDay: v }))}
                  widthClassName="w-[72px]"
                />
                <DobInput
                  placeholder="MM"
                  value={form.dobMonth}
                  maxLength={2}
                  onChange={(v) => setForm((f) => ({ ...f, dobMonth: v }))}
                  widthClassName="w-[72px]"
                />
                <DobInput
                  placeholder="YYYY"
                  value={form.dobYear}
                  maxLength={4}
                  onChange={(v) => setForm((f) => ({ ...f, dobYear: v }))}
                  widthClassName="flex-1"
                />
              </View>
            </Field>

            <Field label="Height">
              <MeasureInput
                placeholder="—"
                value={form.heightCm}
                onChange={(v) => setForm((f) => ({ ...f, heightCm: v }))}
                unit="cm"
                keyboardType="number-pad"
              />
            </Field>

            <Field label="Weight">
              <MeasureInput
                placeholder="—"
                value={form.weightKg}
                onChange={(v) => setForm((f) => ({ ...f, weightKg: v }))}
                unit="kg"
                keyboardType="decimal-pad"
              />
            </Field>

          </View>
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
          disabled={isBusy || !hasChanges}
          className="items-center rounded-2xl py-3.5 active:opacity-90"
          style={{
            backgroundColor:
              isBusy || !hasChanges ? LIGHT_THEME.w3 : LIGHT_THEME.wText,
          }}
        >
          {isBusy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              className="font-coach-bold text-sm"
              style={{
                color: isBusy || !hasChanges ? LIGHT_THEME.wMute : "#FFFFFF",
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

function DobInput({
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

function MeasureInput({
  placeholder,
  value,
  onChange,
  unit,
  keyboardType,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  unit: string;
  keyboardType: "number-pad" | "decimal-pad";
}) {
  return (
    <View className="flex-row items-center gap-3">
      <TextInput
        className="h-12 flex-1 rounded-xl border px-4 font-coach-medium text-[15px]"
        style={{
          backgroundColor: LIGHT_THEME.w1,
          borderColor: LIGHT_THEME.wBrd,
          color: LIGHT_THEME.wText,
        }}
        placeholder={placeholder}
        placeholderTextColor={LIGHT_THEME.wMute}
        keyboardType={keyboardType}
        value={value}
        onChangeText={onChange}
        selectionColor={COLORS.lime}
        cursorColor={COLORS.lime}
      />
      <Text
        className="font-coach-medium text-[13px]"
        style={{ color: LIGHT_THEME.wMute, width: 36 }}
      >
        {unit}
      </Text>
    </View>
  );
}


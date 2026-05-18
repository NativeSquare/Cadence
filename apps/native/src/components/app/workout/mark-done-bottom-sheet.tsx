import { BottomSheetModal } from "@/components/custom/bottom-sheet";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import { nowIso } from "@/components/app/workout/workout-form-helpers";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { api } from "@packages/backend/convex/_generated/api";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BottomSheetModal as GorhomBottomSheetModal,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { useMutation } from "convex/react";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  View,
} from "react-native";
import { z } from "zod";

const formSchema = z.object({
  rpe: z.number().int().min(1).max(10).optional(),
  notes: z.string().optional(),
  testDistanceKm: z.number().positive().optional(),
  testDurationMinutes: z.number().int().min(0).optional(),
  testDurationSeconds: z.number().int().min(0).max(59).optional(),
});

type FormValues = z.infer<typeof formSchema>;

type TierKey = "easy" | "moderate" | "hard" | "max";

const RPE_TIERS: { key: TierKey; min: number; max: number; color: string }[] = [
  { key: "easy", min: 1, max: 3, color: COLORS.grn },
  { key: "moderate", min: 4, max: 6, color: COLORS.ylw },
  { key: "hard", min: 7, max: 8, color: COLORS.red },
  { key: "max", min: 9, max: 10, color: COLORS.red },
];

function tierFor(value: number | undefined): (typeof RPE_TIERS)[number] | null {
  if (value == null) return null;
  return RPE_TIERS.find((t) => value >= t.min && value <= t.max) ?? null;
}

export interface MarkDoneBottomSheetProps {
  sheetRef: React.RefObject<GorhomBottomSheetModal | null>;
  workoutId: string;
  workoutName: string;
  isTest?: boolean;
  /**
   * Date to record on the completed face. Most users mark a workout done
   * after the fact, so we default the actual date to its planned date
   * rather than "right now" — that matches reality the vast majority of
   * the time. Falls back to `nowIso()` if the workout has no planned face.
   */
  plannedDate?: string;
}

const DEFAULTS: FormValues = {
  rpe: undefined,
  notes: "",
  testDistanceKm: undefined,
  testDurationMinutes: undefined,
  testDurationSeconds: undefined,
};

export function MarkDoneBottomSheet({
  sheetRef,
  workoutId,
  workoutName,
  isTest,
  plannedDate,
}: MarkDoneBottomSheetProps) {
  const { t } = useTranslation();
  const updateWorkout = useMutation(api.agoge.workouts.updateWorkout);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    defaultValues: DEFAULTS,
  });

  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const isSubmitting = form.formState.isSubmitting;

  const handleSubmit = form.handleSubmit(async (data) => {
    setSubmitError(null);
    Keyboard.dismiss();

    if (isTest) {
      const km = data.testDistanceKm;
      if (km == null || !(km > 0)) {
        setSubmitError(t("workout.markDone.errorDistanceRequired"));
        return;
      }
      const minutes = data.testDurationMinutes ?? 0;
      const seconds = data.testDurationSeconds ?? 0;
      const totalSeconds = minutes * 60 + seconds;
      if (totalSeconds <= 0) {
        setSubmitError(t("workout.markDone.errorTimeRequired"));
        return;
      }

      try {
        const trimmedNotes = data.notes?.trim();
        const actual = {
          date: plannedDate ?? nowIso(),
          distanceMeters: Math.round(km * 1000),
          durationSeconds: totalSeconds,
          ...(data.rpe != null ? { rpe: data.rpe } : {}),
          ...(trimmedNotes ? { notes: trimmedNotes } : {}),
        };
        await updateWorkout({ workoutId, status: "completed", actual });
        sheetRef.current?.dismiss();
        form.reset(DEFAULTS);
      } catch (err) {
        setSubmitError(getConvexErrorMessage(err));
      }
      return;
    }

    try {
      const trimmedNotes = data.notes?.trim();
      const actual = {
        date: plannedDate ?? nowIso(),
        ...(data.rpe != null ? { rpe: data.rpe } : {}),
        ...(trimmedNotes ? { notes: trimmedNotes } : {}),
      };
      await updateWorkout({ workoutId, status: "completed", actual });
      sheetRef.current?.dismiss();
      form.reset(DEFAULTS);
    } catch (err) {
      setSubmitError(getConvexErrorMessage(err));
    }
  });

  const handleDismiss = React.useCallback(() => {
    form.reset(DEFAULTS);
    setSubmitError(null);
  }, [form]);

  return (
    <BottomSheetModal ref={sheetRef} onDismiss={handleDismiss}>
      <View className="gap-7 px-5 pb-4 pt-2">
        <Text
          className="font-coach-bold text-lg"
          style={{ color: LIGHT_THEME.wText }}
          numberOfLines={1}
        >
          {workoutName}
        </Text>

        {isTest && (
          <View className="gap-4">
            <Text
              className="font-coach-bold text-base"
              style={{ color: LIGHT_THEME.wText }}
            >
              {t("workout.markDone.testHeader")}
            </Text>
            <Controller
              control={form.control}
              name="testDistanceKm"
              render={({ field }) => (
                <DistanceField
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Controller
                  control={form.control}
                  name="testDurationMinutes"
                  render={({ field }) => (
                    <TimePartField
                      label={t("workout.markDone.testTimeLabel")}
                      suffix={t("workout.markDone.testTimeMinutes")}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </View>
              <View className="flex-1">
                <Controller
                  control={form.control}
                  name="testDurationSeconds"
                  render={({ field }) => (
                    <TimePartField
                      label=" "
                      suffix={t("workout.markDone.testTimeSeconds")}
                      value={field.value}
                      onChange={field.onChange}
                      maxLength={2}
                    />
                  )}
                />
              </View>
            </View>
          </View>
        )}

        <Controller
          control={form.control}
          name="rpe"
          render={({ field }) => (
            <RpeField value={field.value} onChange={field.onChange} />
          )}
        />

        <Controller
          control={form.control}
          name="notes"
          render={({ field }) => (
            <NotesField value={field.value ?? ""} onChange={field.onChange} />
          )}
        />

        {submitError && (
          <Text
            className="text-center font-coach text-sm"
            style={{ color: COLORS.red }}
          >
            {submitError}
          </Text>
        )}

        <Pressable
          onPress={() => handleSubmit()}
          disabled={isSubmitting}
          className="items-center rounded-2xl py-3.5 active:opacity-90"
          style={{
            backgroundColor: isSubmitting ? LIGHT_THEME.w3 : LIGHT_THEME.wText,
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              className="font-coach-bold text-sm"
              style={{ color: "#FFFFFF" }}
            >
              {t("workout.markDone.submit")}
            </Text>
          )}
        </Pressable>
      </View>
    </BottomSheetModal>
  );
}

function RpeField({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  const { t } = useTranslation();
  const tier = tierFor(value);

  return (
    <View className="gap-3">
      <Text
        className="font-coach-bold text-base"
        style={{ color: LIGHT_THEME.wText }}
      >
        {t("workout.markDone.howDidItFeel")}
      </Text>

      <View className="flex-row gap-1.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const selected = value === n;
          return (
            <Pressable
              key={n}
              onPress={() => {
                selectionFeedback();
                onChange(selected ? undefined : n);
              }}
              className="flex-1 items-center justify-center rounded-xl active:opacity-80"
              style={{
                paddingVertical: 12,
                backgroundColor: selected ? LIGHT_THEME.wText : LIGHT_THEME.w2,
                borderWidth: 1,
                borderColor: selected ? LIGHT_THEME.wText : LIGHT_THEME.wBrd,
              }}
              accessibilityLabel={t("workout.markDone.rpeValueLabel", {
                value: n,
              })}
              accessibilityState={{ selected }}
            >
              <Text
                className="font-coach-bold text-[15px]"
                style={{ color: selected ? "#FFFFFF" : LIGHT_THEME.wText }}
              >
                {n}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="min-h-[20px] items-center">
        {tier ? (
          <View className="flex-row items-center gap-2">
            <View
              className="size-2 rounded-full"
              style={{ backgroundColor: tier.color }}
            />
            <Text
              className="font-coach-bold text-[12px] uppercase tracking-widest"
              style={{ color: tier.color }}
            >
              {t(`workout.markDone.tiers.${tier.key}`)}
            </Text>
          </View>
        ) : (
          <Text
            className="font-coach text-[12px]"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {t("workout.markDone.tapToRate")}
          </Text>
        )}
      </View>
    </View>
  );
}

function DistanceField({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  const { t } = useTranslation();
  const [text, setText] = React.useState<string>(
    value == null ? "" : String(value),
  );
  React.useEffect(() => {
    setText(value == null ? "" : String(value));
  }, [value]);

  return (
    <View className="gap-2">
      <Text
        className="font-coach-bold text-sm"
        style={{ color: LIGHT_THEME.wText }}
      >
        {t("workout.markDone.testDistanceLabel")}
      </Text>
      <View
        className="flex-row items-center"
        style={{
          paddingHorizontal: 14,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: LIGHT_THEME.wBrd,
          backgroundColor: LIGHT_THEME.w2,
        }}
      >
        <BottomSheetTextInput
          value={text}
          onChangeText={(raw) => {
            const normalized = raw.replace(",", ".");
            setText(normalized);
            const parsed = Number.parseFloat(normalized);
            onChange(Number.isFinite(parsed) ? parsed : undefined);
          }}
          keyboardType="decimal-pad"
          inputMode="decimal"
          placeholder="5.0"
          placeholderTextColor={LIGHT_THEME.wMute}
          className="flex-1 font-coach text-[15px]"
          style={{ paddingVertical: 12, color: LIGHT_THEME.wText }}
        />
        <Text
          className="font-coach text-sm"
          style={{ color: LIGHT_THEME.wMute }}
        >
          {t("workout.markDone.testDistanceUnit")}
        </Text>
      </View>
    </View>
  );
}

function TimePartField({
  label,
  suffix,
  value,
  onChange,
  maxLength,
}: {
  label: string;
  suffix: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  maxLength?: number;
}) {
  const [text, setText] = React.useState<string>(
    value == null ? "" : String(value),
  );
  React.useEffect(() => {
    setText(value == null ? "" : String(value));
  }, [value]);

  return (
    <View className="gap-2">
      <Text
        className="font-coach-bold text-sm"
        style={{ color: LIGHT_THEME.wText }}
      >
        {label}
      </Text>
      <View
        className="flex-row items-center"
        style={{
          paddingHorizontal: 14,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: LIGHT_THEME.wBrd,
          backgroundColor: LIGHT_THEME.w2,
        }}
      >
        <BottomSheetTextInput
          value={text}
          onChangeText={(raw) => {
            const digits = raw.replace(/\D/g, "");
            setText(digits);
            const parsed = Number.parseInt(digits, 10);
            onChange(Number.isFinite(parsed) ? parsed : undefined);
          }}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={maxLength}
          placeholder="0"
          placeholderTextColor={LIGHT_THEME.wMute}
          className="flex-1 font-coach text-[15px]"
          style={{ paddingVertical: 12, color: LIGHT_THEME.wText }}
        />
        <Text
          className="font-coach text-sm"
          style={{ color: LIGHT_THEME.wMute }}
        >
          {suffix}
        </Text>
      </View>
    </View>
  );
}

function NotesField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <View className="gap-3">
      <Text
        className="font-coach-bold text-base"
        style={{ color: LIGHT_THEME.wText }}
      >
        {t("workout.markDone.notesQuestion")}
      </Text>
      <BottomSheetTextInput
        value={value}
        onChangeText={onChange}
        placeholder={t("workout.markDone.notesPlaceholder")}
        placeholderTextColor={LIGHT_THEME.wMute}
        multiline
        textAlignVertical="top"
        className="font-coach text-[14px]"
        style={{
          minHeight: 96,
          padding: 14,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: LIGHT_THEME.wBrd,
          backgroundColor: LIGHT_THEME.w2,
          color: LIGHT_THEME.wText,
        }}
      />
    </View>
  );
}

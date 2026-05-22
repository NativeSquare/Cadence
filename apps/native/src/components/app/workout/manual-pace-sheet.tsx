import { BottomSheetModal } from "@/components/custom/bottom-sheet";
import {
  EMPTY_RECENT_RACE,
  isRecentRaceValid,
  recentRaceToDistanceMeters,
  recentRaceToSeconds,
  type RecentRaceValue,
  type SeedRaceFormat,
} from "@/components/app/onboarding/StepRecentRace";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { api } from "@packages/backend/convex/_generated/api";
import {
  BottomSheetModal as GorhomBottomSheetModal,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { useMutation } from "convex/react";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  View,
} from "react-native";

const FORMATS: readonly SeedRaceFormat[] = [
  "5k",
  "10k",
  "15k",
  "half_marathon",
  "marathon",
];

export interface ManualPaceSheetProps {
  sheetRef: React.RefObject<GorhomBottomSheetModal | null>;
  onSuccess?: () => void;
}

export function ManualPaceSheet({ sheetRef, onSuccess }: ManualPaceSheetProps) {
  const { t } = useTranslation();
  const setVdotFromRaceResult = useMutation(
    api.engine.baselineTest.setVdotFromRaceResult,
  );

  const [race, setRace] = React.useState<RecentRaceValue>(EMPTY_RECENT_RACE);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const reset = React.useCallback(() => {
    setRace(EMPTY_RECENT_RACE);
    setSubmitError(null);
    setIsSubmitting(false);
  }, []);

  const handleSubmit = async () => {
    setSubmitError(null);
    Keyboard.dismiss();
    if (!isRecentRaceValid(race)) {
      setSubmitError(t("workout.baseline.errorRaceResultRequired"));
      return;
    }
    setIsSubmitting(true);
    try {
      await setVdotFromRaceResult({
        distanceMeters: recentRaceToDistanceMeters(race),
        timeSeconds: recentRaceToSeconds(race),
      });
      sheetRef.current?.dismiss();
      reset();
      onSuccess?.();
    } catch (err) {
      setSubmitError(getConvexErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatLabels: Record<SeedRaceFormat, string> = {
    "5k": t("account.races.form.formats.5k"),
    "10k": t("account.races.form.formats.10k"),
    "15k": t("account.races.form.formats.15k"),
    half_marathon: t("account.races.form.formats.half_marathon"),
    marathon: t("account.races.form.formats.marathon"),
  };

  return (
    <BottomSheetModal ref={sheetRef} onDismiss={reset}>
      <View className="gap-6 px-5 pb-4 pt-2">
        <View className="gap-2">
          <Text
            className="font-coach-bold text-lg"
            style={{ color: LIGHT_THEME.wText }}
          >
            {t("workout.baseline.sheetTitle")}
          </Text>
          <Text
            className="font-coach text-sm"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {t("workout.baseline.sheetDescription")}
          </Text>
        </View>

        <View className="gap-2">
          <Text
            className="font-coach-bold text-sm"
            style={{ color: LIGHT_THEME.wText }}
          >
            {t("workout.baseline.distanceLabel")}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
          >
            {FORMATS.map((f) => {
              const selected = race.format === f;
              return (
                <Pressable
                  key={f}
                  onPress={() => setRace((r) => ({ ...r, format: f }))}
                  className="rounded-full border px-4 py-2.5 active:opacity-80"
                  style={{
                    backgroundColor: selected
                      ? LIGHT_THEME.wText
                      : LIGHT_THEME.w1,
                    borderColor: selected
                      ? LIGHT_THEME.wText
                      : LIGHT_THEME.wBrd,
                  }}
                >
                  <Text
                    className="font-coach-semibold text-[13px]"
                    style={{ color: selected ? "#FFFFFF" : LIGHT_THEME.wText }}
                  >
                    {formatLabels[f]}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View className="gap-2">
          <Text
            className="font-coach-bold text-sm"
            style={{ color: LIGHT_THEME.wText }}
          >
            {t("workout.baseline.timeLabel")}
          </Text>
          <View className="flex-row items-center gap-2">
            <TimePart
              value={race.hours}
              placeholder="0"
              suffix={t("workout.baseline.timeHours")}
              onChangeText={(raw) =>
                setRace((r) => ({ ...r, hours: raw.replace(/\D/g, "") }))
              }
            />
            <TimePart
              value={race.minutes}
              placeholder="00"
              suffix={t("workout.baseline.timeMinutes")}
              onChangeText={(raw) =>
                setRace((r) => ({ ...r, minutes: raw.replace(/\D/g, "") }))
              }
            />
            <TimePart
              value={race.seconds}
              placeholder="00"
              suffix={t("workout.baseline.timeSeconds")}
              onChangeText={(raw) =>
                setRace((r) => ({ ...r, seconds: raw.replace(/\D/g, "") }))
              }
            />
          </View>
        </View>

        {submitError && (
          <Text
            className="text-center font-coach text-sm"
            style={{ color: COLORS.red }}
          >
            {submitError}
          </Text>
        )}

        <Pressable
          onPress={handleSubmit}
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
              {t("workout.baseline.submit")}
            </Text>
          )}
        </Pressable>
      </View>
    </BottomSheetModal>
  );
}

function TimePart({
  value,
  placeholder,
  suffix,
  onChangeText,
}: {
  value: string;
  placeholder: string;
  suffix: string;
  onChangeText: (raw: string) => void;
}) {
  return (
    <View className="flex-1">
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
          value={value}
          onChangeText={onChangeText}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={2}
          placeholder={placeholder}
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

import { BottomSheetModal } from "@/components/custom/bottom-sheet";
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
  View,
} from "react-native";

export interface ManualPaceSheetProps {
  sheetRef: React.RefObject<GorhomBottomSheetModal | null>;
  onSuccess?: () => void;
}

export function ManualPaceSheet({ sheetRef, onSuccess }: ManualPaceSheetProps) {
  const { t } = useTranslation();
  const setPace = useMutation(api.agoge.baselineTest.setManualPaceZone);

  const [minutes, setMinutes] = React.useState<string>("");
  const [seconds, setSeconds] = React.useState<string>("");
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const reset = React.useCallback(() => {
    setMinutes("");
    setSeconds("");
    setSubmitError(null);
    setIsSubmitting(false);
  }, []);

  const handleSubmit = async () => {
    setSubmitError(null);
    Keyboard.dismiss();
    const m = Number.parseInt(minutes, 10);
    const s = Number.parseInt(seconds, 10);
    const mm = Number.isFinite(m) ? m : 0;
    const ss = Number.isFinite(s) ? s : 0;
    const totalSeconds = mm * 60 + ss;
    if (totalSeconds <= 0) {
      setSubmitError(t("workout.baseline.errorPaceRequired"));
      return;
    }
    // Sanity bounds: 2:00/km to 12:00/km
    if (totalSeconds < 120 || totalSeconds > 720) {
      setSubmitError(t("workout.baseline.errorPaceUnrealistic"));
      return;
    }
    const thresholdMps = 1000 / totalSeconds;
    setIsSubmitting(true);
    try {
      await setPace({ thresholdMps });
      sheetRef.current?.dismiss();
      reset();
      onSuccess?.();
    } catch (err) {
      setSubmitError(getConvexErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
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
            {t("workout.baseline.paceLabel")}
          </Text>
          <View className="flex-row items-center gap-3">
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
                  value={minutes}
                  onChangeText={(raw) => setMinutes(raw.replace(/\D/g, ""))}
                  keyboardType="number-pad"
                  inputMode="numeric"
                  maxLength={2}
                  placeholder="4"
                  placeholderTextColor={LIGHT_THEME.wMute}
                  className="flex-1 font-coach text-[15px]"
                  style={{ paddingVertical: 12, color: LIGHT_THEME.wText }}
                />
                <Text
                  className="font-coach text-sm"
                  style={{ color: LIGHT_THEME.wMute }}
                >
                  {t("workout.baseline.paceMinutes")}
                </Text>
              </View>
            </View>
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
                  value={seconds}
                  onChangeText={(raw) => setSeconds(raw.replace(/\D/g, ""))}
                  keyboardType="number-pad"
                  inputMode="numeric"
                  maxLength={2}
                  placeholder="30"
                  placeholderTextColor={LIGHT_THEME.wMute}
                  className="flex-1 font-coach text-[15px]"
                  style={{ paddingVertical: 12, color: LIGHT_THEME.wText }}
                />
                <Text
                  className="font-coach text-sm"
                  style={{ color: LIGHT_THEME.wMute }}
                >
                  {t("workout.baseline.paceSeconds")}
                </Text>
              </View>
            </View>
          </View>
          <Text
            className="font-coach text-xs"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {t("workout.baseline.paceUnit")}
          </Text>
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

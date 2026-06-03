/**
 * SwapConfirmSheet — final confirmation for a calendar-driven swap.
 *
 * The user has already picked both sides on the calendar (the source workout in
 * the day sheet, the counterpart by tapping a highlighted day). This sheet just
 * shows the two sessions being exchanged and commits the `swapWorkouts`
 * mutation.
 */

import { WorkoutCard } from "@/components/app/workout/workout-card";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { BottomSheetModal } from "@/components/custom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";
import type { WorkoutDoc } from "@nativesquare/agoge/schema";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, View } from "react-native";

export interface SwapConfirmSheetProps {
  sheetRef: React.RefObject<GorhomBottomSheetModal | null>;
  source: WorkoutDoc;
  target: WorkoutDoc;
  onConfirmed: () => void;
  onDismiss?: () => void;
}

export function SwapConfirmSheet({
  sheetRef,
  source,
  target,
  onConfirmed,
  onDismiss,
}: SwapConfirmSheetProps) {
  const { t } = useTranslation();
  const swap = useMutation(api.agoge.workouts.swapWorkouts);

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await swap({ workoutAId: source._id, workoutBId: target._id });
      sheetRef.current?.dismiss();
      onConfirmed();
    } catch (err) {
      setError(getConvexErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      backgroundColor={LIGHT_THEME.w2}
      borderRadius={28}
      scrollable
      onDismiss={() => {
        setError(null);
        setSubmitting(false);
        onDismiss?.();
      }}
    >
      <View className="gap-5 px-5 pb-2 pt-2">
        <View className="gap-1">
          <Text
            className="font-coach-bold text-xl"
            style={{ color: LIGHT_THEME.wText }}
          >
            {t("workout.swap.confirmTitle")}
          </Text>
          <Text
            className="font-coach text-sm"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {t("workout.swap.confirmSubtitle")}
          </Text>
        </View>

        <View className="gap-2">
          <WorkoutCard workout={source} onPress={() => {}} />
          <View className="items-center">
            <Ionicons
              name="swap-vertical"
              size={20}
              color={LIGHT_THEME.wMute}
            />
          </View>
          <WorkoutCard workout={target} onPress={() => {}} />
        </View>

        {error && (
          <Text
            className="text-center font-coach text-sm"
            style={{ color: COLORS.red }}
          >
            {error}
          </Text>
        )}

        <Pressable
          onPress={handleConfirm}
          disabled={submitting}
          className="items-center rounded-2xl py-3.5 active:opacity-90"
          style={{
            backgroundColor: LIGHT_THEME.wText,
            opacity: submitting ? 0.4 : 1,
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              className="font-coach-bold text-sm"
              style={{ color: "#FFFFFF" }}
            >
              {t("workout.swap.confirm")}
            </Text>
          )}
        </Pressable>
      </View>
    </BottomSheetModal>
  );
}

export default SwapConfirmSheet;

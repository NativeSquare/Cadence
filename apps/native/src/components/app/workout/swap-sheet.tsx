/**
 * SwapSheet — exchange a planned workout with another future session from the
 * same training block. The user explicitly picks the counterpart; the backend
 * `swapWorkouts` mutation swaps the two planned dates and enforces the coaching
 * caps. Workouts outside a block can't be swapped (no `blockId`).
 */

import { localTodayYmd } from "@/components/app/workout/workout-helpers";
import { WorkoutCard } from "@/components/app/workout/workout-card";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { BottomSheetModal } from "@/components/custom/bottom-sheet";
import { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";
import type { WorkoutDoc } from "@nativesquare/agoge/schema";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, View } from "react-native";

export interface SwapSheetProps {
  sheetRef: React.RefObject<GorhomBottomSheetModal | null>;
  workoutId: string;
  blockId: string | undefined;
  onSuccess?: () => void;
}

export function SwapSheet({
  sheetRef,
  workoutId,
  blockId,
  onSuccess,
}: SwapSheetProps) {
  const { t } = useTranslation();
  const swap = useMutation(api.agoge.workouts.swapWorkouts);

  const blockWorkouts = useQuery(
    api.agoge.workouts.listWorkoutsByBlock,
    blockId ? { blockId } : "skip",
  );

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const todayYmd = localTodayYmd();
  const candidates = (blockWorkouts ?? []).filter(
    (w) =>
      w._id !== workoutId &&
      w.status === "planned" &&
      !!w.planned &&
      w.planned.date.slice(0, 10) > todayYmd,
  ) as WorkoutDoc[];

  const handleConfirm = async () => {
    if (!selectedId) return;
    setSubmitting(true);
    setError(null);
    try {
      await swap({ workoutAId: workoutId, workoutBId: selectedId });
      sheetRef.current?.dismiss();
      onSuccess?.();
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
        setSelectedId(null);
        setError(null);
      }}
    >
      <View className="gap-5 px-5 pb-2 pt-2">
        <View className="gap-1">
          <Text
            className="font-coach-bold text-xl"
            style={{ color: LIGHT_THEME.wText }}
          >
            {t("workout.swap.title")}
          </Text>
          <Text
            className="font-coach text-sm"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {t("workout.swap.subtitle")}
          </Text>
        </View>

        {blockWorkouts === undefined && blockId ? (
          <View className="items-center py-6">
            <ActivityIndicator color={LIGHT_THEME.wMute} />
          </View>
        ) : candidates.length === 0 ? (
          <Text
            className="py-6 text-center font-coach text-sm"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {t("workout.swap.empty")}
          </Text>
        ) : (
          <View className="gap-2.5">
            {candidates.map((w) => (
              <View
                key={w._id}
                className="rounded-2xl"
                style={{
                  borderWidth: 2,
                  borderColor:
                    selectedId === w._id ? LIGHT_THEME.wText : "transparent",
                }}
              >
                <WorkoutCard
                  workout={w}
                  onPress={() => {
                    selectionFeedback();
                    setSelectedId(w._id);
                    setError(null);
                  }}
                />
              </View>
            ))}
          </View>
        )}

        {error && (
          <Text
            className="text-center font-coach text-sm"
            style={{ color: COLORS.red }}
          >
            {error}
          </Text>
        )}

        {candidates.length > 0 && (
          <Pressable
            onPress={handleConfirm}
            disabled={!selectedId || submitting}
            className="items-center rounded-2xl py-3.5 active:opacity-90"
            style={{
              backgroundColor: LIGHT_THEME.wText,
              opacity: !selectedId || submitting ? 0.4 : 1,
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
        )}
      </View>
    </BottomSheetModal>
  );
}

export default SwapSheet;

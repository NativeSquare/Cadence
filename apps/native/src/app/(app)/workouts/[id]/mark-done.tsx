import { MarkWorkoutAsDoneForm } from "@/components/app/workout/mark-workout-as-done-form";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import type { WorkoutDoc } from "@nativesquare/agoge/schema";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

export default function MarkWorkoutAsDoneScreen() {
  return (
    <BottomSheetModalProvider>
      <MarkWorkoutAsDoneContent />
    </BottomSheetModalProvider>
  );
}

function MarkWorkoutAsDoneContent() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const result = useQuery(
    api.agoge.workouts.getWorkout,
    id ? { workoutId: id } : "skip",
  );
  const updateWorkout = useMutation(api.agoge.workouts.updateWorkout);

  if (result === undefined) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: LIGHT_THEME.w2 }}
      >
        <ActivityIndicator color={LIGHT_THEME.wMute} />
      </View>
    );
  }

  if (result === null || !result.workout.planned) {
    return (
      <View
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: LIGHT_THEME.w2 }}
      >
        <Text
          className="text-center font-coach text-sm"
          style={{ color: LIGHT_THEME.wMute }}
        >
          {result === null
            ? "Workout not found"
            : "This workout has no planned version to complete."}
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 rounded-full border px-4 py-2 active:opacity-80"
          style={{ borderColor: LIGHT_THEME.wBrd }}
        >
          <Text
            className="font-coach-semibold text-[13px]"
            style={{ color: LIGHT_THEME.wText }}
          >
            Go back
          </Text>
        </Pressable>
      </View>
    );
  }

  const workout = result.workout;

  return (
    <MarkWorkoutAsDoneForm
      workout={workout as unknown as WorkoutDoc}
      onSubmit={async (values) => {
        await updateWorkout({
          workoutId: workout._id,
          status: "completed",
          actual: values.actual,
        });
      }}
    />
  );
}

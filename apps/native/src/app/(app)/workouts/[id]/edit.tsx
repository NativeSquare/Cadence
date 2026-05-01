import {
  WorkoutForm,
  type WorkoutFormInitial,
} from "@/components/app/workout/workout-form";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

export default function EditWorkoutScreen() {
  return (
    <BottomSheetModalProvider>
      <EditWorkoutContent />
    </BottomSheetModalProvider>
  );
}

function EditWorkoutContent() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const workout = useQuery(
    api.agoge.workouts.getWorkout,
    id ? { workoutId: id } : "skip",
  );
  const modifyWorkout = useMutation(api.agoge.workouts.modifyWorkout);
  const deleteWorkout = useMutation(api.agoge.workouts.deleteWorkout);

  if (workout === undefined) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: LIGHT_THEME.w2 }}
      >
        <ActivityIndicator color={LIGHT_THEME.wMute} />
      </View>
    );
  }

  if (workout === null) {
    return (
      <View
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: LIGHT_THEME.w2 }}
      >
        <Text
          className="text-center font-coach text-sm"
          style={{ color: LIGHT_THEME.wMute }}
        >
          Workout not found
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

  const date = workout.planned?.date ?? workout.actual?.date;
  if (!date) {
    return (
      <View
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: LIGHT_THEME.w2 }}
      >
        <Text
          className="text-center font-coach text-sm"
          style={{ color: LIGHT_THEME.wMute }}
        >
          Workout has no date
        </Text>
      </View>
    );
  }

  const initial: WorkoutFormInitial = {
    date,
    name: workout.name,
    type: workout.type,
    subSport: workout.subSport,
    description: workout.description,
    status: workout.status,
    planned: workout.planned,
    actual: workout.actual,
  };

  return (
    <WorkoutForm
      title="Edit workout"
      mode="edit"
      submitLabel="Save changes"
      initial={initial}
      onSubmit={async (values) => {
        const face: {
          durationSeconds?: number;
          distanceMeters?: number;
          notes?: string;
        } = {
          durationSeconds: values.metrics.durationSeconds,
          distanceMeters: values.metrics.distanceMeters,
          notes: values.metrics.notes,
        };
        const isDone = values.workoutMode === "done";
        await modifyWorkout({
          workoutId: workout._id,
          name: values.name,
          date: values.date,
          type: values.type,
          subSport: values.subSport,
          status: isDone ? "completed" : "planned",
          ...(isDone ? { actual: face } : { planned: face }),
        });
      }}
      onDelete={async () => {
        await deleteWorkout({ workoutId: workout._id });
      }}
    />
  );
}

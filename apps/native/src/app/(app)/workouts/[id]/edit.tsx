import { WorkoutForm } from "@/components/app/workout/workout-form";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import type { Workout } from "@nativesquare/agoge/schema";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
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
  const updateWorkout = useMutation(api.agoge.workouts.updateWorkout);
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

  return (
    <WorkoutForm
      title="Edit workout"
      mode="edit"
      submitLabel="Save changes"
      initial={workout as unknown as Workout}
      onSubmit={async (values) => {
        const isDone = values.workoutMode === "done";
        const toFace = (face: typeof values.planned) => ({
          ...face,
          date: `${face.date}T00:00:00.000Z`,
        });
        await updateWorkout({
          workoutId: workout._id,
          name: values.name,
          description: values.description?.trim() || undefined,
          type: values.type,
          typeNotes: values.typeNotes?.trim() || undefined,
          subSport: values.subSport,
          status: isDone ? "completed" : "planned",
          planned:
            values.planned.structure.blocks.length > 0
              ? toFace(values.planned)
              : undefined,
          actual:
            isDone && values.actual.structure.blocks.length > 0
              ? toFace(values.actual)
              : undefined,
        });
      }}
      onDelete={async () => {
        await deleteWorkout({ workoutId: workout._id });
      }}
    />
  );
}

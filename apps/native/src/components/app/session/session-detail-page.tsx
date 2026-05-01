/**
 * Session detail page.
 *
 * Loads the agoge workout doc and renders a compact readout. Adds Edit/Delete
 * affordances when the workout is still upcoming (`status === "planned"`).
 *
 * The richer AI-coach analysis layout is being designed separately and will
 * compose on top of (or replace) this readout.
 */

import { ConfirmationSheet } from "@/components/shared/confirmation-sheet";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { selectionFeedback } from "@/lib/haptics";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  View,
} from "react-native";

export interface SessionDetailPageProps {
  sessionId: string;
}

const STATUS_LABEL: Record<string, string> = {
  planned: "Planned",
  completed: "Completed",
  missed: "Missed",
  skipped: "Skipped",
};

const STATUS_COLOR: Record<string, string> = {
  planned: COLORS.blu,
  completed: COLORS.grn,
  missed: COLORS.red,
  skipped: COLORS.ylw,
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map((p) => Number.parseInt(p, 10));
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDistance(m?: number): string | null {
  if (m == null || m <= 0) return null;
  const km = Math.round((m / 1000) * 10) / 10;
  return `${km} km`;
}

function formatDuration(sec?: number): string | null {
  if (sec == null || sec <= 0) return null;
  const h = Math.floor(sec / 3600);
  const min = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h${String(min).padStart(2, "0")}`;
  return `${min}min`;
}

function formatType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function SessionDetailPage({ sessionId }: SessionDetailPageProps) {
  const router = useRouter();
  const workout = useQuery(api.agoge.workouts.getWorkout, {
    workoutId: sessionId,
  });
  const deleteWorkout = useMutation(api.agoge.workouts.deleteWorkout);
  const deleteSheetRef = React.useRef<BottomSheetModal>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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

  const face =
    workout.status === "completed" ? workout.actual : workout.planned;
  const date = workout.planned?.date ?? workout.actual?.date;
  const distance = formatDistance(face?.distanceMeters);
  const duration = formatDuration(face?.durationSeconds);
  const notes = face?.notes ?? workout.description;

  const handleEdit = () => {
    selectionFeedback();
    router.push({
      pathname: "/(app)/workouts/[id]/edit",
      params: { id: workout._id },
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteWorkout({ workoutId: workout._id });
      deleteSheetRef.current?.dismiss();
      router.back();
    } catch (err) {
      setError(getConvexErrorMessage(err));
      setIsDeleting(false);
    }
  };

  return (
    <View
      className="pt-safe flex-1"
      style={{ backgroundColor: LIGHT_THEME.w2 }}
    >
      <StatusBar barStyle="dark-content" animated />
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
          Workout
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6"
      >
        <View className="w-full max-w-md gap-6 self-center">
          <View className="gap-2">
            <View
              className="self-start rounded-full px-3 py-1"
              style={{
                backgroundColor: `${STATUS_COLOR[workout.status] ?? COLORS.blu}22`,
              }}
            >
              <Text
                className="font-coach-bold text-[11px] uppercase tracking-wider"
                style={{
                  color: STATUS_COLOR[workout.status] ?? COLORS.blu,
                }}
              >
                {STATUS_LABEL[workout.status] ?? workout.status}
              </Text>
            </View>
            <Text
              className="font-coach-bold text-2xl"
              style={{ color: LIGHT_THEME.wText }}
            >
              {workout.name}
            </Text>
            {date && (
              <Text
                className="font-coach text-sm"
                style={{ color: LIGHT_THEME.wMute }}
              >
                {formatDate(date)}
              </Text>
            )}
          </View>

          <View
            className="gap-4 rounded-2xl border p-4"
            style={{
              backgroundColor: LIGHT_THEME.w1,
              borderColor: LIGHT_THEME.wBrd,
            }}
          >
            <SummaryRow label="Type" value={formatType(workout.type)} />
            {workout.subSport && (
              <SummaryRow label="Surface" value={formatType(workout.subSport)} />
            )}
            {distance && <SummaryRow label="Distance" value={distance} />}
            {duration && <SummaryRow label="Duration" value={duration} />}
          </View>

          {notes && notes.trim().length > 0 && (
            <View
              className="gap-2 rounded-2xl border p-4"
              style={{
                backgroundColor: LIGHT_THEME.w1,
                borderColor: LIGHT_THEME.wBrd,
              }}
            >
              <Text
                className="font-coach-semibold text-[11px] uppercase tracking-wider"
                style={{ color: LIGHT_THEME.wMute }}
              >
                Notes
              </Text>
              <Text
                className="font-coach text-[14px] leading-6"
                style={{ color: LIGHT_THEME.wText }}
              >
                {notes}
              </Text>
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
        </View>
      </ScrollView>

      <View className="mb-safe w-full max-w-md gap-2 self-center px-4 pb-4">
        <Pressable
          onPress={handleEdit}
          className="items-center rounded-2xl py-3.5 active:opacity-90"
          style={{ backgroundColor: LIGHT_THEME.wText }}
        >
          <Text
            className="font-coach-bold text-sm"
            style={{ color: "#FFFFFF" }}
          >
            Edit workout
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            selectionFeedback();
            deleteSheetRef.current?.present();
          }}
          className="items-center rounded-2xl border py-3.5 active:opacity-80"
          style={{
            backgroundColor: LIGHT_THEME.w1,
            borderColor: LIGHT_THEME.wBrd,
          }}
        >
          <Text
            className="font-coach-semibold text-sm"
            style={{ color: COLORS.red }}
          >
            Delete
          </Text>
        </Pressable>
      </View>

      <ConfirmationSheet
        sheetRef={deleteSheetRef}
        icon="trash-outline"
        title="Delete workout"
        description="This cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text
        className="font-coach-semibold text-[12px] uppercase tracking-wider"
        style={{ color: LIGHT_THEME.wMute }}
      >
        {label}
      </Text>
      <Text
        className="font-coach-bold text-[15px]"
        style={{ color: LIGHT_THEME.wText }}
      >
        {value}
      </Text>
    </View>
  );
}

export default SessionDetailPage;

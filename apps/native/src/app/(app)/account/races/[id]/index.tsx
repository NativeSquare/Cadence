import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { api } from "@packages/backend/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Linking, Pressable, ScrollView, View } from "react-native";

type RaceDoc = NonNullable<
  ReturnType<typeof useQuery<typeof api.plan.events.getMyEvent>>
>;

const PRIORITY_COLORS: Record<"A" | "B" | "C", string> = {
  A: COLORS.lime,
  B: COLORS.ora,
  C: LIGHT_THEME.w3,
};

const PRIORITY_TEXT_COLORS: Record<"A" | "B" | "C", string> = {
  A: COLORS.black,
  B: COLORS.black,
  C: LIGHT_THEME.wSub,
};

const STATUS_LABELS: Record<
  "upcoming" | "completed" | "cancelled" | "dnf" | "dns",
  string
> = {
  upcoming: "Upcoming",
  completed: "Completed",
  cancelled: "Cancelled",
  dnf: "DNF",
  dns: "DNS",
};

const COURSE_TYPE_LABELS: Record<string, string> = {
  loop: "Loop",
  point_to_point: "Point to point",
  out_and_back: "Out & back",
  laps: "Laps",
  other: "Other",
};

const SURFACE_LABELS: Record<string, string> = {
  pavement: "Pavement",
  mixed: "Mixed",
  trail: "Trail",
  technical_trail: "Technical trail",
  track: "Track",
  other: "Other",
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function formatDistance(meters?: number): string | null {
  if (meters == null) return null;
  if (meters >= 1000) {
    const km = meters / 1000;
    const rounded = Math.round(km * 10) / 10;
    return `${rounded} km`;
  }
  return `${meters} m`;
}

function formatLocation(loc?: RaceDoc["location"]): string | null {
  if (!loc) return null;
  const parts = [loc.city, loc.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

export default function RaceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const race = useQuery(api.plan.events.getMyEvent, { eventId: id });

  if (race === undefined) {
    return <View className="flex-1" style={{ backgroundColor: LIGHT_THEME.w2 }} />;
  }

  if (race === null) {
    return (
      <View
        className="mt-safe flex-1 items-center justify-center px-4"
        style={{ backgroundColor: LIGHT_THEME.w2 }}
      >
        <Text
          className="font-coach-medium text-[15px]"
          style={{ color: LIGHT_THEME.wText }}
        >
          Race not found
        </Text>
      </View>
    );
  }

  const priority = race.priority as "A" | "B" | "C";
  const distance = formatDistance(race.distanceMeters);
  const locationText = formatLocation(race.location);
  const hasRaceDetails =
    race.courseType ||
    race.surface ||
    race.elevationGainMeters != null ||
    race.bibNumber ||
    race.registrationUrl;
  const hasResult =
    race.status === "completed" &&
    race.result &&
    (race.result.finishTime ||
      race.result.placement != null ||
      race.result.notes);

  return (
    <View className="mt-safe flex-1" style={{ backgroundColor: LIGHT_THEME.w2 }}>
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
          Race
        </Text>
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/(app)/account/races/[id]/edit",
              params: { id },
            })
          }
          className="size-9 items-center justify-center rounded-full active:opacity-70"
          style={{ backgroundColor: LIGHT_THEME.w3 }}
        >
          <Ionicons name="create-outline" size={18} color={LIGHT_THEME.wText} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6"
      >
        <View className="w-full max-w-md gap-5 self-center">
          <View
            className="flex-row items-center gap-4 rounded-3xl border px-5 py-5"
            style={{
              backgroundColor: LIGHT_THEME.w1,
              borderColor: LIGHT_THEME.wBrd,
            }}
          >
            <View
              className="size-14 items-center justify-center rounded-2xl"
              style={{ backgroundColor: PRIORITY_COLORS[priority] }}
            >
              <Text
                className="font-coach-extrabold text-[22px]"
                style={{ color: PRIORITY_TEXT_COLORS[priority] }}
              >
                {priority}
              </Text>
            </View>
            <View className="flex-1 gap-1">
              <Text
                className="font-coach-bold text-[18px]"
                style={{ color: LIGHT_THEME.wText }}
              >
                {race.name}
              </Text>
              <Text
                className="font-coach text-[13px]"
                style={{ color: LIGHT_THEME.wSub }}
              >
                {formatDate(race.date)}
                {distance ? ` · ${distance}` : ""}
              </Text>
              <View
                className="mt-1 self-start rounded-full px-2.5 py-0.5"
                style={{ backgroundColor: LIGHT_THEME.w3 }}
              >
                <Text
                  className="font-coach-semibold text-[10px]"
                  style={{ color: LIGHT_THEME.wSub }}
                >
                  {STATUS_LABELS[race.status]}
                </Text>
              </View>
            </View>
          </View>

          {!race.raceId && (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/(app)/account/races/[id]/edit",
                  params: { id },
                })
              }
              className="items-center rounded-2xl border px-4 py-4 active:opacity-80"
              style={{
                backgroundColor: LIGHT_THEME.w1,
                borderColor: LIGHT_THEME.wBrd,
                borderStyle: "dashed",
              }}
            >
              <Text
                className="font-coach-semibold text-[13px]"
                style={{ color: LIGHT_THEME.wText }}
              >
                Log race details
              </Text>
              <Text
                className="mt-1 text-center font-coach text-[11px]"
                style={{ color: LIGHT_THEME.wMute }}
              >
                Add distance, status, course & more.
              </Text>
            </Pressable>
          )}

          {(locationText || race.notes) && (
            <DetailSection title="Event">
              {locationText && (
                <DetailRow label="Location" value={locationText} />
              )}
              {race.notes && <DetailRow label="Notes" value={race.notes} />}
            </DetailSection>
          )}

          {hasRaceDetails && (
            <DetailSection title="Race details">
              {race.courseType && (
                <DetailRow
                  label="Course"
                  value={COURSE_TYPE_LABELS[race.courseType] ?? race.courseType}
                />
              )}
              {race.surface && (
                <DetailRow
                  label="Surface"
                  value={SURFACE_LABELS[race.surface] ?? race.surface}
                />
              )}
              {race.elevationGainMeters != null && (
                <DetailRow
                  label="Elevation gain"
                  value={`${race.elevationGainMeters} m`}
                />
              )}
              {race.bibNumber && (
                <DetailRow label="Bib" value={race.bibNumber} />
              )}
              {race.registrationUrl && (
                <DetailRow
                  label="Registration"
                  value={race.registrationUrl}
                  onPress={() =>
                    Linking.openURL(race.registrationUrl as string).catch(
                      () => undefined,
                    )
                  }
                />
              )}
            </DetailSection>
          )}

          {hasResult && race.result && (
            <DetailSection title="Result">
              {race.result.finishTime && (
                <DetailRow
                  label="Finish time"
                  value={race.result.finishTime}
                />
              )}
              {race.result.placement != null && (
                <DetailRow
                  label="Placement"
                  value={`#${race.result.placement}`}
                />
              )}
              {race.result.notes && (
                <DetailRow label="Notes" value={race.result.notes} />
              )}
            </DetailSection>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-2">
      <Text
        className="px-1 font-coach-extrabold text-[11px] uppercase tracking-widest"
        style={{ color: LIGHT_THEME.wSub }}
      >
        {title}
      </Text>
      <View
        className="rounded-2xl border"
        style={{
          backgroundColor: LIGHT_THEME.w1,
          borderColor: LIGHT_THEME.wBrd,
        }}
      >
        {children}
      </View>
    </View>
  );
}

function DetailRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const content = (
    <View className="flex-row items-start justify-between gap-3 px-4 py-3">
      <Text
        className="font-coach-semibold text-[12px] uppercase tracking-wider"
        style={{ color: LIGHT_THEME.wMute }}
      >
        {label}
      </Text>
      <Text
        className="flex-1 text-right font-coach-medium text-[14px]"
        style={{ color: onPress ? COLORS.lime : LIGHT_THEME.wText }}
        numberOfLines={3}
      >
        {value}
      </Text>
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:opacity-70">
        {content}
      </Pressable>
    );
  }
  return content;
}

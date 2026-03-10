import { useCallback, useMemo, useRef, useState } from "react";
import { View, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import type { Id } from "@packages/backend/convex/_generated/dataModel";
import { BottomSheetModal } from "@gorhom/bottom-sheet";

import { SessionHeader } from "./session-header";
import { SessionStatsRow } from "./session-stats-row";
import { SessionStructure } from "./session-structure";
import { SessionCoachInsight } from "./session-coach-insight";
import { SessionCompletedComparison } from "./session-completed-comparison";
import { SessionActionsBar } from "./session-actions-bar";
import { IntensityProfileChart } from "./IntensityProfileChart";
import { SessionZoneSplit } from "./SessionZoneSplit";
import { ExportToWatchSheet, type WatchProvider } from "../plan/ExportToWatchSheet";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import type { SessionSegment } from "./types";

export interface SessionDetailPageProps {
  sessionId: Id<"plannedSessions">;
}

function formatDurationDisplay(seconds: number): string {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${Math.round(seconds / 60)} min`;
}

interface BackendSegment {
  segmentType: string;
  durationSeconds?: number;
  distanceMeters?: number;
  targetPace?: string;
  targetHeartRate?: number;
  targetEffort?: number;
  repetitions?: number;
  recoverySeconds?: number;
  notes?: string;
}

const SEGMENT_TYPE_LABELS: Record<string, string> = {
  warmup: "Warm Up",
  warm_up: "Warm Up",
  cooldown: "Cool Down",
  cool_down: "Cool Down",
  recovery: "Recovery",
  rest: "Rest",
  main: "Main",
  work: "Work",
};

const SEGMENT_TYPE_ZONES: Record<string, string> = {
  warmup: "Z2",
  warm_up: "Z2",
  cooldown: "Z1",
  cool_down: "Z1",
  recovery: "Z1",
  rest: "Z1",
  main: "Z3",
  work: "Z4",
};

function toChartSegments(segments: BackendSegment[]): SessionSegment[] {
  return segments.map((seg) => {
    const key = seg.segmentType.toLowerCase();
    const km = seg.distanceMeters
      ? (seg.distanceMeters / 1000).toFixed(1)
      : seg.durationSeconds
        ? ((seg.durationSeconds / 60) * 0.15).toFixed(1) // rough estimate: ~9 km/h jog
        : "1.0";

    return {
      name: SEGMENT_TYPE_LABELS[key] ?? seg.segmentType,
      km,
      pace: seg.targetPace ?? "6:00",
      zone: SEGMENT_TYPE_ZONES[key] ?? "Z3",
    };
  });
}

export function SessionDetailPage({ sessionId }: SessionDetailPageProps) {
  const router = useRouter();
  const session = useQuery(api.training.queries.getSessionById, { sessionId });
  const markComplete = useMutation(api.training.mutations.markSessionComplete);
  const exportSheetRef = useRef<BottomSheetModal>(null);
  const [isExported, setIsExported] = useState(false);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleExportToWatch = useCallback(() => {
    exportSheetRef.current?.present();
  }, []);

  const handleExportComplete = useCallback((_provider: WatchProvider) => {
    setIsExported(true);
  }, []);

  const handleMarkComplete = useCallback(async () => {
    await markComplete({ sessionId });
  }, [markComplete, sessionId]);

  const handleAskCoach = useCallback(() => {
    if (!session) return;
    const prompt = `I want to discuss my ${session.sessionTypeDisplay} session scheduled for ${session.dayOfWeek}`;
    router.push({
      pathname: "/(app)/(tabs)/coach",
      params: { sessionContext: prompt },
    });
  }, [router, session]);

  if (session === undefined) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color={LIGHT_THEME.wMute} />
      </View>
    );
  }

  if (session === null) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 16 }}>Session not found</Text>
      </View>
    );
  }

  const isUpcoming = session.status === "scheduled";
  const isCompleted = session.status === "completed";

  const chartSegments = useMemo(
    () => toChartSegments(session.structureSegments ?? []),
    [session.structureSegments],
  );

  const distanceKm = session.targetDistanceMeters
    ? (session.targetDistanceMeters / 1000).toFixed(1)
    : "-";

  const actualDistanceKm = session.actualDistanceMeters
    ? (session.actualDistanceMeters / 1000).toFixed(1)
    : undefined;

  const actualDuration = session.actualDurationSeconds
    ? formatDurationDisplay(session.actualDurationSeconds)
    : undefined;

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <SessionHeader
        sessionTypeDisplay={session.sessionTypeDisplay}
        scheduledDate={session.scheduledDate}
        status={session.status}
        isKeySession={session.isKeySession}
        isRestDay={session.isRestDay}
        onBack={handleBack}
      />

      {/* Content area with rounded top */}
      <View className="flex-1 bg-w2" style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -1 }}>
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingTop: 20, paddingBottom: 180 }}
        >
          {/* Stats overview card (always shown for non-rest) */}
          {!session.isRestDay && (
            <SessionStatsRow
              distanceKm={distanceKm}
              duration={session.targetDurationDisplay}
              effort={session.effortDisplay}
              hrZone={session.targetHeartRateZone}
              isCompleted={isCompleted}
              actualDistanceKm={actualDistanceKm}
              actualDuration={actualDuration}
            />
          )}

          {/* Intensity profile chart */}
          {!session.isRestDay && chartSegments.length > 1 && (
            <IntensityProfileChart segments={chartSegments} />
          )}

          {/* Zone split chart */}
          {!session.isRestDay && chartSegments.length > 1 && (
            <SessionZoneSplit segments={chartSegments} />
          )}

          {/* Completed comparison (completed only) */}
          {isCompleted && !session.isRestDay && (
            <SessionCompletedComparison
              plannedDistanceKm={distanceKm}
              plannedDuration={session.targetDurationDisplay}
              actualDistanceKm={actualDistanceKm}
              actualDuration={actualDuration}
              adherenceScore={session.adherenceScore}
              userRating={session.userRating}
              userFeedback={session.userFeedback}
            />
          )}

          {/* Workout structure (when segments exist) */}
          {!session.isRestDay && (
            <SessionStructure
              segments={session.structureSegments ?? []}
              structureDisplay={session.structureDisplay}
            />
          )}

          {/* Pace targets */}
          {session.targetPaceDisplay && !session.isRestDay && (
            <View className="mb-4">
              <Text
                className="text-[11px] font-coach-semibold text-wMute uppercase px-1 mb-2.5"
                style={{ letterSpacing: 0.55 }}
              >
                Pace Target
              </Text>
              <View className="rounded-2xl bg-w1 border border-wBrd p-4">
                <View className="flex-row items-center gap-3">
                  <Text style={{ fontSize: 22, fontFamily: "Outfit-Bold", color: LIGHT_THEME.wText }}>
                    {session.targetPaceDisplay}
                  </Text>
                  {session.targetHeartRateMin && session.targetHeartRateMax && (
                    <Text style={{ fontSize: 13, color: LIGHT_THEME.wMute }}>
                      HR {session.targetHeartRateMin}–{session.targetHeartRateMax} bpm
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Coach insight */}
          <SessionCoachInsight
            justification={session.justification}
            physiologicalTarget={session.physiologicalTarget}
            placementRationale={session.placementRationale}
            keyPoints={session.keyPoints}
          />

          {/* Description */}
          {session.description && (
            <View className="mb-4">
              <Text
                className="text-[11px] font-coach-semibold text-wMute uppercase px-1 mb-2.5"
                style={{ letterSpacing: 0.55 }}
              >
                Description
              </Text>
              <View className="rounded-2xl bg-w1 border border-wBrd p-4">
                <Text style={{ fontSize: 14, color: LIGHT_THEME.wText, lineHeight: 21 }}>
                  {session.description}
                </Text>
              </View>
            </View>
          )}

          {/* Alternatives (upcoming only) */}
          {isUpcoming && session.alternatives && session.alternatives.length > 0 && (
            <View className="mb-4">
              <Text
                className="text-[11px] font-coach-semibold text-wMute uppercase px-1 mb-2.5"
                style={{ letterSpacing: 0.55 }}
              >
                Alternatives
              </Text>
              <View className="rounded-2xl bg-w1 border border-wBrd overflow-hidden">
                {session.alternatives.map((alt, i) => (
                  <View
                    key={i}
                    style={{
                      padding: 14,
                      paddingHorizontal: 18,
                      borderBottomWidth: i < session.alternatives!.length - 1 ? 1 : 0,
                      borderBottomColor: LIGHT_THEME.wBrd,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontFamily: "Outfit-SemiBold", color: LIGHT_THEME.wText, marginBottom: 2 }}>
                      {alt.sessionType}
                    </Text>
                    <Text style={{ fontSize: 13, color: LIGHT_THEME.wSub, marginBottom: 4 }}>
                      {alt.description}
                    </Text>
                    <Text style={{ fontSize: 12, color: LIGHT_THEME.wMute, fontStyle: "italic" }}>
                      {alt.whenToUse}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Week context */}
          <View className="mb-4">
            <Text
              className="text-[11px] font-coach-semibold text-wMute uppercase px-1 mb-2.5"
              style={{ letterSpacing: 0.55 }}
            >
              Week Context
            </Text>
            <View className="rounded-2xl bg-w1 border border-wBrd p-4 flex-row items-center gap-3">
              <Text style={{ fontSize: 13, color: LIGHT_THEME.wSub }}>
                Week {session.weekNumber} of {session.planName}
              </Text>
              <View className="flex-1" />
              <Text style={{ fontSize: 12, color: LIGHT_THEME.wMute }}>
                Current: Week {session.planCurrentWeek}
              </Text>
            </View>
          </View>

          {/* Rest day message */}
          {session.isRestDay && (
            <View className="items-center py-8">
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🧘</Text>
              <Text style={{ fontSize: 16, fontFamily: "Outfit-SemiBold", color: LIGHT_THEME.wText, marginBottom: 4 }}>
                Rest Day
              </Text>
              <Text style={{ fontSize: 14, color: LIGHT_THEME.wMute, textAlign: "center", lineHeight: 20, paddingHorizontal: 32 }}>
                {session.description || "Take it easy today. Your body needs recovery to adapt to training."}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Actions bar */}
      <SessionActionsBar
        isUpcoming={isUpcoming}
        isExported={isExported}
        isMoveable={session.isMoveable}
        isRestDay={session.isRestDay}
        onExportToWatch={handleExportToWatch}
        onMarkComplete={handleMarkComplete}
        onAskCoach={handleAskCoach}
      />

      {/* Export sheet */}
      <ExportToWatchSheet
        sheetRef={exportSheetRef}
        sessionType={session.sessionTypeDisplay}
        sessionId={sessionId}
        onExportComplete={handleExportComplete}
      />
    </View>
  );
}

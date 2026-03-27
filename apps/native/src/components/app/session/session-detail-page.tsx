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
import { SessionDebriefCard } from "./session-debrief-card";
import { SessionWhyCallout } from "./session-why-callout";
import { SessionFocusCue } from "./session-focus-cue";
import { SessionSplitsTable } from "./session-splits-table";
import { SessionHrZones } from "./session-hr-zones";
import { SessionPaceChart } from "./session-pace-chart";
import { SessionContextCard } from "./session-context-card";
import { IntensityProfileChart } from "./IntensityProfileChart";
import { SessionZoneSplit } from "./SessionZoneSplit";
import { ExportToWatchSheet, type WatchProvider } from "../plan/ExportToWatchSheet";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME, CARD_SHADOW } from "@/lib/design-tokens";
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
  const activityDetail = useQuery(
    api.training.queries.getActivityForSession,
    session?.status === "completed" ? { sessionId } : "skip"
  );
  const adjacentSessions = useQuery(
    api.training.queries.getAdjacentSessions,
    { sessionId }
  );
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
          {/* ── REST DAY ── */}
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

          {/* ── UPCOMING SESSION ORDER ── */}
          {isUpcoming && !session.isRestDay && (
            <>
              {/* 1. "Why this session" callout */}
              {session.justification && (
                <SessionWhyCallout justification={session.justification} />
              )}

              {/* 2. Stats row */}
              <SessionStatsRow
                distanceKm={distanceKm}
                duration={session.targetDurationDisplay}
                effort={session.effortDisplay}
                hrZone={session.targetHeartRateZone}
                isCompleted={false}
              />

              {/* 3. Intensity profile chart */}
              {chartSegments.length > 1 && (
                <IntensityProfileChart segments={chartSegments} />
              )}

              {/* 4. Workout structure (moved up) + pace targets merged */}
              <SessionStructure
                segments={session.structureSegments ?? []}
                structureDisplay={session.structureDisplay}
              />
              {session.targetPaceDisplay && (
                <View className="mb-4">
                  <Text
                    className="text-[11px] font-coach-semibold text-wSub uppercase px-1 mb-2.5"
                    style={{ letterSpacing: 0.55 }}
                  >
                    Pace Target
                  </Text>
                  <View className="rounded-2xl bg-w1 p-4" style={CARD_SHADOW}>
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

              {/* 5. Focus cue (new standalone card) */}
              {session.keyPoints && session.keyPoints.length > 0 && (
                <SessionFocusCue keyPoints={session.keyPoints} />
              )}

              {/* 6. Yesterday / Tomorrow context */}
              {adjacentSessions && (
                <SessionContextCard
                  yesterday={adjacentSessions.yesterday}
                  tomorrow={adjacentSessions.tomorrow}
                />
              )}

              {/* 7. Zone split chart (moved down) */}
              {chartSegments.length > 1 && (
                <SessionZoneSplit segments={chartSegments} />
              )}

              {/* 8. Coach insight (collapsed by default) */}
              <SessionCoachInsight
                justification={session.justification}
                physiologicalTarget={session.physiologicalTarget}
                placementRationale={session.placementRationale}
              />

              {/* 9. Alternatives */}
              {session.alternatives && session.alternatives.length > 0 && (
                <View className="mb-4">
                  <Text
                    className="text-[11px] font-coach-semibold text-wSub uppercase px-1 mb-2.5"
                    style={{ letterSpacing: 0.55 }}
                  >
                    Alternatives
                  </Text>
                  <View className="rounded-2xl bg-w1 overflow-hidden" style={CARD_SHADOW}>
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

            </>
          )}

          {/* ── COMPLETED SESSION ORDER ── */}
          {isCompleted && !session.isRestDay && (
            <>
              {/* 1. Hero result + planned vs actual with compliance colors */}
              <SessionCompletedComparison
                plannedDistanceKm={distanceKm}
                plannedDuration={session.targetDurationDisplay}
                actualDistanceKm={actualDistanceKm}
                actualDuration={actualDuration}
                adherenceScore={session.adherenceScore}
              />

              {/* 2. Debrief card (moved up) */}
              <SessionDebriefCard
                sessionId={sessionId}
                userRating={session.userRating}
                userFeedback={session.userFeedback}
                debriefTags={session.debriefTags}
              />

              {/* 3. Pace consistency chart (intervals with 3+ laps) */}
              {activityDetail && activityDetail.laps.length >= 3 && (
                <SessionPaceChart
                  laps={activityDetail.laps}
                  targetPaceMin={session.targetPaceMin}
                  targetPaceMax={session.targetPaceMax}
                />
              )}

              {/* 4. Splits table */}
              {activityDetail && activityDetail.laps.length > 0 && (
                <SessionSplitsTable laps={activityDetail.laps} />
              )}

              {/* 5. HR zones */}
              {activityDetail && activityDetail.hrZones.length > 0 && (
                <SessionHrZones
                  hrZones={activityDetail.hrZones}
                  targetZone={session.targetHeartRateZone}
                />
              )}

              {/* 6. Intensity profile chart */}
              {chartSegments.length > 1 && (
                <IntensityProfileChart segments={chartSegments} />
              )}

              {/* 7. Zone split */}
              {chartSegments.length > 1 && (
                <SessionZoneSplit segments={chartSegments} />
              )}

              {/* 8. Workout structure (moved down for completed — actual data matters more) */}
              <SessionStructure
                segments={session.structureSegments ?? []}
                structureDisplay={session.structureDisplay}
              />

              {/* 6. Coach insight (collapsed) */}
              <SessionCoachInsight
                justification={session.justification}
                physiologicalTarget={session.physiologicalTarget}
                placementRationale={session.placementRationale}
              />

            </>
          )}

          {/* ── FALLBACK: skipped/modified/rescheduled sessions ── */}
          {!isUpcoming && !isCompleted && !session.isRestDay && (
            <>
              <SessionStatsRow
                distanceKm={distanceKm}
                duration={session.targetDurationDisplay}
                effort={session.effortDisplay}
                hrZone={session.targetHeartRateZone}
                isCompleted={false}
              />
              {chartSegments.length > 1 && (
                <IntensityProfileChart segments={chartSegments} />
              )}
              <SessionStructure
                segments={session.structureSegments ?? []}
                structureDisplay={session.structureDisplay}
              />
              <SessionCoachInsight
                justification={session.justification}
                physiologicalTarget={session.physiologicalTarget}
                placementRationale={session.placementRationale}
              />
            </>
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

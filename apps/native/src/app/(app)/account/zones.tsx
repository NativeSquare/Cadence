import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { ZoneBoundaryBlock } from "@/components/app/zones/zone-boundary-block";
import { ZoneThresholdBlock } from "@/components/app/zones/zone-threshold-block";
import { METHOD_FOR } from "@/components/app/zones/zone-method";
import { api } from "@packages/backend/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { computeZoneBoundaries } from "@nativesquare/agoge";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { Zone, ZoneKind } from "@nativesquare/agoge/schema";

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function findZone<T extends { kind: ZoneKind }>(
  list: readonly T[] | undefined,
  kind: ZoneKind,
): T | null {
  return list?.find((z) => z.kind === kind) ?? null;
}

export default function ZonesScreen() {
  const router = useRouter();
  const zones = useQuery(api.agoge.zones.listAthleteZones);
  const createZone = useMutation(api.agoge.zones.createZone);
  const updateZone = useMutation(api.agoge.zones.updateZone);

  const saveZone = React.useCallback(
    async (
      existing: { _id: string; effectiveFrom: string } | null,
      next: Pick<
        Zone,
        "kind" | "boundaries" | "threshold" | "maxHr" | "restingHr"
      > & {
        source: "manual" | "system";
      },
    ) => {
      const today = todayDateString();
      if (existing && existing.effectiveFrom === today) {
        await updateZone({
          zoneId: existing._id,
          boundaries: next.boundaries,
          threshold: next.threshold,
          maxHr: next.maxHr,
          restingHr: next.restingHr,
          source: next.source,
        });
        return;
      }
      await createZone({
        kind: next.kind,
        boundaries: next.boundaries,
        threshold: next.threshold,
        maxHr: next.maxHr,
        restingHr: next.restingHr,
        source: next.source,
        effectiveFrom: today,
      });
    },
    [createZone, updateZone],
  );

  const handleUpsertThreshold = React.useCallback(
    async ({ kind, threshold }: { kind: ZoneKind; threshold: number }) => {
      const existing = findZone(zones, kind);
      const isManual = existing?.source === "manual";
      const boundaries =
        isManual && existing
          ? existing.boundaries
          : computeZoneBoundaries(kind, threshold, METHOD_FOR[kind]).boundaries;
      await saveZone(existing, {
        kind,
        boundaries,
        threshold,
        maxHr: existing?.maxHr,
        restingHr: existing?.restingHr,
        source: isManual ? "manual" : "system",
      });
    },
    [zones, saveZone],
  );

  const handleUpdateBoundaries = React.useCallback(
    async ({ kind, boundaries }: { kind: ZoneKind; boundaries: number[] }) => {
      const existing = findZone(zones, kind);
      await saveZone(existing, {
        kind,
        boundaries,
        threshold: existing?.threshold,
        maxHr: existing?.maxHr,
        restingHr: existing?.restingHr,
        source: "manual",
      });
    },
    [zones, saveZone],
  );

  const handleResync = React.useCallback(
    async ({ kind }: { kind: ZoneKind }) => {
      const existing = findZone(zones, kind);
      if (!existing?.threshold) {
        throw new Error("Set a threshold before re-syncing zones.");
      }
      const boundaries = computeZoneBoundaries(
        kind,
        existing.threshold,
        METHOD_FOR[kind],
      ).boundaries;
      await saveZone(existing, {
        kind,
        boundaries,
        threshold: existing.threshold,
        maxHr: existing.maxHr,
        restingHr: existing.restingHr,
        source: "system",
      });
    },
    [zones, saveZone],
  );

  const loading = zones === undefined;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="pt-safe flex-1"
      style={{ backgroundColor: LIGHT_THEME.w2 }}
    >
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
          Zones
        </Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6"
      >
        <View className="w-full max-w-md gap-6 self-center">
          {loading ? (
            <View className="py-12 items-center">
              <ActivityIndicator color={LIGHT_THEME.wText} />
            </View>
          ) : (
            <>
              <ZoneThresholdBlock
                hrZone={findZone(zones, "hr")}
                paceZone={findZone(zones, "pace")}
                onUpsert={handleUpsertThreshold}
              />

              <ZoneBoundaryBlock
                kind="hr"
                title="HR Zones"
                zone={findZone(zones, "hr")}
                onUpdateBoundaries={handleUpdateBoundaries}
                onResync={handleResync}
              />

              <ZoneBoundaryBlock
                kind="pace"
                title="Pace Zones"
                zone={findZone(zones, "pace")}
                onUpdateBoundaries={handleUpdateBoundaries}
                onResync={handleResync}
              />
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

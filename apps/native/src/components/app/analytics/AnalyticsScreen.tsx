import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import { useLocalSearchParams } from "expo-router";
import { api } from "@packages/backend/convex/_generated/api";
import { Text } from "@/components/ui/text";
import {
  ANALYTICS_DATA_TYPES,
  PROVIDER_CAPABILITIES,
  type DataTypeKey,
  type Provider,
} from "@/lib/providers/capabilities";
import { DataTypePill } from "./parts/DataTypePill";
import { ConnectProviderCTA } from "./parts/ConnectProviderCTA";
import { TrainingSection } from "./sections/TrainingSection";
import { SleepSection } from "./sections/SleepSection";
import { MenstrualSection } from "./sections/MenstrualSection";
import { NutritionSection } from "./sections/NutritionSection";

const HORIZONTAL_PADDING = 20;
// Card uses p-5 (20px) on each side, plus 1px border on each side.
const CARD_INNER_PADDING = 20 * 2 + 1 * 2;

export function AnalyticsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { type: typeParam } = useLocalSearchParams<{ type?: string }>();
  const initialType = isDataType(typeParam) ? typeParam : "activities";
  const [selected, setSelected] = useState<DataTypeKey>(initialType);
  const [containerWidth, setContainerWidth] = useState(0);

  const connections = useQuery(api.soma.index.listConnections);
  const lockedTypes = useMemo(
    () => computeLockedTypes(connections),
    [connections],
  );
  const isLocked = lockedTypes.has(selected);

  const chartWidth = Math.max(
    0,
    containerWidth - HORIZONTAL_PADDING * 2 - CARD_INNER_PADDING,
  );

  return (
    <View className="flex-1 bg-w2">
      <View className="absolute top-0 left-0 right-0 h-1/2 bg-black" />

      <View className="bg-black">
        <View
          className="px-6 pb-5 flex-row items-end justify-between gap-3"
          style={{ paddingTop: insets.top + 12 }}
        >
          <View className="flex-1 min-w-0">
            <Text
              className="text-[28px] font-coach-bold text-g1"
              style={{ letterSpacing: -0.03 * 28 }}
            >
              {t("analytics.title")}
            </Text>
            <Text className="text-[13px] font-coach text-g3 mt-1">
              {t("analytics.subtitle")}
            </Text>
          </View>
          <DataTypePill value={selected} onChange={setSelected} />
        </View>
        <View
          className="bg-w2 h-7"
          style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
        />
      </View>

      <ScrollView
        className="flex-1 bg-w2"
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        contentContainerStyle={{
          paddingHorizontal: HORIZONTAL_PADDING,
          paddingTop: 4,
          paddingBottom: insets.bottom + 32,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {containerWidth === 0 ? null : (
          <>
            {isLocked ? <ConnectProviderCTA dataType={selected} /> : null}
            {renderSection(selected, chartWidth, isLocked)}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function renderSection(
  type: DataTypeKey,
  width: number,
  isLocked: boolean,
) {
  switch (type) {
    case "activities":
      return <TrainingSection width={width} />;
    case "sleep":
      return <SleepSection width={width} isLocked={isLocked} />;
    case "menstruation":
      return <MenstrualSection width={width} isLocked={isLocked} />;
    case "nutrition":
      return <NutritionSection width={width} isLocked={isLocked} />;
    default:
      return null;
  }
}

function isDataType(v: unknown): v is DataTypeKey {
  return (
    typeof v === "string" &&
    ANALYTICS_DATA_TYPES.some((d) => d.key === v)
  );
}

type ConnectionRow = { provider?: string; active?: boolean | null };

function computeLockedTypes(
  connections: ConnectionRow[] | undefined,
): Set<DataTypeKey> {
  const locked = new Set<DataTypeKey>(
    ANALYTICS_DATA_TYPES.map((d) => d.key),
  );
  if (!connections) return locked;
  for (const conn of connections) {
    if (!conn.active) continue;
    const provider = conn.provider as Provider | undefined;
    if (!provider || !(provider in PROVIDER_CAPABILITIES)) continue;
    for (const dt of PROVIDER_CAPABILITIES[provider]) locked.delete(dt);
  }
  return locked;
}

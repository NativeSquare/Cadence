/**
 * CTA shown at the top of an Analytics section when no connected provider
 * tracks that data type. Tapping deep-links to the Connections screen with
 * a `filter` param so the user lands on a pre-narrowed list.
 */

import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { COLORS } from "@/lib/design-tokens";
import { type DataTypeKey } from "@/lib/providers/capabilities";

type Props = { dataType: DataTypeKey };

export function ConnectProviderCTA({ dataType }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const accent = COLORS.lime;

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/account/connections",
          params: { filter: dataType },
        })
      }
      className="active:opacity-90"
    >
      <View
        className="rounded-2xl px-5 py-5"
        style={{
          backgroundColor: `${accent}1A`,
          borderWidth: 1,
          borderColor: `${accent}40`,
        }}
      >
        <View className="flex-row items-center gap-2 mb-2">
          <PlugIcon color={accent} />
          <Text
            className="text-[10px] font-coach-semibold uppercase"
            style={{ color: accent, letterSpacing: 0.05 * 10 }}
          >
            {t("analytics.cta.eyebrow")}
          </Text>
        </View>

        <Text
          className="text-[18px] font-coach-bold text-wText"
          style={{ letterSpacing: -0.01 * 18, lineHeight: 22 }}
        >
          {t("analytics.cta.title", {
            dataType: t(`analytics.dataTypes.${dataType}`),
          })}
        </Text>
        <Text
          className="text-[13px] font-coach-medium text-wSub mt-1"
          style={{ lineHeight: 18 }}
        >
          {t("analytics.cta.body")}
        </Text>

        <View
          className="self-start mt-4 flex-row items-center gap-2 rounded-full px-4 py-2.5"
          style={{ backgroundColor: accent }}
        >
          <Text
            className="text-[13px] font-coach-bold"
            style={{ color: "#0E0E0E" }}
          >
            {t("analytics.cta.button")}
          </Text>
          <ChevronRight size={14} color="#0E0E0E" strokeWidth={2.5} />
        </View>
      </View>
    </Pressable>
  );
}

function PlugIcon({ size = 16, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 2v6m6-6v6M5 8h14v3a7 7 0 0 1-14 0V8zm7 10v4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Black overlay placed on top of a chart body when no connected provider
 * tracks the section's data type. The chart still renders underneath so the
 * user sees roughly what they're missing.
 */

import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Lock } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { type DataTypeKey } from "@/lib/providers/capabilities";

type Props = { dataType: DataTypeKey };

export function ChartLockedOverlay({ dataType }: Props) {
  const { t } = useTranslation();
  return (
    <View
      pointerEvents="none"
      className="absolute inset-0 rounded-xl items-center justify-center px-6"
      style={{ backgroundColor: "rgba(0,0,0,0.86)" }}
    >
      <Lock size={20} color="#FFFFFF" strokeWidth={2} />
      <Text
        className="text-[13px] font-coach-semibold text-center mt-2"
        style={{ color: "#FFFFFF", lineHeight: 18 }}
      >
        {t("analytics.locked.message", {
          dataType: t(`analytics.dataTypes.${dataType}`),
        })}
      </Text>
    </View>
  );
}

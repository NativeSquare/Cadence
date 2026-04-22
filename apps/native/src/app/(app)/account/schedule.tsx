/**
 * Account / schedule screen — stubbed during agoge migration.
 *
 * This screen edited Cadence's deleted runners.schedule fields. Per the refactor,
 * those preferences live in AI coach memory now. Rebuild as either an agoge
 * event/athlete editor or a link into the Coach chat.
 */

import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";

export default function ScheduleScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: LIGHT_THEME.bg }}>
      <Text style={{ color: LIGHT_THEME.wText, textAlign: "center", fontSize: 16 }}>
        Schedule preferences now live with your Coach.
      </Text>
      <Text style={{ color: LIGHT_THEME.wMute, marginTop: 8, textAlign: "center", fontSize: 12 }}>
        Open the chat and Coach will help you update them.
      </Text>
    </View>
  );
}

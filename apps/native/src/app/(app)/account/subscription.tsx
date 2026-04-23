import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";

export default function SubscriptionScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        backgroundColor: LIGHT_THEME.w2,
      }}
    >
      <Text style={{ color: LIGHT_THEME.wText, textAlign: "center", fontSize: 16 }}>
        Subscription
      </Text>
      <Text
        style={{ color: LIGHT_THEME.wMute, marginTop: 8, textAlign: "center", fontSize: 12 }}
      >
        Coming soon — plan, billing, manage.
      </Text>
    </View>
  );
}

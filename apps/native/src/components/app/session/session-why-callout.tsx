import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { COLORS, FONT_WEIGHTS } from "@/lib/design-tokens";

export interface SessionWhyCalloutProps {
  justification: string;
}

export function SessionWhyCallout({ justification }: SessionWhyCalloutProps) {
  return (
    <View
      className="mb-4"
      style={{
        padding: 18,
        paddingHorizontal: 20,
        borderRadius: 18,
        backgroundColor: COLORS.lime,
      }}
    >
      <View className="flex-row items-center gap-[7px] mb-2.5">
        <View
          style={{
            width: 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: "#000000",
            opacity: 0.2,
          }}
        />
        <Text
          style={{
            fontSize: 11,
            fontFamily: FONT_WEIGHTS.semibold,
            color: "rgba(0,0,0,0.4)",
          }}
        >
          Why This Session
        </Text>
      </View>
      <Text
        style={{
          fontSize: 15,
          fontFamily: FONT_WEIGHTS.medium,
          color: "#000000",
          lineHeight: 23,
        }}
      >
        {justification}
      </Text>
    </View>
  );
}

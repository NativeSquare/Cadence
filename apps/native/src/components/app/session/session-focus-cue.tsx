import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME, FONT_WEIGHTS, CARD_SHADOW } from "@/lib/design-tokens";

export interface SessionFocusCueProps {
  keyPoints: string[];
}

export function SessionFocusCue({ keyPoints }: SessionFocusCueProps) {
  if (keyPoints.length === 0) return null;

  return (
    <View className="mb-4">
      <Text
        className="text-[11px] font-coach-semibold text-wSub uppercase px-1 mb-2.5"
        style={{ letterSpacing: 0.55 }}
      >
        Focus Cue
      </Text>
      <View
        className="rounded-2xl bg-w1"
        style={{ padding: 16, paddingHorizontal: 18, ...CARD_SHADOW }}
      >
        <Text
          style={{
            fontSize: 13,
            fontFamily: FONT_WEIGHTS.semibold,
            color: LIGHT_THEME.wText,
            marginBottom: 12,
          }}
        >
          During this session:
        </Text>
        {keyPoints.map((point, i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 10,
              marginBottom: i < keyPoints.length - 1 ? 10 : 0,
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: COLORS.limeDim,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 1,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: FONT_WEIGHTS.bold,
                  color: LIGHT_THEME.wText,
                }}
              >
                {i + 1}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 14,
                color: LIGHT_THEME.wText,
                lineHeight: 21,
                flex: 1,
              }}
            >
              {point}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

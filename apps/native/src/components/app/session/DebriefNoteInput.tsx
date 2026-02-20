/**
 * DebriefNoteInput - Textarea with mic button and character count
 * Reference: cadence-full-v10.jsx freeform text input (lines 784-797)
 *
 * Features:
 * - TextInput with placeholder
 * - Mic button to trigger voice recording
 * - Character count display
 * - Send arrow button animation (scaleIn) when text present
 */

import { View, TextInput, Pressable } from "react-native";
import Animated, { ZoomIn, FadeIn } from "react-native-reanimated";
import Svg, { Path, Line, Circle } from "react-native-svg";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";

export interface DebriefNoteInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onMicPress: () => void;
}

export function DebriefNoteInput({
  value,
  onChangeText,
  onMicPress,
}: DebriefNoteInputProps) {
  const hasText = value.trim().length > 0;

  return (
    <View
      className="rounded-[18px] overflow-hidden"
      style={{
        backgroundColor: LIGHT_THEME.w1,
        borderWidth: 1,
        borderColor: LIGHT_THEME.wBrd,
      }}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Or type something..."
        placeholderTextColor={LIGHT_THEME.wMute}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        className="px-[18px] pt-4 pb-2 text-[15px] font-coach"
        style={{
          color: LIGHT_THEME.wText,
          lineHeight: 23,
          minHeight: 80,
        }}
      />

      <View className="flex-row items-center justify-between px-[14px] pb-3 pt-1">
        {/* Mic button */}
        <Pressable
          onPress={onMicPress}
          className="w-9 h-9 rounded-xl items-center justify-center"
          style={{ backgroundColor: LIGHT_THEME.w3 }}
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"
              fill={LIGHT_THEME.wMute}
            />
            <Path
              d="M19 10v2a7 7 0 01-14 0v-2"
              stroke={LIGHT_THEME.wMute}
              strokeWidth={2}
              strokeLinecap="round"
            />
            <Line
              x1={12}
              y1={19}
              x2={12}
              y2={23}
              stroke={LIGHT_THEME.wMute}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </Svg>
        </Pressable>

        {/* Right side: character count + send button */}
        <View className="flex-row items-center gap-[10px]">
          <Text
            className="text-[10px] font-coach"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {value.length}
          </Text>

          {hasText && (
            <Animated.View entering={ZoomIn.duration(200)}>
              <Pressable
                className="w-8 h-8 rounded-[10px] items-center justify-center"
                style={{ backgroundColor: LIGHT_THEME.wText }}
              >
                <Svg width={14} height={14} viewBox="0 0 16 16" fill="none">
                  <Path
                    d="M3 8L13 8M13 8L9 4M13 8L9 12"
                    stroke={COLORS.lime}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </Pressable>
            </Animated.View>
          )}
        </View>
      </View>
    </View>
  );
}

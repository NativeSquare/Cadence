import { View, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Watch,
  CheckCircle2,
  MessageCircle,
} from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME, FONT_WEIGHTS } from "@/lib/design-tokens";

export interface SessionActionsBarProps {
  isUpcoming: boolean;
  isExported: boolean;
  isMoveable: boolean;
  isRestDay: boolean;
  onExportToWatch: () => void;
  onMarkComplete: () => void;
  onAskCoach: () => void;
}

function ActionButton({
  label,
  icon,
  onPress,
  variant = "secondary",
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  variant?: "primary" | "secondary";
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isPrimary = variant === "primary";
  const bg = isPrimary ? LIGHT_THEME.wText : LIGHT_THEME.w1;
  const textColor = isPrimary ? LIGHT_THEME.w1 : LIGHT_THEME.wText;

  return (
    <Animated.View
      style={[
        {
          flex: 1,
          borderRadius: 16,
          backgroundColor: bg,
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.12)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 4,
        },
        animStyle,
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        style={{
          paddingVertical: 14,
          borderRadius: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {icon}
        <Text
          style={{
            fontSize: 14,
            fontFamily: FONT_WEIGHTS.semibold,
            color: textColor,
          }}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function SessionActionsBar({
  isUpcoming,
  isExported,
  isMoveable,
  isRestDay,
  onExportToWatch,
  onMarkComplete,
  onAskCoach,
}: SessionActionsBarProps) {
  const insets = useSafeAreaInsets();

  if (isRestDay) {
    return (
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: LIGHT_THEME.w2,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: insets.bottom + 16,
        }}
      >
        <ActionButton
          label="Ask Coach"
          icon={
            <MessageCircle
              size={16}
              color={LIGHT_THEME.wText}
              strokeWidth={2}
            />
          }
          onPress={onAskCoach}
        />
      </View>
    );
  }

  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: LIGHT_THEME.w2,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: insets.bottom + 16,
      }}
    >
      {isUpcoming ? (
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {!isExported && (
              <ActionButton
                label="Export to Watch"
                icon={
                  <Watch size={16} color={LIGHT_THEME.w1} strokeWidth={2} />
                }
                onPress={onExportToWatch}
                variant="primary"
              />
            )}
            <ActionButton
              label="Mark Complete"
              icon={
                <CheckCircle2
                  size={16}
                  color={LIGHT_THEME.wText}
                  strokeWidth={2}
                />
              }
              onPress={onMarkComplete}
            />
          </View>
          <ActionButton
            label="Ask Coach"
            icon={
              <MessageCircle
                size={16}
                color={LIGHT_THEME.wText}
                strokeWidth={2}
              />
            }
            onPress={onAskCoach}
          />
        </View>
      ) : (
        <ActionButton
          label="Ask Coach"
          icon={
            <MessageCircle
              size={16}
              color={LIGHT_THEME.wText}
              strokeWidth={2}
            />
          }
          onPress={onAskCoach}
        />
      )}
    </View>
  );
}

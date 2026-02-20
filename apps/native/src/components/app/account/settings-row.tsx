import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

export type SettingsRowProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value?: string;
  destructive?: boolean;
  showChevron?: boolean;
  onPress?: () => void;
};

/**
 * Settings Row Component
 * Reference: cadence-full-v9.jsx ProfileTab (lines 679-687)
 *
 * Displays a single settings row with icon, label, optional value, and chevron.
 * The value appears to the left of the chevron when provided.
 */
export function SettingsRow({
  label,
  icon,
  value,
  destructive,
  showChevron = true,
  onPress,
}: SettingsRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "flex-row items-center gap-2.5 px-3.5 py-2.5",
        "active:bg-secondary/80",
        destructive && "active:bg-destructive/10"
      )}
    >
      <View
        className={cn(
          "bg-secondary/60 size-9 items-center justify-center rounded-lg",
          destructive && "bg-destructive/10"
        )}
      >
        <Ionicons
          name={icon}
          size={18}
          className={destructive ? "text-destructive" : "text-muted-foreground"}
        />
      </View>
      <Text
        className={cn(
          "flex-1 text-sm font-medium",
          destructive && "text-destructive"
        )}
      >
        {label}
      </Text>
      <View className="flex-row items-center gap-1.5">
        {value && (
          <Text className="text-sm text-muted-foreground">{value}</Text>
        )}
        {showChevron && (
          <Ionicons
            name="chevron-forward"
            size={16}
            className="text-muted-foreground"
          />
        )}
      </View>
    </Pressable>
  );
}

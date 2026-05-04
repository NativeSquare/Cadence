import { useState, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import { ChevronDown, ChevronRight } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";

type Props = {
  id: string;
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
};

export function Subsection({ id, title, children, defaultExpanded = true }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View className="mb-5">
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
        className="flex-row items-center justify-between py-3.5"
      >
        <View className="flex-row items-center gap-2.5">
          {expanded ? (
            <ChevronDown size={18} color={LIGHT_THEME.wSub} strokeWidth={2} />
          ) : (
            <ChevronRight size={18} color={LIGHT_THEME.wSub} strokeWidth={2} />
          )}
          <Text className="text-[11px] font-coach-semibold text-wMute uppercase tracking-wider">
            {id}
          </Text>
          <Text className="text-[16px] font-coach-semibold text-wText">
            {title}
          </Text>
        </View>
      </Pressable>
      {expanded ? <View className="gap-4 mt-1">{children}</View> : null}
    </View>
  );
}

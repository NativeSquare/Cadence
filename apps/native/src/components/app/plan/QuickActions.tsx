import { View, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import {
  SESSION_TYPE_COLORS,
  LIGHT_THEME,
  type SessionCategory,
} from "@/lib/design-tokens";

const SESSION_TILES: {
  category: SessionCategory;
  label: string;
  description: string;
}[] = [
  { category: "easy", label: "Easy", description: "Recovery / Z2" },
  { category: "specific", label: "Specific", description: "Tempo / Intervals" },
  { category: "long", label: "Long Run", description: "Endurance" },
  { category: "race", label: "Race", description: "Race day" },
];

interface LogRunSectionProps {
  onSelectType: (category: SessionCategory) => void;
}

function SessionTile({
  category,
  label,
  description,
  onPress,
}: {
  category: SessionCategory;
  label: string;
  description: string;
  onPress: () => void;
}) {
  const color = SESSION_TYPE_COLORS[category];

  return (
    <Pressable
      className="flex-1 rounded-2xl px-4 py-3.5 active:scale-[0.97]"
      style={{
        backgroundColor: LIGHT_THEME.w1,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.12)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 4,
      }}
      onPress={onPress}
    >
      <View className="flex-row items-center gap-2 mb-1">
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: color,
          }}
        />
        <Text className="text-[15px] font-coach-semibold text-wText">
          {label}
        </Text>
      </View>
      <Text className="text-[12px] font-coach text-wSub ml-[18px]">
        {description}
      </Text>
    </Pressable>
  );
}

export function LogRunSection({ onSelectType }: LogRunSectionProps) {
  return (
    <View>
      <Text
        className="text-[11px] font-coach-semibold text-wMute px-1 mb-2.5 uppercase"
        style={{ letterSpacing: 0.05 * 11 }}
      >
        Log a Run
      </Text>
      <View className="gap-2.5">
        <View className="flex-row gap-2.5">
          <SessionTile
            category={SESSION_TILES[0].category}
            label={SESSION_TILES[0].label}
            description={SESSION_TILES[0].description}
            onPress={() => onSelectType(SESSION_TILES[0].category)}
          />
          <SessionTile
            category={SESSION_TILES[1].category}
            label={SESSION_TILES[1].label}
            description={SESSION_TILES[1].description}
            onPress={() => onSelectType(SESSION_TILES[1].category)}
          />
        </View>
        <View className="flex-row gap-2.5">
          <SessionTile
            category={SESSION_TILES[2].category}
            label={SESSION_TILES[2].label}
            description={SESSION_TILES[2].description}
            onPress={() => onSelectType(SESSION_TILES[2].category)}
          />
          <SessionTile
            category={SESSION_TILES[3].category}
            label={SESSION_TILES[3].label}
            description={SESSION_TILES[3].description}
            onPress={() => onSelectType(SESSION_TILES[3].category)}
          />
        </View>
      </View>
    </View>
  );
}

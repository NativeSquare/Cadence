import { View } from "react-native";
import { Text } from "@/components/ui/text";

type Props = {
  height: number;
  message: string;
};

export function ChartEmpty({ height, message }: Props) {
  return (
    <View
      className="rounded-xl items-center justify-center px-4"
      style={{
        height,
        backgroundColor: "rgba(0,0,0,0.025)",
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: "rgba(0,0,0,0.10)",
      }}
    >
      <Text className="text-[12px] font-coach text-wMute text-center leading-[17px]">
        {message}
      </Text>
    </View>
  );
}

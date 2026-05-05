import { BlockForm } from "@/components/app/training-plan/block-form";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";

export default function EditBlockScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const block = useQuery(api.agoge.blocks.getBlock, { blockId: id });
  const updateBlock = useMutation(api.agoge.blocks.updateBlock);
  const deleteBlock = useMutation(api.agoge.blocks.deleteBlock);

  if (block === undefined) {
    return (
      <View className="flex-1" style={{ backgroundColor: LIGHT_THEME.w2 }} />
    );
  }

  if (block === null) {
    return (
      <View
        className="pt-safe flex-1 items-center justify-center px-4"
        style={{ backgroundColor: LIGHT_THEME.w2 }}
      >
        <Text
          className="font-coach-medium text-[15px]"
          style={{ color: LIGHT_THEME.wText }}
        >
          Block not found
        </Text>
      </View>
    );
  }

  return (
    <BlockForm
      title="Edit block"
      submitLabel="Save"
      initial={{
        name: block.name,
        type: block.type,
        startDate: block.startDate,
        endDate: block.endDate,
        focus: block.focus,
        order: block.order,
      }}
      onSubmit={async (values) => {
        await updateBlock({
          blockId: id,
          name: values.name,
          type: values.type,
          startDate: values.startDate,
          endDate: values.endDate,
          focus: values.focus,
          order: values.order,
        });
      }}
      onDelete={async () => {
        await deleteBlock({ blockId: id });
      }}
    />
  );
}

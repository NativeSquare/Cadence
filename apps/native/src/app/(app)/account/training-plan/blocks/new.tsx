import { BlockForm } from "@/components/app/training-plan/block-form";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

export default function NewBlockScreen() {
  const blocks = useQuery(api.agoge.blocks.listBlocksForActiveAthletePlan);
  const createBlock = useMutation(api.agoge.blocks.createBlock);

  const defaultOrder =
    blocks && blocks.length > 0
      ? Math.max(...blocks.map((b) => b.order)) + 1
      : 1;

  return (
    <BlockForm
      title="New block"
      submitLabel="Create block"
      defaultOrder={defaultOrder}
      onSubmit={async (values) => {
        await createBlock({
          name: values.name,
          type: values.type,
          startDate: values.startDate,
          endDate: values.endDate,
          focus: values.focus,
          order: values.order,
        });
      }}
    />
  );
}

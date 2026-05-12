import { BlockForm } from "@/components/app/training-plan/block-form";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { useTranslation } from "react-i18next";

export default function NewBlockScreen() {
  const { t } = useTranslation();
  const createBlock = useMutation(api.agoge.blocks.createBlock);

  return (
    <BlockForm
      title={t("account.blocks.newTitle")}
      submitLabel={t("account.blocks.createSubmit")}
      onSubmit={async (values) => {
        await createBlock({
          type: values.type,
          startDate: values.startDate,
          endDate: values.endDate,
          focus: values.focus,
        });
      }}
    />
  );
}

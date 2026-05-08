import type { TFunction } from "i18next";
import { z } from "zod";

export function makeUserProfileSchema(t: TFunction) {
  return z.object({
    name: z.string().min(1, t("validation.nameRequired")),
    image: z.string().optional(),
  });
}

export type UserProfileInput = z.infer<ReturnType<typeof makeUserProfileSchema>>;

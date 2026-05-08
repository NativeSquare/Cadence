import type { TFunction } from "i18next";
import { z } from "zod";

export const SEX_VALUES = ["male", "female", "other"] as const;
export type Sex = (typeof SEX_VALUES)[number];

export function makeAthleteProfileSchema(t: TFunction) {
  return z.object({
    sex: z.enum(SEX_VALUES).optional(),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, t("validation.invalidDate"))
      .optional(),
    weightKg: z
      .number()
      .positive(t("validation.invalidWeight"))
      .max(400, t("validation.invalidWeight"))
      .optional(),
    heightCm: z
      .number()
      .positive(t("validation.invalidHeight"))
      .max(260, t("validation.invalidHeight"))
      .optional(),
  });
}

export type AthleteProfileInput = z.infer<
  ReturnType<typeof makeAthleteProfileSchema>
>;

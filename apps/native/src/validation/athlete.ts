import { z } from "zod";

export const SEX_VALUES = ["male", "female", "other"] as const;
export type Sex = (typeof SEX_VALUES)[number];

export const AthleteProfileSchema = z.object({
  sex: z.enum(SEX_VALUES).optional(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date")
    .optional(),
  weightKg: z.number().positive("Invalid weight").max(400, "Invalid weight").optional(),
  heightCm: z.number().positive("Invalid height").max(260, "Invalid height").optional(),
  maxHr: z
    .number()
    .int("Invalid heart rate")
    .positive("Invalid heart rate")
    .max(250, "Invalid heart rate")
    .optional(),
  restingHr: z
    .number()
    .int("Invalid heart rate")
    .positive("Invalid heart rate")
    .max(150, "Invalid heart rate")
    .optional(),
});

export type AthleteProfileInput = z.infer<typeof AthleteProfileSchema>;

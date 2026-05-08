import type { TFunction } from "i18next";
import { z } from "zod";

export function makeSignInSchema(t: TFunction) {
  return z.object({
    email: z
      .string()
      .min(1, t("validation.emailRequired"))
      .email(t("validation.emailInvalid")),
    password: z.string().min(1, t("validation.passwordRequired")),
  });
}

export type SignInInput = z.infer<ReturnType<typeof makeSignInSchema>>;

export function makeSignUpSchema(t: TFunction) {
  return z
    .object({
      name: z.string().min(1, t("validation.nameRequired")),
      email: z
        .string()
        .min(1, t("validation.emailRequired"))
        .email(t("validation.emailInvalid")),
      password: z
        .string()
        .min(1, t("validation.passwordRequired"))
        .min(8, t("validation.passwordMin", { count: 8 })),
      confirmPassword: z
        .string()
        .min(1, t("validation.confirmPasswordRequired"))
        .min(8, t("validation.confirmPasswordMin", { count: 8 })),
      acceptTerms: z.boolean().refine((value) => value, {
        message: t("validation.acceptTerms"),
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("validation.passwordsDoNotMatch"),
      path: ["confirmPassword"],
    });
}

export type SignUpInput = z.infer<ReturnType<typeof makeSignUpSchema>>;

export function makeVerifyEmailSchema(t: TFunction) {
  return z.object({
    code: z.string().length(6, t("validation.codeIncomplete")),
  });
}

export type VerifyEmailInput = z.infer<ReturnType<typeof makeVerifyEmailSchema>>;

export function makeForgotPasswordSchema(t: TFunction) {
  return z.object({
    email: z
      .string()
      .min(1, t("validation.emailRequired"))
      .email(t("validation.emailInvalid")),
  });
}

export type ForgotPasswordInput = z.infer<
  ReturnType<typeof makeForgotPasswordSchema>
>;

export function makeResetPasswordSchema(t: TFunction) {
  return z.object({
    newPassword: z
      .string()
      .min(1, t("validation.newPasswordRequired"))
      .min(8, t("validation.newPasswordMin", { count: 8 })),
    code: z.string().min(1, t("validation.codeRequired")),
  });
}

export type ResetPasswordInput = z.infer<
  ReturnType<typeof makeResetPasswordSchema>
>;

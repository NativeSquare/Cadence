import type { TFunction } from "i18next";
import { z } from "zod";

export function makeFeedbackSchema(t: TFunction) {
  return z.object({
    type: z.string().min(1, t("validation.feedbackTypeRequired")),
    feedbackText: z.string().min(1, t("validation.feedbackTextRequired")),
    feedbackImages: z.array(z.string()).optional(),
  });
}

export type FeedbackInput = z.infer<ReturnType<typeof makeFeedbackSchema>>;

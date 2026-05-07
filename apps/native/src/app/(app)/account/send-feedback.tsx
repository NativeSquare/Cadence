import { DescribeFeedbackField } from "@/components/app/feedback/describe-feedback";
import { FeedbackTypeField } from "@/components/app/feedback/feedback-type";
import { ImageUploaderField } from "@/components/app/feedback/image-uploader-field";
import { Text } from "@/components/ui/text";
import { useUploadImage } from "@/hooks/use-upload-image";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { FeedbackSchema } from "@/validation/feedback";
import { api } from "@packages/backend/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import z from "zod";

export type FeedbackFormData = {
  type?: string;
  feedbackText?: string;
  feedbackImages?: string[];
};

export default function SendFeedback() {
  const router = useRouter();
  const { t } = useTranslation();
  const [formData, setFormData] = React.useState<FeedbackFormData>();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<{
    type?: string;
    feedbackText?: string;
  }>({});
  const currentUser = useQuery(api.table.users.currentUser);
  const insertFeedback = useMutation(api.table.feedback.insert);
  const { uploadImages } = useUploadImage();

  const handleSubmit = async () => {
    setError(null);
    setFieldErrors({});

    const result = FeedbackSchema.safeParse({
      type: formData?.type ?? "",
      feedbackText: formData?.feedbackText ?? "",
      feedbackImages: formData?.feedbackImages,
    });

    if (!result.success) {
      const tree = z.treeifyError(result.error);

      setFieldErrors({
        type: tree.properties?.type?.errors?.[0],
        feedbackText: tree.properties?.feedbackText?.errors?.[0],
      });
      setError(tree.errors?.[0] ?? null);
      return;
    }

    if (!currentUser?._id) {
      setError(t("account.sendFeedback.errors.notLoggedIn"));
      return;
    }

    setIsLoading(true);

    try {
      const feedbackImageIds =
        formData?.feedbackImages && formData.feedbackImages.length > 0
          ? await uploadImages(formData.feedbackImages)
          : undefined;

      await insertFeedback({
        userId: currentUser._id,
        type: formData?.type ?? "",
        feedbackText: formData?.feedbackText ?? "",
        feedbackImages: feedbackImageIds,
      });
      router.back();
    } catch (err) {
      setError(getConvexErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedbackImagesChange = (images: string[]) => {
    setFormData({
      ...formData,
      feedbackImages: images,
    });
  };

  return (
    <View className="pt-safe flex-1" style={{ backgroundColor: LIGHT_THEME.w2 }}>
      <View
        className="flex-row items-center gap-3 px-4 pb-3 pt-4"
        style={{ borderBottomWidth: 1, borderBottomColor: LIGHT_THEME.wBrd }}
      >
        <Pressable
          onPress={() => router.back()}
          className="size-9 items-center justify-center rounded-full active:opacity-70"
          style={{ backgroundColor: LIGHT_THEME.w3 }}
        >
          <Ionicons name="chevron-back" size={20} color={LIGHT_THEME.wText} />
        </Pressable>
        <Text
          className="flex-1 font-coach-bold text-lg"
          style={{ color: LIGHT_THEME.wText }}
        >
          {t("account.sendFeedback.title")}
        </Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6"
      >
        <View className="w-full max-w-md gap-6 self-center">
          <Text
            className="font-coach text-[13px]"
            style={{ color: LIGHT_THEME.wMute }}
          >
            {t("account.sendFeedback.helper")}
          </Text>

          <FeedbackTypeField
            onSelect={(option) =>
              setFormData({
                ...formData,
                type: option,
              })
            }
            isSelected={(option) => formData?.type === option}
            error={fieldErrors.type}
          />

          <DescribeFeedbackField
            value={formData?.feedbackText}
            onChange={(value) =>
              setFormData({
                ...formData,
                feedbackText: value,
              })
            }
            error={fieldErrors.feedbackText}
          />

          <ImageUploaderField
            images={formData?.feedbackImages ?? []}
            onImagesChange={handleFeedbackImagesChange}
            maxImages={3}
            uploadOptions={["camera", "gallery"]}
          />
        </View>
      </ScrollView>

      <View className="w-full max-w-md gap-2 self-center px-4 pb-4 mb-safe">
        {error && (
          <Text
            className="text-center font-coach text-sm"
            style={{ color: COLORS.red }}
          >
            {error}
          </Text>
        )}
        <Pressable
          onPress={handleSubmit}
          disabled={isLoading}
          className="items-center rounded-2xl py-3.5 active:opacity-90"
          style={{
            backgroundColor: isLoading ? LIGHT_THEME.w3 : LIGHT_THEME.wText,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              className="font-coach-bold text-sm"
              style={{
                color: isLoading ? LIGHT_THEME.wMute : "#FFFFFF",
              }}
            >
              {t("account.sendFeedback.submit")}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

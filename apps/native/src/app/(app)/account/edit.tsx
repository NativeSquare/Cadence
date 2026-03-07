import { NameField } from "@/components/app/account/name-field";
import { ProfilePictureField } from "@/components/app/account/profile-picture-field";
import { Text } from "@/components/ui/text";
import { useUploadImage } from "@/hooks/use-upload-image";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { UserProfileSchema } from "@/validation/account";
import { api } from "@packages/backend/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import z from "zod";

type ProfileFormData = {
  name: string;
  image: string | null;
};

export default function EditProfileScreen() {
  const router = useRouter();
  const user = useQuery(api.table.users.currentUser);
  const patchUser = useMutation(api.table.users.patch);
  const { uploadImage, isUploading } = useUploadImage();

  const [formData, setFormData] = React.useState<ProfileFormData>({
    name: user?.name ?? "",
    image: user?.image ?? null,
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<{
    name?: string;
    image?: string;
  }>({});

  const hasChanges =
    formData.name.trim() !== (user?.name ?? "") ||
    formData.image !== (user?.image ?? null);

  const isBusy = isLoading || isUploading;

  const handleSubmit = async () => {
    setError(null);
    setFieldErrors({});

    const result = UserProfileSchema.safeParse(formData);

    if (!result.success) {
      const tree = z.treeifyError(result.error);

      setFieldErrors({
        name: tree.properties?.name?.errors?.[0],
        image: tree.properties?.image?.errors?.[0],
      });
      setError(tree.errors?.[0] ?? null);
      return;
    }

    if (!user?._id) {
      setError("You must be logged in to update your profile");
      return;
    }

    setIsLoading(true);

    try {
      let imageUrl = formData.image;

      if (imageUrl && !imageUrl.startsWith("http")) {
        imageUrl = await uploadImage(imageUrl);
      }

      await patchUser({
        id: user._id,
        data: {
          name: formData.name.trim(),
          image: imageUrl ?? undefined,
        },
      });

      router.back();
    } catch (err) {
      setError(getConvexErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="mt-safe flex-1" style={{ backgroundColor: LIGHT_THEME.w2 }}>
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
          Edit Profile
        </Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6"
      >
        <View className="w-full max-w-md gap-6 self-center">
          <ProfilePictureField
            image={formData.image}
            name={formData.name}
            onImageChange={(uri) =>
              setFormData((prev) => ({ ...prev, image: uri }))
            }
            onImageRemove={() =>
              setFormData((prev) => ({ ...prev, image: null }))
            }
            error={fieldErrors.image}
          />

          <NameField
            value={formData.name}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, name: value }))
            }
            error={fieldErrors.name}
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
          disabled={isBusy || !hasChanges}
          className="items-center rounded-2xl py-3.5 active:opacity-90"
          style={{
            backgroundColor:
              isBusy || !hasChanges ? LIGHT_THEME.w3 : LIGHT_THEME.wText,
          }}
        >
          {isBusy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              className="font-coach-bold text-sm"
              style={{
                color: isBusy || !hasChanges ? LIGHT_THEME.wMute : "#FFFFFF",
              }}
            >
              Save
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

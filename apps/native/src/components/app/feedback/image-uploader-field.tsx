import { ImageUploader } from "@/components/custom/image-uploader";
import { type SelectedImageAsset } from "@/components/shared/upload-media-bottom-sheet-modal";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image, Pressable, View } from "react-native";

export type ImageUploaderFieldProps = {
  label?: string;
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  uploadOptions?: ("camera" | "gallery")[];
  error?: string;
};

export function ImageUploaderField({
  label = "Add Photos",
  images,
  onImagesChange,
  maxImages = 3,
  uploadOptions = ["camera", "gallery"],
  error,
}: ImageUploaderFieldProps) {
  const handleImageSelected = (image: ImagePicker.ImagePickerAsset | SelectedImageAsset) => {
    if (images.length < maxImages) {
      onImagesChange([...images, image.uri]);
    }
  };

  const handleRemoveImage = (index: number) => {
    const updated = [...images];
    updated.splice(index, 1);
    onImagesChange(updated);
  };

  const canAddMore = images.length < maxImages;

  return (
    <View className="gap-2">
      {label && (
        <Text
          className="font-coach-semibold text-[11px] uppercase tracking-wider"
          style={{ color: LIGHT_THEME.wMute }}
        >
          {label}
        </Text>
      )}

      <View className="gap-4">
        {images.length > 0 && (
          <View className="flex-row gap-3">
            {images.map((uri, index) => (
              <View key={index} className="relative">
                <Image
                  source={{ uri }}
                  className="size-24 rounded-xl"
                  resizeMode="cover"
                />
                <Pressable
                  onPress={() => handleRemoveImage(index)}
                  className="absolute right-1.5 top-1.5 size-6 items-center justify-center rounded-full"
                  style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
                >
                  <Ionicons name="close" size={14} color="#FFFFFF" />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <ImageUploader
          onImageSelected={handleImageSelected}
          uploadOptions={uploadOptions}
          disabled={!canAddMore}
        />
      </View>

      {error && (
        <Text
          className="mt-1 font-coach text-xs"
          style={{ color: COLORS.red }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

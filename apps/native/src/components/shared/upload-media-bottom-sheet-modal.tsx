import { BottomSheetModal } from "@/components/custom/bottom-sheet";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { BottomSheetModal as GorhomBottomSheetModal } from "@gorhom/bottom-sheet";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Camera, FileText, Image, LucideIcon } from "lucide-react-native";
import * as React from "react";
import { Alert, Linking, Platform, Pressable, View } from "react-native";

/** Asset-like shape for a single selected image (picker or document) */
export type SelectedImageAsset = { uri: string; width?: number; height?: number };

/** Richer asset shape that distinguishes images from arbitrary documents (e.g. PDFs). */
export type SelectedAttachmentAsset = {
  uri: string;
  kind: "image" | "file";
  mimeType?: string;
  name?: string;
  width?: number;
  height?: number;
};

interface UploadMediaBottomSheetModalProps {
  bottomSheetModalRef: React.RefObject<GorhomBottomSheetModal | null>;
  /** Legacy image-only callback. Prefer `onAttachmentSelected`. */
  onImageSelected?: (image: ImagePicker.ImagePickerAsset | SelectedImageAsset) => void;
  /** Legacy multi-image callback. Prefer `onAttachmentsSelected`. */
  onImagesSelected?: (images: (ImagePicker.ImagePickerAsset | SelectedImageAsset)[]) => void;
  /** Single-attachment callback supporting images and files (PDFs etc.). */
  onAttachmentSelected?: (asset: SelectedAttachmentAsset) => void;
  /** Multi-attachment callback supporting images and files. */
  onAttachmentsSelected?: (assets: SelectedAttachmentAsset[]) => void;
  options?: ("camera" | "gallery" | "files")[];
  allowsEditing?: boolean;
  allowsMultipleSelection?: boolean;
  aspect?: [number, number];
}

export function UploadMediaBottomSheetModal({
  bottomSheetModalRef,
  onImageSelected,
  onImagesSelected,
  onAttachmentSelected,
  onAttachmentsSelected,
  options = ["camera", "gallery"],
  allowsEditing = false,
  allowsMultipleSelection = false,
  aspect,
}: UploadMediaBottomSheetModalProps) {
  const emitImageAsset = (asset: ImagePicker.ImagePickerAsset) => {
    const attachment: SelectedAttachmentAsset = {
      uri: asset.uri,
      kind: "image",
      mimeType: asset.mimeType ?? "image/jpeg",
      name: asset.fileName ?? undefined,
      width: asset.width,
      height: asset.height,
    };
    if (onAttachmentSelected) onAttachmentSelected(attachment);
    else if (onImageSelected) onImageSelected(asset);
  };

  const emitImageAssets = (assets: ImagePicker.ImagePickerAsset[]) => {
    if (assets.length === 0) return;
    if (onAttachmentsSelected) {
      onAttachmentsSelected(
        assets.map((a) => ({
          uri: a.uri,
          kind: "image",
          mimeType: a.mimeType ?? "image/jpeg",
          name: a.fileName ?? undefined,
          width: a.width,
          height: a.height,
        })),
      );
    } else if (onAttachmentSelected) {
      emitImageAsset(assets[0]);
    } else if (onImagesSelected) {
      onImagesSelected(assets);
    } else if (onImageSelected) {
      onImageSelected(assets[0]);
    }
  };

  const handleTakePicture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant access to your camera to take photos.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {
                Linking.openSettings();
              },
            },
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: allowsEditing,
        aspect: aspect,
        quality: 1.0,
      });

      if (!result.canceled && result.assets.length > 0) {
        emitImageAssets(result.assets);
        bottomSheetModalRef.current?.dismiss();
      }
    } catch (error) {
      console.error("Error taking picture:", error);
      Alert.alert("Error", "Failed to take picture.");
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant access to your photo library to select images.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {
                Linking.openSettings();
              },
            },
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: allowsMultipleSelection,
        allowsEditing: allowsEditing,
        quality: 1.0,
        selectionLimit: allowsMultipleSelection ? 10 : 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        emitImageAssets(result.assets);
        bottomSheetModalRef.current?.dismiss();
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image from gallery.");
    }
  };

  const handlePickFromFiles = async () => {
    try {
      // Accept images + PDFs. Claude Sonnet handles both natively.
      const documentTypes =
        Platform.OS === "ios"
          ? ["public.image", "com.adobe.pdf"]
          : ["image/*", "application/pdf"];

      const result = await DocumentPicker.getDocumentAsync({
        type: documentTypes,
        copyToCacheDirectory: true,
        multiple: allowsMultipleSelection,
      });

      if (result.canceled) return;

      const attachments: SelectedAttachmentAsset[] = (result.assets ?? []).map((f) => {
        const mime = f.mimeType ?? "";
        const isImage = mime.startsWith("image/");
        return {
          uri: f.uri,
          kind: isImage ? "image" : "file",
          mimeType: mime || (f.name?.toLowerCase().endsWith(".pdf") ? "application/pdf" : undefined),
          name: f.name,
        };
      });

      if (attachments.length === 0) return;

      if (onAttachmentsSelected && attachments.length > 1) {
        onAttachmentsSelected(attachments);
      } else if (onAttachmentSelected) {
        onAttachmentSelected(attachments[0]);
      } else if (onImagesSelected && attachments.length > 1) {
        // Legacy fallback — only forwards image-shaped assets.
        onImagesSelected(
          attachments
            .filter((a) => a.kind === "image")
            .map((a) => ({ uri: a.uri, width: a.width, height: a.height })),
        );
      } else if (onImageSelected && attachments[0].kind === "image") {
        onImageSelected({ uri: attachments[0].uri });
      }
      bottomSheetModalRef.current?.dismiss();
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Error", "Failed to pick file.");
    }
  };

  const optionMap: Record<
    "camera" | "gallery" | "files",
    {
      icon: LucideIcon;
      label: string;
      onPress: () => void;
    }
  > = {
    camera: {
      icon: Camera,
      label: "Take Photo",
      onPress: handleTakePicture,
    },
    gallery: {
      icon: Image,
      label: "Photo Library",
      onPress: handlePickFromGallery,
    },
    files: {
      icon: FileText,
      label: "Documents",
      onPress: handlePickFromFiles,
    },
  };

  const displayOptions = options.map((option) => optionMap[option]);

  return (
    <BottomSheetModal ref={bottomSheetModalRef}>
      <View className="gap-4 px-4 pt-3.5">
        <Text className="text-lg font-semibold text-foreground">
          Select Media
        </Text>
        <View className="flex-row gap-3">
          {displayOptions.map((option, index) => (
            <Pressable
              key={index}
              onPress={option.onPress}
              className="flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card p-4"
            >
              <View className="size-9 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
                <Icon as={option.icon} size={20} className="text-primary" />
              </View>
              <Text className="text-center text-xs font-medium text-foreground">
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </BottomSheetModal>
  );
}

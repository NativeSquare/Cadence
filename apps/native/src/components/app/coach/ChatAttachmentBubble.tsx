import { View, Image, Text, Pressable, Linking } from "react-native";
import { FileText } from "lucide-react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { LIGHT_THEME } from "@/lib/design-tokens";

export interface ChatAttachmentBubbleProps {
  mediaType: string;
  url: string;
  filename?: string;
  isUser: boolean;
}

const IMAGE_SIZE = 180;

export function ChatAttachmentBubble({
  mediaType,
  url,
  filename,
  isUser,
}: ChatAttachmentBubbleProps) {
  const isImage = mediaType.startsWith("image/");

  const wrapperClass = isUser ? "flex-row justify-end" : "flex-row justify-start";

  return (
    <Animated.View entering={FadeIn.duration(200)} className={wrapperClass}>
      {isImage ? (
        <Pressable onPress={() => Linking.openURL(url)} accessibilityLabel="Open image">
          <Image
            source={{ uri: url }}
            style={{
              width: IMAGE_SIZE,
              height: IMAGE_SIZE,
              borderRadius: 16,
              backgroundColor: "rgba(0,0,0,0.05)",
            }}
            resizeMode="cover"
          />
        </Pressable>
      ) : (
        <Pressable
          onPress={() => Linking.openURL(url)}
          className="flex-row items-center gap-2 rounded-xl bg-w1 px-3 py-2.5"
          style={{
            borderWidth: 1,
            borderColor: "rgba(0,0,0,0.08)",
            maxWidth: 240,
          }}
          accessibilityLabel={`Open ${filename ?? "document"}`}
        >
          <FileText size={20} color={LIGHT_THEME.wSub} strokeWidth={2} />
          <Text
            numberOfLines={1}
            style={{
              fontFamily: "Outfit-Regular",
              fontSize: 14,
              color: LIGHT_THEME.wText,
              maxWidth: 200,
            }}
          >
            {filename ?? "Document"}
          </Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

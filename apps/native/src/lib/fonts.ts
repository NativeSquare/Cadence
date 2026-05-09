import {
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
} from "@expo-google-fonts/outfit";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from "@expo-google-fonts/jetbrains-mono";

export const fontAssets = {
  "Outfit-Light": Outfit_300Light,
  "Outfit-Regular": Outfit_400Regular,
  "Outfit-Medium": Outfit_500Medium,
  "Outfit-SemiBold": Outfit_600SemiBold,
  "Outfit-Bold": Outfit_700Bold,
  "Outfit-ExtraBold": Outfit_800ExtraBold,
  "JetBrainsMono-Regular": JetBrainsMono_400Regular,
  "JetBrainsMono-Medium": JetBrainsMono_500Medium,
} as const;

export const FONT_FAMILY = {
  coach: "Outfit",
  mono: "JetBrainsMono",
} as const;

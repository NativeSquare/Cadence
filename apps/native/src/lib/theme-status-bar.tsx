import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { useEffect } from "react";
import { Platform } from "react-native";

/**
 * Configures system bars (status bar + Android navigation bar).
 *
 * - Status bar forced to dark (dark icons on light background)
 * - Android navigation bar is hidden for immersive experience
 */
export function ThemeStatusBar() {
  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setVisibilityAsync("hidden");
      NavigationBar.setBehaviorAsync("overlay-swipe");
    }
  }, []);

  return <StatusBar style="dark" />;
}

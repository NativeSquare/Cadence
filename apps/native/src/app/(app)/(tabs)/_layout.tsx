import { Tabs } from "expo-router";
import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, MessageSquare, Activity, User } from "lucide-react-native";
import { LIGHT_THEME } from "@/lib/design-tokens";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

/**
 * Main app tab navigation with 4 tabs:
 * - Today (Plan) - Daily training plan and session details
 * - Coach - AI coaching conversation
 * - Analytics - Training metrics and progress charts
 * - Profile - User profile and settings
 *
 * Custom tab bar matching prototype design exactly.
 * Reference: cadence-full-v9.jsx BottomNav component (lines 700-722)
 *
 * Styling from prototype:
 * - Background: T.w2 (#F8F8F6) - off-white/cream
 * - Border top: 1px solid T.wBrd (rgba(0,0,0,0.06))
 * - Padding: 10px 8px 30px (30px bottom for home indicator)
 * - Active color: T.wText (#1A1A1A)
 * - Inactive color: T.wMute (#A3A3A0)
 * - Icon size: 21x21
 * - Label font: fontSize 10, weight 600 (active) / 400 (inactive)
 */

// Tab configuration matching prototype (lines 701-706)
const TAB_CONFIG = [
  { name: "index", label: "Today", Icon: Home },
  { name: "coach", label: "Coach", Icon: MessageSquare },
  { name: "analytics", label: "Analytics", Icon: Activity },
  { name: "profile", label: "Profile", Icon: User },
] as const;

/**
 * Custom TabBar component matching prototype design
 * Reference: cadence-full-v9.jsx BottomNav (lines 707-721)
 */
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  // Prototype uses 30px bottom padding for home indicator area
  const bottomPadding = Math.max(insets.bottom, 30);

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        paddingTop: 10,
        paddingHorizontal: 8,
        paddingBottom: bottomPadding,
        backgroundColor: LIGHT_THEME.w2,
        borderTopWidth: 1,
        borderTopColor: LIGHT_THEME.wBrd,
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const config = TAB_CONFIG.find((t) => t.name === route.name);

        if (!config) return null;

        const { Icon, label } = config;
        const color = isFocused ? LIGHT_THEME.wText : LIGHT_THEME.wMute;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={{
              alignItems: "center",
              gap: 3,
              paddingVertical: 4,
              paddingHorizontal: 14,
            }}
          >
            <Icon size={21} color={color} strokeWidth={1.8} />
            <Text
              style={{
                fontSize: 10,
                fontWeight: isFocused ? "600" : "400",
                color,
                fontFamily: isFocused ? "Outfit-SemiBold" : "Outfit-Regular",
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="coach" />
      <Tabs.Screen name="analytics" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

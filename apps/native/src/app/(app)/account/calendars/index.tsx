import {
  AppleCalendarLogo,
  GoogleCalendarLogo,
} from "@/components/icons/provider-logos";
import { Text } from "@/components/ui/text";
import { LIGHT_THEME } from "@/lib/design-tokens";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";

type CalendarProviderDef = {
  key: "google" | "apple";
  name: string;
  description: string;
  logo: (props: { size?: number; color?: string }) => React.ReactNode;
};

const COMING_SOON_CALENDARS: CalendarProviderDef[] = [
  {
    key: "google",
    name: "Google Calendar",
    description: "Sync sessions with your Google Calendar",
    logo: GoogleCalendarLogo,
  },
  {
    key: "apple",
    name: "Apple Calendar",
    description: "Sync sessions with your Apple Calendar",
    logo: AppleCalendarLogo,
  },
];

export default function CalendarsScreen() {
  const router = useRouter();

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
          Calendars
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6"
      >
        <View className="w-full max-w-md gap-6 self-center">
          <Text
            className="font-coach text-[13px]"
            style={{ color: LIGHT_THEME.wMute }}
          >
            Connect a calendar to see your sessions alongside the rest of your
            schedule. Calendar sync is coming soon.
          </Text>

          <View className="gap-3">
            <Text
              className="font-coach-semibold text-[13px] uppercase tracking-wider"
              style={{ color: LIGHT_THEME.wMute }}
            >
              Not yet connected
            </Text>

            <View
              className="overflow-hidden rounded-[18px]"
              style={{
                backgroundColor: LIGHT_THEME.w1,
                borderWidth: 1,
                borderColor: LIGHT_THEME.wBrd,
              }}
            >
              {COMING_SOON_CALENDARS.map((provider, index) => {
                const isLast = index === COMING_SOON_CALENDARS.length - 1;
                return (
                  <View
                    key={provider.key}
                    className="flex-row items-center gap-3.5 px-4 py-4"
                    style={
                      isLast
                        ? { opacity: 0.55 }
                        : {
                            opacity: 0.55,
                            borderBottomWidth: 1,
                            borderBottomColor: LIGHT_THEME.wBrd,
                          }
                    }
                  >
                    <View
                      className="size-[38px] shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: LIGHT_THEME.w3 }}
                    >
                      <provider.logo size={22} />
                    </View>

                    <View className="flex-1">
                      <Text
                        className="font-coach-medium text-[15px]"
                        style={{ color: LIGHT_THEME.wText }}
                      >
                        {provider.name}
                      </Text>
                      <Text
                        className="mt-0.5 font-coach text-xs"
                        style={{ color: LIGHT_THEME.wMute }}
                      >
                        {provider.description}
                      </Text>
                    </View>

                    <View
                      className="rounded-full px-3 py-1.5"
                      style={{ backgroundColor: LIGHT_THEME.w3 }}
                    >
                      <Text
                        className="font-coach-medium text-[12px]"
                        style={{ color: LIGHT_THEME.wMute }}
                      >
                        Coming soon
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

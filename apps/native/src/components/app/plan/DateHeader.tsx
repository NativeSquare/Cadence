/**
 * DateHeader - Header showing date and greeting
 *
 * Two variants:
 * - full: Complete header with date and greeting
 * - collapsed: Condensed header for sticky bar when scrolled
 */

import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import {
  formatGreeting,
  formatLongDate,
  formatShortDate,
} from "@/lib/format";
import { useLanguage } from "@/lib/i18n";

interface DateHeaderProps {
  variant: "full" | "collapsed";
  userName: string;
}

function FullDateHeader({ userName }: { userName: string }) {
  const { t } = useTranslation();
  const locale = useLanguage();
  const greeting = formatGreeting(t);
  const dateStr = formatLongDate(locale);

  return (
    <View>
      <Text className="text-sm font-coach text-g4">{dateStr}</Text>
      <Text
        className="text-[28px] font-coach-bold text-g1 mt-0.5"
        style={{ letterSpacing: -0.03 * 28, lineHeight: 31 }}
      >
        {greeting},{" "}
        <Text className="text-[28px] font-coach-bold text-lime">{userName}</Text>
      </Text>
    </View>
  );
}

function CollapsedDateHeader() {
  const { t } = useTranslation();
  const locale = useLanguage();
  const shortDate = formatShortDate(locale);

  return (
    <View className="flex-row items-center gap-2.5">
      <Text className="text-[17px] font-coach-bold text-g1">{t("plan.today")}</Text>
      <Text className="text-[13px] font-coach text-g4">{shortDate}</Text>
    </View>
  );
}

export function DateHeader({ variant, userName }: DateHeaderProps) {
  if (variant === "collapsed") {
    return <CollapsedDateHeader />;
  }
  return <FullDateHeader userName={userName} />;
}

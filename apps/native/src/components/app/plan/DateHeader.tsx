/**
 * DateHeader - Header showing date and greeting
 * Reference: cadence-full-v9.jsx TodayTab header (lines 144-156)
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
  /** Display variant */
  variant: "full" | "collapsed";
  /** User's name for greeting */
  userName: string;
  /** Current week number */
  weekNumber: number;
}

/**
 * Full DateHeader variant
 * Shows date and personalized greeting
 */
function FullDateHeader({ userName }: Omit<DateHeaderProps, "variant" | "weekNumber">) {
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

/**
 * Collapsed DateHeader variant
 * Condensed header shown in sticky bar when scrolled
 * Reference: prototype lines 130-141
 */
function CollapsedDateHeader({ userName, weekNumber }: Omit<DateHeaderProps, "variant">) {
  const { t } = useTranslation();
  const locale = useLanguage();
  const shortDate = formatShortDate(locale);

  return (
    <View className="flex-row items-center justify-between">
      {/* Left side: Today label and date */}
      <View className="flex-row items-center gap-2.5">
        <Text className="text-[17px] font-coach-bold text-g1">{t("plan.today")}</Text>
        <Text className="text-[13px] font-coach text-g4">{shortDate}</Text>
      </View>

      {/* Right side: Week indicator */}
      <View className="flex-row items-center gap-1.5">
        <View className="w-1.5 h-1.5 rounded-full bg-lime" />
        <Text className="text-xs font-coach-semibold text-g3">
          {t("plan.weekN", { week: weekNumber })}
        </Text>
      </View>
    </View>
  );
}

/**
 * DateHeader component
 * Renders either full or collapsed variant based on props
 */
export function DateHeader({ variant, userName, weekNumber }: DateHeaderProps) {
  if (variant === "collapsed") {
    return <CollapsedDateHeader userName={userName} weekNumber={weekNumber} />;
  }
  return <FullDateHeader userName={userName} />;
}

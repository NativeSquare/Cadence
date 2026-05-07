import { Component, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { View, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { AnalyticsScreen } from "@/components/app/analytics/AnalyticsScreen";

/**
 * Analytics Tab - Training analytics and progress visualization
 * Reference: Story 10.4 - Analytics Screen
 *
 * Wrapped in an error boundary to catch Convex query errors,
 * Skia/chart rendering failures, and other runtime exceptions
 * that would otherwise crash the entire app.
 */

interface State {
  error: Error | null;
}

class AnalyticsErrorBoundary extends Component<
  { children: ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <AnalyticsErrorFallback
          message={this.state.error.message}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

function AnalyticsErrorFallback({
  message,
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View className="flex-1 bg-w2 items-center justify-center p-6">
      <Text className="text-red text-center text-[16px] font-coach-semibold mb-2">
        {t("analytics.errorTitle")}
      </Text>
      <Text className="text-wMute text-center text-[13px] font-coach mb-6">
        {message || t("analytics.errorFallback")}
      </Text>
      <Pressable
        onPress={onRetry}
        className="px-6 py-3 rounded-xl bg-black"
      >
        <Text className="text-white text-[14px] font-coach-semibold">
          {t("analytics.tryAgain")}
        </Text>
      </Pressable>
    </View>
  );
}

export default function Analytics() {
  return (
    <AnalyticsErrorBoundary>
      <AnalyticsScreen />
    </AnalyticsErrorBoundary>
  );
}

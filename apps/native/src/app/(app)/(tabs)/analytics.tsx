import { Component, type ReactNode } from "react";
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
        <View className="flex-1 bg-w2 items-center justify-center p-6">
          <Text className="text-red text-center text-[16px] font-coach-semibold mb-2">
            Unable to load analytics
          </Text>
          <Text className="text-wMute text-center text-[13px] font-coach mb-6">
            {this.state.error.message || "Something went wrong"}
          </Text>
          <Pressable
            onPress={this.handleRetry}
            className="px-6 py-3 rounded-xl bg-black"
          >
            <Text className="text-white text-[14px] font-coach-semibold">
              Try Again
            </Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function Analytics() {
  return (
    <AnalyticsErrorBoundary>
      <AnalyticsScreen />
    </AnalyticsErrorBoundary>
  );
}

/**
 * Tool Loading Component
 *
 * Shows shimmer/skeleton loading state while tool is streaming.
 * Animates entrance smoothly using design system tokens.
 *
 * Source: Story 2.2 - AC#2
 */

import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

// =============================================================================
// Types
// =============================================================================

interface ToolLoadingProps {
  /** Expected tool type to show appropriate skeleton shape */
  toolName?: string;
  /** Additional className for styling */
  className?: string;
}

// =============================================================================
// Shimmer Animation
// =============================================================================

function useShimmerAnimation() {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [shimmerAnim]);

  return shimmerAnim;
}

// =============================================================================
// Skeleton Components
// =============================================================================

function SkeletonLine({
  width,
  shimmerAnim,
}: {
  width: `${number}%`;
  shimmerAnim: Animated.Value;
}) {
  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <Animated.View
      style={{ opacity, width }}
      className="h-4 bg-white/10 rounded"
    />
  );
}

function MultipleChoiceSkeleton({
  shimmerAnim,
}: {
  shimmerAnim: Animated.Value;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={{ opacity: fadeAnim }} className="gap-3">
      {/* Option skeletons */}
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          className="rounded-xl bg-white/5 border border-white/10 p-4"
        >
          <SkeletonLine width={"60%" as const} shimmerAnim={shimmerAnim} />
        </View>
      ))}
    </Animated.View>
  );
}

function OpenInputSkeleton({ shimmerAnim }: { shimmerAnim: Animated.Value }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View className="rounded-xl bg-white/5 border border-white/10 p-4 h-14">
        <SkeletonLine width={"40%" as const} shimmerAnim={shimmerAnim} />
      </View>
    </Animated.View>
  );
}

function ConfirmationSkeleton({ shimmerAnim }: { shimmerAnim: Animated.Value }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={{ opacity: fadeAnim }} className="gap-4">
      <View className="rounded-xl bg-white/5 border border-white/10 p-4 gap-3">
        <SkeletonLine width={"30%" as const} shimmerAnim={shimmerAnim} />
        <SkeletonLine width={"80%" as const} shimmerAnim={shimmerAnim} />
        <SkeletonLine width={"60%" as const} shimmerAnim={shimmerAnim} />
      </View>
      <View className="flex-row gap-3">
        <View className="flex-1 rounded-xl bg-white/5 border border-white/10 h-12" />
        <View className="flex-1 rounded-xl bg-white/5 border border-white/10 h-12" />
      </View>
    </Animated.View>
  );
}

function GenericSkeleton({ shimmerAnim }: { shimmerAnim: Animated.Value }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View className="rounded-xl bg-white/5 border border-white/10 p-4 gap-2">
        <SkeletonLine width={"70%" as const} shimmerAnim={shimmerAnim} />
        <SkeletonLine width={"50%" as const} shimmerAnim={shimmerAnim} />
      </View>
    </Animated.View>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function ToolLoading({ toolName, className }: ToolLoadingProps) {
  const shimmerAnim = useShimmerAnimation();

  const renderSkeleton = () => {
    switch (toolName) {
      case "renderMultipleChoice":
        return <MultipleChoiceSkeleton shimmerAnim={shimmerAnim} />;
      case "renderOpenInput":
        return <OpenInputSkeleton shimmerAnim={shimmerAnim} />;
      case "renderConfirmation":
        return <ConfirmationSkeleton shimmerAnim={shimmerAnim} />;
      default:
        return <GenericSkeleton shimmerAnim={shimmerAnim} />;
    }
  };

  return <View className={cn("", className)}>{renderSkeleton()}</View>;
}

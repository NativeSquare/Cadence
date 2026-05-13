import {
  BottomSheetBackdrop as GorhomBottomSheetBackdrop,
  BottomSheetModal as GorhomBottomSheetModal,
  BottomSheetView as GorhomBottomSheetView,
  BottomSheetScrollView as GorhomBottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useColorScheme } from "nativewind";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface BottomSheetModalProps {
  ref: React.RefObject<GorhomBottomSheetModal | null>;
  children: React.ReactNode;
  /** Custom background color */
  backgroundColor?: string;
  /** Custom border radius for top corners */
  borderRadius?: number;
  /** Called when the sheet is dismissed */
  onDismiss?: () => void;
  /** Use scrollable content area instead of fixed view */
  scrollable?: boolean;
  /** Snap points (e.g. ["85%"]). Omit for dynamic sizing. */
  snapPoints?: (string | number)[];
}

export type BottomSheetModalType = BottomSheetModalProps;

export function BottomSheetModal({
  ref,
  children,
  backgroundColor,
  borderRadius = 12,
  onDismiss,
  scrollable = false,
  snapPoints,
}: BottomSheetModalProps) {
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === "dark";

  const bgColor = backgroundColor ?? (isDark ? "#121212" : "#FFFFFF");

  const ContentWrapper = scrollable
    ? GorhomBottomSheetScrollView
    : GorhomBottomSheetView;

  // BottomSheetView positions children via `style`; BottomSheetScrollView needs
  // padding on `contentContainerStyle` for it to actually push content above
  // the home indicator.
  const paddingProps = scrollable
    ? { contentContainerStyle: { paddingBottom: insets.bottom + 10 } }
    : { style: { paddingBottom: insets.bottom + 10 } };

  return (
    <GorhomBottomSheetModal
      ref={ref}
      stackBehavior="replace"
      onDismiss={onDismiss}
      {...(snapPoints ? { snapPoints, enableDynamicSizing: false } : {})}
      backgroundStyle={{
        backgroundColor: bgColor,
      }}
      handleIndicatorStyle={{
        backgroundColor: isDark ? "#262626" : "#E5E5E5",
        width: 40,
        height: 5,
      }}
      handleStyle={{
        backgroundColor: bgColor,
        borderTopLeftRadius: borderRadius,
        borderTopRightRadius: borderRadius,
      }}
      backdropComponent={(props) => (
        <GorhomBottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.5}
        />
      )}
    >
      <ContentWrapper {...paddingProps}>{children}</ContentWrapper>
    </GorhomBottomSheetModal>
  );
}

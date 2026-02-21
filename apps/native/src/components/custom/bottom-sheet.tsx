import { THEME } from "@/lib/theme";
import {
  BottomSheetBackdrop as GorhomBottomSheetBackdrop,
  BottomSheetModal as GorhomBottomSheetModal,
  BottomSheetView as GorhomBottomSheetView,
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
}

export type BottomSheetModalType = BottomSheetModalProps;

export function BottomSheetModal({
  ref,
  children,
  backgroundColor,
  borderRadius = 12,
}: BottomSheetModalProps) {
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();

  const bgColor =
    backgroundColor ??
    (colorScheme === "dark"
      ? "#121212"
      : THEME[colorScheme ?? "light"].background);

  return (
    <GorhomBottomSheetModal
      ref={ref}
      stackBehavior="replace"
      backgroundStyle={{
        backgroundColor: bgColor,
      }}
      handleIndicatorStyle={{
        backgroundColor:
          colorScheme === "dark"
            ? THEME[colorScheme ?? "light"].secondary
            : THEME[colorScheme ?? "light"].input,
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
      <GorhomBottomSheetView style={{ paddingBottom: insets.bottom + 10 }}>
        {children}
      </GorhomBottomSheetView>
    </GorhomBottomSheetModal>
  );
}

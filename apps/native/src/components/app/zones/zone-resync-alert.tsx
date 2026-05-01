import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import { getConvexErrorMessage } from "@/utils/getConvexErrorMessage";
import { ZoneKind } from "@nativesquare/agoge/schema";
import React from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

export type ZoneResyncAlertProps = {
  kind: ZoneKind;
  canResync: boolean;
  onResync: (args: { kind: ZoneKind }) => Promise<unknown>;
};

export function ZoneResyncAlert({
  kind,
  canResync,
  onResync,
}: ZoneResyncAlertProps) {
  const [confirming, setConfirming] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    setBusy(true);
    try {
      await onResync({ kind });
      // On success the zone's source flips to "system" and this alert unmounts.
    } catch (err) {
      setError(getConvexErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <View
      className="gap-3 rounded-[14px] px-4 py-3"
      style={{
        backgroundColor: COLORS.ylwDim,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.ylw,
      }}
    >
      <Text
        className="font-coach text-[14px] leading-5"
        style={{ color: LIGHT_THEME.wText }}
      >
        These zones use custom boundaries — they won't recompute when your threshold changes. Re-sync to recalculate them from your current threshold.
      </Text>
      {error && (
        <Text
          className="font-coach text-[12px]"
          style={{ color: COLORS.red }}
        >
          {error}
        </Text>
      )}
      <View className="flex-row items-center justify-end gap-1.5">
        {confirming ? (
          <>
            <Pressable
              onPress={() => {
                setError(null);
                setConfirming(false);
              }}
              disabled={busy}
              hitSlop={6}
              className="h-9 items-center justify-center rounded-md px-3 active:opacity-70"
            >
              <Text
                className="font-coach-medium text-[13px]"
                style={{ color: LIGHT_THEME.wMute }}
              >
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              disabled={busy}
              hitSlop={6}
              className="h-9 items-center justify-center rounded-md px-3 active:opacity-90"
              style={{
                backgroundColor: LIGHT_THEME.wText,
                opacity: busy ? 0.4 : 1,
              }}
            >
              {busy ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text
                  className="font-coach-bold text-[13px]"
                  style={{ color: "#FFFFFF" }}
                >
                  Confirm
                </Text>
              )}
            </Pressable>
          </>
        ) : (
          <Pressable
            onPress={() => setConfirming(true)}
            disabled={!canResync}
            hitSlop={6}
            className="h-9 items-center justify-center rounded-md px-3 active:opacity-90"
            style={{
              backgroundColor: LIGHT_THEME.wText,
              opacity: !canResync ? 0.4 : 1,
            }}
          >
            <Text
              className="font-coach-bold text-[13px]"
              style={{ color: "#FFFFFF" }}
            >
              Re-sync from threshold
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

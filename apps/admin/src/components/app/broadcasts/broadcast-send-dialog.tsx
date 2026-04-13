"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BroadcastSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  recipientCount: number | undefined;
  audienceName: string | undefined;
  sending: boolean;
}

export function BroadcastSendDialog({
  open,
  onOpenChange,
  onConfirm,
  recipientCount,
  audienceName,
  sending,
}: BroadcastSendDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Send broadcast</AlertDialogTitle>
          <AlertDialogDescription>
            This will send this email to{" "}
            <strong className="text-foreground">
              {recipientCount ?? "..."} eligible contact
              {recipientCount !== 1 ? "s" : ""}
            </strong>
            {audienceName ? (
              <>
                {" "}
                in <strong className="text-foreground">{audienceName}</strong>
              </>
            ) : null}
            . This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={sending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={sending}>
            {sending ? "Sending..." : "Send now"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

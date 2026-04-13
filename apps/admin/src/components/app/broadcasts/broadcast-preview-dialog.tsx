"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildBroadcastPreviewHtml } from "@/lib/build-broadcast-preview";

interface BroadcastPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: string;
  bodyHtml: string;
}

export function BroadcastPreviewDialog({
  open,
  onOpenChange,
  subject,
  bodyHtml,
}: BroadcastPreviewDialogProps) {
  const previewHtml = buildBroadcastPreviewHtml(bodyHtml);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Preview: {subject || "Untitled"}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden rounded-md border bg-muted">
          <iframe
            srcDoc={previewHtml}
            title="Email preview"
            className="h-[600px] w-full border-0"
            sandbox="allow-same-origin"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

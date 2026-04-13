"use client";

import * as React from "react";
import { useMutation } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TestSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: string;
  bodyHtml: string;
}

export function TestSendDialog({
  open,
  onOpenChange,
  subject,
  bodyHtml,
}: TestSendDialogProps) {
  const [testEmail, setTestEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const testSend = useMutation(api.broadcasts.testSend);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail.trim()) return;

    if (!subject.trim()) {
      toast.error("Subject is required for test send");
      return;
    }

    setLoading(true);
    try {
      await testSend({
        subject,
        bodyHtml,
        testEmail: testEmail.trim(),
      });
      toast.success(`Test email sent to ${testEmail}`);
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send test"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSend}>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a preview of this broadcast to a single email address. The
              subject will be prefixed with [TEST].
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="test-email">Email address</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="your@email.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="mt-2"
              required
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !testEmail.trim()}>
              {loading ? "Sending..." : "Send Test"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

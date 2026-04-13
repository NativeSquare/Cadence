"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  IconDeviceFloppy,
  IconEye,
  IconSend,
  IconTestPipe,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TiptapEditor } from "./tiptap-editor";
import { BroadcastPreviewDialog } from "./broadcast-preview-dialog";
import { BroadcastSendDialog } from "./broadcast-send-dialog";
import { TestSendDialog } from "./test-send-dialog";
import { BroadcastRecipientTable } from "./broadcast-recipient-table";

interface BroadcastEditorProps {
  broadcastId?: Id<"broadcasts">;
}

export function BroadcastEditor({ broadcastId }: BroadcastEditorProps) {
  const router = useRouter();
  const broadcast = useQuery(
    api.broadcasts.get,
    broadcastId ? { id: broadcastId } : "skip"
  );
  const audiences = useQuery(api.audiences.list);

  const createBroadcast = useMutation(api.broadcasts.create);
  const updateBroadcast = useMutation(api.broadcasts.update);
  const initiateSend = useMutation(api.broadcasts.initiateSend);

  const [subject, setSubject] = React.useState("");
  const [bodyHtml, setBodyHtml] = React.useState("");
  const [audienceId, setAudienceId] = React.useState<
    Id<"audiences"> | undefined
  >(undefined);
  const [currentId, setCurrentId] = React.useState<Id<"broadcasts"> | null>(
    broadcastId ?? null
  );
  const [saving, setSaving] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [sendDialogOpen, setSendDialogOpen] = React.useState(false);
  const [testSendOpen, setTestSendOpen] = React.useState(false);
  const [initialized, setInitialized] = React.useState(!broadcastId);

  // Audience eligible count for send dialog
  const eligibleCount = useQuery(
    api.audiences.getEligibleCount,
    audienceId ? { audienceId } : "skip"
  );

  // Initialize from existing broadcast
  React.useEffect(() => {
    if (broadcast && !initialized) {
      setSubject(broadcast.subject);
      setBodyHtml(broadcast.bodyHtml);
      setAudienceId(broadcast.audienceId ?? undefined);
      setInitialized(true);
    }
  }, [broadcast, initialized]);

  const handleSave = async () => {
    if (!subject.trim()) {
      toast.error("Subject is required");
      return;
    }
    setSaving(true);
    try {
      if (currentId) {
        await updateBroadcast({
          id: currentId,
          subject,
          bodyHtml,
          audienceId,
        });
        toast.success("Draft saved");
      } else {
        const id = await createBroadcast({ subject, bodyHtml, audienceId });
        setCurrentId(id);
        toast.success("Draft created");
        router.replace(`/broadcasts/${id}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!currentId) {
      toast.error("Save the draft first");
      return;
    }
    setSending(true);
    try {
      // Save latest content before sending
      await updateBroadcast({
        id: currentId,
        subject,
        bodyHtml,
        audienceId,
      });
      await initiateSend({ id: currentId });
      toast.success("Broadcast is being sent!");
      setSendDialogOpen(false);
      router.push("/broadcasts");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  // Read-only view for sent broadcasts
  if (broadcast && broadcast.status !== "draft") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{broadcast.subject}</h2>
            <p className="text-sm text-muted-foreground">
              Sent to {broadcast.recipientCount ?? 0} recipients
              {broadcast.audienceName && ` in "${broadcast.audienceName}"`}
              {broadcast.sentAt &&
                ` on ${new Date(broadcast.sentAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}`}
            </p>
            {broadcast.failedCount && broadcast.failedCount > 0 ? (
              <p className="text-sm text-destructive">
                {broadcast.failedCount} failed delivery
                {broadcast.failedCount !== 1 ? "ies" : "y"}
                {broadcast.errorMessage && `: ${broadcast.errorMessage}`}
              </p>
            ) : null}
          </div>
          <Button variant="outline" onClick={() => setPreviewOpen(true)}>
            <IconEye className="size-4" />
            Preview
          </Button>
        </div>
        <div className="rounded-md border bg-muted/50 p-6">
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: broadcast.bodyHtml }}
          />
        </div>

        {/* Recipient delivery status */}
        <BroadcastRecipientTable broadcastId={broadcast._id} />

        <BroadcastPreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          subject={broadcast.subject}
          bodyHtml={broadcast.bodyHtml}
        />
      </div>
    );
  }

  // Loading state for existing broadcast
  if (broadcastId && !initialized) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Selected audience name for send dialog
  const selectedAudience = audiences?.find((a) => a._id === audienceId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={() => setPreviewOpen(true)}>
          <IconEye className="size-4" />
          Preview
        </Button>
        <Button variant="outline" onClick={() => setTestSendOpen(true)}>
          <IconTestPipe className="size-4" />
          Test Send
        </Button>
        <Button variant="outline" onClick={handleSave} disabled={saving}>
          <IconDeviceFloppy className="size-4" />
          {saving ? "Saving..." : "Save Draft"}
        </Button>
        <Button
          onClick={() => {
            if (!subject.trim()) {
              toast.error("Subject is required");
              return;
            }
            if (!bodyHtml.trim() || bodyHtml === "<p></p>") {
              toast.error("Email body is required");
              return;
            }
            if (!audienceId) {
              toast.error("Select an audience before sending");
              return;
            }
            setSendDialogOpen(true);
          }}
          disabled={sending}
        >
          <IconSend className="size-4" />
          Send
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            placeholder="Email subject line..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Audience</Label>
          <Select
            value={audienceId ?? ""}
            onValueChange={(val) =>
              setAudienceId(val as Id<"audiences"> | undefined)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an audience..." />
            </SelectTrigger>
            <SelectContent>
              {audiences?.map((a) => (
                <SelectItem key={a._id} value={a._id}>
                  {a.name} ({a.memberCount} members)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Body</Label>
          <TiptapEditor content={bodyHtml} onChange={setBodyHtml} />
        </div>
      </div>

      <BroadcastPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        subject={subject}
        bodyHtml={bodyHtml}
      />

      <TestSendDialog
        open={testSendOpen}
        onOpenChange={setTestSendOpen}
        subject={subject}
        bodyHtml={bodyHtml}
      />

      <BroadcastSendDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        onConfirm={handleSend}
        recipientCount={eligibleCount}
        audienceName={selectedAudience?.name}
        sending={sending}
      />
    </div>
  );
}

"use client";

import * as React from "react";
import { use } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { AudienceMemberTable } from "@/components/app/audiences/audience-member-table";

export default function AudienceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const audience = useQuery(api.audiences.get, {
    id: id as Id<"audiences">,
  });
  const updateAudience = useMutation(api.audiences.update);

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [initialized, setInitialized] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (audience && !initialized) {
      setName(audience.name);
      setDescription(audience.description ?? "");
      setInitialized(true);
    }
  }, [audience, initialized]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await updateAudience({
        id: id as Id<"audiences">,
        name: name.trim(),
        description: description.trim() || undefined,
      });
      toast.success("Audience updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update"
      );
    } finally {
      setSaving(false);
    }
  };

  if (audience === undefined) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (audience === null) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Audience not found.</p>
      </div>
    );
  }

  const hasChanges =
    name !== audience.name ||
    (description || undefined) !== (audience.description || undefined);

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{audience.name}</h1>
            <p className="text-muted-foreground text-sm">
              {audience.memberCount} member(s)
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/audiences")}>
            Back
          </Button>
        </div>
      </div>

      {/* Edit audience details */}
      <div className="px-4 lg:px-6">
        <div className="max-w-lg space-y-4 rounded-lg border p-4">
          <h2 className="font-semibold">Audience Details</h2>
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          {hasChanges && (
            <Button onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </div>
      </div>

      {/* Members */}
      <div className="px-4 lg:px-6">
        <AudienceMemberTable audienceId={id as Id<"audiences">} />
      </div>
    </div>
  );
}

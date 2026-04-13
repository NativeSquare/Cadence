"use client";

import * as React from "react";
import { useMutation } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function NewAudiencePage() {
  const router = useRouter();
  const createAudience = useMutation(api.audiences.create);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const id = await createAudience({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      toast.success("Audience created");
      router.push(`/audiences/${id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create audience"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold">New Audience</h1>
        <p className="text-muted-foreground text-sm">
          Create a new audience to organize your contacts.
        </p>
      </div>
      <div className="px-4 lg:px-6">
        <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder='e.g. "Beta Testers"'
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="What this audience is for..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? "Creating..." : "Create Audience"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/audiences")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

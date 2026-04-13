"use client";

import { use } from "react";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import { BroadcastEditor } from "@/components/app/broadcasts/broadcast-editor";

export default function BroadcastDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-bold">Edit Broadcast</h1>
          <p className="text-muted-foreground text-sm">
            Edit your draft or view sent broadcast details.
          </p>
        </div>
      </div>
      <div className="px-4 lg:px-6">
        <BroadcastEditor broadcastId={id as Id<"broadcasts">} />
      </div>
    </div>
  );
}

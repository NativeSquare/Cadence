"use client";

import { BroadcastEditor } from "@/components/app/broadcasts/broadcast-editor";

export default function NewBroadcastPage() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-bold">New Broadcast</h1>
          <p className="text-muted-foreground text-sm">
            Compose an email to send to all waitlist subscribers.
          </p>
        </div>
      </div>
      <div className="px-4 lg:px-6">
        <BroadcastEditor />
      </div>
    </div>
  );
}

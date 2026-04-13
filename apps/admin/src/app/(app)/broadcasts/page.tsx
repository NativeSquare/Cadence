"use client";

import Link from "next/link";
import { IconPlus } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { BroadcastTable } from "@/components/app/broadcasts/broadcast-table";

export default function BroadcastsPage() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Broadcasts</h1>
            <p className="text-muted-foreground text-sm">
              Compose and send emails to your contacts.
            </p>
          </div>
          <Button asChild>
            <Link href="/broadcasts/new">
              <IconPlus className="size-4" />
              New Broadcast
            </Link>
          </Button>
        </div>
      </div>
      <div className="px-4 lg:px-6">
        <BroadcastTable />
      </div>
    </div>
  );
}

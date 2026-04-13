"use client";

import Link from "next/link";
import { IconPlus } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { AudienceTable } from "@/components/app/audiences/audience-table";

export default function AudiencesPage() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Audiences</h1>
            <p className="text-muted-foreground text-sm">
              Organize contacts into groups for targeted broadcasts.
            </p>
          </div>
          <Button asChild>
            <Link href="/audiences/new">
              <IconPlus className="size-4" />
              New Audience
            </Link>
          </Button>
        </div>
      </div>
      <div className="px-4 lg:px-6">
        <AudienceTable />
      </div>
    </div>
  );
}

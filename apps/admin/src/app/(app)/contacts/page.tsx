"use client";

import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import {
  IconAddressBook,
  IconLink,
  IconMailOff,
} from "@tabler/icons-react";

import { ContactTable } from "@/components/app/contacts/contact-table";
import { AddContactDialog } from "@/components/app/contacts/add-contact-dialog";

export default function ContactsPage() {
  const stats = useQuery(api.contacts.getStats);

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Contacts</h1>
            <p className="text-muted-foreground text-sm">
              Manage your marketing contacts.
            </p>
          </div>
          <AddContactDialog />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4 px-4 lg:px-6">
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <IconAddressBook className="size-4" />
            Total Contacts
          </div>
          <p className="mt-1 text-2xl font-semibold">
            {stats?.total ?? "—"}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <IconLink className="size-4" />
            App Users
          </div>
          <p className="mt-1 text-2xl font-semibold">
            {stats?.withUserId ?? "—"}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <IconMailOff className="size-4" />
            Unsubscribed
          </div>
          <p className="mt-1 text-2xl font-semibold">
            {stats?.unsubscribed ?? "—"}
          </p>
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <ContactTable />
      </div>
    </div>
  );
}

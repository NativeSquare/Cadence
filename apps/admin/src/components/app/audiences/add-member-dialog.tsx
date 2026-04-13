"use client";

import * as React from "react";
import { usePaginatedQuery, useMutation } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export function AddMemberDialog({
  audienceId,
}: {
  audienceId: Id<"audiences">;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const addMember = useMutation(api.audiences.addMember);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { results, status } = usePaginatedQuery(
    api.contacts.list,
    { search: debouncedSearch || undefined },
    { initialNumItems: 10 }
  );

  const handleAdd = async (contactId: Id<"contacts">) => {
    try {
      await addMember({ audienceId, contactId });
      toast.success("Contact added to audience");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <IconPlus className="size-4" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Member</DialogTitle>
          <DialogDescription>
            Search for a contact to add to this audience.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto rounded-lg border">
            {status === "LoadingFirstPage" ? (
              <div className="flex h-32 items-center justify-center">
                <Spinner className="h-5 w-5" />
              </div>
            ) : results.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                {search ? "No contacts found." : "Type to search contacts."}
              </p>
            ) : (
              <ul className="divide-y">
                {results.map((contact) => (
                  <li
                    key={contact._id}
                    className="flex items-center justify-between px-4 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {contact.email}
                      </p>
                      {contact.name && (
                        <p className="text-xs text-muted-foreground truncate">
                          {contact.name}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAdd(contact._id)}
                    >
                      <IconPlus className="size-4" />
                      Add
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

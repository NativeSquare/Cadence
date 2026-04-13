"use client";

import * as React from "react";
import { usePaginatedQuery, useMutation } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { AddMemberDialog } from "./add-member-dialog";

const sourceConfig = {
  waitlist: {
    label: "Waitlist",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  signup: {
    label: "Signup",
    className: "border-green-200 bg-green-50 text-green-700",
  },
  manual: {
    label: "Manual",
    className: "border-gray-200 bg-gray-50 text-gray-600",
  },
  import: {
    label: "Import",
    className: "border-purple-200 bg-purple-50 text-purple-700",
  },
} as const;

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function AudienceMemberTable({
  audienceId,
}: {
  audienceId: Id<"audiences">;
}) {
  const removeMember = useMutation(api.audiences.removeMember);

  const { results, status, loadMore } = usePaginatedQuery(
    api.audiences.listMembers,
    { audienceId },
    { initialNumItems: 25 }
  );

  const handleRemove = async (contactId: Id<"contacts">) => {
    try {
      await removeMember({ audienceId, contactId });
      toast.success("Member removed");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove"
      );
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: Array<ColumnDef<any>> = React.useMemo(
    () => [
      {
        id: "email",
        header: "Email",
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.contact?.email ?? "—"}
          </span>
        ),
      },
      {
        id: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.contact?.name || "—"}
          </span>
        ),
      },
      {
        id: "source",
        header: "Source",
        cell: ({ row }) => {
          const source = row.original.contact?.source;
          if (!source) return "—";
          const config = sourceConfig[source as keyof typeof sourceConfig];
          return (
            <Badge variant="outline" className={config.className}>
              {config.label}
            </Badge>
          );
        },
      },
      {
        id: "added",
        header: "Added",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDate(row.original._creationTime)}
          </span>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive size-8"
            onClick={() => handleRemove(row.original.contactId)}
          >
            <IconTrash className="size-4" />
            <span className="sr-only">Remove</span>
          </Button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [audienceId]
  );

  const table = useReactTable({
    data: results ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (status === "LoadingFirstPage") {
    return (
      <div className="flex h-32 items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Members</h2>
        <AddMemberDialog audienceId={audienceId} />
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No members in this audience yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-2">
        <span className="text-muted-foreground text-sm">
          {results.length} member(s)
        </span>
        {status === "CanLoadMore" && (
          <Button variant="outline" size="sm" onClick={() => loadMore(25)}>
            Load More
          </Button>
        )}
        {status === "LoadingMore" && <Spinner className="h-4 w-4" />}
      </div>
    </>
  );
}

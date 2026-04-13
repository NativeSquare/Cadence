"use client";

import * as React from "react";
import { usePaginatedQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

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

const recipientStatusConfig = {
  pending: {
    label: "Pending",
    className: "border-gray-200 bg-gray-50 text-gray-600",
  },
  sent: {
    label: "Sent",
    className: "border-green-200 bg-green-50 text-green-700",
  },
  failed: {
    label: "Failed",
    className: "border-red-200 bg-red-50 text-red-700",
  },
} as const;

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BroadcastRecipientTable({
  broadcastId,
}: {
  broadcastId: Id<"broadcasts">;
}) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.broadcasts.getRecipients,
    { broadcastId },
    { initialNumItems: 25 }
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: Array<ColumnDef<any>> = React.useMemo(
    () => [
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.email}</span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const config =
            recipientStatusConfig[
              row.original.status as keyof typeof recipientStatusConfig
            ];
          return (
            <Badge variant="outline" className={config.className}>
              {config.label}
            </Badge>
          );
        },
      },
      {
        id: "error",
        header: "Error",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm truncate max-w-[200px] block">
            {row.original.error || "—"}
          </span>
        ),
      },
      {
        id: "sentAt",
        header: "Sent At",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.sentAt ? formatDate(row.original.sentAt) : "—"}
          </span>
        ),
      },
    ],
    []
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

  if (results.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">Recipients</h3>
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
            {table.getRowModel().rows.map((row) => (
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
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-1">
        <span className="text-muted-foreground text-sm">
          {results.length} recipient(s)
        </span>
        {status === "CanLoadMore" && (
          <Button variant="outline" size="sm" onClick={() => loadMore(25)}>
            Load More
          </Button>
        )}
        {status === "LoadingMore" && <Spinner className="h-4 w-4" />}
      </div>
    </div>
  );
}

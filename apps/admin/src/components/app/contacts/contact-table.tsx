"use client";

import * as React from "react";
import { usePaginatedQuery, useMutation } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { IconSearch } from "@tabler/icons-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";

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

export function ContactTable() {
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const toggleUnsubscribe = useMutation(api.contacts.toggleUnsubscribe);

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { results, status, loadMore } = usePaginatedQuery(
    api.contacts.list,
    { search: debouncedSearch || undefined },
    { initialNumItems: 25 }
  );

  const handleToggleUnsubscribe = async (id: typeof results[0]["_id"]) => {
    try {
      await toggleUnsubscribe({ id });
      toast.success("Contact updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update"
      );
    }
  };

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
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.name || "—"}
          </span>
        ),
      },
      {
        id: "source",
        header: "Source",
        cell: ({ row }) => {
          const config = sourceConfig[row.original.source as keyof typeof sourceConfig];
          return (
            <Badge variant="outline" className={config.className}>
              {config.label}
            </Badge>
          );
        },
      },
      {
        id: "unsubscribed",
        header: "Subscribed",
        cell: ({ row }) => (
          <Switch
            checked={!row.original.unsubscribed}
            onCheckedChange={() =>
              handleToggleUnsubscribe(row.original._id)
            }
            onClick={(e) => e.stopPropagation()}
          />
        ),
      },
      {
        id: "date",
        header: "Added",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDate(row.original._creationTime)}
          </span>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const table = useReactTable({
    data: results ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (status === "LoadingFirstPage") {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <div className="relative max-w-sm">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search contacts by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
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
                  No contacts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-2">
        <span className="text-muted-foreground text-sm">
          {results.length} contact(s) loaded
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

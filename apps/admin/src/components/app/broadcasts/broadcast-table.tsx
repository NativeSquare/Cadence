"use client";

import * as React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  IconDotsVertical,
  IconEdit,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";

type BroadcastData = {
  _id: Id<"broadcasts">;
  _creationTime: number;
  subject: string;
  bodyHtml: string;
  audienceId?: Id<"audiences">;
  audienceName?: string;
  status: "draft" | "sending" | "sent" | "failed";
  sentAt?: number;
  recipientCount?: number;
  sentCount?: number;
  failedCount?: number;
  updatedAt: number;
};

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusConfig = {
  draft: {
    label: "Draft",
    className: "border-gray-200 bg-gray-50 text-gray-600",
    dotClassName: "bg-gray-400",
  },
  sending: {
    label: "Sending",
    className: "border-yellow-200 bg-yellow-50 text-yellow-700",
    dotClassName: "bg-yellow-500",
  },
  sent: {
    label: "Sent",
    className: "border-green-200 bg-green-50 text-green-700",
    dotClassName: "bg-green-500",
  },
  failed: {
    label: "Failed",
    className: "border-red-200 bg-red-50 text-red-700",
    dotClassName: "bg-red-500",
  },
} as const;

export function BroadcastTable() {
  const router = useRouter();
  const broadcasts = useQuery(api.broadcasts.list);
  const removeBroadcast = useMutation(api.broadcasts.remove);

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [broadcastToDelete, setBroadcastToDelete] =
    React.useState<Id<"broadcasts"> | null>(null);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const handleDelete = async () => {
    if (!broadcastToDelete) return;
    try {
      await removeBroadcast({ id: broadcastToDelete });
      toast.success("Draft deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete"
      );
    } finally {
      setDeleteDialogOpen(false);
      setBroadcastToDelete(null);
    }
  };

  const columns: Array<ColumnDef<BroadcastData>> = React.useMemo(
    () => [
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const config = statusConfig[row.original.status];
          return (
            <Badge variant="outline" className={config.className}>
              <span
                className={`mr-1.5 h-1.5 w-1.5 rounded-full ${config.dotClassName}`}
              />
              {config.label}
            </Badge>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "subject",
        header: "Subject",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.subject || "Untitled"}</span>
        ),
      },
      {
        id: "audience",
        header: "Audience",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.audienceName ?? "—"}
          </span>
        ),
        enableSorting: false,
      },
      {
        id: "recipients",
        header: "Recipients",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.status === "draft"
              ? "—"
              : row.original.recipientCount ?? "—"}
          </span>
        ),
        enableSorting: false,
      },
      {
        id: "date",
        header: "Date",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.sentAt
              ? formatDate(row.original.sentAt)
              : formatDate(row.original.updatedAt)}
          </span>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                size="icon"
                onClick={(e) => e.stopPropagation()}
              >
                <IconDotsVertical />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem asChild>
                <Link href={`/broadcasts/${row.original._id}`}>
                  <IconEdit className="mr-2 h-4 w-4" />
                  {row.original.status === "draft" ? "Edit" : "View"}
                </Link>
              </DropdownMenuItem>
              {row.original.status === "draft" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => {
                      setBroadcastToDelete(row.original._id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <IconTrash className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: (broadcasts as BroadcastData[] | undefined) ?? [],
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (broadcasts === undefined) {
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
            placeholder="Search broadcasts..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
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
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() =>
                    router.push(`/broadcasts/${row.original._id}`)
                  }
                >
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
                  No broadcasts yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-muted-foreground text-sm py-2">
        {table.getFilteredRowModel().rows.length} broadcast(s)
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this draft? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

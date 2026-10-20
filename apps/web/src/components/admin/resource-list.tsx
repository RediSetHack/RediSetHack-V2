"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Plus, Search, Trash2, Pencil, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/y2k-dialog";
import { ConfirmDialog } from "@/components/y2k-dialog";
import { EmptyState, Table, Td, Th, Window, buttonClasses } from "@/components/y2k";
import { API_URL, useToken } from "@/components/admin/use-catalog";
import { ApiError, type AdminInput } from "@/lib/api-client";

/** One column: `sortValue`/`render` receive the row; `value` also feeds search and sort. */
export type ListColumn<T> = Readonly<{
  key: string;
  header: string;
  sortValue?: (row: T) => string | number;
  render: (row: T) => React.ReactNode;
  className?: string;
}>;

export type ListFilter<T> = Readonly<{
  key: string;
  label: string;
  /** The dropdown's options (a Region/Zone/Stage cascade is built by the page). */
  options: readonly { value: string; label: string }[];
  /** `null` means the "All …" option is selected. */
  match: (row: T, value: string | null) => boolean;
}>;

export type ListSort = Readonly<{ key: string; direction: "asc" | "desc" }>;

/** Client-side sort, apply once at the data source so filters/search/pagination agree. */
export function compareRows<T>(rows: readonly T[], columns: readonly ListColumn<T>[], sort: ListSort | null): T[] {
  if (!sort) return [...rows];
  const column = columns.find((candidate) => candidate.key === sort.key);
  if (!column?.sortValue) return [...rows];
  const factor = sort.direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const left = column.sortValue!(a);
    const right = column.sortValue!(b);
    if (left < right) return -1 * factor;
    if (left > right) return 1 * factor;
    return 0;
  });
}

/** `GET` renders `rowText`'s searchable haystack; the string is matched case-insensitively. */
export function searchRows<T>(rows: readonly T[], query: string, haystack: (row: T) => string): T[] {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return [...rows];
  return rows.filter((row) => haystack(row).toLowerCase().includes(needle));
}

export const PAGE_SIZE = 10;

const DELETE_COPY =
  "If learners have progress, Results or XP on this content it will be archived and hidden from learners; otherwise it is deleted.";

export function ResourceList<T extends { id: number }>({
  title,
  rows,
  columns,
  searchPlaceholder,
  haystack,
  filters = [],
  newHref,
  newLabel,
  emptyMessage,
  loading,
  error,
  deleteItem,
  deleteName,
  onDeleted,
  cascadeWarning,
}: Readonly<{
  title: string;
  rows: readonly T[];
  columns: readonly ListColumn<T>[];
  searchPlaceholder: string;
  haystack: (row: T) => string;
  filters?: readonly ListFilter<T>[];
  newHref: string;
  newLabel: string;
  emptyMessage: string;
  loading?: boolean;
  error?: boolean;
  /** The resource's `DELETE` call — `(apiUrl, token, id) => Promise<void>`. */
  deleteItem: (apiUrl: string, token: string, id: number) => Promise<void>;
  /** The row's display name, used in the confirm dialog and toasts. */
  deleteName: (row: T) => string;
  onDeleted?: () => void;
  cascadeWarning?: string;
}>) {
  const toast = useToast();
  const token = useToken();
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<ListSort | null>(null);
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    let next = searchRows(rows, query, haystack);
    for (const filter of filters) {
      const value = filterValues[filter.key] ?? null;
      next = next.filter((row) => filter.match(row, value));
    }
    return compareRows(next, columns, sort);
  }, [rows, query, haystack, filters, filterValues, columns, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const toggleSort = (key: string) => {
    setSort((prev) => {
      if (prev?.key !== key) return { key, direction: "asc" };
      return prev.direction === "asc" ? { key, direction: "desc" } : null;
    });
    setPage(1);
  };

  const confirmDelete = async () => {
    if (!pending || !token) return;
    setBusy(true);
    try {
      await deleteItem(API_URL, token, pending.id);
      toast.push(`${deleteName(pending)} deleted.`);
      onDeleted?.();
    } catch (cause) {
      toast.push(cause instanceof ApiError ? cause.message : "Could not delete. Try again.", "error");
    } finally {
      setBusy(false);
      setPending(null);
    }
  };

  const sortIcon = (column: ListColumn<T>) => {
    if (sort?.key !== column.key) return null;
    return sort.direction === "asc" ? (
      <ChevronUp aria-hidden="true" className="size-3" />
    ) : (
      <ChevronDown aria-hidden="true" className="size-3" />
    );
  };

  let body: ReactNode;
  if (loading) {
    body = (
      <output className="block py-8 text-center font-pixel-lg text-xl text-muted-foreground">
        Loading…
      </output>
    );
  } else if (error) {
    body = (
      <p role="alert" className="py-8 text-center font-body text-sm font-bold text-btn-danger">
        Could not load {title.toLowerCase()}. Try again.
      </p>
    );
  } else if (pageRows.length === 0) {
    body = (
      <EmptyState
        title={rows.length === 0 ? emptyMessage : "No matches"}
        action={
          rows.length === 0 ? (
            <Link href={newHref} className={buttonClasses("primary")}>
              <Plus aria-hidden="true" className="size-3" />
              {newLabel}
            </Link>
          ) : undefined
        }
      />
    );
  } else {
    body = (
      <Table>
        <thead>
          <tr>
            {columns.map((column) => (
              <Th key={column.key}>
                {column.sortValue ? (
                  <button
                    type="button"
                    onClick={() => toggleSort(column.key)}
                    className="inline-flex items-center gap-1"
                  >
                    {column.header}
                    {sortIcon(column)}
                  </button>
                ) : (
                  column.header
                )}
              </Th>
            ))}
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {pageRows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => (
                <Td key={column.key} className={column.className}>
                  {column.render(row)}
                </Td>
              ))}
              <Td>
                <div className="flex items-center gap-2">
                  <Link href={`${newHref.replace(/\/new$/, "")}/${row.id}`} className={buttonClasses("secondary")}>
                    <Pencil aria-hidden="true" className="size-3" />
                    EDIT
                  </Link>
                  <button
                    type="button"
                    onClick={() => setPending(row)}
                    className={buttonClasses("danger")}
                    aria-label={`Delete ${deleteName(row)}`}
                  >
                    <Trash2 aria-hidden="true" className="size-3" />
                    DELETE
                  </button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  }

  return (
    <Window
      title={title}
      actions={
        <Link href={newHref} className={cn(buttonClasses("primary"), "relative z-10")}>
          <Plus aria-hidden="true" className="size-3" />
          {newLabel}
        </Link>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-52 flex-1 items-center gap-2 border-2 border-border bg-white px-2 shadow-[2px_2px_0_var(--border)]">
            <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            <span className="sr-only">{searchPlaceholder}</span>
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent py-1.5 font-body text-[13px] font-bold text-foreground outline-none"
            />
          </label>
          {filters.map((filter) => (
            <label key={filter.key} className="flex flex-col gap-1">
              <span className="font-body text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                {filter.label}
              </span>
              <select
                value={filterValues[filter.key] ?? ""}
                onChange={(event) => {
                  setFilterValues((prev) => ({ ...prev, [filter.key]: event.target.value }));
                  setPage(1);
                }}
                className="border-2 border-border bg-white px-2 py-1.5 font-body text-[13px] font-bold text-foreground shadow-[2px_2px_0_var(--border)] outline-none"
              >
                <option value="">All</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        {body}

        {filtered.length > PAGE_SIZE && (
          <nav aria-label="Pagination" className="flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className={cn(buttonClasses("secondary"), currentPage <= 1 && "pointer-events-none opacity-40")}
            >
              PREVIOUS
            </button>
            <output className="font-pixel text-[9px] leading-relaxed">
              Page {currentPage} of {totalPages}
            </output>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              className={cn(buttonClasses("secondary"), currentPage >= totalPages && "pointer-events-none opacity-40")}
            >
              NEXT
            </button>
          </nav>
        )}
      </div>

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        title="Delete"
        danger
        confirmLabel={busy ? "DELETING…" : "DELETE"}
        cancelLabel="CANCEL"
        onConfirm={() => void confirmDelete()}
        message={
          pending ? (
            <>
              <p>{`Delete ${deleteName(pending)}? This cannot be undone.`}</p>
              {cascadeWarning && <p className="mt-2">{cascadeWarning}</p>}
              <p className="mt-2 text-sm text-muted-foreground">{DELETE_COPY}</p>
            </>
          ) : (
            ""
          )
        }
      />
    </Window>
  );
}

export type { AdminInput };

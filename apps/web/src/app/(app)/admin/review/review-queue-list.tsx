"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { EmptyState, Table, Td, Th, Window, buttonClasses } from "@/components/y2k";
import { API_URL, useCatalog, useToken } from "@/components/admin/use-catalog";
import { useAdminAccess } from "@/components/admin/admin-access";
import { ApiError, getReviewQueue, type ReviewQueueItem, type Zone } from "@/lib/api-client";

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

/** The queue table, or its empty state. */
export function ReviewQueueView({ rows, zones }: Readonly<{ rows: readonly ReviewQueueItem[]; zones: readonly Zone[] }>) {
  if (rows.length === 0) return <EmptyState title="No revisions waiting for review." />;
  const zoneName = (id: number) => zones.find((zone) => zone.id === id)?.name ?? `Zone ${id}`;
  return (
    <Table>
      <thead>
        <tr>
          <Th>Draft</Th>
          <Th>Zone</Th>
          <Th>Contributor</Th>
          <Th>Revision</Th>
          <Th>Submitted</Th>
          <Th>Actions</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <Td>{row.title}</Td>
            <Td>{zoneName(row.zoneId)}</Td>
            <Td>{row.ownerId}</Td>
            <Td>{row.submittedRevision ?? row.revision}</Td>
            <Td>{formatDate(row.submittedAt)}</Td>
            <Td>
              <Link href={`/admin/review/${row.id}`} className={buttonClasses("secondary")}>
                <ClipboardCheck aria-hidden="true" className="size-3" />
                REVIEW
              </Link>
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export function ReviewQueueList() {
  const auth = useToken();
  const { token } = auth;
  const { zones } = useCatalog(auth);
  const { report } = useAdminAccess();
  const [rows, setRows] = useState<ReviewQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const queue = await getReviewQueue(API_URL, token);
        if (!cancelled) {
          setRows(queue);
          setLoading(false);
        }
      } catch (cause) {
        // A canceled request must not report: the page that replaced this one
        // owns the shell state now.
        if (cancelled) return;
        // A `403` means the session lost its admin rights: the shell swaps
        // itself for the ACCESS DENIED window.
        if (report(cause)) return;
        setError(cause instanceof ApiError ? cause.message : "Could not load the review queue.");
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, report]);

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
        {error}
      </p>
    );
  } else {
    body = <ReviewQueueView rows={rows} zones={zones} />;
  }

  return (
    <Window title="REVIEW_QUEUE.EXE">
      {body}
    </Window>
  );
}

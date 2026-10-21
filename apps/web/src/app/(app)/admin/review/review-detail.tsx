"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Y2kButton, Y2kTextarea, Window } from "@/components/y2k";
import { Y2kDialog, useToast } from "@/components/y2k-dialog";
import { EditLoadState } from "@/components/admin/form-controls";
import { API_URL, useToken } from "@/components/admin/use-catalog";
import { useAdminAccess } from "@/components/admin/admin-access";
import {
  ApiError,
  getReviewRevision,
  reviewRevision,
  unpublishRevision,
  type ReviewDecisionInput,
  type ReviewQueueItem,
} from "@/lib/api-client";

type Block = { type?: string; content?: string; language?: string; url?: string; alt?: string; caption?: string; prompt?: string; starterCode?: string };

/** Stable key from a block's own fields — index keys break on reorder. */
function blockKey(block: Block): string {
  return [block.type, block.url, block.prompt, block.content].filter(Boolean).join("|");
}

function BlockView({ block }: Readonly<{ block: Block }>) {
  if (block.type === "code") {
    return (
      <pre className="overflow-x-auto border-2 border-border bg-white p-3 font-mono text-xs">
        {`// ${block.language ?? "code"}\n${block.content ?? ""}`}
      </pre>
    );
  }
  if (block.type === "image") {
    return (
      <figure className="flex flex-col gap-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={block.url ?? ""} alt={block.alt ?? ""} className="max-w-full border-2 border-border" />
        {block.caption ? <figcaption className="font-body text-xs text-muted-foreground">{block.caption}</figcaption> : null}
      </figure>
    );
  }
  if (block.type === "exercise") {
    return (
      <div className="border-2 border-border bg-window-body p-3">
        <p className="font-body text-sm font-bold">{block.prompt}</p>
        <pre className="mt-2 overflow-x-auto border-2 border-border bg-white p-2 font-mono text-xs">{block.starterCode ?? ""}</pre>
      </div>
    );
  }
  return <p className="font-body text-sm whitespace-pre-wrap text-foreground">{block.content ?? ""}</p>;
}

export function ReviewDetail({ id }: Readonly<{ id: string }>) {
  const { token } = useToken();
  const toast = useToast();
  const router = useRouter();
  const { report } = useAdminAccess();
  const [item, setItem] = useState<ReviewQueueItem | null>(null);
  const [status, setStatus] = useState<"loading" | "not-found" | "error" | "ready">("loading");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const [unpublishReason, setUnpublishReason] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void getReviewRevision(API_URL, token, Number(id))
      .then((revision) => {
        if (cancelled) return;
        if (!revision) {
          setStatus("not-found");
        } else {
          setItem(revision);
          setStatus("ready");
        }
      })
      .catch((cause: unknown) => {
        // A canceled request must not report: the page that replaced this one
        // owns the shell state now.
        if (cancelled) return;
        // A `403` means the session lost its admin rights: the shell swaps
        // itself for the ACCESS DENIED window.
        if (report(cause)) return;
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [token, id, report]);

  const decide = async (decision: ReviewDecisionInput["decision"]) => {
    if (!token || !item) return;
    if (reason.trim().length === 0) {
      toast.push("A note is required for every decision.", "error");
      return;
    }
    setBusy(true);
    try {
      await reviewRevision(API_URL, token, item.id, { decision, reason: reason.trim() });
      toast.push(`Decision recorded: ${decision}.`);
      router.push("/admin/review");
    } catch (cause) {
      if (report(cause)) return;
      toast.push(cause instanceof ApiError ? cause.message : "Could not record the decision.", "error");
    } finally {
      setBusy(false);
    }
  };

  const unpublish = async () => {
    if (!token || !item) return;
    if (unpublishReason.trim().length === 0) {
      toast.push("A reason is required to unpublish.", "error");
      return;
    }
    setBusy(true);
    try {
      await unpublishRevision(API_URL, token, item.id, unpublishReason.trim());
      toast.push("Lesson unpublished.");
      router.push("/admin/review");
    } catch (cause) {
      if (report(cause)) return;
      toast.push(cause instanceof ApiError ? cause.message : "Could not unpublish.", "error");
    } finally {
      setBusy(false);
      setUnpublishOpen(false);
    }
  };

  if (status === "loading") return <EditLoadState loading resource="Submission" />;
  if (status === "not-found") return <EditLoadState notFound resource="Submission" />;
  if (status === "error") return <EditLoadState error resource="Submission" />;
  if (!item) return null;

  const blocks = Array.isArray(item.lessonContent) ? (item.lessonContent as Block[]) : [];

  return (
    <div className="flex flex-col gap-4">
      <Window title={`REVIEW.EXE › ${item.title}`}>
        <div className="flex flex-col gap-3">
          <dl className="grid grid-cols-2 gap-2 font-body text-sm sm:grid-cols-4">
            <div>
              <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Owner</dt>
              <dd className="font-bold">{item.ownerId}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Revision</dt>
              <dd className="font-bold">{item.submittedRevision ?? item.revision}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Status</dt>
              <dd className="font-bold">{item.status}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Submitted</dt>
              <dd className="font-bold">{item.submittedAt ? new Date(item.submittedAt).toLocaleString() : "—"}</dd>
            </div>
          </dl>

          <div className="flex flex-col gap-3 border-t-2 border-border pt-3">
            {blocks.length === 0 ? (
              <p className="font-body text-sm text-muted-foreground">This revision has no Lesson blocks.</p>
            ) : (
              blocks.map((block) => <BlockView key={blockKey(block)} block={block} />)
            )}
          </div>
        </div>
      </Window>

      <Window title="DECISION.EXE">
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="font-body text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Reviewer note (required)</span>
            <Y2kTextarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} />
          </label>
          <div className="flex flex-wrap gap-2">
            <Y2kButton variant="primary" disabled={busy} onClick={() => void decide("approved")}>
              APPROVE &amp; PUBLISH
            </Y2kButton>
            <Y2kButton variant="secondary" disabled={busy} onClick={() => void decide("revision-needed")}>
              REQUEST REVISION
            </Y2kButton>
            <Y2kButton variant="danger" disabled={busy} onClick={() => void decide("rejected")}>
              REJECT
            </Y2kButton>
            <Y2kButton variant="ghost" disabled={busy} onClick={() => setUnpublishOpen(true)}>
              UNPUBLISH
            </Y2kButton>
          </div>
        </div>
      </Window>

      <Y2kDialog
        open={unpublishOpen}
        onOpenChange={setUnpublishOpen}
        title="UNPUBLISH"
        actions={
          <>
            <Y2kButton variant="secondary" onClick={() => setUnpublishOpen(false)}>
              CANCEL
            </Y2kButton>
            <Y2kButton variant="danger" disabled={busy} onClick={() => void unpublish()}>
              UNPUBLISH
            </Y2kButton>
          </>
        }
      >
        <div className="flex w-full flex-col gap-2">
          <p>The published Lesson is hidden from learners. A reason is required.</p>
          <Y2kTextarea value={unpublishReason} onChange={(event) => setUnpublishReason(event.target.value)} rows={3} />
        </div>
      </Y2kDialog>
    </div>
  );
}

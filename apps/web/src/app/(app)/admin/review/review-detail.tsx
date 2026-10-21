"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Y2kButton, Y2kTextarea, Window } from "@/components/y2k";
import { Y2kDialog, useToast } from "@/components/y2k-dialog";
import { EditLoadState } from "@/components/admin/form-controls";
import { API_URL, useToken } from "@/components/admin/use-catalog";
import { useAdminAccess } from "@/components/admin/admin-access";
import {
  ApiError,
  getReviewHistory,
  getReviewQueue,
  reviewRevision,
  unpublishRevision,
  type ReviewDecisionInput,
  type ReviewDecisionRecord,
  type ReviewQueueItem,
} from "@/lib/api-client";
import { ReviewLesson } from "./review-lesson";

/** What the page shows: a queued revision, or the latest one from history once it has left the queue. */
type Subject = Pick<ReviewQueueItem, "id" | "title" | "lessonContent"> & { ownerId: string | null; revision: number; status: string };

/** A Lesson is live when its latest history entry is an approval that created a Stage. */
export function isPublished(history: readonly ReviewDecisionRecord[]): boolean {
  const latest = history.at(-1);
  return latest?.decision === "approved" && latest.publishedStageId !== null;
}

/** The route id as a draft id, or `null` when it isn't a positive integer. */
export function parseDraftId(id: string): number | null {
  const value = Number(id);
  return Number.isInteger(value) && value > 0 ? value : null;
}

/** A decision with its trimmed note, or `null` while the required note is blank. */
export function buildDecision(decision: ReviewDecisionInput["decision"], note: string): ReviewDecisionInput | null {
  const reason = note.trim();
  return reason.length === 0 ? null : { decision, reason };
}

type DecisionFormProps = Readonly<{
  busy: boolean;
  onDecide: (input: ReviewDecisionInput) => void;
  onNoteMissing: () => void;
}>;

/** Approve / request revision / reject, each needing a reviewer note. */
export function ReviewDecisionForm({ busy, onDecide, onNoteMissing }: DecisionFormProps) {
  const [reason, setReason] = useState("");
  const decide = (decision: ReviewDecisionInput["decision"]) => {
    const input = buildDecision(decision, reason);
    if (input) onDecide(input);
    else onNoteMissing();
  };
  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="font-body text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Reviewer note (required)</span>
        <Y2kTextarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} />
      </label>
      <div className="flex flex-wrap gap-2">
        <Y2kButton variant="primary" disabled={busy} onClick={() => decide("approved")}>
          APPROVE &amp; PUBLISH
        </Y2kButton>
        <Y2kButton variant="secondary" disabled={busy} onClick={() => decide("revision-needed")}>
          REQUEST REVISION
        </Y2kButton>
        <Y2kButton variant="danger" disabled={busy} onClick={() => decide("rejected")}>
          REJECT
        </Y2kButton>
      </div>
    </div>
  );
}

/** Past decisions on the draft, oldest first. */
export function ReviewHistory({ history }: Readonly<{ history: readonly ReviewDecisionRecord[] }>) {
  if (history.length === 0) return <p className="font-body text-sm text-muted-foreground">No decisions yet.</p>;
  return (
    <ol className="flex flex-col gap-2">
      {history.map((entry) => (
        <li key={entry.id} className="border-2 border-border bg-window-body p-2 font-body text-sm">
          <span className="font-bold uppercase">{entry.decision}</span> · revision {entry.revision} · {new Date(entry.reviewedAt).toLocaleString()}
          <p className="whitespace-pre-wrap">{entry.reason}</p>
        </li>
      ))}
    </ol>
  );
}

export function ReviewDetail({ id }: Readonly<{ id: string }>) {
  const { token } = useToken();
  const toast = useToast();
  const router = useRouter();
  const { report } = useAdminAccess();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [history, setHistory] = useState<ReviewDecisionRecord[]>([]);
  const [status, setStatus] = useState<"loading" | "not-found" | "error" | "ready">("loading");
  const [busy, setBusy] = useState(false);
  // State lags a render behind, so two clicks in one tick would both pass `busy`.
  const inFlight = useRef(false);
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const [unpublishReason, setUnpublishReason] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      try {
        const draftId = parseDraftId(id);
        if (draftId === null) {
          setStatus("not-found");
          return;
        }
        const [queue, records] = await Promise.all([
          getReviewQueue(API_URL, token),
          getReviewHistory(API_URL, token, draftId).catch((cause: unknown) => {
            // No history means the draft does not exist: "not found", not a failure.
            if (cause instanceof ApiError && cause.status === 404) return null;
            throw cause;
          }),
        ]);
        if (cancelled) return;
        const sorted = [...(records ?? [])].sort((a, b) => a.id - b.id);
        const queued = queue.find((item) => item.id === draftId);
        const latest = sorted.at(-1);
        if (queued) {
          setSubject({ ...queued, revision: queued.submittedRevision ?? queued.revision });
        } else if (latest) {
          setSubject({ id: draftId, title: latest.title, lessonContent: latest.lessonContent, ownerId: null, revision: latest.revision, status: latest.decision });
        } else {
          setStatus("not-found");
          return;
        }
        setHistory(sorted);
        setStatus("ready");
      } catch (cause) {
        // A canceled request must not report: the page that replaced this one
        // owns the shell state now.
        if (cancelled) return;
        // A `403` means the session lost its admin rights: the shell swaps
        // itself for the ACCESS DENIED window.
        if (report(cause)) return;
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, id, report]);

  const decide = async (input: ReviewDecisionInput) => {
    if (!token || !subject || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      await reviewRevision(API_URL, token, subject.id, input);
      toast.push(`Decision recorded: ${input.decision}.`);
      router.push("/admin/review");
    } catch (cause) {
      if (report(cause)) return;
      toast.push(cause instanceof ApiError ? cause.message : "Could not record the decision.", "error");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const unpublish = async () => {
    if (!token || !subject || inFlight.current) return;
    if (unpublishReason.trim().length === 0) {
      toast.push("A reason is required to unpublish.", "error");
      return;
    }
    inFlight.current = true;
    setBusy(true);
    try {
      await unpublishRevision(API_URL, token, subject.id, unpublishReason.trim());
      toast.push("Lesson unpublished.");
      router.push("/admin/review");
    } catch (cause) {
      if (report(cause)) return;
      toast.push(cause instanceof ApiError ? cause.message : "Could not unpublish.", "error");
    } finally {
      inFlight.current = false;
      setBusy(false);
      setUnpublishOpen(false);
    }
  };

  if (status === "loading") return <EditLoadState loading resource="Submission" />;
  if (status === "not-found") return <EditLoadState notFound resource="Submission" />;
  if (status === "error") return <EditLoadState error resource="Submission" />;
  if (!subject) return null;

  const published = isPublished(history);
  const awaitingReview = subject.status === "submitted";

  return (
    <div className="flex flex-col gap-4">
      <Window title={`REVIEW.EXE › ${subject.title}`}>
        <div className="flex flex-col gap-3">
          <dl className="grid grid-cols-2 gap-2 font-body text-sm sm:grid-cols-3">
            {[
              ["Contributor", subject.ownerId ?? "—"],
              ["Revision", subject.revision],
              ["Status", subject.status],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</dt>
                <dd className="font-bold">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="border-t-2 border-border pt-3">
            <ReviewLesson blocks={subject.lessonContent} />
          </div>
        </div>
      </Window>

      <Window title="HISTORY.LOG">
        <ReviewHistory history={history} />
      </Window>

      {awaitingReview ? (
        <Window title="DECISION.EXE">
          <ReviewDecisionForm
            busy={busy}
            onDecide={(input) => void decide(input)}
            onNoteMissing={() => toast.push("A note is required for every decision.", "error")}
          />
        </Window>
      ) : null}

      {published ? (
        <Window title="PUBLISHED.EXE">
          <Y2kButton variant="danger" disabled={busy} onClick={() => setUnpublishOpen(true)}>
            UNPUBLISH
          </Y2kButton>
        </Window>
      ) : null}

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

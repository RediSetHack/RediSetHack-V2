"use client";

import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { Info } from "lucide-react";
import {
  ApiError,
  createContributorDraft,
  submitContributorDraft,
  updateContributorDraft,
  type ContributorDraftItem,
} from "@/lib/api-client";
import { draftStatusChip } from "@/lib/draft-status";
import { FieldLabel, StatusChip, Window, Y2kButton, Y2kInput, Y2kTextarea } from "@/components/y2k";
import { FeedbackState } from "@/components/y2k-dialog";

const BLANK = JSON.stringify([{ type: "text", content: "" }], null, 2);

/**
 * The denial shown to a learner who is not an approved contributor. It is an
 * info dialog: the shared window chrome with the Lucide info icon, and the
 * reason in text.
 */
export function ContributorAccessDenied() {
  return (
    <dialog
      open
      aria-labelledby="contribute-denied-title"
      className="static m-0 w-full max-w-md border-0 bg-transparent p-0 text-foreground"
    >
      <Window title="CONTRIBUTORS_ONLY.EXE">
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <Info aria-hidden="true" className="size-8 text-accent" />
          <p
            id="contribute-denied-title"
            className="font-pixel-lg text-lg leading-snug text-foreground"
          >
            Only approved contributors can write drafts.
          </p>
          <p className="font-body text-sm font-bold text-muted-foreground">
            Ask a maintainer to approve your contributor account, then come back
            to draft a Stage.
          </p>
        </div>
      </Window>
    </dialog>
  );
}

export function ContributorDrafts({ apiUrl, initial }: Readonly<{ apiUrl: string; initial: ContributorDraftItem[] }>) {
  const { getToken } = useAuth();
  const [drafts, setDrafts] = useState(initial);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [blocks, setBlocks] = useState(BLANK);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const selected = drafts.find((d) => d.id === selectedId) ?? null;
  const locked = selected !== null && selected.status !== "draft" && selected.status !== "revision-needed";

  const open = (draft: ContributorDraftItem | null) => {
    setSelectedId(draft?.id ?? null);
    setTitle(draft?.title ?? "");
    setBlocks(draft ? JSON.stringify(draft.lessonContent, null, 2) : BLANK);
    setError(null);
    setNotice(null);
  };

  const run = async (action: (token: string, content: unknown) => Promise<ContributorDraftItem>, done: string) => {
    setError(null);
    setNotice(null);
    let content: unknown;
    try {
      content = JSON.parse(blocks);
    } catch {
      setError("Lesson blocks must be valid JSON.");
      return;
    }
    try {
      const saved = await action((await getToken()) ?? "", content);
      setDrafts((all) => (all.some((d) => d.id === saved.id) ? all.map((d) => (d.id === saved.id ? saved : d)) : [...all, saved]));
      setSelectedId(saved.id);
      setNotice(done.replace("{revision}", String(saved.revision)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Try again.");
    }
  };

  const save = () =>
    run(
      (token, lessonContent) =>
        selected
          ? updateContributorDraft(apiUrl, token, selected.id, { revision: selected.revision, title, lessonContent } as never)
          : createContributorDraft(apiUrl, token, { zoneId: Number(zoneId), title, lessonContent } as never),
      "Saved as revision {revision}.",
    );
  const submit = () =>
    selected && run((token) => submitContributorDraft(apiUrl, token, selected.id, selected.revision), "Revision {revision} submitted for review.");

  return (
    <div className="space-y-4">
      <FeedbackState
        empty={drafts.length === 0}
        emptyTitle="DRAFTS"
        emptyMessage="No drafts yet. Start one to propose a new Stage."
        emptyAction={
          <Y2kButton onClick={() => open(null)}>NEW DRAFT</Y2kButton>
        }
      >
        <Window
          title="DRAFTS"
          actions={
            <Y2kButton variant="secondary" onClick={() => open(null)}>
              NEW DRAFT
            </Y2kButton>
          }
        >
          <ul className="space-y-4">
            {drafts.map((draft) => {
              const status = draftStatusChip(draft.status);
              return (
                <li key={draft.id}>
                  <Window
                    title={draft.title}
                    actions={
                      <StatusChip status={status.chip} label={status.label} />
                    }
                  >
                    <p className="font-body text-xs font-bold text-muted-foreground">
                      Rev {draft.revision} · Zone {draft.zoneId}
                    </p>
                    <div className="mt-3 flex justify-end">
                      <Y2kButton
                        variant="secondary"
                        onClick={() => open(draft)}
                      >
                        OPEN DRAFT
                      </Y2kButton>
                    </div>
                  </Window>
                </li>
              );
            })}
          </ul>
        </Window>
      </FeedbackState>

      <Window title={selected ? `EDIT DRAFT #${selected.id}` : "NEW DRAFT"}>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void save(); }}>
          {locked && <p className="font-body text-sm font-bold text-muted-foreground">This revision was submitted for review and can no longer be changed.</p>}
          {selected?.status === "revision-needed" && <p className="font-body text-sm font-bold text-muted-foreground">A reviewer requested changes. Save an updated revision and submit it for review again.</p>}
          <div>
            <FieldLabel htmlFor="draft-title">Title</FieldLabel>
            <Y2kInput id="draft-title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={locked} />
          </div>
          {!selected && (
            <div>
              <FieldLabel htmlFor="draft-zone">Zone (chapter) id</FieldLabel>
              <Y2kInput id="draft-zone" value={zoneId} onChange={(e) => setZoneId(e.target.value)} inputMode="numeric" />
            </div>
          )}
          <div>
            <FieldLabel htmlFor="draft-blocks">Lesson blocks (JSON)</FieldLabel>
            <Y2kTextarea id="draft-blocks" value={blocks} onChange={(e) => setBlocks(e.target.value)} disabled={locked} rows={12} className="font-mono text-xs" />
          </div>
          {error && <p role="alert" className="font-body text-sm font-bold text-btn-danger">{error}</p>}
          {notice && <output className="block font-body text-sm font-bold">{notice}</output>}
          <div className="flex flex-wrap gap-2">
            <Y2kButton type="submit" disabled={locked}>SAVE</Y2kButton>
            {selected && (
              <Y2kButton type="button" variant="secondary" disabled={locked} onClick={() => void submit()}>
                SUBMIT REV {selected.revision}
              </Y2kButton>
            )}
          </div>
        </form>
      </Window>
    </div>
  );
}

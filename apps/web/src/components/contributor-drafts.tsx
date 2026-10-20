"use client";

import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import {
  ApiError,
  createContributorDraft,
  submitContributorDraft,
  updateContributorDraft,
  type ContributorDraftItem,
} from "@/lib/api-client";
import { FieldLabel, StatusChip, Window, Y2kButton, Y2kInput, Y2kTextarea } from "@/components/y2k";

const BLANK = JSON.stringify([{ type: "text", content: "" }], null, 2);

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
    <div className="grid gap-6 sm:grid-cols-[16rem_1fr]">
      <Window title="Drafts">
        <div className="space-y-2">
          <Y2kButton variant="secondary" onClick={() => open(null)}>NEW DRAFT</Y2kButton>
          {drafts.length === 0 && <p className="font-body text-sm font-bold text-muted-foreground">No drafts yet.</p>}
          <ul className="space-y-2">
            {drafts.map((d) => (
              <li key={d.id} className="border-2 border-border bg-window-body p-2 shadow-[2px_2px_0_var(--border)]">
                <button type="button" onClick={() => open(d)} className="font-pixel text-[9px] leading-relaxed underline">{d.title}</button>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-body text-xs font-bold">Rev {d.revision}</span>
                  <StatusChip status={d.status === "approved" ? "completed" : d.status === "submitted" ? "unlocked" : d.status === "revision-needed" ? "not-passed" : "locked"} label={d.status} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Window>
      <Window title={selected ? `Edit draft #${selected.id}` : "New draft"}>
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
          {notice && <p role="status" className="font-body text-sm font-bold">{notice}</p>}
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

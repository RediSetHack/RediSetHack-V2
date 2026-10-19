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

const BLANK = JSON.stringify([{ type: "text", content: "" }], null, 2);

/** Lists the caller's drafts and edits one: title, a Zone (new drafts), and Lesson blocks as JSON. */
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
      <section aria-label="Your drafts" className="space-y-2">
        <button type="button" onClick={() => open(null)} className="text-sm font-medium underline">New draft</button>
        {drafts.length === 0 && <p className="text-sm text-muted-foreground">No drafts yet.</p>}
        <ul className="space-y-2">
          {drafts.map((d) => (
            <li key={d.id} className="rounded-lg border border-border bg-card p-3 text-sm">
              <button type="button" onClick={() => open(d)} className="font-medium underline">{d.title}</button>
              <p className="text-muted-foreground">Revision {d.revision} · {d.status}</p>
            </li>
          ))}
        </ul>
      </section>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void save(); }}>
        <h2 className="text-lg font-semibold">{selected ? `Edit draft #${selected.id}` : "New draft"}</h2>
        {locked && <p className="text-sm text-muted-foreground">This revision was submitted for review and can no longer be changed.</p>}
        {selected?.status === "revision-needed" && <p className="text-sm text-muted-foreground">A reviewer requested changes. Save an updated revision and submit it for review again.</p>}
        <label className="block text-sm">Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} disabled={locked} className="mt-1 w-full rounded border border-border bg-background p-2" />
        </label>
        {!selected && (
          <label className="block text-sm">Zone (chapter) id
            <input value={zoneId} onChange={(e) => setZoneId(e.target.value)} inputMode="numeric" className="mt-1 w-full rounded border border-border bg-background p-2" />
          </label>
        )}
        <label className="block text-sm">Lesson blocks (JSON)
          <textarea value={blocks} onChange={(e) => setBlocks(e.target.value)} disabled={locked} rows={12} className="mt-1 w-full rounded border border-border bg-background p-2 font-mono text-xs" />
        </label>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {notice && <p role="status" className="text-sm">{notice}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={locked} className="rounded border border-border px-3 py-1 text-sm font-medium">Save</button>
          {selected && (
            <button type="button" disabled={locked} onClick={() => void submit()} className="rounded border border-border px-3 py-1 text-sm font-medium">
              Submit revision {selected.revision}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

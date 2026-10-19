"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { setProfileSharing } from "@/lib/api-client";

export function ProfileSharing({
  initialShareId,
  apiUrl,
}: Readonly<{ initialShareId: string | null; apiUrl: string }>) {
  const { getToken } = useAuth();
  const [shareId, setShareId] = useState(initialShareId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const toggle = async () => {
    setBusy(true);
    setError(false);
    try {
      const token = await getToken();
      setShareId(await setProfileSharing(apiUrl, token ?? "", shareId === null));
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="sharing-heading" className="space-y-3">
      <h2 id="sharing-heading" className="text-lg font-semibold">Share your profile</h2>
      <p className="text-sm text-muted-foreground">
        Sharing is off by default. When on, anyone with the link sees only your Adventurer Rank, XP, Character, Badges,
        completed Novel / Side Quest / CTF counts and streaks — never your email, name, code or conversations. Turning it off
        revokes the link.
      </p>
      {shareId && (
        <p className="text-sm">
          Public link: <a className="underline" href={`/shared/${shareId}`}>{`/shared/${shareId}`}</a>
        </p>
      )}
      <button type="button" onClick={toggle} disabled={busy} aria-busy={busy}
        className="rounded-lg border border-input px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-60">
        {busy ? "Saving…" : shareId ? "Stop sharing" : "Share my profile"}
      </button>
      <p role="status" className="text-sm text-muted-foreground">{shareId ? "Your profile is shared." : "Your profile is private."}</p>
      {error && <p role="alert" className="text-sm text-destructive">Sharing could not be updated. Please try again.</p>}
    </section>
  );
}

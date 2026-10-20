"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { setProfileSharing } from "@/lib/api-client";
import { Y2kButton } from "@/components/y2k";
import { useToast } from "@/components/y2k-dialog";

export function ProfileSharing({
  initialShareId,
  apiUrl,
}: Readonly<{ initialShareId: string | null; apiUrl: string }>) {
  const { getToken } = useAuth();
  const { push } = useToast();
  const [shareId, setShareId] = useState(initialShareId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const toggle = async () => {
    setBusy(true);
    setError(false);
    try {
      const token = await getToken();
      const next = await setProfileSharing(apiUrl, token ?? "", shareId === null);
      setShareId(next);
      push("Character updated.");
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="sharing-heading" className="space-y-3">
      <p className="font-body text-sm font-bold text-muted-foreground">
        Sharing is off by default. When on, anyone with the link sees only your Adventurer Rank, XP, Character, Badges,
        completed Novel / Side Quest / CTF counts and streaks — never your email, name, code or conversations. Turning it off
        revokes the link.
      </p>
      {shareId && (
        <p className="font-body text-sm font-bold">
          Public link: <a className="underline" href={`/shared/${shareId}`}>{`/shared/${shareId}`}</a>
        </p>
      )}
      <Y2kButton type="button" onClick={toggle} disabled={busy} aria-busy={busy}>
        {busy ? "SAVING…" : shareId ? "REVOKE" : "SHARE"}
      </Y2kButton>
      <p role="status" className="font-body text-sm font-bold text-muted-foreground">
        {shareId ? "Your profile is shared." : "Your profile is private."}
      </p>
      {error && <p role="alert" className="font-body text-sm font-bold text-btn-danger">Sharing could not be updated. Please try again.</p>}
    </section>
  );
}

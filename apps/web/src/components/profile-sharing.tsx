"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { AlertTriangle, Copy, Link2, Share2 } from "lucide-react";
import { setProfileSharing } from "@/lib/api-client";
import { Y2kButton } from "@/components/y2k";
import { useToast } from "@/components/y2k-dialog";

const buttonLabel = (busy: boolean, shareId: string | null) => {
  if (busy) return "SAVING…";
  return shareId ? "REVOKE" : "SHARE";
};

/**
 * PAGES.md §14 Shared Profile window: sharing is off by default, turning it on
 * publishes a revocable link that exposes the accomplishment summary only.
 */
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
      const enabling = shareId === null;
      const next = await setProfileSharing(apiUrl, token ?? "", enabling);
      setShareId(next);
      push(enabling ? "Profile shared." : "Profile sharing turned off.");
    } catch {
      setError(true);
      push("Sharing could not be updated.", "error");
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    if (!shareId) return;
    const url = `${window.location.origin}/shared/${shareId}`;
    try {
      await navigator.clipboard.writeText(url);
      push("Link copied.");
    } catch {
      push("Link could not be copied.", "error");
    }
  };

  return (
    <section aria-label="Profile sharing" className="space-y-3">
      <p className="font-body text-sm font-bold text-muted-foreground">
        Sharing is off by default. When on, anyone with the link sees only your Adventurer Rank, XP, Character, Badges,
        completed Novel / Side Quest / CTF counts and streaks — never your email, name, code or conversations. Turning it off
        revokes the link.
      </p>

      {shareId ? (
        <div className="flex flex-wrap items-center gap-2 border-2 border-border bg-window-body p-3 shadow-[3px_3px_0_var(--border)]">
          <Link2 aria-hidden="true" className="size-4 shrink-0" />
          <a
            href={`/shared/${shareId}`}
            className="min-w-0 flex-1 truncate font-body text-sm font-bold underline underline-offset-2"
          >
            /shared/{shareId}
          </a>
          <Y2kButton type="button" variant="secondary" onClick={copyLink}>
            <Copy aria-hidden="true" className="size-4" />
            COPY LINK
          </Y2kButton>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Y2kButton
          type="button"
          variant={shareId ? "danger" : "primary"}
          onClick={toggle}
          disabled={busy}
          aria-busy={busy}
        >
          {shareId ? null : <Share2 aria-hidden="true" className="size-4" />}
          {buttonLabel(busy, shareId)}
        </Y2kButton>
        <output className="font-body text-sm font-bold text-muted-foreground">
          {shareId ? "Your profile is shared." : "Your profile is private."}
        </output>
      </div>

      {error && (
        <p role="alert" className="flex items-center gap-2 font-body text-sm font-bold text-btn-danger">
          <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
          Sharing could not be updated. Please try again.
        </p>
      )}
    </section>
  );
}

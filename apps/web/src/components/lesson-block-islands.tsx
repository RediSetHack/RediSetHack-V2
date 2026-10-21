"use client";

import { useState } from "react";
import { Y2kAlert } from "@/components/y2k-dialog";

/**
 * The Lesson renderer stays a Server Component (Shiki highlighting happens
 * there and arrives as `html`). Only the pieces that need the browser live
 * here: the COPY button, the image error fallback, and the unsupported-block
 * dialog.
 */

export function CopyButton({ content }: Readonly<{ content: string }>) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <button
      type="button"
      className="border-2 border-border bg-title-bar px-2 py-1 font-pixel text-[8px] leading-relaxed shadow-[2px_2px_0_var(--border)]"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(content);
          setCopied(true);
          setFailed(false);
        } catch {
          setFailed(true);
        }
      }}
    >
      {failed ? "COPY FAILED" : copied ? "COPIED" : "COPY"}
    </button>
  );
}

export function ImageWithFallback({
  url,
  alt,
}: Readonly<{ url: string; alt: string }>) {
  const [failed, setFailed] = useState(false);
  if (failed || !url) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="y2k-checker flex h-40 items-center justify-center border-2 border-border font-body text-[11px] font-semibold uppercase text-muted-foreground"
      >
        {alt || "Image unavailable"}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- admin-controlled image hosts; remote patterns unknown
    <img
      src={url}
      alt={alt}
      className="h-auto max-w-full border-2 border-border"
      ref={(el) => {
        // A cached or already-failed image can finish (or fail) before React
        // hydrates, so `onError` never fires — check the settled state on mount.
        if (el?.complete && el.naturalWidth === 0) setFailed(true);
      }}
      onError={() => setFailed(true)}
    />
  );
}

export function UnsupportedBlockDialog() {
  const [open, setOpen] = useState(true);
  return (
    <Y2kAlert open={open} onOpenChange={setOpen} title="UNSUPPORTED" icon="info">
      This content type isn&apos;t supported yet.
    </Y2kAlert>
  );
}

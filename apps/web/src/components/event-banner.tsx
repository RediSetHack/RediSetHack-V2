"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { DailyEvent } from "@/lib/api-client";
import { Sparkle, StatusChip, Window } from "@/components/y2k";

function dismissalKey(): string {
  return `rsh-event-dismissed-${new Date().toISOString().slice(0, 10)}`;
}

function isDismissedToday(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return window.localStorage.getItem(dismissalKey()) === "1";
  } catch {
    return false;
  }
}

export function EventBanner({
  event,
  error,
}: Readonly<{
  event: DailyEvent | null;
  error: boolean;
}>) {
  const [dismissed, setDismissed] = useState(isDismissedToday);

  if (error || !event || dismissed) {
    return null;
  }

  const isBonus = event.eventType === "bonus";

  return (
    <Window
      title="TODAY'S EVENT"
      bodyClassName="px-3 py-2"
      actions={
        <button
          type="button"
          aria-label="Dismiss today's event announcement"
          onClick={() => {
            setDismissed(true);
            try {
              if (typeof window !== "undefined") {
                window.localStorage.setItem(dismissalKey(), "1");
              }
            } catch {
              /* storage unavailable — dismissal stays in-memory */
            }
          }}
          className="relative z-10 hover:text-btn-danger"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      }
    >
      <div role="status" aria-live="polite" className="flex flex-wrap items-center gap-2">
        {isBonus ? (
          <span
            data-testid="bonus-badge"
            className="y2k-marching-ants inline-flex items-center gap-1 border-2 border-dashed border-border bg-sparkle px-2 py-0.5 font-pixel text-[8px] leading-relaxed text-white"
          >
            <Sparkle size={12} />
            BONUS DAY ×{event.xpMultiplier} XP
          </span>
        ) : (
          <StatusChip status="normal" label="NORMAL DAY" />
        )}
        <p className="font-body text-sm font-bold text-foreground">
          {isBonus
            ? `Today's Event: ×${event.xpMultiplier} XP — make it count!`
            : "Today's Event: a Normal day, no XP bonus."}
        </p>
      </div>
    </Window>
  );
}

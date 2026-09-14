"use client";

import { useState } from "react";
import type { DailyEvent } from "@/lib/api-client";

function Glance({ event }: { event: DailyEvent }) {
  const isBonus = event.eventType === "bonus";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
        isBonus
          ? "bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {isBonus ? `🔥 Bonus day ×${event.xpMultiplier} XP` : "Normal day"}
    </span>
  );
}

export function EventBanner({
  event,
  error,
}: {
  event: DailyEvent | null;
  error: boolean;
}) {
  const [dismissed, setDismissed] = useState(false);

  if (error) {
    return (
      <p role="alert" className="text-xs text-destructive">
        Today&apos;s event could not be loaded.
      </p>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Glance event={event} />
      {!dismissed && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs"
        >
          <span>
            {event.eventType === "bonus"
              ? `Today's Event: ×${event.xpMultiplier} XP — make it count!`
              : "Today's Event: a Normal day, no XP bonus."}
          </span>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss today's event announcement"
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

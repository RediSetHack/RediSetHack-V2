"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMmSs } from "@/lib/format";
import type { Quest } from "@/lib/api-client";
import {
  buttonClasses,
  EmptyState,
  StatusChip,
  Window,
  XPChip,
  Y2kButton,
  Y2kInput,
} from "@/components/y2k";
import { ConfirmDialog, ErrorAlert } from "@/components/y2k-dialog";

type Filter = "all" | "not-taken" | "passed";

const FILTERS: ReadonlyArray<{ id: Filter; label: string }> = [
  { id: "all", label: "All" },
  { id: "not-taken", label: "Not taken" },
  { id: "passed", label: "Passed" },
];

function StartQuestDialog({ quest }: Readonly<{ quest: Quest }>) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Y2kButton variant="primary" onClick={() => setOpen(true)}>
        {quest.completed ? "Retake Quest" : "Start"}
      </Y2kButton>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Start ${quest.title}?`}
        message={`You have ${formatMmSs(quest.timeLimitSeconds)}. The timer starts immediately and submits automatically at zero.`}
        confirmLabel="Start Quest"
        cancelLabel="Cancel"
        onConfirm={() => router.push(`/quests/${quest.id}/session`)}
      />
    </>
  );
}

function QuestCard({ quest }: Readonly<{ quest: Quest }>) {
  const bestStatus = quest.completed ? "passed" : "not-taken";
  const bestLabel = quest.completed ? "Best Result: Passed" : "Best Result: Not taken";

  return (
    <li>
      <Window
        title={quest.title}
        actions={
          quest.initialAssessment ? (
            <span className="border-2 border-border bg-accent px-2 py-0.5 font-body text-[11px] font-semibold tracking-wide uppercase">
              Initial assessment
            </span>
          ) : undefined
        }
      >
        {quest.description && (
          <p className="font-body text-sm font-bold text-muted-foreground">{quest.description}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 font-body text-[13px] font-bold text-foreground">
            <Clock aria-hidden="true" className="size-4" />
            {formatMmSs(quest.timeLimitSeconds)}
          </span>
          <span className="border-2 border-border bg-window-body px-2 py-0.5 font-body text-[11px] font-semibold tracking-wide text-foreground uppercase">
            Pass {quest.passingScore}%
          </span>
          <XPChip xp={quest.xpReward} />
          <StatusChip status={bestStatus} label={bestLabel} />
        </div>
        <div className="mt-4 flex items-center justify-end">
          {quest.lockReason ? (
            <output className="block font-body text-sm font-bold text-muted-foreground">
              {quest.lockReason}
            </output>
          ) : (
            <StartQuestDialog quest={quest} />
          )}
        </div>
      </Window>
    </li>
  );
}

export function QuestList({
  quests,
  error,
}: Readonly<{
  quests: Quest[] | null;
  error: boolean;
}>) {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const list = quests ?? [];
    const query = search.trim().toLowerCase();
    return list.filter((quest) => {
      if (filter === "not-taken" && quest.completed) return false;
      if (filter === "passed" && !quest.completed) return false;
      if (query && !quest.title.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [quests, filter, search]);

  if (error || !quests) {
    return (
      <ErrorAlert
        message="Quests could not be loaded. Please try again later."
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (quests.length === 0) {
    return (
      <Window title="NO QUESTS">
        <EmptyState title="No Quests available." />
      </Window>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <fieldset className="flex flex-wrap gap-1 border-0 p-0">
          <legend className="sr-only">Filter quests</legend>
          {FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={filter === option.id}
              onClick={() => setFilter(option.id)}
              className={cn(
                buttonClasses("secondary"),
                "px-3 py-1.5",
                filter === option.id && "bg-primary",
              )}
            >
              {option.label}
            </button>
          ))}
        </fieldset>
        <Y2kInput
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search quests…"
          aria-label="Search quests"
          className="max-w-xs"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No Quests match your filter." />
      ) : (
        <ul className="space-y-4">
          {filtered.map((quest) => (
            <QuestCard key={quest.id} quest={quest} />
          ))}
        </ul>
      )}
    </div>
  );
}

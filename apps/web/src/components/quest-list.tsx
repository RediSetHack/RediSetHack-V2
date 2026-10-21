"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMmSs } from "@/lib/format";
import type { Quest } from "@/lib/api-client";
import {
  bestResultLabel,
  filterQuests,
  QUEST_FILTERS,
  questOutcome,
  startQuestConfirmCopy,
  type QuestFilter,
} from "@/lib/quest-list";
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

/** The filter tabs, controlled by the caller so the active tab is testable. */
export function QuestFilterTabs({
  filter,
  onChange,
}: Readonly<{ filter: QuestFilter; onChange: (filter: QuestFilter) => void }>) {
  return (
    <fieldset className="flex flex-wrap gap-1 border-0 p-0">
      <legend className="sr-only">Filter quests</legend>
      {QUEST_FILTERS.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={filter === option.id}
          onClick={() => onChange(option.id)}
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
  );
}

/** The start-confirmation copy, split out so it can be asserted on its own. */
export function StartQuestDialogBody({ quest }: Readonly<{ quest: Quest }>) {
  return <span>{startQuestConfirmCopy(quest).message}</span>;
}

function StartQuestDialog({ quest }: Readonly<{ quest: Quest }>) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const copy = startQuestConfirmCopy(quest);

  return (
    <>
      <Y2kButton variant="primary" onClick={() => setOpen(true)}>
        START
      </Y2kButton>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={copy.title}
        message={<StartQuestDialogBody quest={quest} />}
        confirmLabel="START QUEST"
        cancelLabel="CANCEL"
        onConfirm={() => router.push(`/quests/${quest.id}/session`)}
      />
    </>
  );
}

function QuestCard({ quest }: Readonly<{ quest: Quest }>) {
  const outcome = questOutcome(quest);

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
          <p className="font-body text-sm font-bold text-muted-foreground">
            {quest.description}
          </p>
        )}
        <dl className="mt-3 flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1 font-body text-[13px] font-bold text-foreground">
            <dt className="sr-only">Time limit</dt>
            <dd className="inline-flex items-center gap-1">
              <Clock aria-hidden="true" className="size-4" />
              {formatMmSs(quest.timeLimitSeconds)}
            </dd>
          </div>
          <div className="border-2 border-border bg-window-body px-2 py-0.5 font-body text-[11px] font-semibold tracking-wide text-foreground uppercase">
            <dt className="sr-only">Passing score</dt>
            <dd>Pass {quest.passingScore}%</dd>
          </div>
          <div>
            <dt className="sr-only">XP reward</dt>
            <dd>
              <XPChip xp={quest.xpReward} />
            </dd>
          </div>
          <div>
            <dt className="sr-only">Best Result</dt>
            <dd>
              <StatusChip
                status={outcome}
                label={bestResultLabel(quest)}
              />
            </dd>
          </div>
        </dl>
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
  const [filter, setFilter] = useState<QuestFilter>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => filterQuests(quests ?? [], filter, search),
    [quests, filter, search],
  );

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
        <QuestFilterTabs filter={filter} onChange={setFilter} />
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

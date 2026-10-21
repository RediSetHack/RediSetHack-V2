import Link from "next/link";
import { Check, Lock, Play, X } from "lucide-react";
import type { SideQuest, SideQuestListItem } from "@/lib/api-client";
import { requirementStateLabel, sideQuestStatusChip } from "@/lib/side-quests";
import { StatusChip, Window, XPChip, buttonClasses } from "@/components/y2k";
import { FeedbackState } from "@/components/y2k-dialog";

/** Where an activity opens, per the Side Quest activity kind. */
const ACTIVITY_HREF = { ctf: "/ctf?challenge=", coding: "/codelab?activity=" } as const;

/** One Side Quest as its own window, with the reasons it stays locked. */
function SideQuestWindow({ quest }: Readonly<{ quest: SideQuestListItem }>) {
  const status = sideQuestStatusChip(quest.status);

  return (
    <li>
      <Window
        title={quest.title}
        actions={<StatusChip status={status.chip} label={status.label} />}
      >
        <p className="font-body text-sm font-bold text-foreground">{quest.summary}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div>
            <span className="sr-only">XP reward</span>
            <XPChip xp={quest.xpReward} />
          </div>
        </div>
        {quest.lockReasons.length > 0 && (
          <ul className="mt-3 space-y-1">
            {quest.lockReasons.map((reason) => (
              <li
                key={`${reason.type}-${reason.message}`}
                className="flex items-start gap-2 font-body text-xs font-bold text-muted-foreground"
              >
                <Lock aria-hidden="true" className="mt-0.5 size-3 shrink-0" />
                <span>{reason.message}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex justify-end">
          <Link
            href={`/side-quests?quest=${quest.id}`}
            className={buttonClasses("primary")}
          >
            OPEN SIDE QUEST
          </Link>
        </div>
      </Window>
    </li>
  );
}

/**
 * The Side Quest list. A locked Side Quest keeps its reasons on screen so the
 * learner can see what would unlock it.
 */
export function SideQuestList({
  quests,
  error,
}: Readonly<{ quests: SideQuestListItem[] | null; error: boolean }>) {
  if (error) {
    return (
      <FeedbackState
        error
        errorMessage="Side Quests could not be loaded. Please try again later."
      >
        {null}
      </FeedbackState>
    );
  }

  if (!quests || quests.length === 0) {
    return (
      <FeedbackState
        empty
        emptyTitle="SIDE-QUESTS.EXE"
        emptyMessage="No Side Quests yet."
      >
        {null}
      </FeedbackState>
    );
  }

  return (
    <ul className="space-y-4">
      {quests.map((quest) => (
        <SideQuestWindow key={quest.id} quest={quest} />
      ))}
    </ul>
  );
}

/**
 * One Side Quest in detail. Every requirement states whether it is met, with
 * a check or an x icon next to the text.
 */
export function SideQuestDetail({
  detail,
  error,
}: Readonly<{ detail: SideQuest | null; error: boolean }>) {
  if (error || !detail) {
    return (
      <FeedbackState
        error
        errorMessage="This Side Quest could not be loaded. Please try again later."
      >
        {null}
      </FeedbackState>
    );
  }

  const status = sideQuestStatusChip(detail.status);

  return (
    <Window
      title={detail.title}
      actions={<StatusChip status={status.chip} label={status.label} />}
    >
      <p className="font-body text-sm font-bold text-foreground">{detail.summary}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div>
          <span className="sr-only">XP reward</span>
          <XPChip xp={detail.xpReward} />
        </div>
      </div>

      {detail.requirements.length > 0 && (
        <ul className="mt-4 space-y-2">
          {detail.requirements.map((requirement) => (
            <li
              key={`${requirement.type}-${requirement.message}`}
              className="flex items-start gap-2 font-body text-sm font-bold text-foreground"
            >
              {requirement.met ? (
                <Check
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-success"
                />
              ) : (
                <X
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-btn-danger"
                />
              )}
              <span className="flex flex-col">
                <span className="font-body text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  {requirementStateLabel(requirement.met)}
                </span>
                <span>{requirement.message}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {detail.brief && (
        <p className="mt-4 font-body text-sm font-bold text-foreground">{detail.brief}</p>
      )}

      {detail.activity && (
        <div className="mt-4 flex justify-end">
          <Link
            href={`${ACTIVITY_HREF[detail.activity.type]}${detail.activity.id}`}
            className={buttonClasses("primary")}
          >
            <Play aria-hidden="true" className="size-3" /> OPEN ACTIVITY
          </Link>
        </div>
      )}
    </Window>
  );
}

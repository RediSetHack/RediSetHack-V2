import Link from "next/link";
import { Flag, Target, Zap } from "lucide-react";
import type { CtfSummary } from "@/lib/api-client";
import { CTF_DIFFICULTY_LABELS } from "@/lib/ctf";
import { StatusChip, Window, XPChip, buttonClasses } from "@/components/y2k";
import { FeedbackState } from "@/components/y2k-dialog";

/** One challenge as its own window: category, difficulty, XP and state. */
function ChallengeWindow({ challenge }: Readonly<{ challenge: CtfSummary }>) {
  return (
    <li>
      <Window
        title={challenge.title}
        actions={
          challenge.solved ? (
            <StatusChip status="solved" />
          ) : (
            <StatusChip status="not-taken" label="Unsolved" />
          )
        }
      >
        <dl className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1 font-body text-[13px] font-bold text-foreground">
            <dt className="sr-only">Category</dt>
            <dd className="inline-flex items-center gap-1">
              <Target aria-hidden="true" className="size-4" />
              {challenge.category}
            </dd>
          </div>
          <div className="inline-flex items-center gap-1 font-body text-[13px] font-bold text-foreground">
            <dt className="sr-only">Difficulty</dt>
            <dd className="inline-flex items-center gap-1">
              <Zap aria-hidden="true" className="size-4" />
              {CTF_DIFFICULTY_LABELS[challenge.difficulty]}
            </dd>
          </div>
          <div>
            <dt className="sr-only">XP reward</dt>
            <dd>
              <XPChip xp={challenge.xpReward} />
            </dd>
          </div>
        </dl>

        {challenge.skills.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1">
            {challenge.skills.map((skill) => (
              <li
                key={skill}
                className="border-2 border-border bg-window-body px-2 py-0.5 font-body text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
              >
                {skill}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex justify-end">
          <Link
            href={`/ctf?challenge=${challenge.id}`}
            className={buttonClasses("primary")}
          >
            <Flag aria-hidden="true" className="size-3" /> OPEN CHALLENGE
          </Link>
        </div>
      </Window>
    </li>
  );
}

/**
 * The CTF catalog. Every challenge is a window so the list reads like a row
 * of open applications on the desktop.
 */
export function CtfChallengeList({
  challenges,
  error,
}: Readonly<{ challenges: CtfSummary[] | null; error: boolean }>) {
  if (error) {
    return (
      <FeedbackState
        error
        errorMessage="Challenges could not be loaded. Please try again later."
      >
        {null}
      </FeedbackState>
    );
  }

  if (!challenges || challenges.length === 0) {
    return (
      <FeedbackState
        empty
        emptyTitle="CTF.EXE"
        emptyMessage="No challenges available yet. Finish more Stages to unlock them."
      >
        {null}
      </FeedbackState>
    );
  }

  return (
    <ul className="space-y-4">
      {challenges.map((challenge) => (
        <ChallengeWindow key={challenge.id} challenge={challenge} />
      ))}
    </ul>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { ApiError, markStageComplete, type StageCompletion } from "@/lib/api-client";
import { Progress, Y2kButton, buttonClasses } from "@/components/y2k";
import { Y2kDialog } from "@/components/y2k-dialog";
import { levelProgress } from "@/lib/format";

interface StageCompletionProps {
  readonly stageId: number;
  readonly apiUrl: string;
  readonly completed: boolean;
  readonly nextStagePath?: string;
  /** The successor Stage's title, shown in the completion dialog. */
  readonly nextStageTitle?: string;
  /** Route to the Zone's Stage list, where the successor's newly-unlocked status is visible. */
  readonly zonePath: string;
  /** The learner's total XP as the page was rendered, before this completion. */
  readonly totalXpBefore?: number;
}

/**
 * Animates the learner's XP bar from before the completion to after it, so the
 * reward reads as movement rather than a static number. Falls back to a full bar
 * when the profile is unavailable.
 */
function XpBar({
  totalXpBefore,
  xpEarned,
}: Readonly<{ totalXpBefore?: number; xpEarned: number }>) {
  const target = totalXpBefore === undefined ? undefined : levelProgress(totalXpBefore + xpEarned);
  const span = target === undefined ? 100 : target.span;
  const to = target === undefined ? 100 : target.intoLevel;
  const from =
    totalXpBefore === undefined || target === undefined
      ? 0
      : levelProgress(totalXpBefore).level === target.level
        ? Math.min(to, levelProgress(totalXpBefore).intoLevel)
        : 0; // levelled up: sweep the new level from empty rather than start mid-way
  const reducedMotion =
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [value, setValue] = useState(reducedMotion ? to : from);

  useEffect(() => {
    // Reduced-motion users land on the end state immediately; the animated
    // sweep is decoration, not information.
    if (reducedMotion) return;
    const id = requestAnimationFrame(() => setValue(to));
    return () => cancelAnimationFrame(id);
  }, [to, reducedMotion]);

  return (
    <Progress value={value} max={Math.max(span, 1)} label="Experience progress" className="mt-1" />
  );
}

export function StageCompletion({
  stageId,
  apiUrl,
  completed,
  nextStagePath,
  nextStageTitle,
  zonePath,
  totalXpBefore,
}: StageCompletionProps) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StageCompletion | null>(null);
  const hasCompleted = completed || result !== null;

  async function handleComplete() {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Unable to obtain authentication session token");
      }
      const completion = await markStageComplete(apiUrl, token, stageId);
      router.refresh();
      setResult(completion);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setError(
          "This Stage has already been completed — reading it again awards no XP.",
        );
      } else if (err instanceof ApiError && err.status === 403) {
        setError(
          "This Stage is locked — complete the earlier Stages in the Zone first.",
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to complete the Stage. Please try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="mt-8 flex flex-col items-start gap-3">
        {completed && (
          <p className="border-2 border-border bg-window-body p-4 font-body text-sm font-bold text-muted-foreground shadow-[2px_2px_0_var(--border)]">
            Already completed — reading it again awards no XP.
          </p>
        )}
        <Y2kButton onClick={handleComplete} disabled={isLoading || hasCompleted}>
          {isLoading ? "SAVING…" : hasCompleted ? "COMPLETED" : "MARK AS COMPLETE"}
        </Y2kButton>
        {error && (
          <p role="alert" className="font-body text-sm font-bold text-btn-danger">
            {error}
          </p>
        )}
      </div>

      <Y2kDialog
        open={result !== null}
        onOpenChange={(open) => {
          if (!open) setResult(null);
        }}
        title="STAGE COMPLETE!"
        actions={
          <CompletionDialogActions nextStagePath={nextStagePath} zonePath={zonePath} />
        }
      >
        {result && (
          <CompletionDialogBody
            result={result}
            nextStagePath={nextStagePath}
            nextStageTitle={nextStageTitle}
            totalXpBefore={totalXpBefore}
          />
        )}
      </Y2kDialog>
    </>
  );
}

export function CompletionDialogActions({
  nextStagePath,
  zonePath,
}: Readonly<{ nextStagePath?: string; zonePath: string }>) {
  return (
    <>
      <Link href={zonePath} className={buttonClasses("secondary")}>BACK TO ZONE</Link>
      {nextStagePath && (
        <Link href={nextStagePath} className={buttonClasses("primary")}>NEXT STAGE</Link>
      )}
    </>
  );
}

export function CompletionDialogBody({
  result,
  nextStagePath,
  nextStageTitle,
  totalXpBefore,
}: Readonly<{
  result: StageCompletion;
  nextStagePath?: string;
  nextStageTitle?: string;
  totalXpBefore?: number;
}>) {
  const bonusApplied = result.eventType === "bonus" && result.eventMultiplier > 1;
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-pixel-lg text-2xl">+{result.xpEarned} XP</span>
        {bonusApplied && (
          <span className="font-body text-sm font-bold uppercase">
            Bonus ×{result.eventMultiplier}
          </span>
        )}
      </div>
      <XpBar totalXpBefore={totalXpBefore} xpEarned={result.xpEarned} />
      <span className="font-body text-sm text-muted-foreground">
        {nextStagePath
          ? `Next Stage unlocked: ${nextStageTitle ?? "the next Stage"}`
          : "Zone cleared — all Stages completed!"}
      </span>
      {result.leveledUp && (
        <span className="font-body text-sm">You reached Level {result.level}!</span>
      )}
      {result.badgesEarned.length > 0 && (
        <span className="font-body text-sm">
          Badges: {result.badgesEarned.map((b) => b.name).join(", ")}
        </span>
      )}
    </div>
  );
}

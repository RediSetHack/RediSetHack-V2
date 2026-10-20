"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { ApiError, markStageComplete, type StageCompletion } from "@/lib/api-client";
import { Y2kButton, buttonClasses } from "@/components/y2k";
import { Y2kDialog } from "@/components/y2k-dialog";

interface StageCompletionProps {
  readonly stageId: number;
  readonly apiUrl: string;
  readonly completed: boolean;
  readonly nextStagePath?: string;
  /** Route to the Zone's Stage list, where the successor's newly-unlocked status is visible. */
  readonly zonePath: string;
}

export function StageCompletion({
  stageId,
  apiUrl,
  completed,
  nextStagePath,
  zonePath,
}: StageCompletionProps) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StageCompletion | null>(null);

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
        {completed ? (
          <p className="border-2 border-border bg-window-body p-4 font-body text-sm font-bold text-muted-foreground shadow-[2px_2px_0_var(--border)]">
            Already completed — reading it again awards no XP.
          </p>
        ) : (
          <Y2kButton onClick={handleComplete} disabled={isLoading}>
            {isLoading ? "SAVING…" : "MARK AS COMPLETE"}
          </Y2kButton>
        )}
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
          <>
            <Link href={zonePath} className={buttonClasses("secondary")}>BACK TO ZONE</Link>
            {nextStagePath && (
              <Link href={nextStagePath} className={buttonClasses("primary")}>NEXT STAGE</Link>
            )}
          </>
        }
      >
        <div className="flex flex-col gap-2">
          {result && (
            <>
              <span>+{result.xpEarned} XP</span>
              {result.eventType === "bonus" && result.eventMultiplier > 1 && (
                <span className="font-body text-sm">
                  (Bonus ×{result.eventMultiplier})
                </span>
              )}
              {result.leveledUp && (
                <span className="font-body text-sm">
                  You reached Level {result.level}!
                </span>
              )}
              {result.badgesEarned.length > 0 && (
                <span className="font-body text-sm">
                  Badges: {result.badgesEarned.map((b) => b.name).join(", ")}
                </span>
              )}
              <span className="font-body text-sm text-muted-foreground">
                {nextStagePath ? "The next Stage in this Zone is now available." : "Zone cleared — all Stages completed!"}
              </span>
            </>
          )}
        </div>
      </Y2kDialog>
    </>
  );
}
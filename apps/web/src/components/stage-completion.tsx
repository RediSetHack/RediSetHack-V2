"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import { ApiError, markStageComplete, type StageCompletion } from "@/lib/api-client";

interface StageCompletionProps {
  readonly stageId: number;
  readonly apiUrl: string;
  readonly completed: boolean;
  /** Route to the Zone's Stage list, where the successor's newly-unlocked status is visible. */
  readonly zonePath: string;
}

export function StageCompletion({
  stageId,
  apiUrl,
  completed,
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
      // Re-run the app shell's Server Component so the shell's XP and Level
      // reflect the new total, and so the Lesson reads as completed.
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
          <p className="rounded-md border border-border/60 p-4 text-sm text-muted-foreground">
            This Stage is completed — reading it again awards no XP.
          </p>
        ) : (
          <Button onClick={handleComplete} disabled={isLoading}>
            {isLoading ? "Completing…" : "Mark Stage Complete"}
          </Button>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      {/*
        The Dialog is a sibling, not a branch: router.refresh() re-renders
        this component with completed=true right after a successful
        completion, and a dialog nested in the button branch would unmount
        before the learner could read the rewards.
      */}
      <Dialog.Root
        open={result !== null}
        onOpenChange={(open) => {
          if (!open) setResult(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/50 dark:bg-black/70" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-lg">
            <Dialog.Title className="text-lg font-semibold">
              Stage complete!
            </Dialog.Title>
            {result && (
              <>
                <Dialog.Description className="mt-2 text-sm text-muted-foreground">
                  You earned {result.xpEarned} XP
                  {result.eventType === "bonus" &&
                    ` — a Bonus Event multiplied it ×${result.eventMultiplier}`}
                  .
                </Dialog.Description>
                <div aria-live="polite" className="mt-4 space-y-3">
                  {result.leveledUp && (
                    <p className="text-sm font-medium text-foreground">
                      You reached Level {result.level}!
                    </p>
                  )}
                  {result.badgesEarned.length > 0 && (
                    <div className="rounded-lg border border-border/60 p-3">
                      <p className="text-sm font-medium text-foreground">
                        Badges earned
                      </p>
                      <ul className="mt-1 space-y-1">
                        {result.badgesEarned.map((badge) => (
                          <li
                            key={badge.id}
                            className="text-sm text-muted-foreground"
                          >
                            {badge.name}
                            {badge.awardCount > 1
                              ? ` ×${badge.awardCount}`
                              : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    The next Stage in this Zone is now available.
                  </p>
                </div>
              </>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <Dialog.Close render={<Button variant="outline" />}>
                Close
              </Dialog.Close>
              <Button render={<Link href={zonePath} />}>
                Continue to Zone Stages
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
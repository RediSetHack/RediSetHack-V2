"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import { ApiError, completeStage, type StageCompletion } from "@/lib/api-client";

function CompletionDialog({
  completion,
  open,
  onOpenChange,
  regionId,
  zoneId,
}: Readonly<{
  completion: StageCompletion;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  regionId: string;
  zoneId: number;
}>) {
  const isBonus = completion.eventType === "bonus";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/50 dark:bg-black/70" />
        <Dialog.Popup
          role="alertdialog"
          aria-live="polite"
          className="fixed top-1/2 left-1/2 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-lg"
        >
          <Dialog.Title className="text-lg font-semibold">Stage complete! 🎉</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            You earned <span className="font-semibold text-foreground">{completion.xpEarned} XP</span>
            {isBonus && (
              <>
                {" "}
                — a{" "}
                <span className="font-semibold text-foreground">
                  ×{completion.eventMultiplier} Bonus Event
                </span>{" "}
                multiplier was active.
              </>
            )}
          </Dialog.Description>

          {completion.leveledUp && (
            <p className="mt-4 rounded-lg bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900 dark:bg-amber-950/80 dark:text-amber-300">
              🆙 You reached Level {completion.level}!
            </p>
          )}

          {completion.badgesEarned.length > 0 && (
            <ul className="mt-4 space-y-2">
              {completion.badgesEarned.map((badge) => (
                <li
                  key={badge.badgeDefinitionId}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-foreground">🏅 {badge.name}</span>
                  <span className="text-xs text-muted-foreground">×{badge.awardCount}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close render={<Button variant="outline" />}>Stay here</Dialog.Close>
            {completion.nextStageId ? (
              <Button
                render={
                  <Link href={`/map/${regionId}/${zoneId}/${completion.nextStageId}`} />
                }
              >
                Continue to next Stage
              </Button>
            ) : (
              <Button render={<Link href={`/map/${regionId}/${zoneId}`} />}>Back to Zone</Button>
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function StageCompletionPanel({
  stageId,
  regionId,
  zoneId,
  apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
}: Readonly<{
  stageId: number;
  regionId: string;
  zoneId: number;
  apiUrl?: string;
}>) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [completion, setCompletion] = useState<StageCompletion | null>(null);
  const [ruleMessage, setRuleMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async () => {
    setIsLoading(true);
    setRuleMessage(null);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error("Unable to obtain authentication session token");

      const result = await completeStage(apiUrl, token, stageId);
      setCompletion(result);
      // Re-run server components (shell XP/Level, Stage listing) so the new
      // total and unlocked successor Stage show up without a fresh sign-in.
      router.refresh();
    } catch (err: unknown) {
      // A duplicate completion or a locked predecessor is the server
      // enforcing a rule, not a broken request — read it as one.
      if (err instanceof ApiError && (err.status === 400 || err.status === 403)) {
        setRuleMessage(err.message);
      } else {
        setError("Completing this Stage failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <Button onClick={handleComplete} disabled={isLoading}>
        {isLoading ? "Completing…" : "Mark Stage Complete"}
      </Button>
      {ruleMessage && (
        <p role="status" className="text-sm text-muted-foreground">
          {ruleMessage}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {completion && (
        <CompletionDialog
          completion={completion}
          open={true}
          onOpenChange={(open) => {
            if (!open) setCompletion(null);
          }}
          regionId={regionId}
          zoneId={zoneId}
        />
      )}
    </div>
  );
}

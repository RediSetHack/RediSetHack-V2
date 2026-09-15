"use client";

import { useRouter } from "next/navigation";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Button } from "@/components/ui/button";
import type { Quest } from "@/lib/api-client";

function formatTimeLimit(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  return minutes === 1 ? "1 minute" : `${minutes} minutes`;
}

function StartQuestDialog({ quest }: Readonly<{ quest: Quest }>) {
  const router = useRouter();

  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger render={<Button size="sm" />}>
        {quest.completed ? "Retake Quest" : "Start Quest"}
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 bg-black/50 dark:bg-black/70" />
        <AlertDialog.Popup className="fixed top-1/2 left-1/2 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-lg">
          <AlertDialog.Title className="text-lg font-semibold">
            Start &ldquo;{quest.title}&rdquo;?
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
            You&apos;ll have {formatTimeLimit(quest.timeLimitSeconds)} to finish once you
            start — the timer can&apos;t be paused.
          </AlertDialog.Description>
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialog.Close render={<Button variant="outline" />}>Cancel</AlertDialog.Close>
            <Button onClick={() => router.push(`/quests/${quest.id}/session`)}>
              Start
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

function QuestCard({ quest }: Readonly<{ quest: Quest }>) {
  return (
    <li className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
      <div>
        <p className="font-semibold text-foreground">
          {quest.title}
          {quest.completed && (
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Completed
            </span>
          )}
        </p>
        {quest.description && (
          <p className="mt-1 text-sm text-muted-foreground">{quest.description}</p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          {formatTimeLimit(quest.timeLimitSeconds)} • Pass at {quest.passingScore}% •{" "}
          {quest.xpReward} XP
        </p>
      </div>
      <StartQuestDialog quest={quest} />
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
  if (error || !quests) {
    return (
      <p role="alert" className="text-sm text-destructive">
        Quests could not be loaded. Please try again later.
      </p>
    );
  }

  if (quests.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No Quests are available yet — check back once new ones are added.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {quests.map((quest) => (
        <QuestCard key={quest.id} quest={quest} />
      ))}
    </ul>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { submitQuest, type QuestSession, type QuestSubmitResult } from "@/lib/api-client";
import {
  accumulateAnswer,
  formatCountdown,
  isExpired,
  secondsRemaining,
  toSubmission,
  type AnswerMap,
} from "@/lib/quest-session";

function CountdownAnnouncement({ seconds }: Readonly<{ seconds: number | null }>) {
  // Visually hidden and updated only at coarse checkpoints (see the tick
  // handler below) so the countdown doesn't spam a screen reader every
  // second — "announced non-intrusively" per the acceptance criteria.
  return (
    <div aria-live="polite" className="sr-only">
      {seconds !== null ? `${seconds} seconds remaining` : null}
    </div>
  );
}

function SubmissionResult({
  result,
  questId,
}: Readonly<{ result: QuestSubmitResult; questId: number }>) {
  return (
    <div className="space-y-6" aria-live="polite">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {result.passed ? "Quest passed!" : "Quest not passed"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Score: {result.score}%</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="font-medium text-foreground">
          {result.xpAwarded > 0
            ? `+${result.xpAwarded} XP awarded`
            : "No XP awarded"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          XP is only awarded the first time you pass a Quest — retaking a Quest
          you&apos;ve already passed is free to do, but won&apos;t earn XP again.
        </p>
      </div>

      {result.badgesEarned.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="font-medium text-foreground">Badges earned</p>
          <ul className="mt-2 space-y-1">
            {result.badgesEarned.map((badge) => (
              <li key={badge.id} className="text-sm text-muted-foreground">
                {badge.name}
                {badge.awardCount > 1 ? ` ×${badge.awardCount}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button render={<Link href={`/quests/results/${result.resultId}`} />}>
          Review your answers
        </Button>
        <Button variant="outline" render={<Link href={`/quests/${questId}/session`} />}>
          Retake Quest
        </Button>
        <Button variant="ghost" render={<Link href="/quests" />}>
          Back to Quests
        </Button>
      </div>
    </div>
  );
}

export function QuestSessionRunner({
  questId,
  session,
  apiUrl,
}: Readonly<{ questId: number; session: QuestSession; apiUrl: string }>) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(() =>
    secondsRemaining(session.expiresAt, Date.now()),
  );
  const [announcedSeconds, setAnnouncedSeconds] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<QuestSubmitResult | null>(null);

  // A ref, not state, so the interval's auto-submit always sees the latest
  // answers without needing to be torn down and rebuilt on every keystroke.
  const answersRef = useRef<AnswerMap>({});
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const submittedRef = useRef(false);
  // Expiry should trigger exactly one automatic submit attempt, not one
  // every tick while a failed attempt's error is on screen — the visible
  // "Submit Quest" button is the retry path after that.
  const autoSubmitTriggeredRef = useRef(false);

  const doSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Unable to obtain authentication session token");
      }
      const submitResult = await submitQuest(
        apiUrl,
        token,
        questId,
        toSubmission(answersRef.current),
      );
      // Re-run the app shell's Server Component so a passing result's new
      // XP/Level show up without a fresh sign-in.
      router.refresh();
      setResult(submitResult);
    } catch (err) {
      // Allow a retry without losing anything already answered.
      submittedRef.current = false;
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Failed to submit your Quest. Your answers are still here — try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [apiUrl, getToken, questId, router]);

  useEffect(() => {
    if (result) return;

    const tick = () => {
      const secs = secondsRemaining(session.expiresAt, Date.now());
      setRemaining(secs);
      if (secs === 60 || secs === 30 || (secs <= 10 && secs > 0)) {
        setAnnouncedSeconds(secs);
      }
      if (isExpired(session.expiresAt, Date.now()) && !autoSubmitTriggeredRef.current) {
        autoSubmitTriggeredRef.current = true;
        void doSubmit();
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session.expiresAt, doSubmit, result]);

  if (result) {
    return <SubmissionResult result={result} questId={questId} />;
  }

  const question = session.questions[index];
  const total = session.questions.length;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-6">
      <CountdownAnnouncement seconds={announcedSeconds} />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{session.title}</h1>
          <p className="text-sm text-muted-foreground">
            Question {index + 1} of {total} • {answeredCount} answered
          </p>
        </div>
        <p
          className={`text-sm font-semibold tabular-nums ${
            remaining <= 10 ? "text-destructive" : "text-foreground"
          }`}
        >
          Time remaining: {formatCountdown(remaining)}
        </p>
      </div>

      {question && (
        <fieldset className="rounded-xl border border-border bg-card p-4">
          <legend className="px-1 font-medium text-foreground">{question.prompt}</legend>
          <div className="mt-3 space-y-2">
            {question.options.map((option) => (
              <label
                key={option.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-transparent p-2 hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option.id}
                  checked={answers[question.id] === option.id}
                  onChange={() =>
                    setAnswers((prev) => accumulateAnswer(prev, question.id, option.id))
                  }
                  className="size-4"
                />
                <span className="text-sm text-foreground">{option.text}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {submitError && (
        <p role="alert" className="text-sm text-destructive">
          {submitError}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
            disabled={index === total - 1}
          >
            Next
          </Button>
        </div>
        <Button onClick={doSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Submitting…" : "Submit Quest"}
        </Button>
      </div>
    </div>
  );
}

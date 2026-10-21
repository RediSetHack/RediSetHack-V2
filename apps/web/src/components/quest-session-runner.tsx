"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { formatXp } from "@/lib/format";
import {
  submitQuest,
  type QuestSession,
  type QuestSubmitResult,
} from "@/lib/api-client";
import {
  accumulateAnswer,
  clockSkewMs,
  formatCountdown,
  isCountdownDanger,
  isExpired,
  secondsRemaining,
  toSubmission,
  unansweredSubmitMessage,
  type AnswerMap,
} from "@/lib/quest-session";
import {
  SegmentedTracker,
  Window,
  XPChip,
  Y2kButton,
  buttonClasses,
} from "@/components/y2k";
import { ConfirmDialog, ErrorAlert, Y2kAlert } from "@/components/y2k-dialog";

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

function CountdownAnnouncement({
  seconds,
}: Readonly<{ seconds: number | null }>) {
  // Visually hidden and updated only at coarse checkpoints (see the tick
  // handler below) so the countdown doesn't spam a screen reader every
  // second — "announced non-intrusively" per the acceptance criteria.
  return (
    <div aria-live="polite" className="sr-only">
      {seconds !== null ? `${seconds} seconds remaining` : null}
    </div>
  );
}

export function SubmissionResult({
  result,
  questId,
  title,
}: Readonly<{ result: QuestSubmitResult; questId: number; title: string }>) {
  return (
    <div className="space-y-4" aria-live="polite">
      <Window title={`${title} — RESULT`}>
        <h1 className="font-pixel text-lg leading-relaxed text-foreground">
          {result.outcome === "expired"
            ? "TIME EXPIRED"
            : result.passed
              ? "QUEST PASSED!"
              : "QUEST NOT PASSED"}
        </h1>
        <p className="mt-3 font-pixel-lg text-xl text-foreground">
          {result.outcome === "expired"
            ? "The deadline passed before your answers were submitted, so no credit was given."
            : `Score: ${result.score}%`}
        </p>
      </Window>

      <Window title="XP">
        <div className="flex flex-wrap items-center gap-3">
          {result.xpAwarded > 0 ? (
            <>
              <XPChip xp={result.xpAwarded} />
              <span className="font-pixel-lg text-xl text-foreground">
                +{formatXp(result.xpAwarded)} awarded
              </span>
            </>
          ) : (
            <span className="font-pixel-lg text-xl text-foreground">
              No XP awarded
            </span>
          )}
        </div>
        <p className="mt-2 font-body text-xs font-bold text-muted-foreground">
          XP is only awarded the first time you pass a Quest — retaking a Quest
          you&apos;ve already passed is free to do, but won&apos;t earn XP
          again.
        </p>
      </Window>

      <Window title="BADGES EARNED">
        {result.badgesEarned.length > 0 ? (
          <ul className="space-y-2">
            {result.badgesEarned.map((badge) => (
              <li
                key={badge.id}
                className="flex items-center gap-2 border-2 border-border bg-window-body px-2 py-1 font-body text-sm font-bold text-foreground shadow-[2px_2px_0_var(--border)]"
              >
                {badge.name}
                {badge.awardCount > 1 ? ` ×${badge.awardCount}` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-body text-sm font-bold text-muted-foreground">
            No badges earned.
          </p>
        )}
      </Window>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/quests/results/${result.resultId}`}
          className={buttonClasses("primary")}
        >
          REVIEW YOUR ANSWERS
        </Link>
        <Link
          href={`/quests/${questId}/session`}
          className={buttonClasses("secondary")}
        >
          RETAKE QUEST
        </Link>
        <Link href="/quests" className={buttonClasses("ghost")}>
          BACK TO QUESTS
        </Link>
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
  // ponytail: skew includes the start-to-hydrate latency; the server's
  // persisted deadline is what actually decides credit.
  const [skewMs] = useState(() => clockSkewMs(session.serverTime, Date.now()));
  const [remaining, setRemaining] = useState(() =>
    secondsRemaining(session.expiresAt, Date.now(), skewMs),
  );
  const [announcedSeconds, setAnnouncedSeconds] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<QuestSubmitResult | null>(null);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [timesUpOpen, setTimesUpOpen] = useState(false);

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
        session.id,
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
          : "Failed to submit. Your answers are still here — try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [apiUrl, getToken, questId, router, session.id]);

  useEffect(() => {
    if (result) return;

    const tick = () => {
      const secs = secondsRemaining(session.expiresAt, Date.now(), skewMs);
      setRemaining(secs);
      if (secs === 60 || secs === 30 || (secs <= 10 && secs > 0)) {
        setAnnouncedSeconds(secs);
      }
      if (
        isExpired(session.expiresAt, Date.now(), skewMs) &&
        !autoSubmitTriggeredRef.current
      ) {
        autoSubmitTriggeredRef.current = true;
        setTimesUpOpen(true);
        void doSubmit();
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session.expiresAt, skewMs, doSubmit, result]);

  const answeredSet = useMemo(() => {
    const set = new Set<number>();
    session.questions.forEach((q, i) => {
      if (answers[q.id] !== undefined) set.add(i);
    });
    return set;
  }, [answers, session.questions]);

  if (result) {
    return (
      <SubmissionResult
        result={result}
        questId={questId}
        title={session.title}
      />
    );
  }

  const question = session.questions[index];
  const total = session.questions.length;
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = total - answeredCount;
  const danger = isCountdownDanger(remaining);

  return (
    <div className="space-y-4">
      <CountdownAnnouncement seconds={announcedSeconds} />

      <Window title={session.title}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-body text-sm font-bold text-foreground">
            Question {index + 1} of {total} · {answeredCount} answered
          </p>
          <p
            className={cn(
              "inline-flex items-center gap-2 border-2 border-border px-2 py-1 font-pixel text-[9px] leading-relaxed tabular-nums",
              danger
                ? "bg-btn-danger text-white y2k-danger-pulse"
                : "bg-window-body text-foreground",
            )}
          >
            Time remaining: {formatCountdown(remaining)}
          </p>
        </div>
        <div className="mt-3">
          <SegmentedTracker
            total={total}
            current={index}
            answered={answeredSet}
            onSelect={(i) => setIndex(i)}
          />
        </div>
      </Window>

      {question && (
        <Window title={`QUESTION ${index + 1}`}>
          <fieldset>
            <legend className="font-body text-base font-bold text-foreground">
              {question.prompt}
            </legend>
            {(Boolean(question.difficulty) ||
              (question.competencies?.length ?? 0) > 0) && (
              <div className="mt-2 font-body text-xs font-bold text-muted-foreground">
                {question.difficulty && (
                  <p>Difficulty: {question.difficulty}</p>
                )}
                {question.competencies?.map((competency) => (
                  <p key={competency.id}>{competency.objective}</p>
                ))}
              </div>
            )}
            <div className="mt-4 space-y-2">
              {question.options.map((option, optionIndex) => {
                const selected = answers[question.id] === option.id;
                return (
                  <label
                    key={option.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 border-2 border-border bg-white p-3 transition-[filter] duration-[80ms] hover:brightness-[1.03]",
                      selected
                        ? "border-accent shadow-[3px_3px_0_var(--accent)]"
                        : "shadow-[3px_3px_0_var(--border)]",
                    )}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option.id}
                      checked={selected}
                      onChange={() =>
                        setAnswers((prev) =>
                          accumulateAnswer(prev, question.id, option.id),
                        )
                      }
                      className="sr-only"
                    />
                    <span className="flex size-6 shrink-0 items-center justify-center border-2 border-border bg-title-bar font-pixel text-[9px]">
                      {OPTION_LABELS[optionIndex] ?? optionIndex + 1}
                    </span>
                    <span className="font-body text-sm font-bold text-foreground">
                      {option.text}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </Window>
      )}

      {submitError && (
        <ErrorAlert
          message="Failed to submit. Your answers are still here — try again."
          onRetry={doSubmit}
          retryLabel="RETRY"
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Y2kButton
            variant="secondary"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
          >
            PREVIOUS
          </Y2kButton>
          <Y2kButton
            variant="secondary"
            onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
            disabled={index === total - 1}
          >
            NEXT
          </Y2kButton>
        </div>
        <Y2kButton
          onClick={() =>
            unansweredCount > 0 ? setConfirmSubmitOpen(true) : void doSubmit()
          }
          disabled={isSubmitting}
        >
          {isSubmitting ? "SUBMITTING…" : "SUBMIT QUEST"}
        </Y2kButton>
      </div>

      <ConfirmDialog
        open={confirmSubmitOpen}
        onOpenChange={setConfirmSubmitOpen}
        title="Submit Quest?"
        message={unansweredSubmitMessage(unansweredCount)}
        confirmLabel="SUBMIT"
        cancelLabel="CANCEL"
        onConfirm={() => void doSubmit()}
      />

      <Y2kAlert
        open={timesUpOpen}
        onOpenChange={setTimesUpOpen}
        title="TIME'S UP"
        icon="alert"
      >
        TIME&apos;S UP — submitting your answers…
      </Y2kAlert>
    </div>
  );
}

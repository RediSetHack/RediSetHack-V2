import type { QuestSubmission } from "./api-client.js";

/**
 * Pure Quest Session answer bookkeeping. The server scores the submission and
 * owns the deadline — this only turns learner input into
 * the state a countdown/answer UI needs, so it can be unit tested without a
 * DOM or a running timer.
 */

/** A map of questionId -> chosen optionId, keyed for O(1) lookup while navigating questions. */
export type AnswerMap = Record<number, number>;

/** Records (or overwrites) the learner's answer for one question, without losing any other answer. */
export function accumulateAnswer(
  answers: AnswerMap,
  questionId: number,
  optionId: number,
): AnswerMap {
  return { ...answers, [questionId]: optionId };
}

/** Turns the accumulated answers into the `responses` payload the submit endpoint expects. */
export function toSubmission(answers: AnswerMap): QuestSubmission[] {
  return Object.entries(answers).map(([questionId, optionId]) => ({
    questionId: Number(questionId),
    optionId,
  }));
}

/**
 * Milliseconds to add to the local clock to approximate the server's, taken
 * from the `serverTime` the session was issued with. The server's persisted
 * deadline is the authority; this only keeps the displayed countdown honest on
 * a skewed device clock.
 */
export function clockSkewMs(serverTime: string, localNow: number): number {
  return new Date(serverTime).getTime() - localNow;
}

/** True once `now` has reached or passed the session's deadline. */
export function isExpired(expiresAt: string, now: number, skewMs = 0): boolean {
  return now + skewMs >= new Date(expiresAt).getTime();
}

/** Whole seconds remaining until the deadline, floored at 0 (never negative). */
export function secondsRemaining(
  expiresAt: string,
  now: number,
  skewMs = 0,
): number {
  return Math.max(
    0,
    Math.ceil((new Date(expiresAt).getTime() - (now + skewMs)) / 1000),
  );
}

/** Formats whole seconds as `M:SS` for the visible countdown. */
export function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** The countdown enters its accessible visual danger state at ten seconds. */
export function isCountdownDanger(totalSeconds: number): boolean {
  return totalSeconds <= 10;
}

/**
 * The polite screen-reader announcement for a countdown tick, or `null` when
 * the tick is not worth announcing. Announcements stay rare so a screen
 * reader is not read a bare number every second; the last ten seconds are
 * announced one by one and say that time is running out, because that is the
 * window the countdown turns red in.
 */
export function countdownAnnouncement(totalSeconds: number): string | null {
  if (totalSeconds <= 0) return null;
  const remaining =
    totalSeconds === 1 ? "1 second remaining" : `${totalSeconds} seconds remaining`;
  if (totalSeconds === 60 || totalSeconds === 30) {
    return remaining;
  }
  if (totalSeconds <= 10) {
    return `${remaining}. Time is running out`;
  }
  return null;
}

/**
 * True when the deadline has passed and the automatic submission has not been
 * attempted yet. Expiry triggers exactly one automatic submission; a failed
 * attempt is retried from the visible RETRY button rather than resubmitting on
 * every tick.
 */
export function shouldAutoSubmit(
  expired: boolean,
  alreadyTriggered: boolean,
): boolean {
  return expired && !alreadyTriggered;
}

/** The alert copy for a failed submission — the learner's answers are kept. */
export const SUBMIT_ERROR_MESSAGE =
  "Failed to submit. Your answers are still here — try again.";

/**
 * Extra detail for a failed submission, or `null` when the server said nothing
 * the fixed copy does not already say.
 */
export function submitErrorDetail(detail?: string | null): string | null {
  const trimmed = detail?.trim();
  if (!trimmed || trimmed === SUBMIT_ERROR_MESSAGE) return null;
  return trimmed;
}

/** Copy for the confirmation shown when a learner submits an incomplete Quest. */
export function unansweredSubmitMessage(unansweredCount: number): string {
  return `You have ${unansweredCount} unanswered ${
    unansweredCount === 1 ? "question" : "questions"
  }. Submit anyway?`;
}

/** The headline, score line and expiry note of a submitted Quest Result. */
export interface QuestResultSummary {
  headline: string;
  score: string;
  note: string | null;
}

/**
 * The Result window copy for a submission. A Quest that expired is still a
 * Quest that was not passed — the expiry is an extra note, not a third
 * headline, so the result window always reads pass or not passed.
 */
export function questResultSummary(result: {
  passed: boolean;
  score: number;
  outcome: "submitted" | "expired";
}): QuestResultSummary {
  return {
    headline: result.passed ? "QUEST PASSED!" : "QUEST NOT PASSED",
    score: `Score: ${result.score}%`,
    note:
      result.outcome === "expired"
        ? "TIME EXPIRED — the deadline passed before your answers were submitted, so no credit was given."
        : null,
  };
}

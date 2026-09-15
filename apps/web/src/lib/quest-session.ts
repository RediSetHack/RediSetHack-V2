import type { QuestSubmission } from "./api-client.js";

/**
 * Pure Quest Session answer bookkeeping. The server scores the submission and
 * enforces nothing about timing here — this only turns learner input into
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

/** True once `now` has reached or passed the session's deadline. */
export function isExpired(expiresAt: string, now: number): boolean {
  return now >= new Date(expiresAt).getTime();
}

/** Whole seconds remaining until the deadline, floored at 0 (never negative). */
export function secondsRemaining(expiresAt: string, now: number): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / 1000));
}

/** Formats whole seconds as `M:SS` for the visible countdown. */
export function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

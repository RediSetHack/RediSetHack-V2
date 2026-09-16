import { z } from "zod";

import { BadgeAwardSchema } from "../badges/badge-award.schema.js";

export type { BadgeAward } from "../badges/badge-award.schema.js";

/**
 * A single Quest as listed by `QuestPresenter.toListItem` in `apps/api`.
 * `completed` is computed server-side from the learner's passed Quest
 * attempts; it is never recomputed client-side.
 */
export const QuestSchema = z.object({
  id: z.number().int().positive(),
  stageId: z.number().int().positive(),
  title: z.string(),
  description: z.string().nullable(),
  timeLimitSeconds: z.number().int().positive(),
  passingScore: z.number().int().nonnegative(),
  xpReward: z.number().int().nonnegative(),
  completed: z.boolean(),
});
export type Quest = z.infer<typeof QuestSchema>;

/** The Quest listing, `GET /v1/api/quests`. */
export const QuestListResponseSchema = z.array(QuestSchema);
export type QuestListResponse = z.infer<typeof QuestListResponseSchema>;

/** An option as offered during an active Quest Session — `isCorrect` is withheld. */
export const QuestSessionOptionSchema = z.object({
  id: z.number().int().positive(),
  text: z.string(),
});
export type QuestSessionOption = z.infer<typeof QuestSessionOptionSchema>;

export const QuestSessionQuestionSchema = z.object({
  id: z.number().int().positive(),
  prompt: z.string(),
  options: z.array(QuestSessionOptionSchema),
});
export type QuestSessionQuestion = z.infer<typeof QuestSessionQuestionSchema>;

/** A started Quest Session, `POST /v1/api/quests/:questId/start`. */
export const QuestSessionResponseSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  description: z.string().nullable(),
  timeLimitSeconds: z.number().int().positive(),
  expiresAt: z.string(),
  questions: z.array(QuestSessionQuestionSchema),
});
export type QuestSessionResponse = z.infer<typeof QuestSessionResponseSchema>;

/** A response the learner gave for one question, sent back on submission. */
export const QuestResponseSchema = z.object({
  questionId: z.number().int().positive(),
  optionId: z.number().int().positive(),
});
export type QuestResponse = z.infer<typeof QuestResponseSchema>;

/** The outcome of submitting a Quest, `POST /v1/api/quests/:questId/submit`. */
export const SubmitQuestResponseSchema = z.object({
  resultId: z.number().int().positive(),
  score: z.number().int().nonnegative(),
  passed: z.boolean(),
  xpAwarded: z.number().int().nonnegative(),
  badgesEarned: z.array(BadgeAwardSchema),
});
export type SubmitQuestResponse = z.infer<typeof SubmitQuestResponseSchema>;

/** One reviewed question after submission — correct answers are now visible. */
export const QuestResultBreakdownOptionSchema = z.object({
  id: z.number().int().positive(),
  text: z.string(),
  isCorrect: z.boolean(),
});

export const QuestResultBreakdownItemSchema = z.object({
  questionId: z.number().int().positive(),
  prompt: z.string(),
  options: z.array(QuestResultBreakdownOptionSchema),
  chosenOptionId: z.number().int().positive().nullable(),
  isCorrect: z.boolean(),
});
export type QuestResultBreakdownItem = z.infer<typeof QuestResultBreakdownItemSchema>;

/** A submitted Result reviewed against the correct answers, `GET /v1/api/quests/results/:resultId`. */
export const QuestResultReviewResponseSchema = z.object({
  resultId: z.number().int().positive(),
  questId: z.number().int().positive(),
  score: z.number().int().nonnegative(),
  passed: z.boolean(),
  submittedAt: z.string(),
  breakdown: z.array(QuestResultBreakdownItemSchema),
});
export type QuestResultReviewResponse = z.infer<typeof QuestResultReviewResponseSchema>;

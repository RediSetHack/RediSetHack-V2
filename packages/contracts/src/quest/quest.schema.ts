import { z } from "zod";

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

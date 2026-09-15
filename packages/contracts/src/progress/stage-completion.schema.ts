import { z } from "zod";

/** A Badge earned as part of a Stage completion, with its repeat count. */
export const StageCompletionBadgeSchema = z.object({
  badgeDefinitionId: z.number().int().positive(),
  name: z.string(),
  slug: z.string(),
  imageUrl: z.string().nullable(),
  awardCount: z.number().int().positive(),
});
export type StageCompletionBadge = z.infer<typeof StageCompletionBadgeSchema>;

/**
 * The result of completing a Stage, as returned by `CompletedStagePresenter`
 * — `POST /v1/api/stages/:stageId/complete`. `level` and `leveledUp` reflect
 * the learner's totalXp after this award; `badgesEarned` is empty when
 * nothing new was earned. `nextStageId` is `null` when the completed Stage
 * was the last in its Zone.
 */
export const StageCompletionResponseSchema = z.object({
  stageId: z.number().int().positive(),
  xpEarned: z.number().int().nonnegative(),
  eventMultiplier: z.number().positive(),
  eventType: z.enum(["normal", "bonus"]),
  level: z.number().int().positive(),
  leveledUp: z.boolean(),
  badgesEarned: z.array(StageCompletionBadgeSchema),
  nextStageId: z.number().int().positive().nullable(),
});
export type StageCompletionResponse = z.infer<typeof StageCompletionResponseSchema>;

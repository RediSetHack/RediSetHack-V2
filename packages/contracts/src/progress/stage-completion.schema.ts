import { z } from "zod";

import { BadgeAwardSchema } from "../badges/badge-award.schema.js";

/**
 * The outcome of marking a Stage complete, `POST /v1/api/stages/:stageId/complete`.
 * Everything a learner is told about the reward lives here — XP amount, the
 * Level reached, and any Badges earned are all decided server-side, never
 * recomputed on the client.
 */
export const StageCompletionResponseSchema = z.object({
  stageId: z.number().int().positive(),
  xpEarned: z.number().int().nonnegative(),
  eventMultiplier: z.number().int().positive(),
  eventType: z.enum(["normal", "bonus"]),
  level: z.number().int().positive(),
  leveledUp: z.boolean(),
  badgesEarned: z.array(BadgeAwardSchema),
});
export type StageCompletionResponse = z.infer<typeof StageCompletionResponseSchema>;
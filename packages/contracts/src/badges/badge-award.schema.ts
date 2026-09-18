import { z } from "zod";

/**
 * A Badge newly awarded as a side effect of a completion or submission, with
 * its repeat count — Badges are earnable more than once and the count is the
 * achievement. One shared shape for every endpoint that awards them.
 */
export const BadgeAwardSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  awardCount: z.number().int().positive(),
});
export type BadgeAward = z.infer<typeof BadgeAwardSchema>;
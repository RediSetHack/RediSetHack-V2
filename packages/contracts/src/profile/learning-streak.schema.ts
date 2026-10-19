import { z } from "zod";

const DaySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** One Asia/Manila calendar day. `reading` and `assessed` count qualifying accomplishments separately. */
export const LearningDaySchema = z.object({
  date: DaySchema,
  reading: z.number().int().nonnegative(),
  assessed: z.number().int().nonnegative(),
});
export type LearningDay = z.infer<typeof LearningDaySchema>;

/**
 * Learning streaks and contribution history (`GET /v1/api/users/learning-streak`).
 * `days` is dense (zero-activity days included) for `from`..`to`; streaks span the
 * learner's full history, so they do not depend on the requested range.
 */
export const LearningStreakResponseSchema = z.object({
  timeZone: z.literal("Asia/Manila"),
  today: DaySchema,
  from: DaySchema,
  to: DaySchema,
  currentStreak: z.number().int().nonnegative(),
  longestStreak: z.number().int().nonnegative(),
  days: z.array(LearningDaySchema),
});
export type LearningStreakResponse = z.infer<typeof LearningStreakResponseSchema>;

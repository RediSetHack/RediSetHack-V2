import { z } from "zod";

/**
 * A single ranked row, as returned by `LeaderboardPresenter` in `apps/api`
 * (`GET /v1/api/leaderboard`). Rank and `totalXp` ordering are computed
 * server-side; the client never re-ranks entries. Order is `totalXp` desc then
 * user id asc, so ties get distinct, stable ranks (1, 2, 3, 4) and the table and
 * `me` always agree.
 */
export const LeaderboardEntrySchema = z.object({
  rank: z.number().int().positive(),
  userId: z.string(),
  name: z.string().nullable(),
  totalXp: z.number().int().nonnegative(),
  level: z.number().int().positive(),
});
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;

/**
 * The signed-in learner's own standing, regardless of which page is returned.
 * `null` when they have no XP yet: zero-XP learners are left off the leaderboard.
 */
export const LeaderboardMeSchema = LeaderboardEntrySchema.omit({ userId: true, name: true });
export type LeaderboardMe = z.infer<typeof LeaderboardMeSchema>;

/** A page of the leaderboard, as returned by `GET /v1/api/leaderboard`. */
export const LeaderboardResponseSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  entries: z.array(LeaderboardEntrySchema),
  me: LeaderboardMeSchema.nullable(),
});
export type LeaderboardResponse = z.infer<typeof LeaderboardResponseSchema>;

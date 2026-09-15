import { z } from "zod";

/**
 * A single ranked row, as returned by `LeaderboardPresenter` in `apps/api`
 * (`GET /v1/api/leaderboard`). Rank and `totalXp` ordering are computed
 * server-side; the client never re-ranks entries.
 */
export const LeaderboardEntrySchema = z.object({
  rank: z.number().int().positive(),
  userId: z.string(),
  name: z.string().nullable(),
  totalXp: z.number().int().nonnegative(),
  level: z.number().int().positive(),
});
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;

/** A page of the leaderboard, as returned by `GET /v1/api/leaderboard`. */
export const LeaderboardResponseSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  entries: z.array(LeaderboardEntrySchema),
});
export type LeaderboardResponse = z.infer<typeof LeaderboardResponseSchema>;

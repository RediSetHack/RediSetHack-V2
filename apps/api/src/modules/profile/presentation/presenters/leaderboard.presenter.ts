import type { LeaderboardPage } from "../../application/get-leaderboard.use-case.js";

export class LeaderboardPresenter {
  static toResponse(page: LeaderboardPage) {
    return {
      page: page.page,
      limit: page.limit,
      total: page.total,
      entries: page.entries.map((entry) => ({
        rank: entry.rank,
        userId: entry.userId,
        name: entry.name,
        totalXp: entry.totalXp,
        level: entry.level,
      })),
    };
  }
}

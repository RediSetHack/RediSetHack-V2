import { describe, expect, it, vi } from "vitest";

import { GetLeaderboardUseCase } from "./application/get-leaderboard.use-case.js";
import { ProfileRepository } from "./domain/ports/profile.repository.js";

describe("GetLeaderboardUseCase", () => {
  it("ranks entries by the repository's XP order and offsets rank by page", async () => {
    const profiles: ProfileRepository = {
      findProfileByUserId: vi.fn(),
      findLeaderboardPage: vi.fn().mockResolvedValue({
        rows: [
          { userId: "user_1", name: "Top Learner", totalXp: 900 },
          { userId: "user_2", name: "Runner Up", totalXp: 400 },
        ],
        total: 5,
      }),
    };
    const useCase = new GetLeaderboardUseCase(profiles);

    const result = await useCase.execute(2, 2);

    expect(profiles.findLeaderboardPage).toHaveBeenCalledWith(2, 2);
    expect(result.entries.map((entry) => [entry.rank, entry.userId, entry.level])).toEqual([
      [3, "user_1", 4],
      [4, "user_2", 3],
    ]);
    expect(result).toMatchObject({ page: 2, limit: 2, total: 5 });
  });
});

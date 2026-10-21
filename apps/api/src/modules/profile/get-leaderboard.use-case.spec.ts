import { describe, expect, it, vi } from "vitest";

import { GetLeaderboardUseCase } from "./application/get-leaderboard.use-case.js";
import { ProfileRepository } from "./domain/ports/profile.repository.js";

describe("GetLeaderboardUseCase", () => {
  it("ranks entries by the repository's XP order and offsets rank by page", async () => {
    const profiles: ProfileRepository = {
      findProfileByUserId: vi.fn(),
      findDailyLearningActivity: vi.fn(),
      findUserIdByShareId: vi.fn(),
      setSharing: vi.fn(),
      findLeaderboardStanding: vi.fn().mockResolvedValue({ rank: 42, totalXp: 900 }),
      findLeaderboardPage: vi.fn().mockResolvedValue({
        rows: [
          { userId: "user_1", name: "Top Learner", totalXp: 900 },
          { userId: "user_2", name: "Runner Up", totalXp: 400 },
        ],
        total: 5,
      }),
    };
    const useCase = new GetLeaderboardUseCase(profiles);

    const result = await useCase.execute("user_9", 2, 2);

    expect(profiles.findLeaderboardPage).toHaveBeenCalledWith(2, 2);
    expect(result.entries.map((entry) => [entry.rank, entry.userId, entry.level])).toEqual([
      [3, "user_1", 4],
      [4, "user_2", 3],
    ]);
    expect(result).toMatchObject({ page: 2, limit: 2, total: 5 });
    expect(profiles.findLeaderboardStanding).toHaveBeenCalledWith("user_9");
    expect(result.me).toEqual({ rank: 42, totalXp: 900, level: 4 });
  });

  it("has no standing for an unranked learner", async () => {
    const profiles = {
      findLeaderboardStanding: vi.fn().mockResolvedValue(null),
      findLeaderboardPage: vi.fn().mockResolvedValue({ rows: [], total: 0 }),
    } as unknown as ProfileRepository;

    const result = await new GetLeaderboardUseCase(profiles).execute("user_0", 1, 20);

    expect(result.me).toBeNull();
  });
});

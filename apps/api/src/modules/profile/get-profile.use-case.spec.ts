import { describe, expect, it, vi } from "vitest";

import { GetProfileUseCase } from "./application/get-profile.use-case.js";
import { ProfileRepository, type ProfileData } from "./domain/ports/profile.repository.js";
import { BadgeAwardSummary } from "./domain/entities/badge-award-summary.entity.js";
import { UserNotFoundError } from "../auth/domain/errors.js";

const profileData: ProfileData = {
  userId: "user_1",
  totalXp: 450,
  character: { id: 1, name: "Kalayaan", slug: "kalayaan", imageUrl: null },
  badges: [new BadgeAwardSummary(1, "Pull Shark", "pull-shark", null, 3, new Date("2026-01-01"))],
};

describe("GetProfileUseCase", () => {
  it("aggregates character, xp, level, and badge multiplicity into a profile", async () => {
    const profiles: ProfileRepository = {
      findProfileByUserId: vi.fn().mockResolvedValue(profileData),
      findLeaderboardPage: vi.fn(),
    };
    const useCase = new GetProfileUseCase(profiles);

    const profile = await useCase.execute("user_1");

    expect(profiles.findProfileByUserId).toHaveBeenCalledWith("user_1");
    expect(profile.character).toEqual(profileData.character);
    expect(profile.totalXp).toBe(450);
    expect(profile.level).toBe(3); // sqrt(450 / 100) -> level 3
    expect(profile.badges).toEqual([
      expect.objectContaining({ name: "Pull Shark", count: 3 }),
    ]);
  });

  it("throws UserNotFoundError when the user does not exist", async () => {
    const profiles: ProfileRepository = {
      findProfileByUserId: vi.fn().mockResolvedValue(null),
      findLeaderboardPage: vi.fn(),
    };
    const useCase = new GetProfileUseCase(profiles);

    await expect(useCase.execute("missing_user")).rejects.toBeInstanceOf(UserNotFoundError);
  });
});

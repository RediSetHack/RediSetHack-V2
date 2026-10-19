import { describe, expect, it, vi } from "vitest";
import { SharedProfileResponseSchema } from "@repo/contracts";

import { GetSharedProfileUseCase, SharedProfileNotFoundError } from "./application/get-shared-profile.use-case.js";
import { ProfileRepository, type ProfileData } from "./domain/ports/profile.repository.js";
import { BadgeAwardSummary } from "./domain/entities/badge-award-summary.entity.js";

const data: ProfileData = {
  userId: "user_private_id",
  totalXp: 450,
  character: { id: 1, name: "Kalayaan", slug: "kalayaan", imageUrl: null },
  badges: [new BadgeAwardSummary(7, "Pull Shark", "pull-shark", null, 3, new Date("2026-01-01"))],
  activity: [{ id: "a", activityType: "ctf", activityId: 1, occurredAt: new Date(), outcome: { status: "solved" } }],
  initialCompetencyBaseline: null,
  accomplishments: { novelsCompleted: 1, sideQuestsCompleted: 2, ctfsSolved: 3 },
  shareId: "0b0f6d3e-6a0f-4c1e-9a53-4c2d1d1c8a11",
};

const repo = (userId: string | null): ProfileRepository => ({
  findUserIdByShareId: vi.fn().mockResolvedValue(userId),
  findProfileByUserId: vi.fn().mockResolvedValue(userId ? data : null),
  findDailyLearningActivity: vi.fn().mockResolvedValue([
    { date: "2026-10-18", reading: 1, assessed: 0 },
    { date: "2026-10-19", reading: 0, assessed: 1 },
  ]),
  setSharing: vi.fn(),
  findLeaderboardPage: vi.fn(),
});

describe("GetSharedProfileUseCase", () => {
  it("returns only the approved summary, never identifiers or activity", async () => {
    const summary = await new GetSharedProfileUseCase(repo("user_private_id")).execute(data.shareId!, new Date("2026-10-19T04:00:00Z"));

    SharedProfileResponseSchema.strict().parse(summary);
    expect(summary).toMatchObject({ adventurerRank: 3, totalXp: 450, currentStreak: 2, longestStreak: 2 });
    expect(summary.badges).toEqual([{ name: "Pull Shark", slug: "pull-shark", imageUrl: null, count: 3 }]);
    const json = JSON.stringify(summary);
    for (const secret of ["user_private_id", "email", "activity", data.shareId!, "badgeDefinitionId"]) expect(json).not.toContain(secret);
  });

  it("treats an unknown or revoked share id as not found", async () => {
    await expect(new GetSharedProfileUseCase(repo(null)).execute("x")).rejects.toBeInstanceOf(SharedProfileNotFoundError);
  });
});

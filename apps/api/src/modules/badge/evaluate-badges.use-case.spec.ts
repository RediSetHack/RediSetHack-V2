import { describe, expect, it, vi } from "vitest";

import { BadgeDefinition } from "./domain/entities/badge.entity.js";
import type { BadgeRepository } from "./domain/ports/badge.repository.js";
import { EvaluateBadgesUseCase } from "./application/evaluate-badges.use-case.js";

const cumulativeBadge = new BadgeDefinition(
  1,
  "Getting Started",
  "getting-started",
  null,
  { trigger: "cumulative", target: "stage_completions", threshold: 5 },
  null,
);

const activityBadge = new BadgeDefinition(
  2,
  "Quiz Whiz",
  "quiz-whiz",
  null,
  { trigger: "activity", target: "quest_passes", threshold: 3 },
  null,
);

const categoryBadge = new BadgeDefinition(
  3,
  "Zone Master",
  "zone-master",
  null,
  { trigger: "category", target: "zone_completion", zoneId: 7 },
  null,
);

function makeRepo(overrides: Partial<BadgeRepository> = {}): BadgeRepository {
  return {
    findAll: vi.fn().mockResolvedValue([]),
    countAwards: vi.fn().mockResolvedValue(0),
    awardMany: vi.fn(),
    findEarnedByUser: vi.fn(),
    countCompletedStages: vi.fn().mockResolvedValue(0),
    countPassedQuests: vi.fn().mockResolvedValue(0),
    isZoneCompleted: vi.fn().mockResolvedValue(false),
    ...overrides,
  };
}

describe("EvaluateBadgesUseCase", () => {
  it("awards a cumulative badge once its stage-completion threshold is crossed", async () => {
    const repo = makeRepo({
      findAll: vi.fn().mockResolvedValue([cumulativeBadge]),
      countCompletedStages: vi.fn().mockResolvedValue(5),
      countAwards: vi.fn().mockResolvedValue(0),
    });
    const useCase = new EvaluateBadgesUseCase(repo);

    const awarded = await useCase.execute("user_1");

    expect(awarded).toEqual([{ badge: cumulativeBadge, awardCount: 1, newAwards: 1 }]);
    expect(repo.awardMany).toHaveBeenCalledWith("user_1", 1, 1);
  });

  it("increments the award count multiple times once several thresholds are crossed at once", async () => {
    const repo = makeRepo({
      findAll: vi.fn().mockResolvedValue([cumulativeBadge]),
      countCompletedStages: vi.fn().mockResolvedValue(17), // 3 full x5 milestones
      countAwards: vi.fn().mockResolvedValue(1),
    });
    const useCase = new EvaluateBadgesUseCase(repo);

    const awarded = await useCase.execute("user_1");

    expect(awarded).toEqual([{ badge: cumulativeBadge, awardCount: 3, newAwards: 2 }]);
    expect(repo.awardMany).toHaveBeenCalledWith("user_1", 1, 2);
  });

  it("does not re-award a cumulative badge when no new threshold has been crossed", async () => {
    const repo = makeRepo({
      findAll: vi.fn().mockResolvedValue([cumulativeBadge]),
      countCompletedStages: vi.fn().mockResolvedValue(6),
      countAwards: vi.fn().mockResolvedValue(1),
    });
    const useCase = new EvaluateBadgesUseCase(repo);

    const awarded = await useCase.execute("user_1");

    expect(awarded).toEqual([]);
    expect(repo.awardMany).not.toHaveBeenCalled();
  });

  it("awards an activity badge based on distinct passed quest count", async () => {
    const repo = makeRepo({
      findAll: vi.fn().mockResolvedValue([activityBadge]),
      countPassedQuests: vi.fn().mockResolvedValue(3),
      countAwards: vi.fn().mockResolvedValue(0),
    });
    const useCase = new EvaluateBadgesUseCase(repo);

    const awarded = await useCase.execute("user_1");

    expect(awarded).toEqual([{ badge: activityBadge, awardCount: 1, newAwards: 1 }]);
  });

  it("awards a category badge once when its target zone becomes fully completed", async () => {
    const repo = makeRepo({
      findAll: vi.fn().mockResolvedValue([categoryBadge]),
      isZoneCompleted: vi.fn().mockResolvedValue(true),
      countAwards: vi.fn().mockResolvedValue(0),
    });
    const useCase = new EvaluateBadgesUseCase(repo);

    const awarded = await useCase.execute("user_1");

    expect(awarded).toEqual([{ badge: categoryBadge, awardCount: 1, newAwards: 1 }]);
    expect(repo.awardMany).toHaveBeenCalledWith("user_1", 3, 1);
  });

  it("does not award a category badge again once it has already been earned", async () => {
    const repo = makeRepo({
      findAll: vi.fn().mockResolvedValue([categoryBadge]),
      isZoneCompleted: vi.fn().mockResolvedValue(true),
      countAwards: vi.fn().mockResolvedValue(1),
    });
    const useCase = new EvaluateBadgesUseCase(repo);

    const awarded = await useCase.execute("user_1");

    expect(awarded).toEqual([]);
    expect(repo.awardMany).not.toHaveBeenCalled();
  });

  it("evaluates every active badge definition independently in one pass", async () => {
    const repo = makeRepo({
      findAll: vi.fn().mockResolvedValue([cumulativeBadge, activityBadge, categoryBadge]),
      countCompletedStages: vi.fn().mockResolvedValue(10),
      countPassedQuests: vi.fn().mockResolvedValue(0),
      isZoneCompleted: vi.fn().mockResolvedValue(false),
      countAwards: vi.fn().mockResolvedValue(0),
    });
    const useCase = new EvaluateBadgesUseCase(repo);

    const awarded = await useCase.execute("user_1");

    expect(awarded).toEqual([{ badge: cumulativeBadge, awardCount: 2, newAwards: 2 }]);
  });
});

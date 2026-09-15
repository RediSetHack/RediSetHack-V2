import { describe, expect, it, vi } from 'vitest';

import { makeEvaluateBadges } from '../badge/evaluate-badges.fixture.js';
import { BadgeDefinition } from '../badge/domain/entities/badge.entity.js';
import { EvaluateBadgesUseCase } from '../badge/application/evaluate-badges.use-case.js';
import { Stage } from '../content/domain/entities/stage.entity.js';
import type { StageRepository } from '../content/domain/ports/stage.repository.js';
import { DailyEvent } from '../daily-event/domain/entities/daily-event.entity.js';
import type { DailyEventRepository } from '../daily-event/domain/ports/daily-event.repository.js';
import { GetTodayEventUseCase } from '../daily-event/application/get-today-event.use-case.js';
import { MarkStageCompleteUseCase } from './application/mark-stage-complete.use-case.js';
import type { ProgressRepository } from './domain/ports/progress.repository.js';
import {
  StageAlreadyCompletedError,
  StageLockedError,
  StageNotFoundError,
} from './domain/errors.js';

const stages: Stage[] = [
  new Stage(1, 1, 'Intro', 'intro', null, 10, 0),
  new Stage(2, 1, 'Basics', 'basics', null, 20, 1),
];

function makeStageRepo(
  overrides: Partial<StageRepository> = {},
): StageRepository {
  return {
    findById: vi.fn(),
    findByZoneId: vi.fn().mockResolvedValue(stages),
    findCompletedStageIds: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

function makeEvent(
  eventType: 'normal' | 'bonus',
  xpMultiplier: number,
): GetTodayEventUseCase {
  const repo: DailyEventRepository = {
    findByDate: vi
      .fn()
      .mockResolvedValue(
        new DailyEvent(1, '2026-09-11', eventType, xpMultiplier),
      ),
    create: vi.fn(),
  };
  return new GetTodayEventUseCase(repo);
}

function makeProgress(previousXp: number | null = 0): ProgressRepository {
  return {
    markCompleted: vi
      .fn()
      .mockResolvedValue(previousXp === null ? null : { previousXp }),
  };
}

describe('MarkStageCompleteUseCase', () => {
  it("awards base XP when today's event is Normal", async () => {
    const repo = makeStageRepo({
      findById: vi.fn().mockResolvedValue(stages[1]),
      findCompletedStageIds: vi.fn().mockResolvedValue([1]),
    });
    const progress = makeProgress();
    const useCase = new MarkStageCompleteUseCase(
      repo,
      progress,
      makeEvent('normal', 1),
      makeEvaluateBadges(),
    );

    const completion = await useCase.execute('user_1', 2);

    expect(completion).toEqual({
      stageId: 2,
      xpEarned: 20,
      eventMultiplier: 1,
      eventType: 'normal',
      level: 1,
      leveledUp: false,
      badgesEarned: [],
      nextStageId: null,
    });
    expect(progress.markCompleted).toHaveBeenCalledWith('user_1', 2, 20);
  });

  it("doubles XP when today's event is Bonus", async () => {
    const repo = makeStageRepo({
      findById: vi.fn().mockResolvedValue(stages[1]),
      findCompletedStageIds: vi.fn().mockResolvedValue([1]),
    });
    const progress = makeProgress();
    const useCase = new MarkStageCompleteUseCase(
      repo,
      progress,
      makeEvent('bonus', 2),
      makeEvaluateBadges(),
    );

    const completion = await useCase.execute('user_1', 2);

    expect(completion.xpEarned).toBe(40);
    expect(completion.eventMultiplier).toBe(2);
    expect(completion.eventType).toBe('bonus');
    expect(progress.markCompleted).toHaveBeenCalledWith('user_1', 2, 40);
  });

  it('allows completing stage 1 without any progression', async () => {
    const repo = makeStageRepo({
      findById: vi.fn().mockResolvedValue(stages[0]),
    });
    const progress = makeProgress();
    const useCase = new MarkStageCompleteUseCase(
      repo,
      progress,
      makeEvent('normal', 1),
      makeEvaluateBadges(),
    );

    const completion = await useCase.execute('user_1', 1);

    expect(completion.xpEarned).toBe(10);
  });

  it('throws StageLockedError when predecessor is not completed', async () => {
    const repo = makeStageRepo({
      findById: vi.fn().mockResolvedValue(stages[1]),
      findCompletedStageIds: vi.fn().mockResolvedValue([]),
    });
    const progress = makeProgress();
    const useCase = new MarkStageCompleteUseCase(
      repo,
      progress,
      makeEvent('normal', 1),
      makeEvaluateBadges(),
    );

    await expect(useCase.execute('user_1', 2)).rejects.toBeInstanceOf(
      StageLockedError,
    );
    expect(progress.markCompleted).not.toHaveBeenCalled();
  });

  it('throws StageAlreadyCompletedError when stage is already completed', async () => {
    const repo = makeStageRepo({
      findById: vi.fn().mockResolvedValue(stages[1]),
      findCompletedStageIds: vi.fn().mockResolvedValue([1, 2]),
    });
    const progress = makeProgress();
    const useCase = new MarkStageCompleteUseCase(
      repo,
      progress,
      makeEvent('normal', 1),
      makeEvaluateBadges(),
    );

    await expect(useCase.execute('user_1', 2)).rejects.toBeInstanceOf(
      StageAlreadyCompletedError,
    );
    expect(progress.markCompleted).not.toHaveBeenCalled();
  });

  it('rejects a concurrent completion that lost the race', async () => {
    const repo = makeStageRepo({
      findById: vi.fn().mockResolvedValue(stages[1]),
      findCompletedStageIds: vi.fn().mockResolvedValue([1]),
    });
    const progress = makeProgress(null);
    const useCase = new MarkStageCompleteUseCase(
      repo,
      progress,
      makeEvent('normal', 1),
      makeEvaluateBadges(),
    );

    await expect(useCase.execute('user_1', 2)).rejects.toBeInstanceOf(
      StageAlreadyCompletedError,
    );
  });

  it('throws StageNotFoundError when stage does not exist', async () => {
    const repo = makeStageRepo({ findById: vi.fn().mockResolvedValue(null) });
    const progress = makeProgress();
    const useCase = new MarkStageCompleteUseCase(
      repo,
      progress,
      makeEvent('normal', 1),
      makeEvaluateBadges(),
    );

    await expect(useCase.execute('user_1', 999)).rejects.toBeInstanceOf(
      StageNotFoundError,
    );
    expect(progress.markCompleted).not.toHaveBeenCalled();
  });

  it('points to the next Stage in the Zone, or null when it was the last one', async () => {
    const repo = makeStageRepo({
      findById: vi.fn().mockResolvedValue(stages[0]),
    });
    const useCase = new MarkStageCompleteUseCase(
      repo,
      makeProgress(),
      makeEvent('normal', 1),
      makeEvaluateBadges(),
    );

    expect((await useCase.execute('user_1', 1)).nextStageId).toBe(2);

    const lastRepo = makeStageRepo({
      findById: vi.fn().mockResolvedValue(stages[1]),
      findCompletedStageIds: vi.fn().mockResolvedValue([1]),
    });
    const lastUseCase = new MarkStageCompleteUseCase(
      lastRepo,
      makeProgress(),
      makeEvent('normal', 1),
      makeEvaluateBadges(),
    );

    expect((await lastUseCase.execute('user_1', 2)).nextStageId).toBeNull();
  });

  it('announces a level-up when the award crosses a level threshold', async () => {
    const repo = makeStageRepo({
      findById: vi.fn().mockResolvedValue(stages[1]),
      findCompletedStageIds: vi.fn().mockResolvedValue([1]),
    });
    // level-calculator: level(xp) = floor(sqrt(xp / 100)) + 1, so 100 total
    // xp crosses into level 2.
    const progress = makeProgress(90);
    const useCase = new MarkStageCompleteUseCase(
      repo,
      progress,
      makeEvent('normal', 1),
      makeEvaluateBadges(),
    );

    const completion = await useCase.execute('user_1', 2);

    expect(completion.level).toBe(2);
    expect(completion.leveledUp).toBe(true);
  });

  it('surfaces badges earned as a side effect of the completion', async () => {
    const repo = makeStageRepo({
      findById: vi.fn().mockResolvedValue(stages[1]),
      findCompletedStageIds: vi.fn().mockResolvedValue([1]),
    });
    const badge = new BadgeDefinition(
      1,
      'Consistent Learner',
      'consistent-learner',
      null,
      { trigger: 'cumulative', target: 'stage_completions', threshold: 1 },
      null,
    );
    const evaluateBadges = new EvaluateBadgesUseCase({
      findAll: vi.fn().mockResolvedValue([badge]),
      countAwards: vi.fn().mockResolvedValue(0),
      awardMany: vi.fn(),
      findEarnedByUser: vi.fn(),
      countCompletedStages: vi.fn().mockResolvedValue(2),
      countPassedQuests: vi.fn(),
      isZoneCompleted: vi.fn(),
    });
    const useCase = new MarkStageCompleteUseCase(
      repo,
      makeProgress(),
      makeEvent('normal', 1),
      evaluateBadges,
    );

    const completion = await useCase.execute('user_1', 2);

    expect(completion.badgesEarned).toEqual([
      { badge, awardCount: 2, newAwards: 2 },
    ]);
  });
});

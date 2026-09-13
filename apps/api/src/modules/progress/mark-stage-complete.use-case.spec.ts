import { describe, expect, it, vi } from 'vitest';

import { makeEvaluateBadges } from '../badge/evaluate-badges.fixture.js';
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

function makeProgress(awarded = true): ProgressRepository {
  return { markCompleted: vi.fn().mockResolvedValue(awarded) };
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
    const progress = makeProgress(false);
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
});

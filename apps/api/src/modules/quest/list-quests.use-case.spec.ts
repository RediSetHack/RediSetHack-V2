import { makeAvailableStageRepository } from '../content/fake-stage.fixture.js';
import { describe, expect, it, vi } from 'vitest';

import { Quest } from './domain/entities/quest.entity.js';
import { QuestRepository } from './domain/ports/quest.repository.js';
import { ListQuestsUseCase } from './application/list-quests.use-case.js';

function makeRepo(overrides: Partial<QuestRepository> = {}): QuestRepository {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    findQuestions: vi.fn(),
    findBestResults: vi.fn(),
    findActiveSession: vi.fn(),
    findSessionById: vi.fn(),
    createSession: vi.fn(),
    finalizeSession: vi.fn(),
    findResultById: vi.fn(),
    ...overrides,
  };
}

describe('ListQuestsUseCase', () => {
  it('marks quests the user has passed as completed and reports the best Result', async () => {
    const quests = [
      new Quest(1, 10, 'Loops', null, 60, 70, 50),
      new Quest(2, 10, 'Conditionals', null, 60, 70, 50),
    ];
    const repo = makeRepo({
      findAll: vi.fn().mockResolvedValue(quests),
      findBestResults: vi.fn().mockResolvedValue(
        new Map([[1, { score: 90, passed: true }]]),
      ),
    });
    const useCase = new ListQuestsUseCase(repo, makeAvailableStageRepository());

    const result = await useCase.execute('user_1');

    expect(result).toEqual([
      {
        quest: quests[0],
        completed: true,
        bestResult: { score: 90, passed: true },
        lockReason: null,
      },
      {
        quest: quests[1],
        completed: false,
        bestResult: null,
        lockReason: null,
      },
    ]);
  });

  it('marks every quest incomplete for a user with no attempts', async () => {
    const quests = [new Quest(1, 10, 'Loops', null, 60, 70, 50)];
    const repo = makeRepo({
      findAll: vi.fn().mockResolvedValue(quests),
      findBestResults: vi.fn().mockResolvedValue(new Map()),
    });
    const useCase = new ListQuestsUseCase(repo, makeAvailableStageRepository());

    const result = await useCase.execute('user_1');

    expect(result).toEqual([
      {
        quest: quests[0],
        completed: false,
        bestResult: null,
        lockReason: null,
      },
    ]);
  });

  it('keeps a failed best Result distinct from a Quest never taken', async () => {
    const quests = [new Quest(1, 10, 'Loops', null, 60, 70, 50)];
    const repo = makeRepo({
      findAll: vi.fn().mockResolvedValue(quests),
      findBestResults: vi.fn().mockResolvedValue(
        new Map([[1, { score: 40, passed: false }]]),
      ),
    });
    const useCase = new ListQuestsUseCase(repo, makeAvailableStageRepository());

    const result = await useCase.execute('user_1');

    expect(result[0]?.completed).toBe(false);
    expect(result[0]?.bestResult).toEqual({ score: 40, passed: false });
  });
});

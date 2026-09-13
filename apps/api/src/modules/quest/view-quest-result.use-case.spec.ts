import { describe, expect, it, vi } from 'vitest';

import { QuestOption, QuestQuestion } from './domain/entities/quest.entity.js';
import { QuestResult } from './domain/entities/quest-result.entity.js';
import { QuestResultNotFoundError } from './domain/errors.js';
import { QuestRepository } from './domain/ports/quest.repository.js';
import { ViewQuestResultUseCase } from './application/view-quest-result.use-case.js';

const questions = [
  new QuestQuestion(1, '2 + 2?', [
    new QuestOption(1, '4', true),
    new QuestOption(2, '5', false),
  ]),
  new QuestQuestion(2, '3 + 3?', [
    new QuestOption(3, '6', true),
    new QuestOption(4, '7', false),
  ]),
];

function makeRepo(overrides: Partial<QuestRepository> = {}): QuestRepository {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    findQuestions: vi.fn().mockResolvedValue(questions),
    findPassedQuestIds: vi.fn(),
    createResult: vi.fn(),
    findResultById: vi.fn(),
    claimXpAward: vi.fn(),
    ...overrides,
  };
}

describe('ViewQuestResultUseCase', () => {
  it('throws QuestResultNotFoundError when the result does not exist', async () => {
    const repo = makeRepo({ findResultById: vi.fn().mockResolvedValue(null) });
    const useCase = new ViewQuestResultUseCase(repo);

    await expect(useCase.execute(1, 'user_1')).rejects.toBeInstanceOf(
      QuestResultNotFoundError,
    );
  });

  it('throws QuestResultNotFoundError when the result belongs to another user', async () => {
    const result = new QuestResult(
      1,
      'other_user',
      1,
      100,
      true,
      [],
      new Date(),
    );
    const repo = makeRepo({
      findResultById: vi.fn().mockResolvedValue(result),
    });
    const useCase = new ViewQuestResultUseCase(repo);

    await expect(useCase.execute(1, 'user_1')).rejects.toBeInstanceOf(
      QuestResultNotFoundError,
    );
  });

  it('builds a per-question breakdown marking correct and incorrect choices', async () => {
    const result = new QuestResult(
      1,
      'user_1',
      1,
      50,
      false,
      [
        { questionId: 1, optionId: 1 },
        { questionId: 2, optionId: 4 },
      ],
      new Date(),
    );
    const repo = makeRepo({
      findResultById: vi.fn().mockResolvedValue(result),
    });
    const useCase = new ViewQuestResultUseCase(repo);

    const { breakdown } = await useCase.execute(1, 'user_1');

    expect(breakdown).toEqual([
      {
        questionId: 1,
        prompt: '2 + 2?',
        options: expect.any(Array),
        chosenOptionId: 1,
        isCorrect: true,
      },
      {
        questionId: 2,
        prompt: '3 + 3?',
        options: expect.any(Array),
        chosenOptionId: 4,
        isCorrect: false,
      },
    ]);
  });

  it('marks a question with no submitted response as incorrect and unchosen', async () => {
    const result = new QuestResult(
      1,
      'user_1',
      1,
      50,
      false,
      [{ questionId: 1, optionId: 1 }],
      new Date(),
    );
    const repo = makeRepo({
      findResultById: vi.fn().mockResolvedValue(result),
    });
    const useCase = new ViewQuestResultUseCase(repo);

    const { breakdown } = await useCase.execute(1, 'user_1');

    expect(breakdown[1]).toMatchObject({
      chosenOptionId: null,
      isCorrect: false,
    });
  });
});

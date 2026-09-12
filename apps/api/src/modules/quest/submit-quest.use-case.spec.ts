import { describe, expect, it, vi } from 'vitest';

import { UserRepository } from '../auth/domain/ports/user.repository.js';
import { User } from '../auth/domain/entities/user.entity.js';
import { DailyEvent } from '../daily-event/domain/entities/daily-event.entity.js';
import { GetTodayEventUseCase } from '../daily-event/application/get-today-event.use-case.js';
import { DailyEventRepository } from '../daily-event/domain/ports/daily-event.repository.js';
import {
  Quest,
  QuestOption,
  QuestQuestion,
} from './domain/entities/quest.entity.js';
import { QuestResult } from './domain/entities/quest-result.entity.js';
import { QuestRepository } from './domain/ports/quest.repository.js';
import { SubmitQuestUseCase } from './application/submit-quest.use-case.js';

const quest = new Quest(
  1,
  10,
  'Loops 101',
  'Test your loop knowledge',
  60,
  70,
  50,
);

const questions = [
  new QuestQuestion(1, 'What prints first?', [
    new QuestOption(1, 'A', true),
    new QuestOption(2, 'B', false),
  ]),
  new QuestQuestion(2, 'How many iterations?', [
    new QuestOption(3, '3', false),
    new QuestOption(4, '5', true),
  ]),
];

function makeQuestRepo(
  overrides: Partial<QuestRepository> = {},
): QuestRepository {
  return {
    findAll: vi.fn(),
    findById: vi.fn().mockResolvedValue(quest),
    findQuestions: vi.fn().mockResolvedValue(questions),
    findPassedQuestIds: vi.fn(),
    createResult: vi
      .fn()
      .mockImplementation(
        async (input) =>
          new QuestResult(
            1,
            input.userId,
            input.questId,
            input.score,
            input.passed,
            input.responses,
            new Date(),
          ),
      ),
    findResultById: vi.fn(),
    claimXpAward: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

function makeUserRepo(overrides: Partial<UserRepository> = {}): UserRepository {
  return {
    upsert: vi.fn(),
    findById: vi.fn(),
    findByEmail: vi.fn(),
    updateCharacter: vi.fn(),
    awardXp: vi
      .fn()
      .mockImplementation(
        async (userId, amount) =>
          new User(userId, 'learner@example.com', 'Learner', null, amount),
      ),
    ...overrides,
  };
}

function makeGetTodayEvent(multiplier = 1): GetTodayEventUseCase {
  const repo: DailyEventRepository = {
    findByDate: vi
      .fn()
      .mockResolvedValue(
        new DailyEvent(
          1,
          '2026-09-12',
          multiplier > 1 ? 'bonus' : 'normal',
          multiplier,
        ),
      ),
    create: vi.fn(),
  };
  return new GetTodayEventUseCase(repo);
}

describe('SubmitQuestUseCase', () => {
  it('scores correct responses and marks the attempt as passed', async () => {
    const quests = makeQuestRepo();
    const users = makeUserRepo();
    const useCase = new SubmitQuestUseCase(quests, users, makeGetTodayEvent());

    const { result } = await useCase.execute({
      userId: 'user_1',
      questId: quest.id,
      responses: [
        { questionId: 1, optionId: 1 },
        { questionId: 2, optionId: 4 },
      ],
    });

    expect(result.score).toBe(100);
    expect(result.passed).toBe(true);
  });

  it('scores partial and failing responses against passingScore', async () => {
    const quests = makeQuestRepo();
    const users = makeUserRepo();
    const useCase = new SubmitQuestUseCase(quests, users, makeGetTodayEvent());

    const { result } = await useCase.execute({
      userId: 'user_1',
      questId: quest.id,
      responses: [
        { questionId: 1, optionId: 1 },
        { questionId: 2, optionId: 3 },
      ],
    });

    expect(result.score).toBe(50);
    expect(result.passed).toBe(false);
  });

  it('never exposes correct-answer keys through the questions it reads for scoring', async () => {
    const quests = makeQuestRepo();
    const users = makeUserRepo();
    const useCase = new SubmitQuestUseCase(quests, users, makeGetTodayEvent());

    // The use case only ever returns score/passed/xp — never the fetched
    // question set, so a caller can't recover isCorrect flags from the response.
    const output = await useCase.execute({
      userId: 'user_1',
      questId: quest.id,
      responses: [{ questionId: 1, optionId: 1 }],
    });
    expect(output).not.toHaveProperty('questions');
    expect(Object.keys(output)).toEqual(['result', 'xpAwarded']);
  });

  it('awards XP on first pass', async () => {
    const quests = makeQuestRepo();
    const users = makeUserRepo();
    const useCase = new SubmitQuestUseCase(quests, users, makeGetTodayEvent());

    const { xpAwarded } = await useCase.execute({
      userId: 'user_1',
      questId: quest.id,
      responses: [
        { questionId: 1, optionId: 1 },
        { questionId: 2, optionId: 4 },
      ],
    });

    expect(xpAwarded).toBe(50);
    expect(users.awardXp).toHaveBeenCalledWith('user_1', 50);
  });

  it('doubles the XP award on a Bonus event day', async () => {
    const quests = makeQuestRepo();
    const users = makeUserRepo();
    const useCase = new SubmitQuestUseCase(quests, users, makeGetTodayEvent(2));

    const { xpAwarded } = await useCase.execute({
      userId: 'user_1',
      questId: quest.id,
      responses: [
        { questionId: 1, optionId: 1 },
        { questionId: 2, optionId: 4 },
      ],
    });

    expect(xpAwarded).toBe(100);
    expect(users.awardXp).toHaveBeenCalledWith('user_1', 100);
  });

  it('awards zero XP on a passing retake', async () => {
    const quests = makeQuestRepo({
      claimXpAward: vi.fn().mockResolvedValue(false),
    });
    const users = makeUserRepo();
    const useCase = new SubmitQuestUseCase(quests, users, makeGetTodayEvent());

    const { xpAwarded, result } = await useCase.execute({
      userId: 'user_1',
      questId: quest.id,
      responses: [
        { questionId: 1, optionId: 1 },
        { questionId: 2, optionId: 4 },
      ],
    });

    expect(result.passed).toBe(true);
    expect(xpAwarded).toBe(0);
    expect(users.awardXp).not.toHaveBeenCalled();
  });

  it('records a new Result on every retake, passing or not', async () => {
    const quests = makeQuestRepo({
      claimXpAward: vi.fn().mockResolvedValue(false),
    });
    const users = makeUserRepo();
    const useCase = new SubmitQuestUseCase(quests, users, makeGetTodayEvent());

    await useCase.execute({
      userId: 'user_1',
      questId: quest.id,
      responses: [{ questionId: 1, optionId: 2 }],
    });

    expect(quests.createResult).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user_1', questId: quest.id }),
    );
  });

  it('awards no XP when the quest carries no xpReward', async () => {
    const zeroRewardQuest = new Quest(2, 10, 'Free quiz', null, 60, 70, 0);
    const quests = makeQuestRepo({
      findById: vi.fn().mockResolvedValue(zeroRewardQuest),
    });
    const users = makeUserRepo();
    const useCase = new SubmitQuestUseCase(quests, users, makeGetTodayEvent());

    const { xpAwarded } = await useCase.execute({
      userId: 'user_1',
      questId: zeroRewardQuest.id,
      responses: [
        { questionId: 1, optionId: 1 },
        { questionId: 2, optionId: 4 },
      ],
    });

    expect(xpAwarded).toBe(0);
    expect(users.awardXp).not.toHaveBeenCalled();
  });
});

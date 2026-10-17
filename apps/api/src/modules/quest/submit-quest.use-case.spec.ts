import { afterEach, describe, expect, it, vi } from 'vitest';

import { UserRepository } from '../auth/domain/ports/user.repository.js';
import { User } from '../auth/domain/entities/user.entity.js';
import { BadgeDefinition } from '../badge/domain/entities/badge.entity.js';
import { makeEvaluateBadges } from '../badge/evaluate-badges.fixture.js';
import { DailyEvent } from '../daily-event/domain/entities/daily-event.entity.js';
import { GetTodayEventUseCase } from '../daily-event/application/get-today-event.use-case.js';
import { DailyEventRepository } from '../daily-event/domain/ports/daily-event.repository.js';
import {
  Quest,
  QuestOption,
  QuestQuestion,
} from './domain/entities/quest.entity.js';
import {
  InvalidQuestResponsesError,
  QuestSessionAlreadySubmittedError,
  QuestSessionNotFoundError,
} from './domain/errors.js';
import { FakeQuestRepository } from './fake-quest-repository.fixture.js';
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

function makeQuestRepo(q: Quest = quest): FakeQuestRepository {
  return new FakeQuestRepository(q, questions);
}

async function startSession(
  quests: FakeQuestRepository,
  userId = 'user_1',
  q: Quest = quest,
) {
  return quests.createSession({
    userId,
    questId: q.id,
    questions: quests.questions,
    passingScore: q.passingScore,
    expiresAt: new Date(Date.now() + q.timeLimitSeconds * 1000),
  });
}

const allCorrect = [
  { questionId: 1, optionId: 1 },
  { questionId: 2, optionId: 4 },
];

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

function makeUseCase(
  quests: FakeQuestRepository,
  users = makeUserRepo(),
  multiplier = 1,
  badges = makeEvaluateBadges(),
) {
  return new SubmitQuestUseCase(
    quests,
    users,
    makeGetTodayEvent(multiplier),
    badges,
  );
}

describe('SubmitQuestUseCase', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('scores correct responses and marks the attempt as passed', async () => {
    const quests = makeQuestRepo();
    const session = await startSession(quests);
    const { result, outcome } = await makeUseCase(quests).execute({
      userId: 'user_1',
      questId: quest.id,
      sessionId: session.id,
      responses: allCorrect,
    });

    expect(result.score).toBe(100);
    expect(result.passed).toBe(true);
    expect(outcome).toBe('submitted');
  });

  it('scores partial and failing responses against passingScore', async () => {
    const quests = makeQuestRepo();
    const session = await startSession(quests);
    const { result } = await makeUseCase(quests).execute({
      userId: 'user_1',
      questId: quest.id,
      sessionId: session.id,
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
    const session = await startSession(quests);
    const output = await makeUseCase(quests).execute({
      userId: 'user_1',
      questId: quest.id,
      sessionId: session.id,
      responses: [{ questionId: 1, optionId: 1 }],
    });
    expect(output).not.toHaveProperty('questions');
    expect(Object.keys(output)).toEqual([
      'result',
      'xpAwarded',
      'badgesEarned',
      'outcome',
    ]);
  });

  it('awards XP on first pass', async () => {
    const quests = makeQuestRepo();
    const users = makeUserRepo();
    const session = await startSession(quests);
    const { xpAwarded } = await makeUseCase(quests, users).execute({
      userId: 'user_1',
      questId: quest.id,
      sessionId: session.id,
      responses: allCorrect,
    });

    expect(xpAwarded).toBe(50);
    expect(users.awardXp).toHaveBeenCalledWith('user_1', 50);
  });

  it('doubles the XP award on a Bonus event day', async () => {
    const quests = makeQuestRepo();
    const users = makeUserRepo();
    const session = await startSession(quests);
    const { xpAwarded } = await makeUseCase(quests, users, 2).execute({
      userId: 'user_1',
      questId: quest.id,
      sessionId: session.id,
      responses: allCorrect,
    });

    expect(xpAwarded).toBe(100);
    expect(users.awardXp).toHaveBeenCalledWith('user_1', 100);
  });

  it('awards zero XP on a passing retake and records a new Result per session', async () => {
    const quests = makeQuestRepo();
    const users = makeUserRepo();
    const useCase = makeUseCase(quests, users);
    const first = await startSession(quests);
    const firstOutput = await useCase.execute({
      userId: 'user_1',
      questId: quest.id,
      sessionId: first.id,
      responses: allCorrect,
    });
    const second = await startSession(quests);
    const retake = await useCase.execute({
      userId: 'user_1',
      questId: quest.id,
      sessionId: second.id,
      responses: allCorrect,
    });

    expect(second.id).not.toBe(first.id);
    expect(retake.result.id).not.toBe(firstOutput.result.id);
    expect(retake.result.passed).toBe(true);
    expect(retake.xpAwarded).toBe(0);
    expect(users.awardXp).toHaveBeenCalledTimes(1);
  });

  it('awards no XP when the quest carries no xpReward', async () => {
    const zeroRewardQuest = new Quest(2, 10, 'Free quiz', null, 60, 70, 0);
    const quests = makeQuestRepo(zeroRewardQuest);
    const users = makeUserRepo();
    const session = await startSession(quests, 'user_1', zeroRewardQuest);
    const { xpAwarded } = await makeUseCase(quests, users).execute({
      userId: 'user_1',
      questId: zeroRewardQuest.id,
      sessionId: session.id,
      responses: allCorrect,
    });

    expect(xpAwarded).toBe(0);
    expect(users.awardXp).not.toHaveBeenCalled();
  });

  it('surfaces badges newly awarded by a passing submission', async () => {
    const quests = makeQuestRepo();
    const badge = new BadgeDefinition(
      1,
      'Quest Novice',
      'quest-novice',
      null,
      { trigger: 'activity', target: 'quest_passes', threshold: 1 },
      null,
    );
    const session = await startSession(quests);
    const { badgesEarned } = await makeUseCase(
      quests,
      makeUserRepo(),
      1,
      makeEvaluateBadges({
        findAll: vi.fn().mockResolvedValue([badge]),
        countAwards: vi.fn().mockResolvedValue(0),
        countPassedQuests: vi.fn().mockResolvedValue(1),
      }),
    ).execute({
      userId: 'user_1',
      questId: quest.id,
      sessionId: session.id,
      responses: allCorrect,
    });

    expect(badgesEarned).toEqual([{ badge, awardCount: 1, newAwards: 1 }]);
  });

  it('reports no badges earned on a failing submission', async () => {
    const quests = makeQuestRepo();
    const session = await startSession(quests);
    const { badgesEarned } = await makeUseCase(quests).execute({
      userId: 'user_1',
      questId: quest.id,
      sessionId: session.id,
      responses: [{ questionId: 1, optionId: 1 }],
    });

    expect(badgesEarned).toEqual([]);
  });

  describe('session ownership', () => {
    it('rejects an unknown session', async () => {
      const quests = makeQuestRepo();
      await expect(
        makeUseCase(quests).execute({
          userId: 'user_1',
          questId: quest.id,
          sessionId: 99,
          responses: [],
        }),
      ).rejects.toBeInstanceOf(QuestSessionNotFoundError);
    });

    it("rejects another learner's session", async () => {
      const quests = makeQuestRepo();
      const session = await startSession(quests, 'user_2');
      await expect(
        makeUseCase(quests).execute({
          userId: 'user_1',
          questId: quest.id,
          sessionId: session.id,
          responses: allCorrect,
        }),
      ).rejects.toBeInstanceOf(QuestSessionNotFoundError);
      expect(quests.results.size).toBe(0);
    });
  });

  describe('response validation', () => {
    it.each([
      ['an unknown question', [{ questionId: 9, optionId: 1 }]],
      ['an option of another question', [{ questionId: 1, optionId: 4 }]],
      [
        'a duplicated question reference',
        [
          { questionId: 1, optionId: 1 },
          { questionId: 1, optionId: 2 },
        ],
      ],
    ])('rejects %s without finalizing the session', async (_name, responses) => {
      const quests = makeQuestRepo();
      const session = await startSession(quests);
      await expect(
        makeUseCase(quests).execute({
          userId: 'user_1',
          questId: quest.id,
          sessionId: session.id,
          responses,
        }),
      ).rejects.toBeInstanceOf(InvalidQuestResponsesError);
      expect((await quests.findSessionById(session.id))?.status).toBe('active');
    });
  });

  describe('deadline', () => {
    it('records a late submission as expired with no credit', async () => {
      vi.useFakeTimers({ now: new Date('2026-09-15T12:00:00.000Z') });
      const quests = makeQuestRepo();
      const users = makeUserRepo();
      const session = await startSession(quests);
      vi.setSystemTime(new Date('2026-09-15T12:01:00.000Z')); // exactly at the 60s deadline

      const output = await makeUseCase(quests, users).execute({
        userId: 'user_1',
        questId: quest.id,
        sessionId: session.id,
        responses: allCorrect,
      });

      expect(output.outcome).toBe('expired');
      expect(output.result.score).toBe(0);
      expect(output.result.passed).toBe(false);
      expect(output.result.responses).toEqual([]);
      expect(output.xpAwarded).toBe(0);
      expect(users.awardXp).not.toHaveBeenCalled();
    });

    it('credits a submission one millisecond before the deadline', async () => {
      vi.useFakeTimers({ now: new Date('2026-09-15T12:00:00.000Z') });
      const quests = makeQuestRepo();
      const session = await startSession(quests);
      vi.setSystemTime(new Date('2026-09-15T12:00:59.999Z'));

      const output = await makeUseCase(quests).execute({
        userId: 'user_1',
        questId: quest.id,
        sessionId: session.id,
        responses: allCorrect,
      });
      expect(output.outcome).toBe('submitted');
      expect(output.result.passed).toBe(true);
    });
  });

  describe('replay and conflicts', () => {
    it('returns the recorded Result on an identical resubmission', async () => {
      const quests = makeQuestRepo();
      const users = makeUserRepo();
      const useCase = makeUseCase(quests, users);
      const session = await startSession(quests);
      const input = {
        userId: 'user_1',
        questId: quest.id,
        sessionId: session.id,
        responses: allCorrect,
      };
      const first = await useCase.execute(input);
      const replay = await useCase.execute({
        ...input,
        responses: [...allCorrect].reverse(),
      });

      expect(replay.result.id).toBe(first.result.id);
      expect(replay.xpAwarded).toBe(first.xpAwarded);
      expect(quests.results.size).toBe(1);
      expect(users.awardXp).toHaveBeenCalledTimes(1);
    });

    it('rejects a conflicting second submission and keeps the first Result', async () => {
      const quests = makeQuestRepo();
      const useCase = makeUseCase(quests);
      const session = await startSession(quests);
      const first = await useCase.execute({
        userId: 'user_1',
        questId: quest.id,
        sessionId: session.id,
        responses: allCorrect,
      });

      await expect(
        useCase.execute({
          userId: 'user_1',
          questId: quest.id,
          sessionId: session.id,
          responses: [{ questionId: 1, optionId: 2 }],
        }),
      ).rejects.toBeInstanceOf(QuestSessionAlreadySubmittedError);
      expect(quests.results.get(first.result.id)?.score).toBe(100);
      expect(quests.results.size).toBe(1);
    });

    it('scores against the session snapshot after the Quest is edited', async () => {
      const quests = makeQuestRepo();
      const session = await startSession(quests);
      quests.questions = [
        new QuestQuestion(7, 'Edited?', [new QuestOption(8, 'X', true)]),
      ];

      const { result } = await makeUseCase(quests).execute({
        userId: 'user_1',
        questId: quest.id,
        sessionId: session.id,
        responses: allCorrect,
      });
      expect(result.score).toBe(100);
      expect(result.questionSnapshot?.map((q) => q.id)).toEqual([1, 2]);
    });
  });
});

import { makeAvailableStageRepository } from '../content/fake-stage.fixture.js';
import { StageRepository } from '../content/domain/ports/stage.repository.js';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { IncomingMessage } from 'node:http';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  QuestResultReviewResponseSchema,
  QuestSessionResponseSchema,
  SubmitQuestResponseSchema,
} from '@repo/contracts';

import {
  ClerkAuthPort,
  type ClerkAuthenticatedUser,
} from '../auth/domain/ports/clerk-auth.port.js';
import { User } from '../auth/domain/entities/user.entity.js';
import { UserRepository } from '../auth/domain/ports/user.repository.js';
import { EnsureUserUseCase } from '../auth/application/ensure-user.use-case.js';
import { ClerkAuthGuard } from '../auth/presentation/guards/clerk-auth.guard.js';
import { BadgeDefinition } from '../badge/domain/entities/badge.entity.js';
import { BadgeRepository } from '../badge/domain/ports/badge.repository.js';
import { EvaluateBadgesUseCase } from '../badge/application/evaluate-badges.use-case.js';
import { DailyEvent } from '../daily-event/domain/entities/daily-event.entity.js';
import { DailyEventRepository } from '../daily-event/domain/ports/daily-event.repository.js';
import { GetTodayEventUseCase } from '../daily-event/application/get-today-event.use-case.js';
import {
  Quest,
  QuestOption,
  QuestQuestion,
} from './domain/entities/quest.entity.js';
import { QuestResult } from './domain/entities/quest-result.entity.js';
import { QuestRepository } from './domain/ports/quest.repository.js';
import { FakeQuestRepository } from './fake-quest-repository.fixture.js';
import { StartQuestUseCase } from './application/start-quest.use-case.js';
import { SubmitQuestUseCase } from './application/submit-quest.use-case.js';
import { ViewQuestResultUseCase } from './application/view-quest-result.use-case.js';
import { StartQuestController } from './presentation/controllers/start-quest.controller.js';
import { SubmitQuestController } from './presentation/controllers/submit-quest.controller.js';
import { ViewQuestResultController } from './presentation/controllers/view-quest-result.controller.js';

describe('Quest Session integration (start, submit, review)', () => {
  let app: INestApplication;

  const quest = new Quest(
    1,
    10,
    'Loop fundamentals',
    'Covers loops.',
    300,
    70,
    100,
  );
  const makeQuestions = () => [
    new QuestQuestion(1, 'What prints first?', [
      new QuestOption(1, 'A', true),
      new QuestOption(2, 'B', false),
    ]),
  ];
  let fakeQuests: FakeQuestRepository;

  const fakeUsers: UserRepository = {
    async upsert(identity) {
      return new User(
        identity.id,
        identity.email ?? '',
        identity.name,
        null,
        0,
      );
    },
    async findById() {
      return null;
    },
    async findByEmail() {
      return null;
    },
    async updateCharacter() {
      throw new Error('not used in this test');
    },
    async awardXp(userId, amount) {
      return new User(userId, 'learner@example.com', 'Learner', null, amount);
    },
  };

  const badge = new BadgeDefinition(
    1,
    'Quest Novice',
    'quest-novice',
    'Pass your first Quest.',
    { trigger: 'activity', target: 'quest_passes', threshold: 1 },
    null,
  );

  const fakeBadges: BadgeRepository = {
    findAll: vi.fn().mockResolvedValue([badge]),
    countAwards: vi.fn().mockResolvedValue(0),
    awardMany: vi.fn(),
    awardMilestones: vi
      .fn()
      .mockImplementation((_u, _b, m) => Promise.resolve(m)),
    findEarnedByUser: vi.fn(),
    countCompletedStages: vi.fn(),
    countPassedQuests: vi.fn().mockResolvedValue(1),
    isZoneCompleted: vi.fn(),
  };

  const fakeDailyEvents: DailyEventRepository = {
    async findByDate() {
      return new DailyEvent(1, '2026-09-15', 'normal', 1);
    },
    async create() {
      throw new Error('not used in this test');
    },
  };

  const fakeClerk: ClerkAuthPort = {
    async authenticate(req: IncomingMessage) {
      if (req.headers['authorization'] !== 'Bearer valid-token') return null;
      return {
        id: 'user_learner',
        email: 'learner@example.com',
        name: 'Learner',
        role: 'user',
      } satisfies ClerkAuthenticatedUser;
    },
  };

  beforeEach(async () => {
    fakeQuests = new FakeQuestRepository(quest, makeQuestions());

    const moduleRef = await Test.createTestingModule({
      controllers: [
        StartQuestController,
        SubmitQuestController,
        ViewQuestResultController,
      ],
      providers: [
        { provide: StageRepository, useValue: makeAvailableStageRepository() },
        { provide: QuestRepository, useValue: fakeQuests },
        { provide: UserRepository, useValue: fakeUsers },
        { provide: BadgeRepository, useValue: fakeBadges },
        { provide: DailyEventRepository, useValue: fakeDailyEvents },
        { provide: ClerkAuthPort, useValue: fakeClerk },
        ClerkAuthGuard,
        EnsureUserUseCase,
        EvaluateBadgesUseCase,
        GetTodayEventUseCase,
        StartQuestUseCase,
        SubmitQuestUseCase,
        ViewQuestResultUseCase,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const asLearner = () => ({ authorization: 'Bearer valid-token' });

  const startSession = async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/api/quests/1/start')
      .set(asLearner());
    return QuestSessionResponseSchema.parse(res.body);
  };
  const submit = (sessionId: number, responses: unknown) =>
    request(app.getHttpServer())
      .post('/v1/api/quests/1/submit')
      .set(asLearner())
      .send({ sessionId, responses });

  describe('POST /v1/api/quests/:questId/start', () => {
    it('rejects an unauthenticated request with 401', async () => {
      const res = await request(app.getHttpServer()).post(
        '/v1/api/quests/1/start',
      );
      expect(res.status).toBe(401);
    });

    it('starts a session with the questions and a deadline, answers withheld', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/api/quests/1/start')
        .set(asLearner());

      expect(res.status).toBe(201);
      const session = QuestSessionResponseSchema.parse(res.body);
      expect(session.id).toBe(1);
      expect(session.questId).toBe(1);
      expect(session.questions[0]?.options).toEqual([
        { id: 1, text: 'A' },
        { id: 2, text: 'B' },
      ]);
      expect(new Date(session.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });

    it('resumes the same session on a second start', async () => {
      const first = await startSession();
      const again = await startSession();
      expect(again.id).toBe(first.id);
      expect(again.expiresAt).toBe(first.expiresAt);
    });

    it('404s for a Quest that does not exist', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/api/quests/999/start')
        .set(asLearner());
      expect(res.status).toBe(404);
    });
  });

  describe('POST /v1/api/quests/:questId/submit', () => {
    it('scores the submission, awards XP once, and surfaces earned Badges', async () => {
      const session = await startSession();
      const res = await submit(session.id, [{ questionId: 1, optionId: 1 }]);

      expect(res.status).toBe(201);
      const body = SubmitQuestResponseSchema.parse(res.body);
      expect(body).toEqual({
        resultId: 1,
        score: 100,
        passed: true,
        outcome: 'submitted',
        xpAwarded: 100,
        badgesEarned: [
          {
            id: 1,
            name: 'Quest Novice',
            description: 'Pass your first Quest.',
            imageUrl: null,
            awardCount: 1,
          },
        ],
      });
    });

    it('awards no XP on a passing retake in a new session', async () => {
      const first = await startSession();
      await submit(first.id, [{ questionId: 1, optionId: 1 }]);
      const retake = await startSession();
      expect(retake.id).not.toBe(first.id);

      const res = await submit(retake.id, [{ questionId: 1, optionId: 1 }]);
      const body = SubmitQuestResponseSchema.parse(res.body);
      expect(body.passed).toBe(true);
      expect(body.xpAwarded).toBe(0);
      expect(body.resultId).not.toBe(1);
    });

    it('rejects a malformed responses payload', async () => {
      const session = await startSession();
      const res = await submit(session.id, [{ questionId: 'nope' }]);
      expect(res.status).toBe(400);
    });

    it('requires a sessionId', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/api/quests/1/submit')
        .set(asLearner())
        .send({ responses: [] });
      expect(res.status).toBe(400);
    });

    it('404s for a session that does not exist', async () => {
      const res = await submit(99, []);
      expect(res.status).toBe(404);
    });

    it("404s for another learner's session and leaves it open", async () => {
      const other = await fakeQuests.createSession({
        userId: 'someone_else',
        questId: 1,
        questions: makeQuestions(),
        passingScore: 70,
        expiresAt: new Date(Date.now() + 60_000),
      });
      const res = await submit(other.id, [{ questionId: 1, optionId: 1 }]);
      expect(res.status).toBe(404);
      expect((await fakeQuests.findSessionById(other.id))?.status).toBe(
        'active',
      );
    });

    it.each([
      ['an unknown question', [{ questionId: 9, optionId: 1 }]],
      ['an option from another question', [{ questionId: 1, optionId: 99 }]],
      [
        'a duplicate question reference',
        [
          { questionId: 1, optionId: 1 },
          { questionId: 1, optionId: 2 },
        ],
      ],
    ])('400s on %s', async (_name, responses) => {
      const session = await startSession();
      const res = await submit(session.id, responses);
      expect(res.status).toBe(400);
      expect((await fakeQuests.findSessionById(session.id))?.status).toBe(
        'active',
      );
    });

    it('records a submission after the server deadline as expired, no credit', async () => {
      const session = await startSession();
      // Move the persisted deadline into the past; no client input involved.
      const stored = (await fakeQuests.findSessionById(session.id))!;
      fakeQuests.sessions.set(stored.id, {
        ...stored,
        expiresAt: new Date(Date.now() - 1),
      });

      const res = await submit(session.id, [{ questionId: 1, optionId: 1 }]);
      expect(res.status).toBe(201);
      const body = SubmitQuestResponseSchema.parse(res.body);
      expect(body).toMatchObject({
        outcome: 'expired',
        score: 0,
        passed: false,
        xpAwarded: 0,
        badgesEarned: [],
      });
    });

    it('returns the same Result on an identical replay without re-awarding XP', async () => {
      const session = await startSession();
      const payload = [{ questionId: 1, optionId: 1 }];
      const first = await submit(session.id, payload);
      const replay = await submit(session.id, payload);

      expect(replay.status).toBe(201);
      expect(SubmitQuestResponseSchema.parse(replay.body)).toMatchObject({
        resultId: first.body.resultId,
        score: 100,
        xpAwarded: 100,
      });
      expect(fakeQuests.results.size).toBe(1);
    });

    it('409s on a conflicting second submission and keeps the original Result', async () => {
      const session = await startSession();
      const first = await submit(session.id, [{ questionId: 1, optionId: 1 }]);
      const conflict = await submit(session.id, [{ questionId: 1, optionId: 2 }]);

      expect(conflict.status).toBe(409);
      const review = await request(app.getHttpServer())
        .get(`/v1/api/quests/results/${first.body.resultId}`)
        .set(asLearner());
      expect(review.body.score).toBe(100);
      expect(fakeQuests.results.size).toBe(1);
    });
  });

  describe('GET /v1/api/quests/results/:resultId', () => {
    it("reviews the learner's own Result with correct answers now visible", async () => {
      const session = await startSession();
      const submitted = await submit(session.id, [
        { questionId: 1, optionId: 2 },
      ]);
      const { resultId } = SubmitQuestResponseSchema.parse(submitted.body);

      const res = await request(app.getHttpServer())
        .get(`/v1/api/quests/results/${resultId}`)
        .set(asLearner());

      expect(res.status).toBe(200);
      const review = QuestResultReviewResponseSchema.parse(res.body);
      expect(review.passed).toBe(false);
      expect(review.breakdown).toEqual([
        {
          questionId: 1,
          prompt: 'What prints first?',
          options: [
            { id: 1, text: 'A', isCorrect: true },
            { id: 2, text: 'B', isCorrect: false },
          ],
          chosenOptionId: 2,
          isCorrect: false,
        },
      ]);
    });

    it("404s for another learner's Result (no ID-enumeration oracle)", async () => {
      const session = await startSession();
      const submitted = await submit(session.id, [
        { questionId: 1, optionId: 1 },
      ]);
      const { resultId } = SubmitQuestResponseSchema.parse(submitted.body);

      fakeQuests.results.set(
        resultId,
        new QuestResult(resultId, 'someone_else', 1, 100, true, [], new Date()),
      );

      const res = await request(app.getHttpServer())
        .get(`/v1/api/quests/results/${resultId}`)
        .set(asLearner());
      expect(res.status).toBe(404);
    });

    it('keeps reviewing the questions actually answered after the Quest is edited', async () => {
      const session = await startSession();
      const submitted = await submit(session.id, [
        { questionId: 1, optionId: 1 },
      ]);
      const { resultId } = SubmitQuestResponseSchema.parse(submitted.body);
      fakeQuests.questions = [
        new QuestQuestion(5, 'Edited prompt', [new QuestOption(9, 'Z', true)]),
      ];

      const res = await request(app.getHttpServer())
        .get(`/v1/api/quests/results/${resultId}`)
        .set(asLearner());
      expect(res.body.breakdown[0]).toMatchObject({
        questionId: 1,
        prompt: 'What prints first?',
      });
    });
  });
});

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
  const questions = [
    new QuestQuestion(1, 'What prints first?', [
      new QuestOption(1, 'A', true),
      new QuestOption(2, 'B', false),
    ]),
  ];
  let results: Map<number, QuestResult>;
  let nextResultId: number;
  let xpAwardsClaimed: Set<string>;

  const fakeQuests: QuestRepository = {
    async findAll() {
      return [quest];
    },
    async findById(questId) {
      return questId === quest.id ? quest : null;
    },
    async findQuestions(questId) {
      return questId === quest.id ? questions : [];
    },
    async findPassedQuestIds() {
      return new Set();
    },
    async createResult(input) {
      const result = new QuestResult(
        nextResultId++,
        input.userId,
        input.questId,
        input.score,
        input.passed,
        input.responses,
        new Date('2026-09-15T12:04:00.000Z'),
      );
      results.set(result.id, result);
      return result;
    },
    async claimXpAward(userId, questId) {
      const key = `${userId}:${questId}`;
      if (xpAwardsClaimed.has(key)) return false;
      xpAwardsClaimed.add(key);
      return true;
    },
    async findResultById(resultId) {
      return results.get(resultId) ?? null;
    },
  };

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
    results = new Map();
    nextResultId = 1;
    xpAwardsClaimed = new Set();

    const moduleRef = await Test.createTestingModule({
      controllers: [
        StartQuestController,
        SubmitQuestController,
        ViewQuestResultController,
      ],
      providers: [
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
      expect(session.questions[0]?.options).toEqual([
        { id: 1, text: 'A' },
        { id: 2, text: 'B' },
      ]);
      expect(new Date(session.expiresAt).getTime()).toBeGreaterThan(Date.now());
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
      const res = await request(app.getHttpServer())
        .post('/v1/api/quests/1/submit')
        .set(asLearner())
        .send({ responses: [{ questionId: 1, optionId: 1 }] });

      expect(res.status).toBe(201);
      const body = SubmitQuestResponseSchema.parse(res.body);
      expect(body).toEqual({
        resultId: 1,
        score: 100,
        passed: true,
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

    it('awards no XP on a passing retake', async () => {
      await request(app.getHttpServer())
        .post('/v1/api/quests/1/submit')
        .set(asLearner())
        .send({ responses: [{ questionId: 1, optionId: 1 }] });

      const res = await request(app.getHttpServer())
        .post('/v1/api/quests/1/submit')
        .set(asLearner())
        .send({ responses: [{ questionId: 1, optionId: 1 }] });

      const body = SubmitQuestResponseSchema.parse(res.body);
      expect(body.passed).toBe(true);
      expect(body.xpAwarded).toBe(0);
    });

    it('rejects a malformed responses payload', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/api/quests/1/submit')
        .set(asLearner())
        .send({ responses: [{ questionId: 'nope' }] });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /v1/api/quests/results/:resultId', () => {
    it("reviews the learner's own Result with correct answers now visible", async () => {
      const submit = await request(app.getHttpServer())
        .post('/v1/api/quests/1/submit')
        .set(asLearner())
        .send({ responses: [{ questionId: 1, optionId: 2 }] });
      const { resultId } = SubmitQuestResponseSchema.parse(submit.body);

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
      const submit = await request(app.getHttpServer())
        .post('/v1/api/quests/1/submit')
        .set(asLearner())
        .send({ responses: [{ questionId: 1, optionId: 1 }] });
      const { resultId } = SubmitQuestResponseSchema.parse(submit.body);

      results.set(
        resultId,
        new QuestResult(resultId, 'someone_else', 1, 100, true, [], new Date()),
      );

      const res = await request(app.getHttpServer())
        .get(`/v1/api/quests/results/${resultId}`)
        .set(asLearner());
      expect(res.status).toBe(404);
    });
  });
});

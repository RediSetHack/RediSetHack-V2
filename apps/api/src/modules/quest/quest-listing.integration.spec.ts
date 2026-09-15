import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { IncomingMessage } from 'node:http';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { QuestListResponseSchema } from '@repo/contracts';

import {
  ClerkAuthPort,
  type ClerkAuthenticatedUser,
} from '../auth/domain/ports/clerk-auth.port.js';
import { UserRepository } from '../auth/domain/ports/user.repository.js';
import { EnsureUserUseCase } from '../auth/application/ensure-user.use-case.js';
import { makeFakeUserRepository } from '../auth/fake-user.fixture.js';
import { ClerkAuthGuard } from '../auth/presentation/guards/clerk-auth.guard.js';
import { Quest } from './domain/entities/quest.entity.js';
import { QuestRepository } from './domain/ports/quest.repository.js';
import { ListQuestsUseCase } from './application/list-quests.use-case.js';
import { ListQuestsController } from './presentation/controllers/list-quests.controller.js';

describe('Quest listing integration (GET /v1/api/quests)', () => {
  let app: INestApplication;

  const quests = new Map<number, Quest>();
  const passedQuestIds = new Set<number>();

  const fakeQuests: QuestRepository = {
    async findAll() {
      return [...quests.values()];
    },
    async findById(questId) {
      return quests.get(questId) ?? null;
    },
    async findQuestions() {
      throw new Error('not used in this test');
    },
    async findPassedQuestIds() {
      return passedQuestIds;
    },
    async createResult() {
      throw new Error('not used in this test');
    },
    async claimXpAward() {
      throw new Error('not used in this test');
    },
    async findResultById() {
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

  const fakeUsers = makeFakeUserRepository();

  beforeEach(async () => {
    quests.clear();
    passedQuestIds.clear();

    const moduleRef = await Test.createTestingModule({
      controllers: [ListQuestsController],
      providers: [
        { provide: QuestRepository, useValue: fakeQuests },
        { provide: ClerkAuthPort, useValue: fakeClerk },
        { provide: UserRepository, useValue: fakeUsers },
        ClerkAuthGuard,
        EnsureUserUseCase,
        ListQuestsUseCase,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const asLearner = () => ({ authorization: 'Bearer valid-token' });

  it('rejects an unauthenticated request with 401', async () => {
    const res = await request(app.getHttpServer()).get('/v1/api/quests');
    expect(res.status).toBe(401);
  });

  it('returns an empty array when no Quests exist', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/api/quests')
      .set(asLearner());

    expect(res.status).toBe(200);
    expect(QuestListResponseSchema.parse(res.body)).toEqual([]);
  });

  it("lists Quests with the learner's completion status", async () => {
    quests.set(1, new Quest(1, 10, 'Loop fundamentals', 'Covers loops.', 300, 70, 100));
    quests.set(2, new Quest(2, 10, 'Conditionals', null, 180, 60, 50));
    passedQuestIds.add(1);

    const res = await request(app.getHttpServer())
      .get('/v1/api/quests')
      .set(asLearner());

    expect(res.status).toBe(200);
    expect(QuestListResponseSchema.parse(res.body)).toEqual([
      {
        id: 1,
        stageId: 10,
        title: 'Loop fundamentals',
        description: 'Covers loops.',
        timeLimitSeconds: 300,
        passingScore: 70,
        xpReward: 100,
        completed: true,
      },
      {
        id: 2,
        stageId: 10,
        title: 'Conditionals',
        description: null,
        timeLimitSeconds: 180,
        passingScore: 60,
        xpReward: 50,
        completed: false,
      },
    ]);
  });
});

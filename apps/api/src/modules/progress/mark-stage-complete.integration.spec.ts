import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { IncomingMessage } from 'node:http';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StageCompletionResponseSchema } from '@repo/contracts';

import {
  ClerkAuthPort,
  type ClerkAuthenticatedUser,
} from '../auth/domain/ports/clerk-auth.port.js';
import { UserRepository } from '../auth/domain/ports/user.repository.js';
import { EnsureUserUseCase } from '../auth/application/ensure-user.use-case.js';
import { makeFakeUserRepository } from '../auth/fake-user.fixture.js';
import { ClerkAuthGuard } from '../auth/presentation/guards/clerk-auth.guard.js';
import { BadgeDefinition } from '../badge/domain/entities/badge.entity.js';
import { BadgeRepository } from '../badge/domain/ports/badge.repository.js';
import { EvaluateBadgesUseCase } from '../badge/application/evaluate-badges.use-case.js';
import { Stage } from '../content/domain/entities/stage.entity.js';
import { StageRepository } from '../content/domain/ports/stage.repository.js';
import { makeFakeStageRepository } from '../content/fake-stage.fixture.js';
import { DailyEvent } from '../daily-event/domain/entities/daily-event.entity.js';
import { DailyEventRepository } from '../daily-event/domain/ports/daily-event.repository.js';
import { GetTodayEventUseCase } from '../daily-event/application/get-today-event.use-case.js';
import { MarkStageCompleteUseCase } from './application/mark-stage-complete.use-case.js';
import { MarkStageCompleteController } from './presentation/controllers/mark-stage-complete.controller.js';
import { ProgressRepository } from './domain/ports/progress.repository.js';

describe('POST /v1/api/stages/:stageId/complete integration', () => {
  let app: INestApplication;

  const stages = [
    new Stage(1, 1, 'For loops', 'for-loops', [], 100, 1),
    new Stage(2, 1, 'While loops', 'while-loops', [], 10, 2),
  ];
  const stagesByZone = new Map<number, Stage[]>([[1, stages]]);
  const completedStageIds = new Set<number>();

  const fakeStages = makeFakeStageRepository(stagesByZone, completedStageIds);

  const totalXpByUser = new Map<string, number>();
  const fakeProgress: ProgressRepository = {
    async markCompleted(userId, stageId, xpEarned) {
      if (completedStageIds.has(stageId)) return null;
      completedStageIds.add(stageId);
      const total = (totalXpByUser.get(userId) ?? 0) + xpEarned;
      totalXpByUser.set(userId, total);
      return total;
    },
  };

  const badge = new BadgeDefinition(
    1,
    'First Steps',
    'first-steps',
    'Complete your first Lesson.',
    { trigger: 'cumulative', target: 'stage_completions', threshold: 1 },
    null,
  );

  const fakeBadges: BadgeRepository = {
    findAll: vi.fn().mockResolvedValue([badge]),
    countAwards: vi.fn().mockResolvedValue(0),
    awardMany: vi.fn(),
    findEarnedByUser: vi.fn(),
    countCompletedStages: vi.fn().mockResolvedValue(1),
    countPassedQuests: vi.fn().mockResolvedValue(0),
    isZoneCompleted: vi.fn().mockResolvedValue(false),
  };

  const fakeDailyEvents: DailyEventRepository = {
    async findByDate() {
      return new DailyEvent(1, '2026-09-15', 'normal', 1);
    },
    async create() {
      throw new Error('not used in this test');
    },
  };

  const fakeUsers = makeFakeUserRepository();

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
    stagesByZone.clear();
    stagesByZone.set(1, stages);
    completedStageIds.clear();
    totalXpByUser.clear();

    const moduleRef = await Test.createTestingModule({
      controllers: [MarkStageCompleteController],
      providers: [
        { provide: StageRepository, useValue: fakeStages },
        { provide: ProgressRepository, useValue: fakeProgress },
        { provide: BadgeRepository, useValue: fakeBadges },
        { provide: DailyEventRepository, useValue: fakeDailyEvents },
        { provide: UserRepository, useValue: fakeUsers },
        { provide: ClerkAuthPort, useValue: fakeClerk },
        ClerkAuthGuard,
        EnsureUserUseCase,
        EvaluateBadgesUseCase,
        GetTodayEventUseCase,
        MarkStageCompleteUseCase,
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

  it('rejects an unauthenticated request with 401', async () => {
    const res = await request(app.getHttpServer()).post(
      '/v1/api/stages/1/complete',
    );
    expect(res.status).toBe(401);
  });

  it('completes an available Stage, reporting XP, the Level reached, and the Badge earned', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/api/stages/1/complete')
      .set(asLearner());

    expect(res.status).toBe(201);
    const body = StageCompletionResponseSchema.parse(res.body);
    expect(body).toEqual({
      stageId: 1,
      xpEarned: 100,
      eventMultiplier: 1,
      eventType: 'normal',
      level: 2,
      leveledUp: true,
      badgesEarned: [
        {
          id: 1,
          name: 'First Steps',
          description: 'Complete your first Lesson.',
          imageUrl: null,
          awardCount: 1,
        },
      ],
    });
  });

  it('rejects a duplicate completion as a rule (400), not an error', async () => {
    completedStageIds.add(stages[0]!.id);

    const res = await request(app.getHttpServer())
      .post('/v1/api/stages/1/complete')
      .set(asLearner());

    expect(res.status).toBe(400);
  });

  it('rejects completing a locked Stage (unfinished predecessor) with 403', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/api/stages/2/complete')
      .set(asLearner());

    expect(res.status).toBe(403);
  });

  it('returns 404 for a Stage that does not exist', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/api/stages/999/complete')
      .set(asLearner());
    expect(res.status).toBe(404);
  });
});
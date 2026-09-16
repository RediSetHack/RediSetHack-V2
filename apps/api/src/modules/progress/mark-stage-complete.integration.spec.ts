import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { IncomingMessage } from 'node:http';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { StageCompletionResponseSchema } from '@repo/contracts';

import {
  ClerkAuthPort,
  type ClerkAuthenticatedUser,
} from '../auth/domain/ports/clerk-auth.port.js';
import { UserRepository } from '../auth/domain/ports/user.repository.js';
import { EnsureUserUseCase } from '../auth/application/ensure-user.use-case.js';
import { makeFakeUserRepository } from '../auth/fake-user.fixture.js';
import { ClerkAuthGuard } from '../auth/presentation/guards/clerk-auth.guard.js';
import { EvaluateBadgesUseCase } from '../badge/application/evaluate-badges.use-case.js';
import { BadgeRepository } from '../badge/domain/ports/badge.repository.js';
import { Stage } from '../content/domain/entities/stage.entity.js';
import { StageRepository } from '../content/domain/ports/stage.repository.js';
import { makeFakeStageRepository } from '../content/fake-stage.fixture.js';
import { DailyEvent } from '../daily-event/domain/entities/daily-event.entity.js';
import { DailyEventRepository } from '../daily-event/domain/ports/daily-event.repository.js';
import { GetTodayEventUseCase } from '../daily-event/application/get-today-event.use-case.js';
import { MarkStageCompleteUseCase } from './application/mark-stage-complete.use-case.js';
import { MarkStageCompleteController } from './presentation/controllers/mark-stage-complete.controller.js';
import type { MarkCompletedResult } from './domain/ports/progress.repository.js';
import { ProgressRepository } from './domain/ports/progress.repository.js';

describe('POST /v1/api/stages/:stageId/complete integration', () => {
  let app: INestApplication;

  const stagesByZone = new Map<number, Stage[]>();
  const completedStageIds = new Set<number>();
  const totalXpByUser = new Map<string, number>();

  const fakeStages = makeFakeStageRepository(stagesByZone, completedStageIds);
  const fakeUsers = makeFakeUserRepository();

  const fakeProgress: ProgressRepository = {
    async markCompleted(
      userId,
      stageId,
      xpEarned,
    ): Promise<MarkCompletedResult | null> {
      const stage = (stagesByZone.get(1) ?? []).find((s) => s.id === stageId);
      if (stage && completedStageIds.has(stage.id)) return null;
      const previousXp = totalXpByUser.get(userId) ?? 0;
      totalXpByUser.set(userId, previousXp + xpEarned);
      if (stage) completedStageIds.add(stage.id);
      return { previousXp };
    },
  };

  const fakeDailyEvents: DailyEventRepository = {
    async findByDate() {
      return new DailyEvent(1, '2026-09-15', 'normal', 1);
    },
    async create() {
      throw new Error('not used in this test');
    },
  };

  const fakeBadges: BadgeRepository = {
    async findAll() {
      return [];
    },
    async countAwards() {
      return 0;
    },
    async awardMany() {},
    async findEarnedByUser() {
      return [];
    },
    async countCompletedStages() {
      return 0;
    },
    async countPassedQuests() {
      return 0;
    },
    async isZoneCompleted() {
      return false;
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
    stagesByZone.clear();
    completedStageIds.clear();
    totalXpByUser.clear();

    const moduleRef = await Test.createTestingModule({
      controllers: [MarkStageCompleteController],
      providers: [
        { provide: StageRepository, useValue: fakeStages },
        { provide: ProgressRepository, useValue: fakeProgress },
        { provide: DailyEventRepository, useValue: fakeDailyEvents },
        { provide: BadgeRepository, useValue: fakeBadges },
        { provide: ClerkAuthPort, useValue: fakeClerk },
        { provide: UserRepository, useValue: fakeUsers },
        ClerkAuthGuard,
        EnsureUserUseCase,
        GetTodayEventUseCase,
        EvaluateBadgesUseCase,
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

  it('returns 404 for a Stage that does not exist', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/api/stages/999/complete')
      .set(asLearner());
    expect(res.status).toBe(404);
  });

  it('rejects a locked Stage (unfinished predecessor) with 403, as a rule not an error', async () => {
    stagesByZone.set(1, [
      new Stage(1, 1, 'For loops', 'for-loops', [], 50, 1),
      new Stage(2, 1, 'While loops', 'while-loops', [], 50, 2),
    ]);

    const res = await request(app.getHttpServer())
      .post('/v1/api/stages/2/complete')
      .set(asLearner());

    expect(res.status).toBe(403);
  });

  it('completes the first (always-open) Stage in a Zone and points to the next one', async () => {
    stagesByZone.set(1, [
      new Stage(1, 1, 'For loops', 'for-loops', [], 50, 1),
      new Stage(2, 1, 'While loops', 'while-loops', [], 50, 2),
    ]);

    const res = await request(app.getHttpServer())
      .post('/v1/api/stages/1/complete')
      .set(asLearner());

    expect(res.status).toBe(201);
    const parsed = StageCompletionResponseSchema.parse(res.body);
    expect(parsed).toEqual({
      stageId: 1,
      xpEarned: 50,
      eventMultiplier: 1,
      eventType: 'normal',
      level: 1,
      leveledUp: false,
      badgesEarned: [],
      nextStageId: 2,
    });
  });

  it('reports nextStageId as null for the last Stage in a Zone', async () => {
    stagesByZone.set(1, [new Stage(1, 1, 'For loops', 'for-loops', [], 50, 1)]);

    const res = await request(app.getHttpServer())
      .post('/v1/api/stages/1/complete')
      .set(asLearner());

    expect(res.status).toBe(201);
    expect(
      StageCompletionResponseSchema.parse(res.body).nextStageId,
    ).toBeNull();
  });

  it('rejects a duplicate completion with 400, as a rule not an error', async () => {
    stagesByZone.set(1, [new Stage(1, 1, 'For loops', 'for-loops', [], 50, 1)]);

    await request(app.getHttpServer())
      .post('/v1/api/stages/1/complete')
      .set(asLearner());
    const res = await request(app.getHttpServer())
      .post('/v1/api/stages/1/complete')
      .set(asLearner());

    expect(res.status).toBe(400);
  });
});

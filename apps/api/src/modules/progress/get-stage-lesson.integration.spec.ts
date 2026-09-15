import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { IncomingMessage } from 'node:http';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LessonResponseSchema } from '@repo/contracts';

import {
  ClerkAuthPort,
  type ClerkAuthenticatedUser,
} from '../auth/domain/ports/clerk-auth.port.js';
import { UserRepository } from '../auth/domain/ports/user.repository.js';
import { EnsureUserUseCase } from '../auth/application/ensure-user.use-case.js';
import { makeFakeUserRepository } from '../auth/fake-user.fixture.js';
import { ClerkAuthGuard } from '../auth/presentation/guards/clerk-auth.guard.js';
import { Stage } from '../content/domain/entities/stage.entity.js';
import { StageRepository } from '../content/domain/ports/stage.repository.js';
import { makeFakeStageRepository } from '../content/fake-stage.fixture.js';
import { GetStageLessonUseCase } from './application/get-stage-lesson.use-case.js';
import { GetStageLessonController } from './presentation/controllers/get-stage-lesson.controller.js';

describe('GET /v1/api/stages/:stageId/lesson integration', () => {
  let app: INestApplication;

  const stagesByZone = new Map<number, Stage[]>();
  const completedStageIds = new Set<number>();

  const fakeStages = makeFakeStageRepository(stagesByZone, completedStageIds);

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
    completedStageIds.clear();

    const moduleRef = await Test.createTestingModule({
      controllers: [GetStageLessonController],
      providers: [
        { provide: StageRepository, useValue: fakeStages },
        { provide: ClerkAuthPort, useValue: fakeClerk },
        { provide: UserRepository, useValue: fakeUsers },
        ClerkAuthGuard,
        EnsureUserUseCase,
        GetStageLessonUseCase,
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
    const res = await request(app.getHttpServer()).get(
      '/v1/api/stages/1/lesson',
    );
    expect(res.status).toBe(401);
  });

  it('returns 404 for a Stage that does not exist', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/api/stages/999/lesson')
      .set(asLearner());
    expect(res.status).toBe(404);
  });

  it('returns the Lesson for the first (always-open) Stage in a Zone', async () => {
    stagesByZone.set(1, [
      new Stage(
        1,
        1,
        'For loops',
        'for-loops',
        [
          { type: 'text', content: 'Loops repeat code.' },
          {
            type: 'code',
            language: 'javascript',
            content: 'for (let i = 0; i < 3; i++) {}',
          },
          {
            type: 'exercise',
            prompt: 'Write a loop that prints 1 to 3.',
            language: 'javascript',
            starterCode: '// your code here',
          },
        ],
        50,
        1,
      ),
    ]);

    const res = await request(app.getHttpServer())
      .get('/v1/api/stages/1/lesson')
      .set(asLearner());

    expect(res.status).toBe(200);
    const parsed = LessonResponseSchema.parse(res.body);
    expect(parsed).toEqual({
      id: 1,
      zoneId: 1,
      title: 'For loops',
      slug: 'for-loops',
      xpReward: 50,
      sortOrder: 1,
      status: 'available',
      blocks: [
        { type: 'text', content: 'Loops repeat code.' },
        {
          type: 'code',
          language: 'javascript',
          content: 'for (let i = 0; i < 3; i++) {}',
        },
        {
          type: 'exercise',
          prompt: 'Write a loop that prints 1 to 3.',
          language: 'javascript',
          starterCode: '// your code here',
        },
      ],
    });
  });

  it('rejects a locked Stage (unfinished predecessor) with 403', async () => {
    stagesByZone.set(1, [
      new Stage(1, 1, 'For loops', 'for-loops', [], 50, 1),
      new Stage(2, 1, 'While loops', 'while-loops', [], 50, 2),
    ]);

    const res = await request(app.getHttpServer())
      .get('/v1/api/stages/2/lesson')
      .set(asLearner());

    expect(res.status).toBe(403);
  });

  it('marks the Lesson completed once its Stage is completed', async () => {
    stagesByZone.set(1, [new Stage(1, 1, 'For loops', 'for-loops', [], 50, 1)]);
    completedStageIds.add(1);

    const res = await request(app.getHttpServer())
      .get('/v1/api/stages/1/lesson')
      .set(asLearner());

    expect(res.status).toBe(200);
    expect(LessonResponseSchema.parse(res.body).status).toBe('completed');
  });
});

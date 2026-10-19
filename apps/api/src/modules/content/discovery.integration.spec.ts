import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { IncomingMessage } from 'node:http';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DiscoveryResponseSchema } from '@repo/contracts';

import {
  ClerkAuthPort,
  type ClerkAuthenticatedUser,
} from '../auth/domain/ports/clerk-auth.port.js';
import { UserRepository } from '../auth/domain/ports/user.repository.js';
import { EnsureUserUseCase } from '../auth/application/ensure-user.use-case.js';
import { makeFakeUserRepository } from '../auth/fake-user.fixture.js';
import { ClerkAuthGuard } from '../auth/presentation/guards/clerk-auth.guard.js';
import { Region } from './domain/entities/region.entity.js';
import { Zone } from './domain/entities/zone.entity.js';
import { Stage } from './domain/entities/stage.entity.js';
import { RegionRepository } from './domain/ports/region.repository.js';
import { ZoneRepository } from './domain/ports/zone.repository.js';
import { StageRepository, DiscoverableStage } from './domain/ports/stage.repository.js';
import { ListDiscoverableContentUseCase } from './application/list-discoverable-content.use-case.js';
import { ListDiscoverableContentController } from './presentation/controllers/list-discoverable-content.controller.js';

describe('content discovery (approved catalog by interest and difficulty)', () => {
  let app: INestApplication;

  const regions = new Map<number, Region>();
  const zones = new Map<number, Zone>();
  // stageId -> { stage, regionId }
  const discoverableStages = new Map<number, { stage: Stage; regionId: number }>();
  const completedStageIds = new Set<number>();

  const fakeRegions: RegionRepository = {
    async findAll() {
      return [...regions.values()].filter((r) => r.archivedAt === null);
    },
  };

  const fakeZones: ZoneRepository = {
    async findAll() {
      return [...zones.values()].filter((z) => z.archivedAt === null);
    },
    async findByRegionId() {
      return [];
    },
  };

  const fakeStages: StageRepository = {
    async findById() {
      return null;
    },
    async findByZoneId() {
      return [];
    },
    async hasArchivedAncestor() {
      return false;
    },
    async findCompletedStageIds() {
      return [];
    },
    async findAllDiscoverable() {
      return [...discoverableStages.values()]
        .filter(({ stage }) => stage.archivedAt === null)
        .map(({ stage, regionId }) => ({ ...stage, regionId } as DiscoverableStage));
    },
    async findAllCompletedStageIds() {
      return [...completedStageIds];
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
    regions.clear();
    zones.clear();
    discoverableStages.clear();
    completedStageIds.clear();

    const moduleRef = await Test.createTestingModule({
      controllers: [ListDiscoverableContentController],
      providers: [
        { provide: RegionRepository, useValue: fakeRegions },
        { provide: ZoneRepository, useValue: fakeZones },
        { provide: StageRepository, useValue: fakeStages },
        { provide: ClerkAuthPort, useValue: fakeClerk },
        { provide: UserRepository, useValue: fakeUsers },
        ClerkAuthGuard,
        EnsureUserUseCase,
        ListDiscoverableContentUseCase,
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

  function seed() {
    regions.set(1, new Region(1, 'Foundations', 'foundations', null, 1, null, 'A story introduction.'));
    regions.set(2, new Region(2, 'Retired', 'retired', null, 2, new Date(), null));
    zones.set(1, new Zone(1, 1, 'Loops', 'loops', null, 1, null));
    zones.set(2, new Zone(2, 2, 'Retired Zone', 'retired-zone', null, 1, new Date()));
    zones.set(3, new Zone(3, 1, 'Progress', 'progress', null, 2, null));

    // Available beginner stage tagged with control-flow.
    discoverableStages.set(1, {
      stage: new Stage(
        1,
        1,
        'For loops',
        'for-loops',
        [{ type: 'text', content: 'secret lesson body' }],
        50,
        1,
        null,
        ['programming.control-flow'],
        'beginner',
      ),
      regionId: 1,
    });
    // Locked intermediate stage (predecessor not completed).
    discoverableStages.set(2, {
      stage: new Stage(
        2,
        1,
        'While loops',
        'while-loops',
        [{ type: 'text', content: 'restricted' }],
        50,
        2,
        null,
        ['programming.control-flow'],
        'intermediate',
      ),
      regionId: 1,
    });
    // Completed advanced stage in its own Zone (index 0, so unlocked).
    discoverableStages.set(3, {
      stage: new Stage(
        3,
        3,
        'Recursion',
        'recursion',
        [{ type: 'text', content: 'restricted' }],
        30,
        1,
        null,
        ['programming.recursion'],
        'advanced',
      ),
      regionId: 1,
    });
    // Archived (retired) stage must never appear.
    discoverableStages.set(4, {
      stage: new Stage(
        4,
        1,
        'Archived loops',
        'archived-loops',
        [{ type: 'text', content: 'retired' }],
        10,
        3,
        new Date(),
        ['programming.control-flow'],
        'beginner',
      ),
      regionId: 1,
    });
    completedStageIds.add(3);
  }

  it('rejects unauthenticated discovery requests with 401', async () => {
    seed();
    const res = await request(app.getHttpServer()).get('/v1/api/discover');
    expect(res.status).toBe(401);
  });

  it('returns only approved, non-archived content and omits restricted bodies', async () => {
    seed();
    const res = await request(app.getHttpServer()).get('/v1/api/discover').set(asLearner());
    expect(res.status).toBe(200);
    const parsed = DiscoveryResponseSchema.parse(res.body);

    // No archived Region, Zone, or Stage.
    expect(parsed.some((i) => i.id === 2 && i.kind === 'region')).toBe(false);
    expect(parsed.some((i) => i.id === 2 && i.kind === 'zone')).toBe(false);
    expect(parsed.some((i) => i.id === 4 && i.kind === 'stage')).toBe(false);

    // Stage items never carry lesson content.
    const stages = parsed.filter((i) => i.kind === 'stage');
    for (const stage of stages) {
      expect((stage as Record<string, unknown>).lessonContent).toBeUndefined();
    }

    // Locked stage exposes safe metadata + eligibility reason, not content.
    const locked = stages.find((i) => i.id === 2);
    expect(locked?.status).toBe('locked');
    expect(locked?.lockReason).toBe('Complete the predecessor Stage first.');

    // Completed stage reports completion.
    const completed = stages.find((i) => i.id === 3);
    expect(completed?.status).toBe('completed');
  });

  it('filters activities by competency', async () => {
    seed();
    const res = await request(app.getHttpServer())
      .get('/v1/api/discover?competency=programming.control-flow')
      .set(asLearner());
    const parsed = DiscoveryResponseSchema.parse(res.body);
    const stages = parsed.filter((i) => i.kind === 'stage');
    expect(stages.map((i) => i.id)).toEqual([1, 2]);
    // Archived control-flow stage excluded.
    expect(stages.map((i) => i.id)).not.toContain(4);
    // Non-matching competency stages excluded.
    expect(stages.map((i) => i.id)).not.toContain(3);
  });

  it('filters activities by difficulty', async () => {
    seed();
    const res = await request(app.getHttpServer())
      .get('/v1/api/discover?difficulty=advanced')
      .set(asLearner());
    const parsed = DiscoveryResponseSchema.parse(res.body);
    const stages = parsed.filter((i) => i.kind === 'stage');
    expect(stages.map((i) => i.id)).toEqual([3]);
  });

  it('searches titles and slugs across the catalog', async () => {
    seed();
    const res = await request(app.getHttpServer())
      .get('/v1/api/discover?q=loops')
      .set(asLearner());
    const parsed = DiscoveryResponseSchema.parse(res.body);
    const titles = parsed.map((i) => i.title);
    expect(titles).toContain('For loops');
    expect(titles).toContain('While loops');
    expect(titles).not.toContain('Recursion');
  });

  it('bounds results to the requested limit', async () => {
    seed();
    const res = await request(app.getHttpServer())
      .get('/v1/api/discover?limit=1')
      .set(asLearner());
    const parsed = DiscoveryResponseSchema.parse(res.body);
    expect(parsed.length).toBeLessThanOrEqual(1);
  });

  it('applies competency, difficulty, and search together', async () => {
    seed();
    const res = await request(app.getHttpServer())
      .get(
        '/v1/api/discover?competency=programming.control-flow&difficulty=beginner&q=for',
      )
      .set(asLearner());
    const parsed = DiscoveryResponseSchema.parse(res.body);
    const stages = parsed.filter((i) => i.kind === 'stage');
    expect(stages.map((i) => i.id)).toEqual([1]);
  });

  it('returns an empty list when nothing matches the filters', async () => {
    seed();
    const res = await request(app.getHttpServer())
      .get('/v1/api/discover?difficulty=advanced&competency=security.input-validation')
      .set(asLearner());
    const parsed = DiscoveryResponseSchema.parse(res.body);
    expect(parsed.filter((i) => i.kind === 'stage')).toEqual([]);
  });
});

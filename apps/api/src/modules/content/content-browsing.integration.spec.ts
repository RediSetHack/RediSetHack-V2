import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { IncomingMessage } from 'node:http';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  RegionListResponseSchema,
  StageListResponseSchema,
  ZoneListResponseSchema,
} from '@repo/contracts';

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
import { StageRepository } from './domain/ports/stage.repository.js';
import { ListRegionsUseCase } from './application/list-regions.use-case.js';
import { ListZonesUseCase } from './application/list-zones.use-case.js';
import { ListStagesUseCase } from './application/list-stages.use-case.js';
import { ListRegionsController } from './presentation/controllers/list-regions.controller.js';
import { ListZonesController } from './presentation/controllers/list-zones.controller.js';
import { ListStagesController } from './presentation/controllers/list-stages.controller.js';

describe('content browsing integration (Region → Zone → Stage)', () => {
  let app: INestApplication;

  const regions = new Map<number, Region>();
  const zonesByRegion = new Map<number, Zone[]>();
  const stagesByZone = new Map<number, Stage[]>();
  const completedStageIds = new Set<number>();

  const fakeRegions: RegionRepository = {
    async findAll() {
      return [...regions.values()];
    },
  };

  const fakeZones: ZoneRepository = {
    async findByRegionId(regionId) {
      return zonesByRegion.get(regionId) ?? [];
    },
  };

  const fakeStages: StageRepository = {
    async findById(stageId) {
      for (const stages of stagesByZone.values()) {
        const found = stages.find((s) => s.id === stageId);
        if (found) return found;
      }
      return null;
    },
    async findByZoneId(zoneId) {
      return stagesByZone.get(zoneId) ?? [];
    },
    async findCompletedStageIds(_userId, zoneId) {
      const stages = stagesByZone.get(zoneId) ?? [];
      return stages.filter((s) => completedStageIds.has(s.id)).map((s) => s.id);
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
    zonesByRegion.clear();
    stagesByZone.clear();
    completedStageIds.clear();

    const moduleRef = await Test.createTestingModule({
      controllers: [
        ListRegionsController,
        ListZonesController,
        ListStagesController,
      ],
      providers: [
        { provide: RegionRepository, useValue: fakeRegions },
        { provide: ZoneRepository, useValue: fakeZones },
        { provide: StageRepository, useValue: fakeStages },
        { provide: ClerkAuthPort, useValue: fakeClerk },
        { provide: UserRepository, useValue: fakeUsers },
        ClerkAuthGuard,
        EnsureUserUseCase,
        ListRegionsUseCase,
        ListZonesUseCase,
        ListStagesUseCase,
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

  it('lists Regions without authentication', async () => {
    regions.set(1, new Region(1, 'Foundations', 'foundations', null, 1));

    const res = await request(app.getHttpServer()).get('/v1/api/regions');

    expect(res.status).toBe(200);
    RegionListResponseSchema.parse(res.body);
    expect(res.body).toEqual([
      {
        id: 1,
        name: 'Foundations',
        slug: 'foundations',
        description: null,
        sortOrder: 1,
      },
    ]);
  });

  it('returns an empty array for a Region with no Zones', async () => {
    const res = await request(app.getHttpServer()).get(
      '/v1/api/regions/1/zones',
    );

    expect(res.status).toBe(200);
    expect(ZoneListResponseSchema.parse(res.body)).toEqual([]);
  });

  it("lists a Region's Zones without authentication", async () => {
    zonesByRegion.set(1, [new Zone(1, 1, 'Loops', 'loops', null, 1)]);

    const res = await request(app.getHttpServer()).get(
      '/v1/api/regions/1/zones',
    );

    expect(res.status).toBe(200);
    expect(ZoneListResponseSchema.parse(res.body)).toEqual([
      {
        id: 1,
        regionId: 1,
        name: 'Loops',
        slug: 'loops',
        description: null,
        sortOrder: 1,
      },
    ]);
  });

  it('rejects an unauthenticated Stage listing request with 401', async () => {
    const res = await request(app.getHttpServer()).get(
      '/v1/api/zones/1/stages',
    );
    expect(res.status).toBe(401);
  });

  it('returns an empty array for a Zone with no Stages', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/api/zones/1/stages')
      .set(asLearner());

    expect(res.status).toBe(200);
    expect(StageListResponseSchema.parse(res.body)).toEqual([]);
  });

  it('presents the first Stage as available and locks a Stage behind an unfinished predecessor', async () => {
    stagesByZone.set(1, [
      new Stage(1, 1, 'For loops', 'for-loops', [], 50, 1),
      new Stage(2, 1, 'While loops', 'while-loops', [], 50, 2),
    ]);

    const res = await request(app.getHttpServer())
      .get('/v1/api/zones/1/stages')
      .set(asLearner());

    expect(res.status).toBe(200);
    const parsed = StageListResponseSchema.parse(res.body);
    expect(parsed).toEqual([
      expect.objectContaining({ id: 1, status: 'available', xpReward: 50 }),
      expect.objectContaining({ id: 2, status: 'locked', xpReward: 50 }),
    ]);
  });

  it('unlocks the successor once its predecessor is completed', async () => {
    stagesByZone.set(1, [
      new Stage(1, 1, 'For loops', 'for-loops', [], 50, 1),
      new Stage(2, 1, 'While loops', 'while-loops', [], 50, 2),
    ]);
    completedStageIds.add(1);

    const res = await request(app.getHttpServer())
      .get('/v1/api/zones/1/stages')
      .set(asLearner());

    expect(res.status).toBe(200);
    const parsed = StageListResponseSchema.parse(res.body);
    expect(parsed).toEqual([
      expect.objectContaining({ id: 1, status: 'completed' }),
      expect.objectContaining({ id: 2, status: 'available' }),
    ]);
  });
});

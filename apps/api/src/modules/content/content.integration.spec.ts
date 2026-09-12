import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { IncomingMessage } from 'node:http';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const ADMIN_ROUTES: Array<{ method: 'post' | 'get' | 'patch' | 'delete'; path: string }> = [
  { method: 'post', path: '/v1/api/admin/regions' },
  { method: 'get', path: '/v1/api/admin/regions/1' },
  { method: 'patch', path: '/v1/api/admin/regions/1' },
  { method: 'delete', path: '/v1/api/admin/regions/1' },
  { method: 'post', path: '/v1/api/admin/zones' },
  { method: 'get', path: '/v1/api/admin/zones/1' },
  { method: 'patch', path: '/v1/api/admin/zones/1' },
  { method: 'delete', path: '/v1/api/admin/zones/1' },
  { method: 'post', path: '/v1/api/admin/stages' },
  { method: 'get', path: '/v1/api/admin/stages/1' },
  { method: 'patch', path: '/v1/api/admin/stages/1' },
  { method: 'delete', path: '/v1/api/admin/stages/1' },
  { method: 'post', path: '/v1/api/admin/quests' },
  { method: 'get', path: '/v1/api/admin/quests/1' },
  { method: 'patch', path: '/v1/api/admin/quests/1' },
  { method: 'delete', path: '/v1/api/admin/quests/1' },
  { method: 'post', path: '/v1/api/admin/badges' },
  { method: 'get', path: '/v1/api/admin/badges/1' },
  { method: 'patch', path: '/v1/api/admin/badges/1' },
  { method: 'delete', path: '/v1/api/admin/badges/1' },
  { method: 'post', path: '/v1/api/admin/characters' },
  { method: 'get', path: '/v1/api/admin/characters/1' },
  { method: 'patch', path: '/v1/api/admin/characters/1' },
  { method: 'delete', path: '/v1/api/admin/characters/1' },
];

import { Character } from '../auth/domain/entities/character.entity.js';
import { User } from '../auth/domain/entities/user.entity.js';
import { CharacterRepository } from '../auth/domain/ports/character.repository.js';
import {
  ClerkAuthPort,
  type ClerkAuthenticatedUser,
} from '../auth/domain/ports/clerk-auth.port.js';
import { UserRepository } from '../auth/domain/ports/user.repository.js';
import { EnsureUserUseCase } from '../auth/application/ensure-user.use-case.js';
import { AdminGuard } from '../auth/presentation/guards/admin.guard.js';
import { ClerkAuthGuard } from '../auth/presentation/guards/clerk-auth.guard.js';
import {
  BadgeDefinition,
  Quest,
  Region,
  Stage,
  Zone,
} from './domain/entities.js';
import {
  BadgeDefinitionRepository,
  QuestRepository,
  RegionRepository,
  StageRepository,
  ZoneRepository,
} from './domain/ports.js';
import {
  CreateBadgeDefinitionUseCase,
  CreateCharacterUseCase,
  CreateQuestUseCase,
  CreateRegionUseCase,
  CreateStageUseCase,
  CreateZoneUseCase,
  DeleteBadgeDefinitionUseCase,
  DeleteCharacterUseCase,
  DeleteQuestUseCase,
  DeleteRegionUseCase,
  DeleteStageUseCase,
  DeleteZoneUseCase,
  GetBadgeDefinitionUseCase,
  GetCharacterUseCase,
  GetQuestUseCase,
  GetRegionUseCase,
  GetStageUseCase,
  GetZoneUseCase,
  UpdateBadgeDefinitionUseCase,
  UpdateCharacterUseCase,
  UpdateQuestUseCase,
  UpdateRegionUseCase,
  UpdateStageUseCase,
  UpdateZoneUseCase,
} from './application/use-cases.js';
import {
  CreateBadgeDefinitionController,
  CreateCharacterController,
  CreateQuestController,
  CreateRegionController,
  CreateStageController,
  CreateZoneController,
  DeleteBadgeDefinitionController,
  DeleteCharacterController,
  DeleteQuestController,
  DeleteRegionController,
  DeleteStageController,
  DeleteZoneController,
  GetBadgeDefinitionController,
  GetCharacterController,
  GetQuestController,
  GetRegionController,
  GetStageController,
  GetZoneController,
  UpdateBadgeDefinitionController,
  UpdateCharacterController,
  UpdateQuestController,
  UpdateRegionController,
  UpdateStageController,
  UpdateZoneController,
} from './presentation/controllers.js';

// --- In-memory fakes ---------------------------------------------------

function makeRegionRepository(): RegionRepository {
  const store = new Map<number, Region>();
  let nextId = 1;
  return {
    async findById(id) {
      return store.get(id) ?? null;
    },
    async create(input) {
      const region = new Region(
        nextId++,
        input.name,
        input.slug,
        input.description,
        input.sortOrder,
      );
      store.set(region.id, region);
      return region;
    },
    async update(id, input) {
      const existing = store.get(id);
      if (!existing) return null;
      const updated = new Region(
        id,
        input.name ?? existing.name,
        input.slug ?? existing.slug,
        input.description !== undefined
          ? input.description
          : existing.description,
        input.sortOrder ?? existing.sortOrder,
      );
      store.set(id, updated);
      return updated;
    },
    async delete(id) {
      return store.delete(id);
    },
  };
}

function makeZoneRepository(): ZoneRepository {
  const store = new Map<number, Zone>();
  let nextId = 1;
  return {
    async findById(id) {
      return store.get(id) ?? null;
    },
    async create(input) {
      const zone = new Zone(
        nextId++,
        input.regionId,
        input.name,
        input.slug,
        input.description,
        input.sortOrder,
      );
      store.set(zone.id, zone);
      return zone;
    },
    async update(id, input) {
      const existing = store.get(id);
      if (!existing) return null;
      const updated = new Zone(
        id,
        existing.regionId,
        input.name ?? existing.name,
        input.slug ?? existing.slug,
        input.description !== undefined
          ? input.description
          : existing.description,
        input.sortOrder ?? existing.sortOrder,
      );
      store.set(id, updated);
      return updated;
    },
    async delete(id) {
      return store.delete(id);
    },
  };
}

function makeStageRepository(): StageRepository {
  const store = new Map<number, Stage>();
  let nextId = 1;
  return {
    async findById(id) {
      return store.get(id) ?? null;
    },
    async create(input) {
      const stage = new Stage(
        nextId++,
        input.zoneId,
        input.title,
        input.slug,
        input.lessonContent,
        input.xpReward,
        input.sortOrder,
      );
      store.set(stage.id, stage);
      return stage;
    },
    async update(id, input) {
      const existing = store.get(id);
      if (!existing) return null;
      const updated = new Stage(
        id,
        existing.zoneId,
        input.title ?? existing.title,
        input.slug ?? existing.slug,
        input.lessonContent !== undefined
          ? input.lessonContent
          : existing.lessonContent,
        input.xpReward ?? existing.xpReward,
        input.sortOrder ?? existing.sortOrder,
      );
      store.set(id, updated);
      return updated;
    },
    async delete(id) {
      return store.delete(id);
    },
  };
}

function makeQuestRepository(): QuestRepository {
  const store = new Map<number, Quest>();
  let nextId = 1;
  return {
    async findById(id) {
      return store.get(id) ?? null;
    },
    async create(input) {
      const quest = new Quest(
        nextId++,
        input.stageId,
        input.title,
        input.description,
        input.timeLimitSeconds,
        input.passingScore,
        input.xpReward,
        input.questions,
      );
      store.set(quest.id, quest);
      return quest;
    },
    async update(id, input) {
      const existing = store.get(id);
      if (!existing) return null;
      const updated = new Quest(
        id,
        existing.stageId,
        input.title ?? existing.title,
        input.description !== undefined
          ? input.description
          : existing.description,
        input.timeLimitSeconds ?? existing.timeLimitSeconds,
        input.passingScore ?? existing.passingScore,
        input.xpReward ?? existing.xpReward,
        input.questions ?? existing.questions,
      );
      store.set(id, updated);
      return updated;
    },
    async delete(id) {
      return store.delete(id);
    },
  };
}

function makeBadgeDefinitionRepository(): BadgeDefinitionRepository {
  const store = new Map<number, BadgeDefinition>();
  let nextId = 1;
  return {
    async findById(id) {
      return store.get(id) ?? null;
    },
    async create(input) {
      const badge = new BadgeDefinition(
        nextId++,
        input.name,
        input.slug,
        input.description,
        input.criteria,
        input.imageUrl,
      );
      store.set(badge.id, badge);
      return badge;
    },
    async update(id, input) {
      const existing = store.get(id);
      if (!existing) return null;
      const updated = new BadgeDefinition(
        id,
        input.name ?? existing.name,
        input.slug ?? existing.slug,
        input.description !== undefined
          ? input.description
          : existing.description,
        input.criteria ?? existing.criteria,
        input.imageUrl !== undefined ? input.imageUrl : existing.imageUrl,
      );
      store.set(id, updated);
      return updated;
    },
    async delete(id) {
      return store.delete(id);
    },
  };
}

function makeCharacterRepository(): CharacterRepository {
  const store = new Map<number, Character>();
  let nextId = 1;
  return {
    async findById(id) {
      return store.get(id) ?? null;
    },
    async create(input) {
      const character = new Character(
        nextId++,
        input.name,
        input.slug,
        input.description,
        input.imageUrl,
      );
      store.set(character.id, character);
      return character;
    },
    async update(id, input) {
      const existing = store.get(id);
      if (!existing) return null;
      const updated = new Character(
        id,
        input.name ?? existing.name,
        input.slug ?? existing.slug,
        input.description !== undefined
          ? input.description
          : existing.description,
        input.imageUrl !== undefined ? input.imageUrl : existing.imageUrl,
      );
      store.set(id, updated);
      return updated;
    },
    async delete(id) {
      return store.delete(id);
    },
  };
}

describe('content admin CRUD', () => {
  let app: INestApplication;

  const fakeClerk: ClerkAuthPort = {
    async authenticate(request: IncomingMessage) {
      if (request.headers['authorization'] !== 'Bearer valid-token')
        return null;
      const isAdmin = request.headers['x-probe-role'] === 'admin';
      return {
        id: isAdmin ? 'user_admin' : 'user_learner',
        email: isAdmin ? 'admin@example.com' : 'learner@example.com',
        name: isAdmin ? 'Admin' : 'Learner',
        role: isAdmin ? 'admin' : 'user',
      } satisfies ClerkAuthenticatedUser;
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
  };

  beforeEach(async () => {
    const regions = makeRegionRepository();
    const zones = makeZoneRepository();
    const stages = makeStageRepository();
    const quests = makeQuestRepository();
    const badges = makeBadgeDefinitionRepository();
    const characters = makeCharacterRepository();

    const moduleRef = await Test.createTestingModule({
      controllers: [
        CreateRegionController,
        GetRegionController,
        UpdateRegionController,
        DeleteRegionController,
        CreateZoneController,
        GetZoneController,
        UpdateZoneController,
        DeleteZoneController,
        CreateStageController,
        GetStageController,
        UpdateStageController,
        DeleteStageController,
        CreateQuestController,
        GetQuestController,
        UpdateQuestController,
        DeleteQuestController,
        CreateBadgeDefinitionController,
        GetBadgeDefinitionController,
        UpdateBadgeDefinitionController,
        DeleteBadgeDefinitionController,
        CreateCharacterController,
        GetCharacterController,
        UpdateCharacterController,
        DeleteCharacterController,
      ],
      providers: [
        { provide: ClerkAuthPort, useValue: fakeClerk },
        { provide: UserRepository, useValue: fakeUsers },
        { provide: RegionRepository, useValue: regions },
        { provide: ZoneRepository, useValue: zones },
        { provide: StageRepository, useValue: stages },
        { provide: QuestRepository, useValue: quests },
        { provide: BadgeDefinitionRepository, useValue: badges },
        { provide: CharacterRepository, useValue: characters },
        ClerkAuthGuard,
        AdminGuard,
        EnsureUserUseCase,
        {
          provide: CreateRegionUseCase,
          useFactory: () => new CreateRegionUseCase(regions),
        },
        {
          provide: GetRegionUseCase,
          useFactory: () => new GetRegionUseCase(regions),
        },
        {
          provide: UpdateRegionUseCase,
          useFactory: () => new UpdateRegionUseCase(regions),
        },
        {
          provide: DeleteRegionUseCase,
          useFactory: () => new DeleteRegionUseCase(regions),
        },
        {
          provide: CreateZoneUseCase,
          useFactory: () => new CreateZoneUseCase(zones, regions),
        },
        {
          provide: GetZoneUseCase,
          useFactory: () => new GetZoneUseCase(zones),
        },
        {
          provide: UpdateZoneUseCase,
          useFactory: () => new UpdateZoneUseCase(zones),
        },
        {
          provide: DeleteZoneUseCase,
          useFactory: () => new DeleteZoneUseCase(zones),
        },
        {
          provide: CreateStageUseCase,
          useFactory: () => new CreateStageUseCase(stages, zones),
        },
        {
          provide: GetStageUseCase,
          useFactory: () => new GetStageUseCase(stages),
        },
        {
          provide: UpdateStageUseCase,
          useFactory: () => new UpdateStageUseCase(stages),
        },
        {
          provide: DeleteStageUseCase,
          useFactory: () => new DeleteStageUseCase(stages),
        },
        {
          provide: CreateQuestUseCase,
          useFactory: () => new CreateQuestUseCase(quests, stages),
        },
        {
          provide: GetQuestUseCase,
          useFactory: () => new GetQuestUseCase(quests),
        },
        {
          provide: UpdateQuestUseCase,
          useFactory: () => new UpdateQuestUseCase(quests),
        },
        {
          provide: DeleteQuestUseCase,
          useFactory: () => new DeleteQuestUseCase(quests),
        },
        {
          provide: CreateBadgeDefinitionUseCase,
          useFactory: () => new CreateBadgeDefinitionUseCase(badges),
        },
        {
          provide: GetBadgeDefinitionUseCase,
          useFactory: () => new GetBadgeDefinitionUseCase(badges),
        },
        {
          provide: UpdateBadgeDefinitionUseCase,
          useFactory: () => new UpdateBadgeDefinitionUseCase(badges),
        },
        {
          provide: DeleteBadgeDefinitionUseCase,
          useFactory: () => new DeleteBadgeDefinitionUseCase(badges),
        },
        {
          provide: CreateCharacterUseCase,
          useFactory: () => new CreateCharacterUseCase(characters),
        },
        {
          provide: GetCharacterUseCase,
          useFactory: () => new GetCharacterUseCase(characters),
        },
        {
          provide: UpdateCharacterUseCase,
          useFactory: () => new UpdateCharacterUseCase(characters),
        },
        {
          provide: DeleteCharacterUseCase,
          useFactory: () => new DeleteCharacterUseCase(characters),
        },
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

  const admin = () => ({
    authorization: 'Bearer valid-token',
    'x-probe-role': 'admin',
  });
  const learner = () => ({
    authorization: 'Bearer valid-token',
    'x-probe-role': 'user',
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/api/admin/regions')
      .send({ name: 'Basics', slug: 'basics' });
    expect(res.status).toBe(401);
  });

  it.each(ADMIN_ROUTES)('rejects non-admin users with 403 on $method $path', async ({ method, path }) => {
    const res = await request(app.getHttpServer())[method](path).set(learner()).send({});
    expect(res.status).toBe(403);
  });

  it('runs the full CRUD lifecycle for regions', async () => {
    const create = await request(app.getHttpServer())
      .post('/v1/api/admin/regions')
      .set(admin())
      .send({ name: 'Basics', slug: 'basics', sortOrder: 1 });
    expect(create.status).toBe(201);
    const id = create.body.id;

    const get = await request(app.getHttpServer())
      .get(`/v1/api/admin/regions/${id}`)
      .set(admin());
    expect(get.status).toBe(200);
    expect(get.body).toMatchObject({ name: 'Basics', slug: 'basics' });

    const update = await request(app.getHttpServer())
      .patch(`/v1/api/admin/regions/${id}`)
      .set(admin())
      .send({ name: 'Fundamentals' });
    expect(update.status).toBe(200);
    expect(update.body.name).toBe('Fundamentals');

    const del = await request(app.getHttpServer())
      .delete(`/v1/api/admin/regions/${id}`)
      .set(admin());
    expect(del.status).toBe(204);

    const getAfterDelete = await request(app.getHttpServer())
      .get(`/v1/api/admin/regions/${id}`)
      .set(admin());
    expect(getAfterDelete.status).toBe(404);
  });

  it('rejects creating a zone under a missing region with 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/api/admin/zones')
      .set(admin())
      .send({ regionId: 999, name: 'Loops', slug: 'loops' });
    expect(res.status).toBe(400);
  });

  it('runs the full CRUD lifecycle for zones nested under a region', async () => {
    const region = await request(app.getHttpServer())
      .post('/v1/api/admin/regions')
      .set(admin())
      .send({ name: 'Basics', slug: 'basics' });

    const create = await request(app.getHttpServer())
      .post('/v1/api/admin/zones')
      .set(admin())
      .send({ regionId: region.body.id, name: 'Loops', slug: 'loops' });
    expect(create.status).toBe(201);
    const id = create.body.id;

    const update = await request(app.getHttpServer())
      .patch(`/v1/api/admin/zones/${id}`)
      .set(admin())
      .send({ sortOrder: 5 });
    expect(update.status).toBe(200);
    expect(update.body.sortOrder).toBe(5);

    const del = await request(app.getHttpServer())
      .delete(`/v1/api/admin/zones/${id}`)
      .set(admin());
    expect(del.status).toBe(204);
  });

  it('validates structured lesson content when creating a stage', async () => {
    const region = await request(app.getHttpServer())
      .post('/v1/api/admin/regions')
      .set(admin())
      .send({ name: 'Basics', slug: 'basics' });
    const zone = await request(app.getHttpServer())
      .post('/v1/api/admin/zones')
      .set(admin())
      .send({ regionId: region.body.id, name: 'Loops', slug: 'loops' });

    const invalid = await request(app.getHttpServer())
      .post('/v1/api/admin/stages')
      .set(admin())
      .send({
        zoneId: zone.body.id,
        title: 'For loops',
        slug: 'for-loops',
        lessonContent: [{ type: 'bogus' }],
      });
    expect(invalid.status).toBe(400);

    const valid = await request(app.getHttpServer())
      .post('/v1/api/admin/stages')
      .set(admin())
      .send({
        zoneId: zone.body.id,
        title: 'For loops',
        slug: 'for-loops',
        lessonContent: [{ type: 'text', content: 'Loops repeat code.' }],
      });
    expect(valid.status).toBe(201);
    expect(valid.body.lessonContent).toEqual([
      { type: 'text', content: 'Loops repeat code.' },
    ]);
  });

  it('validates question schemas and answer definitions when creating a quest', async () => {
    const region = await request(app.getHttpServer())
      .post('/v1/api/admin/regions')
      .set(admin())
      .send({ name: 'Basics', slug: 'basics' });
    const zone = await request(app.getHttpServer())
      .post('/v1/api/admin/zones')
      .set(admin())
      .send({ regionId: region.body.id, name: 'Loops', slug: 'loops' });
    const stage = await request(app.getHttpServer())
      .post('/v1/api/admin/stages')
      .set(admin())
      .send({ zoneId: zone.body.id, title: 'For loops', slug: 'for-loops' });

    const invalid = await request(app.getHttpServer())
      .post('/v1/api/admin/quests')
      .set(admin())
      .send({
        stageId: stage.body.id,
        title: 'Loop quiz',
        questions: [
          {
            id: 'q1',
            prompt: '?',
            options: [{ id: 'a', text: 'A' }],
            correctOptionId: 'z',
          },
        ],
      });
    expect(invalid.status).toBe(400);

    const valid = await request(app.getHttpServer())
      .post('/v1/api/admin/quests')
      .set(admin())
      .send({
        stageId: stage.body.id,
        title: 'Loop quiz',
        questions: [
          {
            id: 'q1',
            prompt: 'What repeats code?',
            options: [
              { id: 'a', text: 'A loop' },
              { id: 'b', text: 'A variable' },
            ],
            correctOptionId: 'a',
          },
        ],
      });
    expect(valid.status).toBe(201);
    expect(valid.body.questions).toHaveLength(1);

    const get = await request(app.getHttpServer())
      .get(`/v1/api/admin/quests/${valid.body.id}`)
      .set(admin());
    expect(get.status).toBe(200);

    const del = await request(app.getHttpServer())
      .delete(`/v1/api/admin/quests/${valid.body.id}`)
      .set(admin());
    expect(del.status).toBe(204);
  });

  it('validates badge trigger criteria and runs the badge CRUD lifecycle', async () => {
    const invalid = await request(app.getHttpServer())
      .post('/v1/api/admin/badges')
      .set(admin())
      .send({
        name: 'Streaker',
        slug: 'streaker',
        criteria: { trigger: 'bogus', target: 'x', threshold: 1 },
      });
    expect(invalid.status).toBe(400);

    const create = await request(app.getHttpServer())
      .post('/v1/api/admin/badges')
      .set(admin())
      .send({
        name: 'Streaker',
        slug: 'streaker',
        criteria: {
          trigger: 'cumulative',
          target: 'stage_completions',
          threshold: 5,
        },
      });
    expect(create.status).toBe(201);
    const id = create.body.id;

    const update = await request(app.getHttpServer())
      .patch(`/v1/api/admin/badges/${id}`)
      .set(admin())
      .send({
        criteria: {
          trigger: 'cumulative',
          target: 'stage_completions',
          threshold: 10,
        },
      });
    expect(update.status).toBe(200);
    expect(update.body.criteria.threshold).toBe(10);

    const del = await request(app.getHttpServer())
      .delete(`/v1/api/admin/badges/${id}`)
      .set(admin());
    expect(del.status).toBe(204);
  });

  it('runs the full CRUD lifecycle for characters', async () => {
    const create = await request(app.getHttpServer())
      .post('/v1/api/admin/characters')
      .set(admin())
      .send({ name: 'Knight', slug: 'knight' });
    expect(create.status).toBe(201);
    const id = create.body.id;

    const update = await request(app.getHttpServer())
      .patch(`/v1/api/admin/characters/${id}`)
      .set(admin())
      .send({ description: 'A brave knight' });
    expect(update.status).toBe(200);
    expect(update.body.description).toBe('A brave knight');

    const del = await request(app.getHttpServer())
      .delete(`/v1/api/admin/characters/${id}`)
      .set(admin());
    expect(del.status).toBe(204);

    const getAfterDelete = await request(app.getHttpServer())
      .get(`/v1/api/admin/characters/${id}`)
      .set(admin());
    expect(getAfterDelete.status).toBe(404);
  });
});

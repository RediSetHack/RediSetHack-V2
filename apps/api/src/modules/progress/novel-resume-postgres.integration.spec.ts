import type { IncomingMessage } from 'node:http';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDb, stages, userProgress, users, zones, type Database } from '@repo/db';
import { StageListResponseSchema } from '@repo/contracts';
import { AppModule } from '../../app.module.js';
import { ClerkAuthPort } from '../auth/domain/ports/clerk-auth.port.js';
import { DailyEventRepository } from '../daily-event/domain/ports/daily-event.repository.js';
import { DailyEvent } from '../daily-event/domain/entities/daily-event.entity.js';

const databaseUrl = process.env.DATABASE_URL;
describe.skipIf(!databaseUrl)('seeded Novel resume with PostgreSQL', () => {
  const learner = `novel-resume-${Date.now()}`;
  let app: INestApplication;
  let db: Database;
  let stageIds: number[];
  let regionId: number;
  let archivedStageId: number | undefined;
  beforeAll(async () => {
    db = createDb(databaseUrl!);
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ClerkAuthPort).useValue({ authenticate: async (_req: IncomingMessage) => ({ id: learner, email: `${learner}@example.test`, name: learner, role: 'user' }) })
      .overrideProvider(DailyEventRepository).useValue({ findByDate: async () => new DailyEvent(1, '2026-10-17', 'normal', 1) })
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
    await db.insert(users).values({ id: learner, email: `${learner}@example.test`, name: learner });
    const novel = await db.query.regions.findFirst({ where: (r, { eq }) => eq(r.slug, 'signal-at-dawn') });
    if (!novel) throw new Error('Seeded Novel signal-at-dawn is missing; apply migration 0010 first');
    regionId = novel.id;
    stageIds = await db.select({ id: stages.id }).from(stages).innerJoin(zones, eq(stages.zoneId, zones.id)).where(eq(zones.regionId, regionId)).then(rows => rows.map(({ id }) => id));
  });
  afterAll(async () => {
    await app?.close();
    if (db) {
      if (archivedStageId) await db.update(stages).set({ archivedAt: null }).where(eq(stages.id, archivedStageId));
      await db.delete(users).where(eq(users.id, learner));
      await (db as unknown as { $client: { end(): Promise<void> } }).$client.end();
    }
  });
  it('preserves completion across a new app session and resumes past an archived Stage', async () => {
    expect(stageIds).toHaveLength(4);
    // Find the first seeded chapter through the public catalog instead of relying on generated IDs.
    const zones = await request(app.getHttpServer()).get(`/v1/api/regions/${regionId}/zones`);
    const chapterId = zones.body[0].id as number;
    const listing = StageListResponseSchema.parse((await request(app.getHttpServer()).get(`/v1/api/zones/${chapterId}/stages`).set({ authorization: `Bearer ${learner}` })).body);
    expect(listing.map(s => s.status)).toEqual(['available', 'locked']);
    const completedId = listing[0]!.id;
    expect((await request(app.getHttpServer()).post(`/v1/api/stages/${completedId}/complete`).set({ authorization: `Bearer ${learner}` })).status).toBe(201);
    await app.close();
    const module = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(ClerkAuthPort).useValue({ authenticate: async () => ({ id: learner, email: `${learner}@example.test`, name: learner, role: 'user' }) }).overrideProvider(DailyEventRepository).useValue({ findByDate: async () => new DailyEvent(1, '2026-10-17', 'normal', 1) }).compile();
    app = module.createNestApplication(); await app.init();
    const fresh = StageListResponseSchema.parse((await request(app.getHttpServer()).get(`/v1/api/zones/${chapterId}/stages`).set({ authorization: `Bearer ${learner}` })).body);
    expect(fresh.map(s => s.status)).toEqual(['completed', 'available']);
    archivedStageId = fresh[1]!.id;
    await db.update(stages).set({ archivedAt: new Date() }).where(eq(stages.id, archivedStageId));
    const archived = StageListResponseSchema.parse((await request(app.getHttpServer()).get(`/v1/api/zones/${chapterId}/stages`).set({ authorization: `Bearer ${learner}` })).body);
    expect(archived.map(s => s.id)).toEqual([completedId]);
    expect(await db.select().from(userProgress).where(and(eq(userProgress.stageId, completedId), eq(userProgress.userId, learner)))).toHaveLength(1);
  });
});

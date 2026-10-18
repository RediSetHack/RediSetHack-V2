import type { IncomingMessage } from 'node:http';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createDb,
  regions,
  zones,
  stages,
  quests,
  users,
  learningInteractions,
  type Database,
} from '@repo/db';
import {
  QuestListResponseSchema,
  StageListResponseSchema,
  LessonResponseSchema,
  QuestSessionResponseSchema,
  SubmitQuestResponseSchema,
  StageCompletionResponseSchema,
} from '@repo/contracts';
import { AppModule } from '../../app.module.js';
import { ClerkAuthPort } from '../auth/domain/ports/clerk-auth.port.js';
import { DailyEventRepository } from '../daily-event/domain/ports/daily-event.repository.js';
import { DailyEvent } from '../daily-event/domain/entities/daily-event.entity.js';

const databaseUrl = process.env.DATABASE_URL;

describe.skipIf(!databaseUrl)(
  'Stage eligibility through HTTP with PostgreSQL',
  () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const learner = `eligibility-a-${suffix}`;
    const other = `eligibility-b-${suffix}`;
    let app: INestApplication;
    let database: Database;
    let regionId: number;
    let zoneId: number;
    let firstId: number;
    let lockedId: number;
    let questId: number;
    const blocks = [{ type: 'text', content: 'Restricted Lesson body' }];
    const as = (id = learner) => ({ authorization: `Bearer ${id}` });
    const catalog = (id = learner) =>
      request(app.getHttpServer())
        .get(`/v1/api/zones/${zoneId}/stages`)
        .set(as(id));

    beforeAll(async () => {
      database = createDb(databaseUrl!);
      const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
        .overrideProvider(ClerkAuthPort)
        .useValue({
          authenticate: async (req: IncomingMessage) => {
            const id = req.headers.authorization?.replace('Bearer ', '');
            return id === learner || id === other
              ? { id, email: `${id}@example.test`, name: id, role: 'user' }
              : null;
          },
        })
        .overrideProvider(DailyEventRepository)
        .useValue({
          findByDate: async () => new DailyEvent(1, '2026-10-17', 'normal', 1),
        })
        .compile();
      app = moduleRef.createNestApplication();
      app.useGlobalPipes(
        new ValidationPipe({ transform: true, whitelist: true }),
      );
      await app.init();
      await database
        .insert(users)
        .values(
          [learner, other].map((id) => ({
            id,
            email: `${id}@example.test`,
            name: id,
          })),
        );
      const [region] = await database
        .insert(regions)
        .values({ name: 'Eligibility', slug: `eligibility-${suffix}` })
        .returning();
      regionId = region!.id;
      const [zone] = await database
        .insert(zones)
        .values({
          regionId,
          name: 'Eligibility',
          slug: `eligibility-${suffix}`,
        })
        .returning();
      zoneId = zone!.id;
      const created = await database
        .insert(stages)
        .values([
          {
            zoneId,
            title: 'Predecessor',
            slug: `first-${suffix}`,
            sortOrder: 10,
            competencyIds: ['programming.control-flow'],
            difficulty: 'beginner',
            xpReward: 0,
          },
          {
            zoneId,
            title: 'Restricted',
            slug: `locked-${suffix}`,
            sortOrder: 20,
            lessonContent: blocks,
            competencyIds: ['programming.control-flow'],
            difficulty: 'beginner',
            xpReward: 5,
          },
        ])
        .returning();
      firstId = created[0]!.id;
      lockedId = created[1]!.id;
      const [quest] = await database
        .insert(quests)
        .values({ stageId: lockedId, title: 'Attached Quest', xpReward: 0 })
        .returning();
      questId = quest!.id;
    });

    afterAll(async () => {
      await app?.close();
      if (database) {
        await database.delete(regions).where(eq(regions.id, regionId));
        for (const id of [learner, other])
          await database.delete(users).where(eq(users.id, id));
        await (
          database as unknown as { $client: { end(): Promise<void> } }
        ).$client.end();
      }
    });

    it('withholds locked Lesson bodies while keeping catalog metadata and a lock reason', async () => {
      const response = await catalog();
      expect(response.status).toBe(200);
      const listing = StageListResponseSchema.parse(response.body);
      expect(listing[1]).toMatchObject({
        id: lockedId,
        title: 'Restricted',
        xpReward: 5,
        status: 'locked',
      });
      expect(response.body[1].lessonContent).toBeUndefined();
      expect(response.body[1].lockReason).toBe(
        `Stage with id ${lockedId} is locked until its predecessor is completed`,
      );
      expect(JSON.stringify(response.body)).not.toContain(
        'Restricted Lesson body',
      );
    });
    it('denies direct Lesson, completion, Quest start and forged submission routes with the same reason', async () => {
      for (const id of [learner, other]) {
        const reason = (await catalog(id)).body[1].lockReason;
        const responses = await Promise.all([
          request(app.getHttpServer())
            .get(`/v1/api/stages/${lockedId}/lesson`)
            .set(as(id)),
          request(app.getHttpServer())
            .post(`/v1/api/stages/${lockedId}/complete`)
            .set(as(id)),
          request(app.getHttpServer())
            .post(`/v1/api/quests/${questId}/start`)
            .set(as(id)),
          request(app.getHttpServer())
            .post(`/v1/api/quests/${questId}/submit`)
            .set(as(id))
            .send({ sessionId: 999999, responses: [] }),
        ]);
        expect(responses.map((r) => r.status)).toEqual([403, 403, 403, 403]);
        expect(responses.map((r) => r.body.message)).toEqual(
          Array(4).fill(reason),
        );
      }
    });

    it('keeps alternate Quest discovery locked for both learners', async () => {
      for (const id of [learner, other]) {
        const response = await request(app.getHttpServer())
          .get('/v1/api/quests')
          .set(as(id));
        expect(response.status).toBe(200);
        expect(
          QuestListResponseSchema.parse(response.body).find(
            (q) => q.id === questId,
          ),
        ).toMatchObject({
          lockReason: (await catalog(id)).body[1].lockReason,
        });
      }
    });

    it('unlocks only the learner who completed the predecessor, and rechecks saved sessions after a new prerequisite', async () => {
      const complete = (stageId: number, id = learner) =>
        request(app.getHttpServer())
          .post(`/v1/api/stages/${stageId}/complete`)
          .set(as(id));
      const start = (id = learner) =>
        request(app.getHttpServer())
          .post(`/v1/api/quests/${questId}/start`)
          .set(as(id));
      const submit = (sessionId: number, id = learner) =>
        request(app.getHttpServer())
          .post(`/v1/api/quests/${questId}/submit`)
          .set(as(id))
          .send({ sessionId, responses: [] });

      const opened = await request(app.getHttpServer()).get(`/v1/api/stages/${firstId}/lesson`).set(as());
      expect(opened.status).toBe(200);
      const completed = await complete(firstId);
      expect(completed.status).toBe(201);
      StageCompletionResponseSchema.parse(completed.body);
      const reading = await database.select().from(learningInteractions).where(eq(learningInteractions.learnerId, learner));
      expect(reading).toHaveLength(1);
      expect(reading[0]).toMatchObject({ activityType: 'reading', activityId: firstId, correctness: null, skills: ['programming.control-flow'], difficulty: 'beginner', elapsedDefinition: expect.stringContaining('Server elapsed time'), outcome: { assessed: false, xpAwarded: 0 } });
      expect(reading[0]!.startedAt).not.toBeNull();
      expect(reading[0]!.occurredAt.getTime()).toBeGreaterThanOrEqual(reading[0]!.startedAt!.getTime());
      const privateHistory = await request(app.getHttpServer()).get('/v1/api/users/profile').set(as(other));
      expect(privateHistory.body.activity).toEqual([]);
      const listing = StageListResponseSchema.parse((await catalog()).body);
      expect(listing[1]).toMatchObject({
        status: 'available',
        lockReason: null,
        lessonContent: blocks,
      });
      expect(
        StageListResponseSchema.parse((await catalog(other)).body)[1],
      ).toMatchObject({ status: 'locked' });

      const lesson = await request(app.getHttpServer())
        .get(`/v1/api/stages/${lockedId}/lesson`)
        .set(as());
      expect(lesson.status).toBe(200);
      expect(LessonResponseSchema.parse(lesson.body).blocks).toEqual(blocks);
      const started = await start();
      expect(started.status).toBe(201);
      const session = QuestSessionResponseSchema.parse(started.body);
      const submitted = await submit(session.id);
      expect(submitted.status).toBe(201);
      SubmitQuestResponseSchema.parse(submitted.body);
      expect((await start(other)).status).toBe(403);
      expect((await submit(session.id, other)).status).toBe(403);
      expect((await complete(lockedId)).status).toBe(201);

      const active = QuestSessionResponseSchema.parse((await start()).body);
      const [added] = await database
        .insert(stages)
        .values({
          zoneId,
          title: 'New prerequisite',
          slug: `added-${suffix}`,
          sortOrder: 15,
          xpReward: 0,
        })
        .returning();
      const relocked = StageListResponseSchema.parse(
        (await catalog()).body,
      ).find((stage) => stage.id === lockedId)!;
      expect(relocked.status).toBe('locked');
      expect(relocked.lessonContent).toBeUndefined();
      for (const response of [
        await start(),
        await submit(active.id),
        await request(app.getHttpServer())
          .get(`/v1/api/stages/${lockedId}/lesson`)
          .set(as()),
        await complete(lockedId),
      ]) {
        expect(response.status).toBe(403);
        expect(response.body.message).toBe(relocked.lockReason);
      }
      expect((await complete(added!.id)).status).toBe(201);
      const unmeasured = (await database.select().from(learningInteractions).where(eq(learningInteractions.learnerId, learner))).find((event) => event.activityId === added!.id);
      expect(unmeasured).toMatchObject({ sessionId: null, startedAt: null, elapsedMs: null, elapsedDefinition: 'No prior lesson read session; elapsed time unavailable.' });
      const resumed = await start();
      expect(resumed.status).toBe(201);
      expect(QuestSessionResponseSchema.parse(resumed.body).id).toBe(active.id);
      expect((await submit(active.id)).status).toBe(201);
      expect((await start(other)).status).toBe(403);

      // Learners cannot bypass policy via the authoring read routes.
      expect(
        (
          await request(app.getHttpServer())
            .get(`/v1/api/admin/stages/${lockedId}`)
            .set(as(other))
        ).status,
      ).toBe(403);
      expect(
        (
          await request(app.getHttpServer())
            .get(`/v1/api/admin/quests/${questId}`)
            .set(as(other))
        ).status,
      ).toBe(403);
    });
  },
);

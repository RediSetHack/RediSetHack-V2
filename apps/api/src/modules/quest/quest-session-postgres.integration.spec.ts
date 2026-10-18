import type { IncomingMessage } from 'node:http';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { and, eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  createDb,
  questOptions,
  questQuestions,
  questSessions,
  questXpAwards,
  results,
  quests,
  regions,
  stages,
  users,
  learningInteractions,
  zones,
  type Database,
} from '@repo/db';
import {
  QuestResultReviewResponseSchema,
  QuestSessionResponseSchema,
  SubmitQuestResponseSchema,
} from '@repo/contracts';

import { EvaluateBadgesUseCase } from '../badge/application/evaluate-badges.use-case.js';
import { DailyEventRepository } from '../daily-event/domain/ports/daily-event.repository.js';
import { DailyEvent } from '../daily-event/domain/entities/daily-event.entity.js';

import { AppModule } from '../../app.module.js';
import {
  ClerkAuthPort,
  type ClerkAuthenticatedUser,
} from '../auth/domain/ports/clerk-auth.port.js';

const dbUrl = process.env.DATABASE_URL;

describe.skipIf(!dbUrl)('Quest Sessions over HTTP with PostgreSQL', () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const learnerId = `qs-learner-${suffix}`;
  const otherId = `qs-other-${suffix}`;
  let app: INestApplication;
  let db: Database;
  let regionId: number;
  let zoneId: number;
  let stageId: number;
  let questId: number;
  let questionId: number;
  let correctOptionId: number;
  let wrongOptionId: number;
  let multiplier = 1;

  const fakeClerk: ClerkAuthPort = {
    async authenticate(
      req: IncomingMessage,
    ): Promise<ClerkAuthenticatedUser | null> {
      const auth = req.headers['authorization'];
      const id =
        auth === 'Bearer learner'
          ? learnerId
          : auth === 'Bearer other'
            ? otherId
            : auth === 'Bearer admin'
              ? 'qs-admin'
              : null;
      return id
        ? {
            id,
            email: `${id}@example.test`,
            name: id,
            role: id === 'qs-admin' ? 'admin' : 'user',
          }
        : null;
    },
  };
  const as = (who: 'learner' | 'other' = 'learner') => ({
    authorization: `Bearer ${who}`,
  });

  const start = async (who: 'learner' | 'other' = 'learner') => {
    const res = await request(app.getHttpServer())
      .post(`/v1/api/quests/${questId}/start`)
      .set(as(who));
    expect(res.status).toBe(201);
    return QuestSessionResponseSchema.parse(res.body);
  };
  const submit = (
    sessionId: number,
    responses: unknown,
    who: 'learner' | 'other' = 'learner',
  ) =>
    request(app.getHttpServer())
      .post(`/v1/api/quests/${questId}/submit`)
      .set(as(who))
      .send({ sessionId, responses });
  const correct = () => [{ questionId, optionId: correctOptionId }];

  beforeAll(async () => {
    db = createDb(dbUrl!);
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DailyEventRepository)
      .useValue({
        findByDate: async () =>
          new DailyEvent(
            1,
            '2026-10-17',
            multiplier === 2 ? 'bonus' : 'normal',
            multiplier,
          ),
      })
      .overrideProvider(ClerkAuthPort)
      .useValue(fakeClerk)
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();

    await db.insert(users).values([
      { id: learnerId, email: `${learnerId}@example.test`, name: 'Learner' },
      { id: otherId, email: `${otherId}@example.test`, name: 'Other' },
    ]);
    const [region] = await db
      .insert(regions)
      .values({ name: 'Sessions', slug: `qs-${suffix}` })
      .returning();
    regionId = region!.id;
    const [zone] = await db
      .insert(zones)
      .values({ regionId, name: 'Sessions', slug: `qs-${suffix}` })
      .returning();
    zoneId = zone!.id;
    const [stage] = await db
      .insert(stages)
      .values({ zoneId: zone!.id, title: 'Sessions', slug: `qs-${suffix}` })
      .returning();
    stageId = stage!.id;
    const [quest] = await db
      .insert(quests)
      .values({
        stageId: stage!.id,
        title: 'Sessions quest',
        timeLimitSeconds: 300,
        passingScore: 100,
        xpReward: 10,
      })
      .returning();
    questId = quest!.id;
    const [question] = await db
      .insert(questQuestions)
      .values({ questId, prompt: 'Original prompt?', competencyIds: ['security.input-validation'], difficulty: 'beginner' })
      .returning();
    questionId = question!.id;
    const options = await db
      .insert(questOptions)
      .values([
        { questionId, text: 'Right', isCorrect: true, sortOrder: 0 },
        { questionId, text: 'Wrong', isCorrect: false, sortOrder: 1 },
      ])
      .returning();
    correctOptionId = options.find((o) => o.isCorrect)!.id;
    wrongOptionId = options.find((o) => !o.isCorrect)!.id;
  });

  afterAll(async () => {
    await app?.close();
    if (db) {
      await db.delete(regions).where(eq(regions.id, regionId));
      await db.delete(users).where(eq(users.id, learnerId));
      await db.delete(users).where(eq(users.id, otherId));
      await (
        db as unknown as { $client: { end(): Promise<void> } }
      ).$client.end();
    }
  });

  const balance = async (who: 'learner' | 'other' = 'other') => {
    const res = await request(app.getHttpServer())
      .get('/v1/api/user/me')
      .set(as(who));
    expect(res.status).toBe(200);
    return res.body.totalXp as number;
  };

  const resetOther = async () => {
    await db.delete(learningInteractions).where(eq(learningInteractions.learnerId, otherId));
    await db.delete(questSessions).where(eq(questSessions.userId, otherId));
    await db.delete(results).where(eq(results.userId, otherId));
    await db.delete(questXpAwards).where(eq(questXpAwards.userId, otherId));
    await db.update(users).set({ totalXp: 0 }).where(eq(users.id, otherId));
  };

  it.each([
    ['claim insertion', 'quest_xp_awards', 'INSERT', 'NEW.user_id', ''],
    [
      'balance credit',
      'users',
      'UPDATE',
      'NEW.id',
      'AND NEW.total_xp <> OLD.total_xp',
    ],
    [
      'session receipt after credit',
      'quest_sessions',
      'UPDATE',
      'NEW.user_id',
      'AND NEW.result_id IS NOT NULL',
    ],
  ])(
    'rolls back a failure at %s and lets the same submission recover',
    async (_name, table, operation, owner, condition) => {
      await resetOther();
      const session = await start('other');
      const trigger = sql.identifier(`fail_quest_xp_${Date.now()}`);
      await db.execute(sql`CREATE FUNCTION ${trigger}() RETURNS trigger LANGUAGE plpgsql AS
      $$ BEGIN RAISE EXCEPTION 'injected Quest award failure'; END $$`);
      await db.execute(sql`CREATE TRIGGER ${trigger} BEFORE ${sql.raw(operation)} ON ${sql.identifier(table)}
      FOR EACH ROW WHEN (${sql.raw(owner)} = ${sql.raw(`'${otherId}'`)} ${sql.raw(condition)})
      EXECUTE FUNCTION ${trigger}()`);
      try {
        expect((await submit(session.id, correct(), 'other')).status).toBe(500);
        const stored = await db.query.questSessions.findFirst({
          where: eq(questSessions.id, session.id),
        });
        expect(stored).toMatchObject({
          status: 'active',
          resultId: null,
          xpAwarded: 0,
        });
        expect(
          await db
            .select()
            .from(questXpAwards)
            .where(eq(questXpAwards.userId, otherId)),
        ).toHaveLength(0);
        expect(
          await db.select().from(results).where(eq(results.userId, otherId)),
        ).toHaveLength(0);
        expect(await balance()).toBe(0);
      } finally {
        await db.execute(
          sql`DROP TRIGGER ${trigger} ON ${sql.identifier(table)}`,
        );
        await db.execute(sql`DROP FUNCTION ${trigger}()`);
      }
      const recovered = await submit(session.id, correct(), 'other');
      expect(recovered.status).toBe(201);
      expect(SubmitQuestResponseSchema.parse(recovered.body)).toMatchObject({
        passed: true,
        xpAwarded: 10,
      });
      const replay = await submit(session.id, correct(), 'other');
      expect(SubmitQuestResponseSchema.parse(replay.body)).toMatchObject({
        resultId: recovered.body.resultId,
        xpAwarded: 10,
      });
      expect(await balance()).toBe(10);
      expect(
        await db
          .select()
          .from(questXpAwards)
          .where(eq(questXpAwards.userId, otherId)),
      ).toHaveLength(1);
      expect(
        await db.select().from(results).where(eq(results.userId, otherId)),
      ).toHaveLength(1);
    },
  );

  it('races first-pass submissions, persists bonus XP on replay, and gives passing retakes no reward', async () => {
    await resetOther();
    multiplier = 2;
    try {
      const session = await start('other');
      const responses = await Promise.all(
        Array.from({ length: 8 }, () => submit(session.id, correct(), 'other')),
      );
      expect(responses.map((r) => r.status)).toEqual(Array(8).fill(201));
      const awards = responses.map((r) =>
        SubmitQuestResponseSchema.parse(r.body),
      );
      expect(new Set(awards.map((r) => r.resultId)).size).toBe(1);
      expect(awards.map((r) => r.xpAwarded)).toEqual(Array(8).fill(20));
      expect(await balance()).toBe(20);
      multiplier = 1;
      const replay = await submit(session.id, correct(), 'other');
      expect(SubmitQuestResponseSchema.parse(replay.body)).toMatchObject({
        resultId: awards[0]!.resultId,
        xpAwarded: 20,
      });
      const retake = await start('other');
      expect(retake.id).not.toBe(session.id);
      const retakes = await Promise.all(
        Array.from({ length: 4 }, () => submit(retake.id, correct(), 'other')),
      );
      for (const res of retakes) {
        expect(res.status).toBe(201);
        expect(SubmitQuestResponseSchema.parse(res.body)).toMatchObject({
          passed: true,
          xpAwarded: 0,
        });
      }
      expect(await balance()).toBe(20);
      expect(
        await db
          .select()
          .from(questXpAwards)
          .where(eq(questXpAwards.userId, otherId)),
      ).toHaveLength(1);
      expect(
        await db.select().from(results).where(eq(results.userId, otherId)),
      ).toHaveLength(2);
      const interactions = await db.select().from(learningInteractions).where(eq(learningInteractions.learnerId, otherId));
      expect(interactions.filter((event) => event.sessionId === `quest:${session.id}`)).toHaveLength(1);
      expect(interactions.find((event) => event.sessionId === `quest:${session.id}`)).toMatchObject({
        activityType: 'quest', activityId: questId, correctness: true,
        skills: ['security.input-validation'], difficulty: 'beginner',
        elapsedDefinition: expect.stringContaining('Server elapsed time'),
        outcome: { passed: true, score: 100, xpAwarded: 20 },
      });
      expect(interactions.find((event) => event.sessionId === `quest:${session.id}`)!.contentVersion).toMatch(/^[a-f0-9]{64}$/);
      const ownProfile = await request(app.getHttpServer()).get('/v1/api/users/profile').set(as('other'));
      expect(ownProfile.status).toBe(200);
      expect(ownProfile.body.activity).toHaveLength(2);
      const anotherProfile = await request(app.getHttpServer()).get('/v1/api/users/profile').set(as('learner'));
      expect(anotherProfile.body.activity).toEqual([]);
    } finally {
      multiplier = 1;
    }
  });

  it('keeps the accepted Result and credit when badge evaluation fails', async () => {
    await resetOther();
    const session = await start('other');
    const completion = await request(app.getHttpServer())
      .post(`/v1/api/stages/${stageId}/complete`)
      .set(as('other'));
    expect(completion.status).toBe(201);
    const badges = vi
      .spyOn(app.get(EvaluateBadgesUseCase), 'execute')
      .mockRejectedValueOnce(new Error('injected badge failure'));
    try {
      const res = await submit(session.id, correct(), 'other');
      expect(res.status).toBe(201);
      const body = SubmitQuestResponseSchema.parse(res.body);
      expect(body).toMatchObject({
        passed: true,
        xpAwarded: 10,
        badgesEarned: [],
      });
      const review = await request(app.getHttpServer())
        .get(`/v1/api/quests/results/${body.resultId}`)
        .set(as('other'));
      expect(review.status).toBe(200);
      expect(QuestResultReviewResponseSchema.parse(review.body)).toMatchObject({
        resultId: body.resultId,
        passed: true,
      });
      expect(await balance()).toBe(10);
      const replay = await submit(session.id, correct(), 'other');
      expect(SubmitQuestResponseSchema.parse(replay.body)).toMatchObject({
        resultId: body.resultId,
        xpAwarded: 10,
      });
    } finally {
      badges.mockRestore();
    }
  });

  it('persists the session and resumes it with the same server deadline', async () => {
    const first = await start();
    const again = await start();
    expect(again.id).toBe(first.id);
    expect(again.expiresAt).toBe(first.expiresAt);
    expect(first.questId).toBe(questId);

    const row = await db.query.questSessions.findFirst({
      where: eq(questSessions.id, first.id),
    });
    expect(row).toMatchObject({
      userId: learnerId,
      status: 'active',
      passingScore: 100,
    });
    expect(row!.expiresAt.getTime() - row!.startedAt.getTime()).toBeCloseTo(
      300_000,
      -3,
    );

    // leave the session terminal for the following tests
    await submit(first.id, correct());
  });

  it('replays an identical submission, rejects a conflicting one, and awards XP once', async () => {
    const session = await start();
    const first = await submit(session.id, correct());
    expect(first.status).toBe(201);
    const body = SubmitQuestResponseSchema.parse(first.body);
    expect(body).toMatchObject({ outcome: 'submitted', passed: true });

    const replay = await submit(session.id, correct());
    expect(replay.status).toBe(201);
    expect(SubmitQuestResponseSchema.parse(replay.body)).toMatchObject({
      resultId: body.resultId,
      score: body.score,
      xpAwarded: body.xpAwarded,
    });

    const conflict = await submit(session.id, [
      { questionId, optionId: wrongOptionId },
    ]);
    expect(conflict.status).toBe(409);
    const review = await request(app.getHttpServer())
      .get(`/v1/api/quests/results/${body.resultId}`)
      .set(as());
    expect(QuestResultReviewResponseSchema.parse(review.body)).toMatchObject({
      score: 100,
      passed: true,
    });
  });

  it('survives concurrent duplicate submissions with a single Result', async () => {
    const session = await start();
    const responses = await Promise.all([
      submit(session.id, correct()),
      submit(session.id, correct()),
      submit(session.id, correct()),
    ]);
    const ids = new Set(responses.map((r) => r.body.resultId));
    expect(responses.map((r) => r.status)).toEqual([201, 201, 201]);
    expect(ids.size).toBe(1);
  });

  it('allows an explicit retake as a new session once the last one is terminal', async () => {
    const before = await start();
    await submit(before.id, correct());
    const retake = await start();
    expect(retake.id).not.toBe(before.id);
    await submit(retake.id, [{ questionId, optionId: wrongOptionId }]);
  });

  it("rejects another learner's session without closing it", async () => {
    const session = await start();
    const res = await submit(session.id, correct(), 'other');
    expect(res.status).toBe(404);
    const row = await db.query.questSessions.findFirst({
      where: eq(questSessions.id, session.id),
    });
    expect(row?.status).toBe('active');
    await submit(session.id, correct());
  });

  it.each([
    [
      'an unknown question',
      () => [{ questionId: questionId + 100000, optionId: 1 }],
    ],
    [
      'an option outside the question',
      () => [{ questionId, optionId: correctOptionId + 100000 }],
    ],
    [
      'a duplicate question reference',
      () => [
        { questionId, optionId: correctOptionId },
        { questionId, optionId: wrongOptionId },
      ],
    ],
  ])('400s on %s', async (_name, responses) => {
    const session = await start();
    const res = await submit(session.id, responses());
    expect(res.status).toBe(400);
    await submit(session.id, correct());
  });

  it('gives no credit for a submission after the persisted deadline', async () => {
    const session = await start();
    await db
      .update(questSessions)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(questSessions.id, session.id));

    const res = await submit(session.id, correct());
    expect(res.status).toBe(201);
    expect(SubmitQuestResponseSchema.parse(res.body)).toMatchObject({
      outcome: 'expired',
      score: 0,
      passed: false,
      xpAwarded: 0,
    });
    const replay = await submit(session.id, correct());
    expect(replay.body.resultId).toBe(res.body.resultId);

    // the next start is a fresh session, not the expired one
    const next = await start();
    expect(next.id).not.toBe(session.id);
    await submit(next.id, correct());
  });

  it('closes an abandoned expired session when the learner starts again', async () => {
    const abandoned = await start();
    await db
      .update(questSessions)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(questSessions.id, abandoned.id));

    const next = await start();
    expect(next.id).not.toBe(abandoned.id);
    const row = await db.query.questSessions.findFirst({
      where: eq(questSessions.id, abandoned.id),
    });
    expect(row).toMatchObject({ status: 'expired' });
    expect(row!.resultId).not.toBeNull();
    await submit(next.id, correct());
  });

  it('scores and reviews the snapshot the learner saw after the Quest is edited', async () => {
    const session = await start();
    await db
      .update(questQuestions)
      .set({ prompt: 'Edited prompt?' })
      .where(eq(questQuestions.id, questionId));
    await db
      .update(questOptions)
      .set({ isCorrect: false })
      .where(eq(questOptions.id, correctOptionId));
    try {
      const res = await submit(session.id, correct());
      const body = SubmitQuestResponseSchema.parse(res.body);
      expect(body).toMatchObject({ score: 100, passed: true });

      const review = QuestResultReviewResponseSchema.parse(
        (
          await request(app.getHttpServer())
            .get(`/v1/api/quests/results/${body.resultId}`)
            .set(as())
        ).body,
      );
      expect(review.breakdown[0]).toMatchObject({
        prompt: 'Original prompt?',
        isCorrect: true,
      });

      // a new session sees the edit
      const fresh = await start();
      expect(fresh.questions[0]?.prompt).toBe('Edited prompt?');
      await db
        .update(questSessions)
        .set({ status: 'expired' })
        .where(and(eq(questSessions.id, fresh.id)));
    } finally {
      await db
        .update(questQuestions)
        .set({ prompt: 'Original prompt?' })
        .where(eq(questQuestions.id, questionId));
      await db
        .update(questOptions)
        .set({ isCorrect: true })
        .where(eq(questOptions.id, correctOptionId));
    }
  });

  it.each(['stages', 'zones', 'regions', 'quests'] as const)(
    'retires an in-flight session when its %s is archived without losing XP or review',
    async (level) => {
      await resetOther();
      await db
        .update(stages)
        .set({ archivedAt: null })
        .where(eq(stages.id, stageId));
      await db
        .update(zones)
        .set({ archivedAt: null })
        .where(eq(zones.id, zoneId));
      await db
        .update(regions)
        .set({ archivedAt: null })
        .where(eq(regions.id, regionId));
      await db
        .update(quests)
        .set({ archivedAt: null })
        .where(eq(quests.id, questId));
      const session = await start('other');
      const retired = await request(app.getHttpServer())
        .delete(
          `/v1/api/admin/${level}/${level === 'stages' ? stageId : level === 'zones' ? zoneId : level === 'regions' ? regionId : questId}`,
        )
        .set({ authorization: 'Bearer admin' });
      expect(retired.status).toBe(204);
      const archivedAt =
        level === 'stages'
          ? (await db.query.stages.findFirst({ where: eq(stages.id, stageId) }))
              ?.archivedAt
          : level === 'zones'
            ? (await db.query.zones.findFirst({ where: eq(zones.id, zoneId) }))
                ?.archivedAt
            : level === 'regions'
              ? (
                  await db.query.regions.findFirst({
                    where: eq(regions.id, regionId),
                  })
                )?.archivedAt
              : (
                  await db.query.quests.findFirst({
                    where: eq(quests.id, questId),
                  })
                )?.archivedAt;
      expect(archivedAt).not.toBeNull();

      const catalog = await request(app.getHttpServer())
        .get(
          level === 'quests'
            ? '/v1/api/quests'
            : `/v1/api/zones/${zoneId}/stages`,
        )
        .set(as());
      expect(catalog.status).toBe(200);
      if (level === 'quests')
        expect(
          catalog.body.find((item: { id: number }) => item.id === questId),
        ).toBeUndefined();
      else expect(catalog.body).toEqual([]);
      if (level === 'regions') {
        const regionsCatalog = await request(app.getHttpServer()).get(
          '/v1/api/regions',
        );
        expect(
          regionsCatalog.body.find(
            (item: { id: number }) => item.id === regionId,
          ),
        ).toBeUndefined();
      }
      expect(
        (
          await request(app.getHttpServer())
            .post(`/v1/api/quests/${questId}/start`)
            .set(as())
        ).status,
      ).toBe(404);

      const submitted = await submit(session.id, correct(), 'other');
      expect(submitted.status, JSON.stringify(submitted.body)).toBe(201);
      expect(SubmitQuestResponseSchema.parse(submitted.body)).toMatchObject({
        passed: true,
        xpAwarded: 10,
      });
      const review = await request(app.getHttpServer())
        .get(`/v1/api/quests/results/${submitted.body.resultId}`)
        .set(as('other'));
      expect(review.status, JSON.stringify(review.body)).toBe(200);
      expect(
        QuestResultReviewResponseSchema.parse(review.body).breakdown[0]?.prompt,
      ).toBe('Original prompt?');
      expect(await balance('other')).toBe(10);
    },
  );

  it('archives completed content while preserving its Result and XP claim', async () => {
    await resetOther();
    await db
      .update(stages)
      .set({ archivedAt: null })
      .where(eq(stages.id, stageId));
    await db
      .update(zones)
      .set({ archivedAt: null })
      .where(eq(zones.id, zoneId));
    await db
      .update(regions)
      .set({ archivedAt: null })
      .where(eq(regions.id, regionId));
    await db
      .update(quests)
      .set({ archivedAt: null })
      .where(eq(quests.id, questId));
    const session = await start('other');
    const submitted = await submit(session.id, correct(), 'other');
    expect(SubmitQuestResponseSchema.parse(submitted.body)).toMatchObject({
      passed: true,
      xpAwarded: 10,
    });

    expect(
      (
        await request(app.getHttpServer())
          .delete(`/v1/api/admin/stages/${stageId}`)
          .set({ authorization: 'Bearer admin' })
      ).status,
    ).toBe(204);
    expect(
      await db.query.results.findFirst({
        where: eq(results.id, submitted.body.resultId),
      }),
    ).toBeDefined();
    expect(
      await db.query.questXpAwards.findFirst({
        where: and(
          eq(questXpAwards.userId, otherId),
          eq(questXpAwards.questId, questId),
        ),
      }),
    ).toBeDefined();
    expect(await balance('other')).toBe(10);
    expect(
      (
        await request(app.getHttpServer())
          .get(`/v1/api/quests/results/${submitted.body.resultId}`)
          .set(as('other'))
      ).status,
    ).toBe(200);
  });

  it('hard deletes unused Region content with its descendants', async () => {
    const [region] = await db
      .insert(regions)
      .values({ name: 'Unused', slug: `unused-${suffix}` })
      .returning();
    const [zone] = await db
      .insert(zones)
      .values({
        regionId: region!.id,
        name: 'Unused',
        slug: `unused-${suffix}`,
      })
      .returning();
    const [stage] = await db
      .insert(stages)
      .values({ zoneId: zone!.id, title: 'Unused', slug: `unused-${suffix}` })
      .returning();
    const [quest] = await db
      .insert(quests)
      .values({ stageId: stage!.id, title: 'Unused' })
      .returning();
    const [question] = await db
      .insert(questQuestions)
      .values({ questId: quest!.id, prompt: 'Unused?' })
      .returning();
    const [option] = await db
      .insert(questOptions)
      .values({ questionId: question!.id, text: 'Unused' })
      .returning();

    expect(
      (
        await request(app.getHttpServer())
          .delete(`/v1/api/admin/regions/${region!.id}`)
          .set({ authorization: 'Bearer admin' })
      ).status,
    ).toBe(204);
    expect(
      await db.query.regions.findFirst({ where: eq(regions.id, region!.id) }),
    ).toBeUndefined();
    expect(
      await db.query.zones.findFirst({ where: eq(zones.id, zone!.id) }),
    ).toBeUndefined();
    expect(
      await db.query.stages.findFirst({ where: eq(stages.id, stage!.id) }),
    ).toBeUndefined();
    expect(
      await db.query.quests.findFirst({ where: eq(quests.id, quest!.id) }),
    ).toBeUndefined();
    expect(
      await db.query.questQuestions.findFirst({
        where: eq(questQuestions.id, question!.id),
      }),
    ).toBeUndefined();
    expect(
      await db.query.questOptions.findFirst({
        where: eq(questOptions.id, option!.id),
      }),
    ).toBeUndefined();
  });
});

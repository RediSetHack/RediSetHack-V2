import type { IncomingMessage } from 'node:http';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createDb,
  ctfAttempts,
  ctfChallenges,
  ctfSolves,
  learningInteractions,
  regions,
  stages,
  userProgress,
  users,
  zones,
  type Database,
} from '@repo/db';
import {
  CtfArtifactResponseSchema,
  CtfAttemptResponseSchema,
  CtfChallengeListResponseSchema,
  CtfChallengeResponseSchema,
} from '@repo/contracts';
import { AppModule } from '../../app.module.js';
import { ClerkAuthPort } from '../auth/domain/ports/clerk-auth.port.js';
import { DailyEventRepository } from '../daily-event/domain/ports/daily-event.repository.js';
import { DailyEvent } from '../daily-event/domain/entities/daily-event.entity.js';

const databaseUrl = process.env.DATABASE_URL;
const FLAG = 'RSH{unit_test_flag}';

describe.skipIf(!databaseUrl)('Controlled CTF through HTTP with PostgreSQL', () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const [learner, other, locked] = ['a', 'b', 'c'].map((n) => `ctf-${n}-${suffix}`) as [string, string, string];
  let app: INestApplication;
  let database: Database;
  let regionId: number;
  let challengeId: number;
  let lockedChallengeId: number;
  const as = (id: string) => ({ authorization: `Bearer ${id}` });
  const url = (path = '', id = challengeId) => `/v1/api/ctf/challenges/${id}${path}`;
  const submit = (flag: string, id = learner) => request(app.getHttpServer()).post(url('/attempts')).set(as(id)).send({ flag });
  const totalXp = async (id = learner) => (await database.select().from(users).where(eq(users.id, id)))[0]!.totalXp;
  const events = (id = learner) => database.select().from(learningInteractions).where(eq(learningInteractions.learnerId, id));

  beforeAll(async () => {
    database = createDb(databaseUrl!);
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ClerkAuthPort)
      .useValue({
        authenticate: async (req: IncomingMessage) => {
          const id = req.headers.authorization?.replace('Bearer ', '');
          return id && [learner, other, locked].includes(id) ? { id, email: `${id}@example.test`, name: id, role: 'user' } : null;
        },
      })
      .overrideProvider(DailyEventRepository)
      .useValue({ findByDate: async () => new DailyEvent(1, '2026-10-17', 'normal', 1) })
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
    await database.insert(users).values([learner, other, locked].map((id) => ({ id, email: `${id}@example.test`, name: id })));
    const [region] = await database.insert(regions).values({ name: 'CTF', slug: `ctf-${suffix}` }).returning();
    regionId = region!.id;
    const [zone] = await database.insert(zones).values({ regionId, name: 'CTF', slug: `ctf-${suffix}` }).returning();
    const [first, second] = await database
      .insert(stages)
      .values([
        { zoneId: zone!.id, title: 'First', slug: `a-${suffix}`, sortOrder: 10 },
        { zoneId: zone!.id, title: 'Second', slug: `b-${suffix}`, sortOrder: 20 },
      ])
      .returning();
    // `learner` and `other` completed the first stage; `locked` did not.
    await database.insert(userProgress).values([learner, other].map((id) => ({ userId: id, stageId: first!.id, completed: true, completedAt: new Date() })));
    const [challenge] = await database
      .insert(ctfChallenges)
      .values({
        stageId: second!.id,
        authoringId: `ctf-${suffix}`,
        title: 'Test log',
        category: 'forensics',
        difficulty: 'beginner',
        competencyIds: ['programming.control-flow'],
        brief: 'Inspect the log.',
        artifactName: 'test.log',
        artifact: 'line one\nbeacon=ZW5jb2RlZA==\n',
        flagHash: createHash('sha256').update(FLAG).digest('hex'),
        xpReward: 25,
      })
      .returning();
    challengeId = challenge!.id;
    lockedChallengeId = challengeId;
  });

  afterAll(async () => {
    await app?.close();
    if (database) {
      await database.delete(regions).where(eq(regions.id, regionId));
      for (const id of [learner, other, locked]) await database.delete(users).where(eq(users.id, id));
      await (database as unknown as { $client: { end(): Promise<void> } }).$client.end();
    }
  });

  it('lists eligible challenges and serves the artifact without leaking answer material', async () => {
    const list = await request(app.getHttpServer()).get('/v1/api/ctf/challenges').set(as(learner)).expect(200);
    CtfChallengeListResponseSchema.parse(list.body);
    expect(list.body).toContainEqual(expect.objectContaining({ id: challengeId, category: 'forensics', skills: ['programming.control-flow'], solved: false }));
    const view = await request(app.getHttpServer()).get(url()).set(as(learner)).expect(200);
    CtfChallengeResponseSchema.parse(view.body);
    const artifact = await request(app.getHttpServer()).get(url('/artifact')).set(as(learner)).expect(200);
    CtfArtifactResponseSchema.parse(artifact.body);
    expect(artifact.body.content).toContain('beacon=');
    expect(JSON.stringify([list.body, view.body])).not.toMatch(/flagHash|flag_hash|artifact|beacon|ZW5jb2RlZA/i);
  });

  it('restricts the challenge and its artifact to eligible learners', async () => {
    const mine = await request(app.getHttpServer()).get('/v1/api/ctf/challenges').set(as(locked)).expect(200);
    expect(mine.body.map((c: { id: number }) => c.id)).not.toContain(lockedChallengeId);
    await request(app.getHttpServer()).get(url('/artifact', lockedChallengeId)).set(as(locked)).expect(403);
    await request(app.getHttpServer()).get(url('', lockedChallengeId)).set(as(locked)).expect(403);
    await submit(FLAG, locked).expect(403);
    await request(app.getHttpServer()).get(url('/artifact')).expect(401);
    await request(app.getHttpServer()).get(url('/artifact', 999999)).set(as(learner)).expect(404);
    expect(await totalXp(locked)).toBe(0);
  });

  it('rejects a wrong flag without paying or revealing anything, and caps retries', async () => {
    const wrong = await submit('RSH{nope}').expect(201);
    CtfAttemptResponseSchema.parse(wrong.body);
    expect(wrong.body).toEqual({ correct: false, alreadySolved: false, xpAwarded: 0 });
    expect(await totalXp()).toBe(0);
    expect(JSON.stringify(await database.select().from(ctfAttempts).where(eq(ctfAttempts.learnerId, learner)))).not.toContain('nope');
    for (let i = 0; i < 3; i += 1) await submit(`RSH{nope${i}}`).expect(201);
    // Fifth attempt in the window is the last allowed; the sixth is limited, even with the right flag.
    await submit('RSH{nope4}').expect(201);
    await submit(FLAG).expect(429);
    expect(await totalXp()).toBe(0);
    expect(await database.select().from(ctfSolves).where(eq(ctfSolves.learnerId, learner))).toHaveLength(0);
  });

  it('records the solve, XP and event exactly once, even concurrently and on replay', async () => {
    const results = await Promise.all([submit(` ${FLAG}\n`, other), submit(FLAG, other), submit(FLAG, other)]);
    for (const r of results) {
      expect(r.status).toBe(201);
      CtfAttemptResponseSchema.parse(r.body);
    }
    expect(results.filter((r) => !r.body.alreadySolved)).toHaveLength(1);
    expect(results.map((r) => r.body.xpAwarded).sort()).toEqual([0, 0, 25]);
    expect(await totalXp(other)).toBe(25);
    expect(await events(other)).toHaveLength(1);
    expect((await events(other))[0]).toMatchObject({ activityType: 'ctf', correctness: true, outcome: { status: 'solved', assessed: true, xpAwarded: 25 } });
    expect((await submit(FLAG, other)).body).toEqual({ correct: true, alreadySolved: true, xpAwarded: 0 });
    expect(await totalXp(other)).toBe(25);
    expect(await events(other)).toHaveLength(1);
    // Ownership: the solve is learner-scoped.
    const list = await request(app.getHttpServer()).get('/v1/api/ctf/challenges').set(as(other)).expect(200);
    expect(list.body.find((c: { id: number }) => c.id === challengeId).solved).toBe(true);
    const otherView = await request(app.getHttpServer()).get('/v1/api/ctf/challenges').set(as(learner)).expect(200);
    expect(otherView.body.find((c: { id: number }) => c.id === challengeId).solved).toBe(false);
    expect(await events(learner)).toHaveLength(5);
  });
});
